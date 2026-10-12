CREATE TABLE IF NOT EXISTS musicas (
  id          SERIAL PRIMARY KEY,
  titulo      TEXT        NOT NULL,
  artista     TEXT        NOT NULL,
  origem      TEXT        CHECK (origem IN ('nac', 'int')),
  instrumento TEXT,
  nova        BOOLEAN     NOT NULL DEFAULT TRUE,
  criada_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
  criada_por  TEXT,
  spotify_id  TEXT,
  UNIQUE (titulo, artista)
);

ALTER TABLE musicas ADD COLUMN IF NOT EXISTS criada_por TEXT;

ALTER TABLE musicas ADD COLUMN IF NOT EXISTS spotify_id TEXT;

ALTER TABLE musicas ALTER COLUMN origem DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS musicas_spotify_id_key ON musicas (spotify_id) WHERE spotify_id IS NOT NULL;

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

CREATE TABLE IF NOT EXISTS sincronizacao (
  id        INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  ultima_em TIMESTAMPTZ,
  resultado TEXT
)
