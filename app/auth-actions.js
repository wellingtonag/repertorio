"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSql } from "../lib/db";
import { COOKIE_SESSAO, ipCliente } from "../lib/auth";
import { criarToken, senhaCorreta, loginConfigurado, DURACAO_SEGUNDOS } from "../lib/token";

const MAX_TENTATIVAS = 5; // por IP, a cada 15 minutos

export async function entrar(_estado, formData) {
  const nome = String(formData.get("nome") || "")
    .replace(/[\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const senha = String(formData.get("senha") || "");

  if (nome.length < 2 || nome.length > 40) {
    return { ok: false, mensagem: "Digite seu nome (de 2 a 40 caracteres)." };
  }
  if (!loginConfigurado()) {
    return { ok: false, mensagem: "Login não configurado no servidor (EDIT_PASSWORD e SESSION_SECRET)." };
  }

  try {
    const sql = getSql();
    const ip = await ipCliente();

    const [{ n }] = await sql`
      SELECT count(*)::int AS n FROM tentativas_login
      WHERE ip = ${ip} AND em > now() - interval '15 minutes'`;
    if (n >= MAX_TENTATIVAS) {
      return { ok: false, mensagem: "Muitas tentativas erradas. Aguarde 15 minutos." };
    }

    if (!senhaCorreta(senha)) {
      await sql`INSERT INTO tentativas_login (ip) VALUES (${ip})`;
      await sql`DELETE FROM tentativas_login WHERE em < now() - interval '1 day'`;
      return { ok: false, mensagem: "Senha incorreta." };
    }
    await sql`DELETE FROM tentativas_login WHERE ip = ${ip}`;
  } catch (e) {
    console.error(e);
    return { ok: false, mensagem: "Não foi possível verificar a senha. Tente de novo." };
  }

  const jar = await cookies();
  jar.set(COOKIE_SESSAO, criarToken(nome), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO_SEGUNDOS,
  });
  revalidatePath("/");
  return { ok: true };
}

export async function sair() {
  const jar = await cookies();
  jar.delete(COOKIE_SESSAO);
  revalidatePath("/");
}
