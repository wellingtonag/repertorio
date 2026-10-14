import ExcelJS from "exceljs";
import { COLUNAS_EXPORT, normalizarColunas, valorCelula } from "./colunas.js";

// Gera o .xlsx com as músicas na ordem recebida e só com as colunas escolhidas.
// As novas ficam em amarelo quando a coluna "Status" está incluída.
export async function gerarExcel(linhas, usuario, chaves, agora = new Date()) {
  const colunas = normalizarColunas(chaves).map((k) => COLUNAS_EXPORT.find((c) => c.chave === k));

  const wb = new ExcelJS.Workbook();
  wb.creator = "Repertório";
  wb.lastModifiedBy = usuario;
  wb.created = agora;

  const ws = wb.addWorksheet("Repertório", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = colunas.map((c) => ({ header: c.rotulo, key: c.chave, width: c.largura }));

  linhas.forEach((m, i) => {
    ws.addRow(Object.fromEntries(colunas.map((c) => [c.chave, valorCelula(m, c.chave, i)])));
  });

  const preencher = (linha, argb) =>
    linha.eachCell((c) => {
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
    });

  const cabecalho = ws.getRow(1);
  cabecalho.font = { bold: true, color: { argb: "FFFFFFFF" } };
  preencher(cabecalho, "FF1B2433");
  if (colunas.some((c) => c.chave === "status")) {
    linhas.forEach((m, i) => m.nova && preencher(ws.getRow(i + 2), "FFFFE27A"));
  }
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: colunas.length } };

  return Buffer.from(await wb.xlsx.writeBuffer());
}
