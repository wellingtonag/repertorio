# Repertório

Lista de músicas da banda com banco Postgres (Neon), deploy na Vercel.

- **Stack:** Next.js 15 (App Router, Server Actions) · Tailwind CSS 4 · Neon (`@neondatabase/serverless`)
- **Novas x antigas:** linhas novas em amarelo (marca-texto), antigas em cinza. O botão "Nova/Antiga" alterna o status.
- **Data de inserção:** coluna `criada_em` (preenchida automaticamente pelo banco).

## 1. Banco (Neon)

1. Crie um projeto em https://neon.tech (ou use a integração Neon dentro da Vercel).
2. Copie a *connection string* e crie o arquivo `.env.local`:

   ```
   DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require
   ```

3. Crie a tabela e importe a lista inicial (51 músicas, de `data/musicas-iniciais.json`):

   ```bash
   npm install
   npm run db:setup
   ```

   O script pode ser rodado de novo sem duplicar nada.

## 2. Rodar local

```bash
npm run dev
```

Abra http://localhost:3000.

## 3. GitHub + Vercel

```bash
git init
git add .
git commit -m "Repertório"
git branch -M main
git remote add origin git@github.com:SEU-USUARIO/repertorio.git
git push -u origin main
```

Na Vercel: **Add New > Project**, importe o repositório e defina em *Environment Variables*:

| Variável | Valor |
| --- | --- |
| `DATABASE_URL` | string de conexão do Neon |
| `EDIT_PASSWORD` | senha única do grupo para editar |
| `SESSION_SECRET` | texto aleatório com 16+ caracteres (veja `.env.example`) |

Se você usar a integração Neon da Vercel, o `DATABASE_URL` é criado automaticamente.
Rode `npm run db:setup` uma vez (localmente, apontando para o mesmo banco) antes do primeiro acesso
e sempre que o `db/schema.sql` mudar.

## Login

- Qualquer pessoa pode **visualizar** a lista, sem login.
- Para **adicionar, alterar ou excluir**, é preciso entrar no modal com o nome e a senha do grupo.
- O nome é registrado só nas alterações (coluna "Por" e "Histórico de alterações").
- A sessão fica em um cookie assinado (`httpOnly`) e dura 7 dias. Toda ação de escrita confere a sessão no servidor.
- Após 5 senhas erradas, o IP fica bloqueado por 15 minutos.
- O nome é digitado pelo usuário e não é verificado: serve como registro, não como prova de identidade.
- Para trocar a senha, altere `EDIT_PASSWORD` e faça um novo deploy. Para deslogar todo mundo, troque o `SESSION_SECRET`.

## Spotify

O **player** da playlist aparece no site sem configuração nenhuma e sempre mostra a playlist atual.

A **sincronização** (trazer músicas novas do Spotify para a tabela) precisa de configuração, por causa das
regras do Spotify desde fevereiro de 2026: o app precisa pertencer a uma conta **Premium** e a playlist precisa
ser **da conta que autoriza** (ou colaborativa).

1. Em https://developer.spotify.com/dashboard, crie um app (API: Web API) com o Redirect URI
   `http://127.0.0.1:8888/callback` (precisa ser exatamente este; `localhost` não é aceito).
2. Coloque `SPOTIFY_CLIENT_ID` e `SPOTIFY_CLIENT_SECRET` no `.env.local`.
3. Rode `npm run spotify:auth`, abra o link, autorize com a conta dona da playlist e copie a linha
   `SPOTIFY_REFRESH_TOKEN=...` que aparece no terminal para o `.env.local`.
4. Coloque as três variáveis também na Vercel (Settings > Environment Variables) e faça um novo deploy.

Como funciona:
- Quando alguém abre o site, ele confere a playlist no Spotify (no máximo 1 vez a cada 10 minutos).
- Músicas que já existem na tabela são reconhecidas pelo título e artista (ignorando "- Ao Vivo", "(Remaster)" etc.).
- As que faltam entram como **novas**, com "Por: Spotify". O Spotify não informa se a música é nacional ou
  internacional: elas entram com "?" e quem está logado escolhe nac/int na própria linha.
- Músicas removidas da playlist **não** são apagadas da tabela.
- Quem está logado também pode clicar em "Sincronizar agora".
