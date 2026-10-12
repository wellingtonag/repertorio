import { createHmac, timingSafeEqual } from "node:crypto";

export const DURACAO_SEGUNDOS = 60 * 60 * 24 * 7; // sessão de 7 dias

export function loginConfigurado() {
  return Boolean(process.env.EDIT_PASSWORD) && (process.env.SESSION_SECRET || "").length >= 16;
}

function assinar(payload) {
  return createHmac("sha256", process.env.SESSION_SECRET).update(payload).digest("base64url");
}

// Token = base64url({nome, exp}) + "." + assinatura HMAC. Não dá para forjar sem o SESSION_SECRET.
export function criarToken(nome, agora = Date.now()) {
  const payload = Buffer.from(
    JSON.stringify({ nome, exp: agora + DURACAO_SEGUNDOS * 1000 })
  ).toString("base64url");
  return `${payload}.${assinar(payload)}`;
}

export function lerToken(token, agora = Date.now()) {
  if (!token || !loginConfigurado()) return null;
  const [payload, assinatura] = token.split(".");
  if (!payload || !assinatura) return null;

  const esperada = Buffer.from(assinar(payload));
  const recebida = Buffer.from(assinatura);
  if (esperada.length !== recebida.length || !timingSafeEqual(esperada, recebida)) return null;

  try {
    const { nome, exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!nome || typeof exp !== "number" || exp < agora) return null;
    return { nome };
  } catch {
    return null;
  }
}

// Compara em tempo constante (via hash, para igualar o tamanho).
export function senhaCorreta(tentativa, real = process.env.EDIT_PASSWORD) {
  if (!real) return false;
  const h = (s) => createHmac("sha256", "comparacao").update(String(s)).digest();
  return timingSafeEqual(h(tentativa), h(real));
}
