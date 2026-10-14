import { rotulosDasColunas } from "./colunas.js";

// Funções compartilhadas por "Imprimir" e "Baixar Excel": validam a seleção e registram no histórico.

export function normalizarIds(ids) {
  if (!Array.isArray(ids)) return [];
  const vistos = new Set();
  const saida = [];
  for (const v of ids) {
    const n = Number(v);
    if (Number.isInteger(n) && n > 0 && n < 2147483647 && !vistos.has(n)) {
      vistos.add(n);
      saida.push(n);
    }
    if (saida.length >= 500) break;
  }
  return saida;
}

// Lê as músicas no banco, na mesma ordem dos ids (nunca confia nos dados vindos do navegador).
export async function buscarSelecao(sql, ids) {
  return await sql`
    SELECT m.id, m.titulo, m.artista, m.origem, m.instrumento, m.nova, m.criada_em, m.criada_por
    FROM jsonb_array_elements_text(${JSON.stringify(ids)}::jsonb) WITH ORDINALITY AS o(id, pos)
    JOIN musicas m ON m.id = o.id::int
    ORDER BY o.pos`;
}

export async function registrarExportacao(sql, usuario, acao, linhas, chaves) {
  const titulo = `o repertório (${linhas.length} ${linhas.length === 1 ? "música" : "músicas"})`;
  const detalhes =
    `Colunas: ${rotulosDasColunas(chaves).join(", ")}\n` +
    linhas.map((m, i) => `${i + 1}. ${m.titulo} (${m.artista})`).join("\n");
  await sql`
    INSERT INTO historico (musica_id, titulo, acao, usuario, detalhes)
    VALUES (NULL, ${titulo}, ${acao}::text, ${usuario}::text, ${detalhes})`;
}
