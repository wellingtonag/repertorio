import { cookies, headers } from "next/headers";
import { lerToken } from "./token";

export const COOKIE_SESSAO = "repertorio_sessao";

// Nome do usuário logado ou null. Chamado em toda ação de escrita (não basta esconder botões).
export async function usuarioAtual() {
  const jar = await cookies();
  return lerToken(jar.get(COOKIE_SESSAO)?.value)?.nome ?? null;
}

export async function ipCliente() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || "desconhecido";
}
