"use client";

import { useMemo, useState, useTransition } from "react";
import { alternarNova, excluirMusica, definirOrigem } from "../app/actions";

const fmtData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

const colunas = [
  { chave: "titulo", rotulo: "Música" },
  { chave: "artista", rotulo: "Autor/Banda" },
  { chave: "origem", rotulo: "Nac/Int" },
  { chave: "instrumento", rotulo: "Instr." },
  { chave: "nova", rotulo: "Status" },
  { chave: "criada_em", rotulo: "Inserida em" },
  { chave: "criada_por", rotulo: "Por" },
];

export default function SongTable({ musicas, usuario }) {
  const [busca, setBusca] = useState("");
  const [origem, setOrigem] = useState("todas");
  const [status, setStatus] = useState("todas");
  const [ordem, setOrdem] = useState(null); // { chave, dir }
  const [, startTransition] = useTransition();
  const [erro, setErro] = useState("");

  function executar(fn) {
    startTransition(async () => {
      const r = await fn();
      setErro(r && r.ok === false ? r.mensagem : "");
    });
  }

  const totais = useMemo(
    () => ({
      total: musicas.length,
      novas: musicas.filter((m) => m.nova).length,
      nac: musicas.filter((m) => m.origem === "nac").length,
      int: musicas.filter((m) => m.origem === "int").length,
    }),
    [musicas]
  );

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    let lista = musicas.filter(
      (m) =>
        (origem === "todas" || m.origem === origem) &&
        (status === "todas" || (status === "novas") === m.nova) &&
        (!q || `${m.titulo} ${m.artista}`.toLowerCase().includes(q))
    );
    if (ordem) {
      const { chave, dir } = ordem;
      lista = [...lista].sort((a, b) => {
        const x = a[chave] ?? "";
        const y = b[chave] ?? "";
        const c = typeof x === "string" ? x.localeCompare(y, "pt-BR") : x === y ? 0 : x ? -1 : 1;
        return dir === "asc" ? c : -c;
      });
    }
    return lista;
  }, [musicas, busca, origem, status, ordem]);

  function ordenar(chave) {
    setOrdem((o) =>
      o?.chave === chave ? (o.dir === "asc" ? { chave, dir: "desc" } : null) : { chave, dir: "asc" }
    );
  }

  const seletor =
    "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-700 focus:ring-2 focus:ring-slate-300";

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar música ou banda"
          className={`${seletor} w-full sm:w-72`}
        />
        <select value={origem} onChange={(e) => setOrigem(e.target.value)} className={seletor}>
          <option value="todas">Nacionais e internacionais</option>
          <option value="nac">Só nacionais</option>
          <option value="int">Só internacionais</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={seletor}>
          <option value="todas">Novas e antigas</option>
          <option value="novas">Só novas</option>
          <option value="antigas">Só antigas</option>
        </select>
        <p className="ml-auto text-sm text-slate-600">
          {visiveis.length} de {totais.total} · {totais.novas} novas · {totais.nac} nac ·{" "}
          {totais.int} int
        </p>
      </div>

      {erro && (
        <p role="alert" className="mb-3 text-sm text-red-700">
          {erro}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="bg-tinta text-left text-white">
              {colunas.map((c) => (
                <th key={c.chave} className="px-3 py-2 font-semibold">
                  <button type="button" onClick={() => ordenar(c.chave)} className="hover:underline">
                    {c.rotulo}
                    {ordem?.chave === c.chave && (ordem.dir === "asc" ? " ▲" : " ▼")}
                  </button>
                </th>
              ))}
              {usuario && <th className="px-3 py-2" />}
            </tr>
          </thead>
          <tbody>
            {visiveis.map((m) => (
              <tr
                key={m.id}
                className={
                  m.nova
                    ? "border-l-4 border-marca-borda bg-marca/60 text-slate-900"
                    : "border-l-4 border-transparent text-slate-500 odd:bg-slate-50"
                }
              >
                <td className="px-3 py-2 font-medium">{m.titulo}</td>
                <td className="px-3 py-2">{m.artista}</td>
                <td className="px-3 py-2">
                  {m.origem ? (
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                        m.origem === "int" ? "bg-sky-100 text-sky-800" : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {m.origem}
                    </span>
                  ) : usuario ? (
                    <select
                      aria-label={`Classificar ${m.titulo} como nacional ou internacional`}
                      defaultValue=""
                      onChange={(e) =>
                        e.target.value && executar(() => definirOrigem(m.id, e.target.value))
                      }
                      className="rounded border border-amber-500 bg-white px-1 py-0.5 text-xs"
                    >
                      <option value="">?</option>
                      <option value="nac">nac</option>
                      <option value="int">int</option>
                    </select>
                  ) : (
                    <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-semibold text-slate-600">
                      ?
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">{m.instrumento}</td>
                <td className="px-3 py-2">
                  {usuario ? (
                    <button
                      type="button"
                      title={m.nova ? "Marcar como antiga" : "Marcar como nova"}
                      onClick={() => executar(() => alternarNova(m.id, !m.nova))}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        m.nova
                          ? "bg-marca-borda text-white hover:bg-amber-600"
                          : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                      }`}
                    >
                      {m.nova ? "Nova" : "Antiga"}
                    </button>
                  ) : (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        m.nova ? "bg-marca-borda text-white" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {m.nova ? "Nova" : "Antiga"}
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                  {fmtData.format(new Date(m.criada_em))}
                </td>
                <td className="whitespace-nowrap px-3 py-2">{m.criada_por || "—"}</td>
                {usuario && (
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      aria-label={`Excluir ${m.titulo}`}
                      onClick={() => {
                        if (confirm(`Excluir "${m.titulo}"?`)) executar(() => excluirMusica(m.id));
                      }}
                      className="rounded px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                    >
                      Excluir
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {visiveis.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                  Nenhuma música encontrada com esses filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
