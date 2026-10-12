"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { entrar, sair } from "../app/auth-actions";

const campo =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-700 focus:ring-2 focus:ring-slate-300";

function LoginModal({ aoFechar }) {
  const ref = useRef(null);
  const [estado, acao, pendente] = useActionState(entrar, null);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  useEffect(() => {
    if (estado?.ok) aoFechar();
  }, [estado, aoFechar]);

  return (
    <dialog
      ref={ref}
      onClose={aoFechar}
      className="m-auto w-[92vw] max-w-sm rounded-xl p-0 shadow-xl backdrop:bg-slate-900/60"
    >
      <form action={acao} className="space-y-4 p-6">
        <div>
          <h2 className="text-xl font-bold">Entrar para editar</h2>
          <p className="mt-1 text-sm text-slate-600">
            Informe seu nome e a senha do grupo. Seu nome fica registrado nas alterações que você fizer.
          </p>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Seu nome</span>
          <input
            name="nome"
            required
            minLength={2}
            maxLength={40}
            autoComplete="name"
            autoFocus
            className={campo}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Senha</span>
          <input
            name="senha"
            type="password"
            required
            autoComplete="current-password"
            className={campo}
          />
        </label>

        {estado && !estado.ok && (
          <p role="alert" className="text-sm text-red-700">
            {estado.mensagem}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="rounded-md px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pendente}
            className="rounded-md bg-tinta px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {pendente ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export default function Topo({ usuario }) {
  const [aberto, setAberto] = useState(false);

  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-4xl font-black tracking-tight">Repertório</h1>
        <p className="mt-1 text-slate-600">
          Músicas já ensaiadas e novas sugestões. As novas ficam marcadas em amarelo.
        </p>
      </div>

      <div className="flex items-center gap-3 text-sm">
        {usuario ? (
          <>
            <span className="text-slate-600">
              Editando como <strong className="text-slate-900">{usuario}</strong>
            </span>
            <form action={sair}>
              <button
                type="submit"
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-100"
              >
                Sair
              </button>
            </form>
          </>
        ) : (
          <>
            <span className="text-slate-600">Somente visualização</span>
            <button
              type="button"
              onClick={() => setAberto(true)}
              className="rounded-md bg-tinta px-3 py-1.5 font-semibold text-white hover:bg-slate-700"
            >
              Entrar para editar
            </button>
          </>
        )}
      </div>

      {aberto && !usuario && <LoginModal aoFechar={() => setAberto(false)} />}
    </header>
  );
}
