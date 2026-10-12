"use client";

import { useActionState, useEffect, useRef } from "react";
import { adicionarMusica } from "../app/actions";

const campo =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-700 focus:ring-2 focus:ring-slate-300";

export default function SongForm() {
  const [estado, acao, pendente] = useActionState(adicionarMusica, null);
  const formRef = useRef(null);

  useEffect(() => {
    if (estado?.ok) formRef.current?.reset();
  }, [estado]);

  return (
    <form
      ref={formRef}
      action={acao}
      className="mb-8 grid gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-6"
    >
      <label className="sm:col-span-2">
        <span className="mb-1 block text-xs font-medium text-slate-600">Música</span>
        <input name="titulo" required className={campo} placeholder="Ex.: Pais e Filhos" />
      </label>
      <label className="sm:col-span-2">
        <span className="mb-1 block text-xs font-medium text-slate-600">Autor/Banda</span>
        <input name="artista" required className={campo} placeholder="Ex.: Legião Urbana" />
      </label>
      <label>
        <span className="mb-1 block text-xs font-medium text-slate-600">Nac/Int</span>
        <select name="origem" className={campo} defaultValue="nac">
          <option value="nac">Nacional</option>
          <option value="int">Internacional</option>
        </select>
      </label>
      <label>
        <span className="mb-1 block text-xs font-medium text-slate-600">Instrumento</span>
        <input name="instrumento" list="instrumentos" className={campo} placeholder="Opcional" />
        <datalist id="instrumentos">
          <option value="Teclado" />
          <option value="Teclado/Intro" />
        </datalist>
      </label>

      <div className="flex flex-wrap items-center gap-4 sm:col-span-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="nova" defaultChecked className="size-4 accent-amber-500" />
          Marcar como nova
        </label>
        <button
          type="submit"
          disabled={pendente}
          className="rounded-md bg-tinta px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {pendente ? "Salvando..." : "Adicionar música"}
        </button>
        {estado?.mensagem && (
          <p
            role="status"
            className={`text-sm ${estado.ok ? "text-emerald-700" : "text-red-700"}`}
          >
            {estado.mensagem}
          </p>
        )}
      </div>
    </form>
  );
}
