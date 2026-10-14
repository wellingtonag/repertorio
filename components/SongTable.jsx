"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { alternarNova, excluirMusica, definirOrigem, registrarImpressao } from "../app/actions";
import { COLUNAS_EXPORT, COLUNAS_PADRAO, normalizarColunas, normalizarOrigem, valorCelula } from "../lib/colunas";
import { usePlayer } from "./PlayerProvider";
import { IconePause, IconePlay } from "./Icones";

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

const botao =
  "rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-50";

const chaveColunas = "repertorio:colunas";

function BotaoPlay({ m, player }) {
  if (!m.spotify_id) {
    return (
      <span
        title="Sem link do Spotify. Sincronize a playlist para vincular."
        className="inline-flex size-7 items-center justify-center text-slate-300"
      >
        <IconePlay />
      </span>
    );
  }
  const atual = player.atual?.id === m.spotify_id;
  const tocando = atual && player.tocando;
  return (
    <button
      type="button"
      aria-label={tocando ? `Pausar ${m.titulo}` : `Ouvir ${m.titulo}`}
      onClick={() =>
        atual ? player.alternar() : player.tocarFaixa({ id: m.spotify_id, titulo: m.titulo, artista: m.artista })
      }
      className={`inline-flex size-7 items-center justify-center rounded-full ${
        atual ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-200"
      }`}
    >
      {tocando ? <IconePause /> : <IconePlay />}
    </button>
  );
}

export default function SongTable({ musicas, usuario }) {
  const player = usePlayer();
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [origem, setOrigem] = useState("todas");
  const [status, setStatus] = useState("todas");
  const [ordem, setOrdem] = useState(null); // { chave, dir }
  const [erro, setErro] = useState("");
  const [ocupado, startTransition] = useTransition();

  // Seleção para imprimir/baixar: ids na ordem em que serão impressos.
  const [selecionadas, setSelecionadas] = useState([]);
  const [impressoEm, setImpressoEm] = useState(null);
  const [baixando, setBaixando] = useState(false);
  const [colunasSel, setColunasSel] = useState(COLUNAS_PADRAO);

  // Lembra as colunas escolhidas neste navegador.
  useEffect(() => {
    try {
      const salvo = JSON.parse(localStorage.getItem(chaveColunas) || "null");
      if (Array.isArray(salvo)) setColunasSel(normalizarColunas(salvo));
    } catch {}
  }, []);

  function alternarColuna(chave) {
    const novo = normalizarColunas(
      colunasSel.includes(chave) ? colunasSel.filter((c) => c !== chave) : [...colunasSel, chave]
    );
    setColunasSel(novo);
    try {
      localStorage.setItem(chaveColunas, JSON.stringify(novo));
    } catch {}
  }

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
      nac: musicas.filter((m) => normalizarOrigem(m.origem) === "nac").length,
      int: musicas.filter((m) => normalizarOrigem(m.origem) === "int").length,
    }),
    [musicas]
  );

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    let lista = musicas.filter(
      (m) =>
        (origem === "todas" || normalizarOrigem(m.origem) === origem) &&
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

  // ---- seleção ----
  const porId = useMemo(() => new Map(musicas.map((m) => [m.id, m])), [musicas]);
  const selecao = useMemo(
    () => (usuario ? selecionadas.filter((id) => porId.has(id)) : []),
    [usuario, selecionadas, porId]
  );
  const posicao = useMemo(() => new Map(selecao.map((id, i) => [id, i + 1])), [selecao]);
  const linhasSelecionadas = selecao.map((id) => porId.get(id));
  const faixasFila = linhasSelecionadas
    .filter((m) => m.spotify_id)
    .map((m) => ({ id: m.spotify_id, titulo: m.titulo, artista: m.artista }));
  const semLink = linhasSelecionadas.length - faixasFila.length;
  const posicaoNaFila = (i) => linhasSelecionadas.slice(0, i).filter((m) => m.spotify_id).length;
  const colunasImpressao = COLUNAS_EXPORT.filter((c) => colunasSel.includes(c.chave));
  const todasVisiveisMarcadas = visiveis.length > 0 && visiveis.every((m) => posicao.has(m.id));

  function alternarUma(id) {
    setSelecionadas(selecao.includes(id) ? selecao.filter((x) => x !== id) : [...selecao, id]);
  }

  // Marca (ou desmarca) todas as músicas que os filtros estão mostrando, na ordem da tabela.
  function alternarVisiveis() {
    if (todasVisiveisMarcadas) {
      const fora = new Set(visiveis.map((m) => m.id));
      setSelecionadas(selecao.filter((id) => !fora.has(id)));
    } else {
      const ja = new Set(selecao);
      setSelecionadas([...selecao, ...visiveis.filter((m) => !ja.has(m.id)).map((m) => m.id)]);
    }
  }

  function mover(i, delta) {
    const j = i + delta;
    if (j < 0 || j >= selecao.length) return;
    const novo = [...selecao];
    [novo[i], novo[j]] = [novo[j], novo[i]];
    setSelecionadas(novo);
  }

  function imprimir() {
    setErro("");
    startTransition(async () => {
      const r = await registrarImpressao(selecao, colunasSel); // confere a sessão e registra no histórico
      if (!r?.ok) {
        setErro(r?.mensagem || "Não foi possível registrar a impressão.");
        return;
      }
      flushSync(() => setImpressoEm(new Date().toISOString()));
      window.print();
    });
  }

  async function baixarExcel() {
    setErro("");
    setBaixando(true);
    try {
      const r = await fetch("/api/exportar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selecao, colunas: colunasSel }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setErro(j.mensagem || "Não foi possível gerar o Excel.");
        return;
      }
      const blob = await r.blob();
      const nome =
        /filename="([^"]+)"/.exec(r.headers.get("Content-Disposition") || "")?.[1] || "repertorio.xlsx";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nome;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      router.refresh(); // atualiza o histórico
    } catch {
      setErro("Não foi possível gerar o Excel.");
    } finally {
      setBaixando(false);
    }
  }

  const seletor =
    "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-700 focus:ring-2 focus:ring-slate-300";

  return (
    <>
      <section className="print:hidden">
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
            {visiveis.length} de {totais.total} · {totais.novas} novas · {totais.nac} nac · {totais.int} int
          </p>
        </div>

        {usuario && selecao.length > 0 && (
          <div className="mb-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-bold">Repertório selecionado ({selecao.length})</h2>
                <p className="text-sm text-slate-600">
                  A ordem abaixo é a ordem da impressão e do Excel. Use as setas para mudar.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => player.tocarFila(faixasFila, 0)}
                  disabled={faixasFila.length === 0}
                  className={botao}
                >
                  Tocar na ordem
                </button>
                <button type="button" onClick={imprimir} disabled={ocupado || baixando} className={botao}>
                  Imprimir
                </button>
                <button type="button" onClick={baixarExcel} disabled={ocupado || baixando} className={botao}>
                  {baixando ? "Gerando..." : "Baixar Excel"}
                </button>
                <button type="button" onClick={() => setSelecionadas([])} className={botao}>
                  Limpar seleção
                </button>
              </div>
            </div>

            {semLink > 0 && (
              <p className="mt-2 text-sm text-amber-800">
                {semLink} {semLink === 1 ? "música sem link" : "músicas sem link"} do Spotify (serão puladas ao tocar).
              </p>
            )}

            <fieldset className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <legend className="sr-only">Colunas na impressão e no Excel</legend>
              <span className="font-medium text-slate-600">Colunas na impressão e no Excel:</span>
              {COLUNAS_EXPORT.map((c) => (
                <label key={c.chave} className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={colunasSel.includes(c.chave)}
                    disabled={c.obrigatoria}
                    onChange={() => alternarColuna(c.chave)}
                    className="size-4 accent-slate-800"
                  />
                  {c.rotulo}
                </label>
              ))}
            </fieldset>

            <ol className="mt-3 max-h-64 divide-y divide-slate-100 overflow-y-auto text-sm">
              {linhasSelecionadas.map((m, i) => (
                <li key={m.id} className="flex items-center gap-2 py-1.5">
                  <span className="w-6 text-right tabular-nums text-slate-500">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">
                    <strong>{m.titulo}</strong> <span className="ml-1 text-slate-500">{m.artista}</span>
                    {!m.spotify_id && <span className="ml-2 text-xs text-amber-800">sem link</span>}
                  </span>
                  {m.spotify_id && (
                    <button
                      type="button"
                      aria-label={`Tocar a partir de ${m.titulo}`}
                      onClick={() => player.tocarFila(faixasFila, posicaoNaFila(i))}
                      className="rounded px-2 py-1 hover:bg-slate-100"
                    >
                      <IconePlay />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={`Subir ${m.titulo}`}
                    disabled={i === 0}
                    onClick={() => mover(i, -1)}
                    className="rounded px-2 py-0.5 hover:bg-slate-100 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`Descer ${m.titulo}`}
                    disabled={i === selecao.length - 1}
                    onClick={() => mover(i, 1)}
                    className="rounded px-2 py-0.5 hover:bg-slate-100 disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    aria-label={`Remover ${m.titulo} da seleção`}
                    onClick={() => alternarUma(m.id)}
                    className="rounded px-2 py-0.5 text-red-700 hover:bg-red-50"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ol>
          </div>
        )}

        {erro && (
          <p role="alert" className="mb-3 text-sm text-red-700">
            {erro}
          </p>
        )}

        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="bg-tinta text-left text-white">
                {usuario && (
                  <th className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={todasVisiveisMarcadas}
                      onChange={alternarVisiveis}
                      aria-label="Selecionar todas as músicas visíveis"
                      className="size-4 accent-amber-400"
                    />
                  </th>
                )}
                <th className="w-10 px-1 py-2" />
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
              {visiveis.map((m) => {
                const o = normalizarOrigem(m.origem);
                return (
                  <tr
                    key={m.id}
                    className={
                      m.nova
                        ? "border-l-4 border-marca-borda bg-marca/60 text-slate-900"
                        : "border-l-4 border-transparent text-slate-500 odd:bg-slate-50"
                    }
                  >
                    {usuario && (
                      <td className="px-3 py-2">
                        <label className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={posicao.has(m.id)}
                            onChange={() => alternarUma(m.id)}
                            aria-label={`Selecionar ${m.titulo}`}
                            className="size-4 accent-slate-800"
                          />
                          <span className="w-5 text-xs font-bold tabular-nums text-slate-700">
                            {posicao.get(m.id) ?? ""}
                          </span>
                        </label>
                      </td>
                    )}
                    <td className="px-1 py-2">
                      <BotaoPlay m={m} player={player} />
                    </td>
                    <td className="px-3 py-2 font-medium">{m.titulo}</td>
                    <td className="px-3 py-2">{m.artista}</td>
                    <td className="px-3 py-2">
                      {o ? (
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                            o === "int" ? "bg-sky-100 text-sky-800" : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {o}
                        </span>
                      ) : usuario ? (
                        <select
                          aria-label={`Classificar ${m.titulo} como nacional ou internacional`}
                          defaultValue=""
                          onChange={(e) =>
                            e.target.value && executar(() => definirOrigem(m.id, e.target.value))
                          }
                          className="rounded border border-amber-500 bg-white px-1 py-0.5 text-xs text-slate-900"
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
                );
              })}
              {visiveis.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-3 py-8 text-center text-slate-500">
                    Nenhuma música encontrada com esses filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Só aparece ao imprimir */}
      {usuario && selecao.length > 0 && (
        <div className="hidden text-black print:block">
          <h1 className="text-2xl font-bold">Repertório</h1>
          <p className="mt-1 text-sm">
            {selecao.length} {selecao.length === 1 ? "música" : "músicas"}
            {impressoEm && `, impresso em ${fmtData.format(new Date(impressoEm))} por ${usuario}`}
          </p>
          <table className="mt-4 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-black text-left">
                {colunasImpressao.map((c) => (
                  <th key={c.chave} className="py-1 pr-2">
                    {c.rotulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhasSelecionadas.map((m, i) => (
                <tr key={m.id} className="break-inside-avoid border-b border-slate-400">
                  {colunasImpressao.map((c) => (
                    <td
                      key={c.chave}
                      className={`py-1 pr-2 ${c.chave === "titulo" ? "font-semibold" : ""} ${
                        c.chave === "n" ? "tabular-nums" : ""
                      }`}
                    >
                      {valorCelula(m, c.chave, i)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
