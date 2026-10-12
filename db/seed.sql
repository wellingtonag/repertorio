-- Cria/atualiza as tabelas e importa as 51 músicas da lista inicial.
-- Pode ser executado mais de uma vez: tabelas existentes e músicas repetidas são ignoradas.

CREATE TABLE IF NOT EXISTS musicas (
  id          SERIAL PRIMARY KEY,
  titulo      TEXT        NOT NULL,
  artista     TEXT        NOT NULL,
  origem      TEXT        NOT NULL CHECK (origem IN ('nac', 'int')),
  instrumento TEXT,
  nova        BOOLEAN     NOT NULL DEFAULT TRUE,
  criada_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
  criada_por  TEXT,
  UNIQUE (titulo, artista)
);

ALTER TABLE musicas ADD COLUMN IF NOT EXISTS criada_por TEXT;

CREATE TABLE IF NOT EXISTS historico (
  id        SERIAL PRIMARY KEY,
  musica_id INTEGER,
  titulo    TEXT        NOT NULL,
  acao      TEXT        NOT NULL,
  usuario   TEXT        NOT NULL,
  em        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tentativas_login (
  id SERIAL PRIMARY KEY,
  ip TEXT        NOT NULL,
  em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tentativas_login_ip_em ON tentativas_login (ip, em);

INSERT INTO musicas (titulo, artista, origem, instrumento, nova, criada_em) VALUES
  ('Epitáfio', 'Titãs', 'nac', 'Teclado', TRUE, now()),
  ('Do Seu Lado - Ao Vivo', 'Jota Quest', 'nac', NULL, FALSE, now()),
  ('À Sua Maneira', 'Capital Inicial', 'nac', NULL, FALSE, now()),
  ('Será', 'Legião Urbana', 'nac', NULL, FALSE, now()),
  ('A Cera', 'O Surto', 'nac', NULL, TRUE, now()),
  ('I Saw You Saying - That You Say That You Saw', 'Raimundos', 'nac', NULL, FALSE, now()),
  ('Carla', 'LS Jack', 'nac', NULL, FALSE, now()),
  ('Dias Atrás', 'CPM 22', 'nac', NULL, FALSE, now()),
  ('Quatro Vezes Você', 'Capital Inicial', 'nac', NULL, FALSE, now()),
  ('A Mais Pedida', 'Raimundos', 'nac', NULL, FALSE, now()),
  ('Razões e Emoções', 'NX Zero', 'nac', NULL, FALSE, now()),
  ('Cedo ou Tarde', 'NX Zero', 'nac', NULL, FALSE, now()),
  ('Não Olhe pra Trás', 'Capital Inicial', 'nac', NULL, FALSE, now()),
  ('Natasha - Ao Vivo', 'Capital Inicial', 'nac', NULL, FALSE, now()),
  ('Lanterna dos Afogados', 'Os Paralamas do Sucesso', 'nac', 'Teclado', FALSE, now()),
  ('Camila, Camila', 'Nenhum de Nós', 'nac', NULL, FALSE, now()),
  ('Tudo Que Vai - Ao Vivo', 'Capital Inicial', 'nac', NULL, FALSE, now()),
  ('Não Sei Viver Sem Ter Você', 'CPM 22', 'nac', NULL, FALSE, now()),
  ('Geração Coca-Cola', 'Legião Urbana', 'nac', NULL, FALSE, now()),
  ('Esperando na Janela', 'Cogumelo Plutão', 'nac', NULL, FALSE, now()),
  ('Mais', 'Capital Inicial', 'nac', NULL, FALSE, now()),
  ('Rádio Pirata - Ao Vivo', 'RPM', 'nac', 'Teclado', FALSE, now()),
  ('Exagerado', 'Barão Vermelho', 'nac', 'Teclado/Intro', FALSE, now()),
  ('Meu Erro', 'Os Paralamas do Sucesso', 'nac', NULL, FALSE, now()),
  ('Tempo Perdido', 'Legião Urbana', 'nac', NULL, FALSE, now()),
  ('O Astronauta de Mármore (Starman)', 'Nenhum de Nós', 'nac', NULL, FALSE, now()),
  ('Que País É Este', 'Legião Urbana', 'nac', NULL, FALSE, now()),
  ('Mulher de Fases', 'Raimundos', 'nac', NULL, FALSE, now()),
  ('Primeiros Erros (Chove) - Ao Vivo', 'Capital Inicial', 'nac', NULL, FALSE, now()),
  ('Vou Deixar', 'Skank', 'nac', NULL, FALSE, now()),
  ('Não Vou Lutar', 'Titãs', 'nac', NULL, TRUE, now()),
  ('I Believe in Miracles - (Ramones)', 'Ver. Pearl Jam', 'int', NULL, FALSE, now()),
  ('O Calibre', 'Os Paralamas do Sucesso', 'nac', NULL, FALSE, now()),
  ('Vossa Excelência', 'Titãs', 'nac', NULL, TRUE, now()),
  ('Sex on Fire', 'Kings of Leon', 'int', NULL, TRUE, now()),
  ('Sweetest Thing', 'U2', 'int', 'Teclado', TRUE, now()),
  ('Mr. Brightside', 'The Killers', 'int', NULL, TRUE, now()),
  ('Vertigo', 'U2', 'int', NULL, TRUE, now()),
  ('Segredos', 'Frejat', 'nac', NULL, TRUE, now()),
  ('Como Vovó Já Dizia (Óculos Escuros)', 'Raul Seixas', 'nac', NULL, TRUE, now()),
  ('Easy', 'Faith No More', 'int', 'Teclado', TRUE, now()),
  ('Never Tear Us Apart', 'INXS', 'int', 'Teclado', TRUE, now()),
  ('Psycho Killer', 'Talking Heads', 'int', NULL, TRUE, now()),
  ('Carta aos Missionários', 'Uns e Outros', 'nac', NULL, TRUE, now()),
  ('Interstate Love Song - 2019 Remaster', 'Stone Temple Pilots', 'int', NULL, TRUE, now()),
  ('Molly''s Chambers', 'Kings of Leon', 'int', NULL, TRUE, now()),
  ('Santeria', 'Sublime', 'int', NULL, TRUE, now()),
  ('Mr. Jones', 'Counting Crows', 'int', NULL, TRUE, now()),
  ('Jeremy', 'Pearl Jam', 'int', NULL, TRUE, now()),
  ('Shine', 'Collective Soul', 'int', NULL, TRUE, now()),
  ('Never There', 'CAKE', 'int', 'Teclado', TRUE, now())
ON CONFLICT (titulo, artista) DO NOTHING;
