import { getSql } from "../lib/db";
import { usuarioAtual } from "../lib/auth";
import Topo from "../components/Topo";
import SongForm from "../components/SongForm";
import SongTable from "../components/SongTable";
import Historico from "../components/Historico";

export const dynamic = "force-dynamic";

async function carregar() {
  try {
    const sql = getSql();
    const [rows, hist] = await Promise.all([
      sql`
        SELECT id, titulo, artista, origem, instrumento, nova, criada_em, criada_por
        FROM musicas
        ORDER BY criada_em DESC, id ASC`,
      sql`
        SELECT id, titulo, acao, usuario, em
        FROM historico
        ORDER BY em DESC, id DESC
        LIMIT 30`,
    ]);
    return {
      musicas: rows.map((r) => ({ ...r, criada_em: new Date(r.criada_em).toISOString() })),
      historico: hist.map((h) => ({ ...h, em: new Date(h.em).toISOString() })),
    };
  } catch (e) {
    console.error(e);
    return { erro: e.message };
  }
}

export default async function Home() {
  const usuario = await usuarioAtual();
  const { musicas, historico, erro } = await carregar();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Topo usuario={usuario} />

      {erro ? (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
          <p className="font-semibold">Não foi possível ler o banco de dados.</p>
          <p className="mt-1 text-sm">
            Confira a variável <code>DATABASE_URL</code> e rode <code>npm run db:setup</code> para
            criar ou atualizar as tabelas. Detalhe: {erro}
          </p>
        </div>
      ) : (
        <>
          {usuario && <SongForm />}
          <SongTable musicas={musicas} usuario={usuario} />
          <Historico itens={historico} />
        </>
      )}
    </main>
  );
}
