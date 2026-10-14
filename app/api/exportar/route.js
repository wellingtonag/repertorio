import { NextResponse } from "next/server";
import { getSql } from "../../../lib/db";
import { usuarioAtual } from "../../../lib/auth";
import { buscarSelecao, normalizarIds, registrarExportacao } from "../../../lib/exportar";
import { gerarExcel } from "../../../lib/excel";
import { normalizarColunas } from "../../../lib/colunas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const erro = (mensagem, status) => NextResponse.json({ mensagem }, { status });

export async function POST(req) {
  // Só aceita chamadas feitas pelo próprio site.
  const origem = req.headers.get("origin");
  if (origem && new URL(origem).host !== req.headers.get("host")) {
    return erro("Origem não permitida.", 403);
  }

  const usuario = await usuarioAtual();
  if (!usuario) return erro("Sua sessão expirou. Entre novamente para baixar.", 401);

  let ids;
  let colunas;
  try {
    ({ ids, colunas } = await req.json());
  } catch {
    return erro("Requisição inválida.", 400);
  }
  ids = normalizarIds(ids);
  const chaves = normalizarColunas(colunas);
  if (ids.length === 0) return erro("Selecione ao menos uma música.", 400);

  try {
    const sql = getSql();
    const linhas = await buscarSelecao(sql, ids);
    if (linhas.length === 0) return erro("As músicas selecionadas não existem mais.", 404);

    const arquivo = await gerarExcel(linhas, usuario, chaves);
    await registrarExportacao(sql, usuario, "baixou em Excel", linhas, chaves); // sem registro, sem arquivo

    const dia = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date());
    return new NextResponse(new Uint8Array(arquivo), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="repertorio-${dia}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error(e);
    return erro("Não foi possível gerar o Excel. Tente de novo.", 500);
  }
}
