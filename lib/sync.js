import { getSql } from "./db";
import { buscarFaixasDaPlaylist, planejarSincronizacao, spotifyConfigurado } from "./spotify";

const INTERVALO = "10 minutes";

// Sincroniza a playlist com o banco. Sem `forcar`, roda no máximo 1 vez a cada 10 minutos
// (a "reserva" é feita de forma atômica no banco, então visitas simultâneas não duplicam o trabalho).
export async function sincronizar({ forcar = false } = {}) {
  if (!spotifyConfigurado()) {
    return { ok: false, mensagem: "Sincronização com o Spotify não configurada." };
  }
  const sql = getSql();

  const reserva = forcar
    ? await sql`
        INSERT INTO sincronizacao (id, ultima_em) VALUES (1, now())
        ON CONFLICT (id) DO UPDATE SET ultima_em = now()
        RETURNING id`
    : await sql`
        INSERT INTO sincronizacao (id, ultima_em) VALUES (1, now())
        ON CONFLICT (id) DO UPDATE SET ultima_em = now()
        WHERE sincronizacao.ultima_em < now() - ${INTERVALO}::interval
        RETURNING id`;
  if (reserva.length === 0) return { ok: true, pulada: true, mensagem: "Sincronizada há pouco." };

  try {
    const faixas = await buscarFaixasDaPlaylist();
    const existentes = await sql`SELECT id, titulo, artista, spotify_id FROM musicas`;
    const { atualizar, inserir } = planejarSincronizacao(existentes, faixas);

    const vinculos = atualizar.map(
      (u) => sql`UPDATE musicas SET spotify_id = ${u.spotify_id}::text WHERE id = ${u.id}::int AND spotify_id IS NULL`
    );
    const novas = inserir.map(
      (f) => sql`
        WITH nova_musica AS (
          INSERT INTO musicas (titulo, artista, origem, nova, criada_por, spotify_id)
          VALUES (${f.titulo}, ${f.artista}, NULL, TRUE, 'Spotify', ${f.id}::text)
          ON CONFLICT DO NOTHING
          RETURNING id, titulo
        )
        INSERT INTO historico (musica_id, titulo, acao, usuario)
        SELECT id, titulo, 'adicionou (do Spotify)', 'Spotify' FROM nova_musica
        RETURNING id`
    );

    let adicionadas = 0;
    if (vinculos.length + novas.length > 0) {
      const resultados = await sql.transaction([...vinculos, ...novas]);
      adicionadas = resultados.slice(vinculos.length).reduce((n, r) => n + r.length, 0);
    }

    const mensagem =
      adicionadas > 0
        ? `${adicionadas} música(s) nova(s) vinda(s) do Spotify.`
        : "Nenhuma música nova no Spotify.";
    await sql`UPDATE sincronizacao SET resultado = ${"ok: " + mensagem} WHERE id = 1`;
    return { ok: true, adicionadas, mensagem };
  } catch (e) {
    console.error(e);
    try {
      await sql`UPDATE sincronizacao SET resultado = ${"erro: " + e.message} WHERE id = 1`;
    } catch {}
    return { ok: false, mensagem: e.message };
  }
}
