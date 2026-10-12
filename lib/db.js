import { neon } from "@neondatabase/serverless";

// Criado sob demanda para o build não quebrar sem DATABASE_URL.
export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não definida. Veja o README.");
  }
  return neon(process.env.DATABASE_URL);
}
