"use server";

import { revalidatePath } from "next/cache";
import { getSql } from "../lib/db";
import { usuarioAtual } from "../lib/auth";
import { sincronizar } from "../lib/sync";

const NAO_LOGADO = { ok: false, mensagem: "Sua sessão expirou. Entre novamente para editar." };

export async function adicionarMusica(_estado, formData) {
  const usuario = await usuarioAtual();
  if (!usuario) return NAO_LOGADO;

  const titulo = String(formData.get("titulo") || "").trim();
  const artista = String(formData.get("artista") || "").trim();
  const origem = formData.get("origem") === "int" ? "int" : "nac";
  const instrumento = String(formData.get("instrumento") || "").trim() || null;
  const nova = formData.get("nova") === "on";

  if (!titulo || !artista) {
    return { ok: false, mensagem: "Preencha a música e o artista/banda." };
  }

  try {
    const sql = getSql();
    // Insere a música e o registro no histórico no mesmo comando (atômico).
    const r = await sql`
      WITH nova_musica AS (
        INSERT INTO musicas (titulo, artista, origem, instrumento, nova, criada_por)
        VALUES (${titulo}, ${artista}, ${origem}, ${instrumento}, ${nova}::boolean, ${usuario})
        ON CONFLICT (titulo, artista) DO NOTHING
        RETURNING id, titulo
      )
      INSERT INTO historico (musica_id, titulo, acao, usuario)
      SELECT id, titulo, 'adicionou', ${usuario}::text FROM nova_musica
      RETURNING id`;
    if (r.length === 0) {
      return { ok: false, mensagem: "Essa música já está na lista." };
    }
  } catch (e) {
    console.error(e);
    return { ok: false, mensagem: "Não foi possível salvar. Tente de novo." };
  }

  revalidatePath("/");
  return { ok: true, mensagem: `"${titulo}" adicionada.` };
}

export async function alternarNova(id, nova) {
  const usuario = await usuarioAtual();
  if (!usuario) return NAO_LOGADO;

  try {
    const sql = getSql();
    await sql`
      WITH alterada AS (
        UPDATE musicas SET nova = ${nova}::boolean WHERE id = ${id}::int RETURNING id, titulo
      )
      INSERT INTO historico (musica_id, titulo, acao, usuario)
      SELECT id, titulo, ${nova ? "marcou como nova" : "marcou como antiga"}::text, ${usuario}::text
      FROM alterada`;
  } catch (e) {
    console.error(e);
    return { ok: false, mensagem: "Não foi possível alterar. Tente de novo." };
  }
  revalidatePath("/");
  return { ok: true };
}

export async function excluirMusica(id) {
  const usuario = await usuarioAtual();
  if (!usuario) return NAO_LOGADO;

  try {
    const sql = getSql();
    await sql`
      WITH excluida AS (
        DELETE FROM musicas WHERE id = ${id}::int RETURNING id, titulo
      )
      INSERT INTO historico (musica_id, titulo, acao, usuario)
      SELECT id, titulo, 'excluiu', ${usuario}::text FROM excluida`;
  } catch (e) {
    console.error(e);
    return { ok: false, mensagem: "Não foi possível excluir. Tente de novo." };
  }
  revalidatePath("/");
  return { ok: true };
}

export async function definirOrigem(id, origem) {
  const usuario = await usuarioAtual();
  if (!usuario) return NAO_LOGADO;
  if (origem !== "nac" && origem !== "int") return { ok: false, mensagem: "Valor inválido." };

  try {
    const sql = getSql();
    await sql`
      WITH alterada AS (
        UPDATE musicas SET origem = ${origem}::text WHERE id = ${id}::int RETURNING id, titulo
      )
      INSERT INTO historico (musica_id, titulo, acao, usuario)
      SELECT id, titulo, ${origem === "nac" ? "classificou como nacional" : "classificou como internacional"}::text, ${usuario}::text
      FROM alterada`;
  } catch (e) {
    console.error(e);
    return { ok: false, mensagem: "Não foi possível alterar. Tente de novo." };
  }
  revalidatePath("/");
  return { ok: true };
}

export async function sincronizarAgora() {
  const usuario = await usuarioAtual();
  if (!usuario) return NAO_LOGADO;

  const r = await sincronizar({ forcar: true });
  revalidatePath("/");
  return r;
}
