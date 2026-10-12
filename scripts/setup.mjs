// Cria a tabela e importa a lista inicial (pode rodar mais de uma vez: ignora duplicadas).
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL não definida. Crie o .env.local (veja .env.example).");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

// O schema tem vários comandos; roda um por vez (todos são idempotentes).
const schema = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
for (const comando of schema.split(";").map((c) => c.trim()).filter(Boolean)) {
  await sql.query(comando);
}
console.log("Tabelas prontas (musicas, historico, tentativas_login).");

const lista = JSON.parse(
  readFileSync(new URL("../data/musicas-iniciais.json", import.meta.url), "utf8")
);

// Mesmo timestamp para todas, para manter a ordem original da planilha (id).
const agora = new Date().toISOString();
let inseridas = 0;
for (const m of lista) {
  const r = await sql`
    INSERT INTO musicas (titulo, artista, origem, instrumento, nova, criada_em)
    VALUES (${m.titulo}, ${m.artista}, ${m.origem}, ${m.instrumento || null}, ${m.nova}, ${agora})
    ON CONFLICT (titulo, artista) DO NOTHING
    RETURNING id`;
  inseridas += r.length;
}
console.log(`${inseridas} música(s) importada(s) de ${lista.length}.`);
