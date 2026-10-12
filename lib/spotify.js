// Leitura da playlist via Web API do Spotify (fluxo Authorization Code + refresh token).
// Desde fev/2026 o Spotify só devolve os itens de playlists que o usuário autorizado possui ou colabora.

export const PLAYLIST_ID = process.env.SPOTIFY_PLAYLIST_ID || "1yNfq1mBmnzI0ZbrSenXbW";

export function spotifyConfigurado() {
  return Boolean(
    process.env.SPOTIFY_CLIENT_ID &&
      process.env.SPOTIFY_CLIENT_SECRET &&
      process.env.SPOTIFY_REFRESH_TOKEN
  );
}

async function tokenDeAcesso() {
  const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: segredo, SPOTIFY_REFRESH_TOKEN: refresh } =
    process.env;
  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${id}:${segredo}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh }),
    cache: "no-store",
  });
  if (!r.ok) {
    throw new Error("Não foi possível autenticar no Spotify. Refaça o passo do SPOTIFY_REFRESH_TOKEN.");
  }
  return (await r.json()).access_token;
}

export async function buscarFaixasDaPlaylist() {
  const token = await tokenDeAcesso();
  let url = `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/items?limit=50`;
  const faixas = [];

  while (url) {
    if (!url.startsWith("https://api.spotify.com/")) break; // nunca manda o token para outro host
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });

    if (r.status === 403 || r.status === 404) {
      throw new Error(
        "O Spotify não liberou os itens da playlist. Ela precisa ser da conta que autorizou o app (ou colaborativa)."
      );
    }
    if (r.status === 429) throw new Error("O Spotify pediu para aguardar (limite de requisições). Tente mais tarde.");
    if (!r.ok) throw new Error(`Erro ${r.status} ao ler a playlist no Spotify.`);

    const data = await r.json();
    for (const entrada of data.items ?? []) {
      const t = entrada.item ?? entrada.track; // "item" é o nome novo; "track" o antigo
      if (!t || !t.name) continue;
      if (t.type && t.type !== "track") continue; // ignora podcasts
      faixas.push({ id: t.id ?? null, titulo: t.name, artista: t.artists?.[0]?.name ?? "Desconhecido" });
    }
    url = data.next;
  }
  return faixas;
}

// Chave para reconhecer a mesma música mesmo com sufixos como "- Ao Vivo" ou "(2019 Remaster)".
export function chaveMusica(titulo, artista) {
  const base = (s) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "");
  const t = base(titulo)
    .replace(/\(.*?\)/g, " ")
    .split(" - ")[0]
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const a = base(artista)
    .split(/,|&| feat\.?| ft\.?/)[0]
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return `${t}|${a}`;
}

// Decide o que fazer: vincular o spotify_id a músicas já existentes e inserir só as que faltam.
export function planejarSincronizacao(existentes, faixas) {
  const porSpotify = new Map();
  const porChave = new Map();
  for (const m of existentes) {
    if (m.spotify_id) porSpotify.set(m.spotify_id, m);
    porChave.set(chaveMusica(m.titulo, m.artista), m);
  }

  const atualizar = [];
  const inserir = [];
  const vistas = new Set();

  for (const f of faixas) {
    const k = chaveMusica(f.titulo, f.artista);
    if (vistas.has(k)) continue; // repetida dentro da própria playlist
    vistas.add(k);

    const existente = (f.id && porSpotify.get(f.id)) || porChave.get(k);
    if (!existente) inserir.push(f);
    else if (!existente.spotify_id && f.id) atualizar.push({ id: existente.id, spotify_id: f.id });
  }
  return { atualizar, inserir };
}
