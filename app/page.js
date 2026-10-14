import { after } from "next/server";
import { getSql } from "../lib/db";
import { usuarioAtual } from "../lib/auth";
import { sincronizar } from "../lib/sync";
import { PLAYLIST_ID, spotifyConfigurado } from "../lib/spotify";
import Topo from "../components/Topo";
import SongForm from "../components/SongForm";
import SongTable from "../components/SongTable";
import SpotifyPlayer from "../components/SpotifyPlayer";
import Historico from "../components/Historico";
import PlayerProvider from "../components/PlayerProvider";

export const dynamic = "force-dynamic";

async function carregar() {
  try {
    const sql = getSql();
    const [rows, hist, sinc] = await Promise.all([
      sql`
        SELECT id, titulo, artista, origem, instrumento, nova, criada_em, criada_por, spotify_id
        FROM musicas
        ORDER BY criada_em DESC, id ASC`,
      sql`
        SELECT id, titulo, acao, usuario, detalhes, em
        FROM historico
        ORDER BY em DESC, id DESC
        LIMIT 30`,
      sql`SELECT ultima_em, resultado FROM sincronizacao WHERE id = 1`,
    ]);
    return {
      musicas: rows.map((r) => ({ ...r, criada_em: new Date(r.criada_em).toISOString() })),
      historico: hist.map((h) => ({ ...h, em: new Date(h.em).toISOString() })),
      sync: {
        configurado: spotifyConfigurado(),
        ultimaEm: sinc[0]?.ultima_em ? new Date(sinc[0].ultima_em).toISOString() : null,
        resultado: sinc[0]?.resultado ?? null,
      },
    };
  } catch (e) {
    console.error(e);
    return { erro: e.message };
  }
}

export default async function Home() {
  const usuario = await usuarioAtual();
  const { musicas, historico, sync, erro } = await carregar();

  // Sincroniza com o Spotify depois de responder (no máximo 1x a cada 10 minutos).
  if (!erro && sync.configurado) after(() => sincronizar());

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 print:max-w-none print:p-0">
      <PlayerProvider>
        <div className="print:hidden">
          <Topo usuario={usuario} />
        </div>

        {erro ? (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 print:hidden">
            <p className="font-semibold">Não foi possível ler o banco de dados.</p>
            <p className="mt-1 text-sm">
              Confira a variável <code>DATABASE_URL</code> e rode <code>npm run db:setup</code> para
              criar ou atualizar as tabelas. Detalhe: {erro}
            </p>
          </div>
        ) : (
          <>
            {usuario && (
              <div className="print:hidden">
                <SongForm />
              </div>
            )}
            <SongTable musicas={musicas} usuario={usuario} />
            <div className="print:hidden">
              <SpotifyPlayer playlistId={PLAYLIST_ID} usuario={usuario} sync={sync} />
              <Historico itens={historico} />
            </div>
          </>
        )}
      </PlayerProvider>
    </main>
  );
}
