// Gera o SPOTIFY_REFRESH_TOKEN (rode uma vez, com a conta dona da playlist).
// Uso: npm run spotify:auth
import http from "node:http";
import { randomBytes } from "node:crypto";

const id = process.env.SPOTIFY_CLIENT_ID;
const segredo = process.env.SPOTIFY_CLIENT_SECRET;
if (!id || !segredo) {
  console.error("Defina SPOTIFY_CLIENT_ID e SPOTIFY_CLIENT_SECRET no .env.local antes de rodar.");
  process.exit(1);
}

const PORTA = 8888;
const REDIRECT = `http://127.0.0.1:${PORTA}/callback`;
const state = randomBytes(16).toString("hex");

const url =
  "https://accounts.spotify.com/authorize?" +
  new URLSearchParams({
    client_id: id,
    response_type: "code",
    redirect_uri: REDIRECT,
    scope: "playlist-read-private playlist-read-collaborative",
    state,
  });

console.log("\n1) Abra este endereço no navegador, entre com a conta dona da playlist e autorize:\n");
console.log(url + "\n");
console.log(`2) Depois do "Aceitar", volte aqui. (Redirect URI cadastrado no app: ${REDIRECT})\n`);

const servidor = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://127.0.0.1:${PORTA}`);
  if (u.pathname !== "/callback") return res.writeHead(404).end();

  const code = u.searchParams.get("code");
  if (u.searchParams.get("state") !== state || !code) {
    return res.writeHead(400).end("Requisição inválida. Rode o comando de novo.");
  }

  try {
    const r = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${id}:${segredo}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: REDIRECT }),
    });
    const data = await r.json();
    if (!r.ok || !data.refresh_token) throw new Error(JSON.stringify(data));

    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Pronto! Pode fechar esta aba e voltar ao terminal.");
    console.log("Copie esta linha para o .env.local e para as variáveis da Vercel (mantenha em segredo):\n");
    console.log(`SPOTIFY_REFRESH_TOKEN=${data.refresh_token}\n`);
  } catch (e) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Falhou. Veja o terminal.");
    console.error("Erro ao trocar o código pelo token:", e.message);
  } finally {
    servidor.close();
  }
});
servidor.listen(PORTA, "127.0.0.1");
