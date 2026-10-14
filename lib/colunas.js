// Colunas disponíveis na impressão e no Excel (usado no navegador e no servidor).

const fmtData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export const COLUNAS_EXPORT = [
  { chave: "n", rotulo: "Nº", largura: 6 },
  { chave: "titulo", rotulo: "Música", largura: 48, obrigatoria: true },
  { chave: "artista", rotulo: "Autor/Banda", largura: 30 },
  { chave: "origem", rotulo: "Nac/Int", largura: 10 },
  { chave: "instrumento", rotulo: "Instr.", largura: 16 },
  { chave: "status", rotulo: "Status", largura: 10 },
  { chave: "criada_em", rotulo: "Inserida em", largura: 18 },
  { chave: "criada_por", rotulo: "Por", largura: 16 },
];

export const COLUNAS_PADRAO = ["n", "titulo", "artista", "origem", "instrumento"];

// Aceita "nac", "Nacional", "int ", "Internacional"... e devolve "nac", "int" ou null.
export function normalizarOrigem(valor) {
  const o = String(valor ?? "").trim().toLowerCase();
  if (o.startsWith("nac")) return "nac";
  if (o.startsWith("int")) return "int";
  return null;
}

// Só aceita chaves conhecidas, na ordem fixa das colunas; "Música" sempre entra.
export function normalizarColunas(chaves) {
  if (!Array.isArray(chaves)) return [...COLUNAS_PADRAO];
  const pedidas = new Set(chaves);
  pedidas.add("titulo");
  return COLUNAS_EXPORT.filter((c) => pedidas.has(c.chave)).map((c) => c.chave);
}

export function rotulosDasColunas(chaves) {
  return normalizarColunas(chaves).map((k) => COLUNAS_EXPORT.find((c) => c.chave === k).rotulo);
}

export function valorCelula(m, chave, indice) {
  switch (chave) {
    case "n":
      return indice + 1;
    case "titulo":
      return m.titulo;
    case "artista":
      return m.artista;
    case "origem":
      return normalizarOrigem(m.origem) ?? "";
    case "instrumento":
      return m.instrumento ?? "";
    case "status":
      return m.nova ? "Nova" : "Antiga";
    case "criada_em":
      return fmtData.format(new Date(m.criada_em));
    case "criada_por":
      return m.criada_por ?? "";
    default:
      return "";
  }
}
