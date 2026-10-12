"use client";

import { useState, useTransition } from "react";
import { sincronizarAgora } from "../app/actions";

export default function SyncButton() {
  const [mensagem, setMensagem] = useState("");
  const [pendente, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        disabled={pendente}
        onClick={() =>
          startTransition(async () => {
            const r = await sincronizarAgora();
            setMensagem(r.mensagem || "");
          })
        }
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-60"
      >
        {pendente ? "Sincronizando..." : "Sincronizar agora"}
      </button>
      {mensagem && <span role="status">{mensagem}</span>}
    </>
  );
}
