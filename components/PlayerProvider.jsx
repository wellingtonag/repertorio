"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { IconeAnterior, IconePause, IconePlay, IconeProxima } from "./Icones";

// Player do repertório: usa a iFrame API do Spotify (um único embed, trocado a cada música).
// Os controles (play/pause, anterior, próxima) e a fila ficam numa barra fixa no rodapé.

const PLAYER_VAZIO = {
  atual: null,
  tocando: false,
  fila: [],
  indice: -1,
  tocarFaixa() {},
  tocarFila() {},
  alternar() {},
  proxima() {},
  anterior() {},
  fechar() {},
};
const Ctx = createContext(PLAYER_VAZIO);
export const usePlayer = () => useContext(Ctx);

let apiSpotify = null;
let promessaApi = null;

// O script do Spotify só é carregado quando alguém pede para ouvir uma música.
function carregarApi() {
  if (apiSpotify) return Promise.resolve(apiSpotify);
  if (promessaApi) return promessaApi;
  promessaApi = new Promise((resolve, reject) => {
    window.onSpotifyIframeApiReady = (api) => {
      apiSpotify = api;
      resolve(api);
    };
    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    script.onerror = () => {
      promessaApi = null;
      reject(new Error("script bloqueado"));
    };
    document.body.appendChild(script);
  });
  return promessaApi;
}

const carregarUri = (c, uri) => (c.loadEntity ? c.loadEntity(uri) : c.loadUri(uri));
const uriDaFaixa = (f) => `spotify:track:${f.id}`;

export default function PlayerProvider({ children, limiteMs = 10000 }) {
  const [aberto, setAberto] = useState(false);
  const [fila, setFila] = useState([]);
  const [indice, setIndice] = useState(-1);
  const [modoFila, setModoFila] = useState(false);
  const [tocando, setTocando] = useState(false);
  const [fim, setFim] = useState(false);
  const [erro, setErro] = useState("");
  const [filaAberta, setFilaAberta] = useState(false);

  const montagem = useRef(null);
  const ctrl = useRef(null);
  const criando = useRef(null);
  const pronto = useRef(false);
  const filaRef = useRef([]);
  const indiceRef = useRef(-1);
  const modoRef = useRef(false);
  const querTocar = useRef(false);
  const uriPedida = useRef("");
  const uriCarregada = useRef("");
  const avancou = useRef("");
  const timerRetry = useRef(null);
  const timerPronto = useRef(null);
  const aoAtualizar = useRef(() => {});

  const criarControlador = useCallback((uri) => {
    if (!criando.current) {
      criando.current = (async () => {
        const api = await carregarApi();
        const alvo = document.createElement("div");
        montagem.current.appendChild(alvo);
        const c = await new Promise((resolve) =>
          api.createController(alvo, { uri, width: "100%", height: 80 }, resolve)
        );
        uriCarregada.current = uri;
        c.addListener("ready", () => {
          pronto.current = true;
          clearTimeout(timerPronto.current);
          setErro("");
          if (querTocar.current) c.play();
        });
        c.addListener("playback_update", (e) => aoAtualizar.current(e));
        ctrl.current = c;
        return c;
      })().catch((e) => {
        criando.current = null;
        throw e;
      });
    }
    return criando.current;
  }, []);

  const tentarTocar = useCallback((c) => {
    c.play();
    clearTimeout(timerRetry.current);
    // o embed pode ignorar o play() enquanto carrega a nova música: tenta de novo uma vez
    timerRetry.current = setTimeout(() => {
      if (querTocar.current) c.play();
    }, 1500);
  }, []);

  const iniciar = useCallback(
    async (lista, i, comFila) => {
      const faixa = lista[i];
      if (!faixa?.id) return;
      const uri = uriDaFaixa(faixa);

      filaRef.current = lista;
      indiceRef.current = i;
      modoRef.current = comFila;
      avancou.current = "";
      uriPedida.current = uri;
      querTocar.current = true;
      setFila(lista);
      setIndice(i);
      setModoFila(comFila);
      setFim(false);
      setAberto(true);
      setErro("");

      if (!pronto.current) {
        clearTimeout(timerPronto.current);
        timerPronto.current = setTimeout(() => {
          if (!pronto.current) {
            setErro("O player do Spotify não carregou neste navegador ou site (bloqueador de anúncios?).");
          }
        }, limiteMs);
      }

      try {
        const c = ctrl.current ?? (await criarControlador(uri));
        if (uriPedida.current !== uri) return; // outra música foi pedida enquanto carregava
        if (uriCarregada.current !== uri) {
          carregarUri(c, uri);
          uriCarregada.current = uri;
        } else if (ctrl.current && c.restart) {
          c.restart(); // mesma música de novo: volta ao início
        }
        tentarTocar(c);
      } catch {
        setErro("Não foi possível carregar o player do Spotify. Use o link para abrir no Spotify.");
      }
    },
    [criarControlador, tentarTocar, limiteMs]
  );

  const tocarFaixa = useCallback((faixa) => iniciar([faixa], 0, false), [iniciar]);
  const tocarFila = useCallback((lista, i = 0) => iniciar(lista, i, true), [iniciar]);

  const proxima = useCallback(() => {
    const i = indiceRef.current + 1;
    if (i < filaRef.current.length) {
      iniciar(filaRef.current, i, modoRef.current);
    } else {
      querTocar.current = false;
      clearTimeout(timerRetry.current);
      ctrl.current?.pause();
      setTocando(false);
      setFim(true);
    }
  }, [iniciar]);

  const anterior = useCallback(() => {
    const i = indiceRef.current - 1;
    if (i >= 0) iniciar(filaRef.current, i, modoRef.current);
    else if (ctrl.current) {
      querTocar.current = true;
      ctrl.current.restart?.();
    }
  }, [iniciar]);

  const alternar = useCallback(() => {
    const c = ctrl.current;
    if (!c) return;
    querTocar.current = false;
    clearTimeout(timerRetry.current);
    c.togglePlay();
  }, []);

  const fechar = useCallback(() => {
    querTocar.current = false;
    clearTimeout(timerRetry.current);
    clearTimeout(timerPronto.current);
    ctrl.current?.pause();
    uriPedida.current = "";
    filaRef.current = [];
    indiceRef.current = -1;
    setAberto(false);
    setTocando(false);
    setFila([]);
    setIndice(-1);
    setFilaAberta(false);
    setErro("");
  }, []);

  // Eventos do embed. Fica em um ref para o listener (registrado uma vez) enxergar sempre o estado atual.
  useEffect(() => {
    aoAtualizar.current = (e) => {
      const { isPaused, duration, position, playingURI } = e?.data || {};
      const faixa = filaRef.current[indiceRef.current];
      const uriAtual = faixa ? uriDaFaixa(faixa) : "";
      if (playingURI && uriAtual && playingURI !== uriAtual) return; // atualização da música anterior

      setTocando(!isPaused);
      if (!isPaused) {
        querTocar.current = false;
        clearTimeout(timerRetry.current);
      }
      if (!modoRef.current || !faixa) return;

      // Acabou a música da fila: passa para a próxima (uma única vez por música).
      const chave = `${uriAtual}#${indiceRef.current}`;
      if (duration > 0 && position >= duration - 1500 && avancou.current !== chave) {
        avancou.current = chave;
        proxima();
      }
    };
  });

  useEffect(
    () => () => {
      clearTimeout(timerRetry.current);
      clearTimeout(timerPronto.current);
      ctrl.current?.destroy?.();
    },
    []
  );

  const atual = fila[indice] ?? null;
  const seguinte = modoFila ? fila[indice + 1] : null;

  const valor = useMemo(
    () => ({ atual, tocando, fila, indice, tocarFaixa, tocarFila, alternar, proxima, anterior, fechar }),
    [atual, tocando, fila, indice, tocarFaixa, tocarFila, alternar, proxima, anterior, fechar]
  );

  const botaoControle =
    "rounded-full p-2 text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <Ctx.Provider value={valor}>
      {children}

      <div className={aberto ? "print:hidden" : "hidden"}>
        <div className="h-52" aria-hidden="true" />
        <div
          role="region"
          aria-label="Player do repertório"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-300 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
        >
          {filaAberta && modoFila && (
            <ol className="absolute inset-x-0 bottom-full max-h-64 overflow-y-auto border-t border-slate-300 bg-white text-sm shadow-lg">
              {fila.map((f, i) => (
                <li key={`${f.id}-${i}`}>
                  <button
                    type="button"
                    onClick={() => iniciar(fila, i, true)}
                    className={`flex w-full items-center gap-3 px-4 py-1.5 text-left hover:bg-slate-100 sm:px-6 ${
                      i === indice ? "bg-marca/60 font-semibold" : ""
                    }`}
                  >
                    <span className="w-6 text-right tabular-nums text-slate-500">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate">
                      {f.titulo} <span className="ml-1 font-normal text-slate-500">{f.artista}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}

          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 sm:px-6">
            <div className="min-w-0 flex-1 basis-56">
              <p className="text-xs font-medium text-slate-500">
                {fim
                  ? "Fim do repertório"
                  : modoFila
                    ? `Ordem do show: ${indice + 1} de ${fila.length}`
                    : "Ouvindo"}
              </p>
              {atual && (
                <p className="truncate text-sm">
                  <strong>{atual.titulo}</strong> <span className="ml-1 text-slate-500">{atual.artista}</span>
                </p>
              )}
              {seguinte && !fim && <p className="truncate text-xs text-slate-500">A seguir: {seguinte.titulo}</p>}
            </div>

            <div className="flex items-center gap-1">
              <button type="button" aria-label="Música anterior" onClick={anterior} disabled={!modoFila} className={botaoControle}>
                <IconeAnterior />
              </button>
              <button
                type="button"
                aria-label={tocando ? "Pausar" : "Tocar"}
                onClick={alternar}
                className="rounded-full bg-slate-900 p-2.5 text-white hover:bg-slate-700"
              >
                {tocando ? <IconePause tamanho={18} /> : <IconePlay tamanho={18} />}
              </button>
              <button
                type="button"
                aria-label="Próxima música"
                onClick={proxima}
                disabled={!modoFila}
                className={botaoControle}
              >
                <IconeProxima />
              </button>
              {modoFila && (
                <button
                  type="button"
                  onClick={() => setFilaAberta((v) => !v)}
                  aria-expanded={filaAberta}
                  className="ml-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
                >
                  Ordem
                </button>
              )}
              <button
                type="button"
                aria-label="Fechar player"
                onClick={fechar}
                className="ml-1 rounded-full px-2.5 py-1.5 text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div ref={montagem} className="w-full sm:w-96" />
          </div>

          {erro && (
            <p role="alert" className="mx-auto max-w-6xl px-4 pb-2 text-sm text-red-700 sm:px-6">
              {erro}{" "}
              {atual && (
                <a
                  href={`https://open.spotify.com/track/${atual.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline"
                >
                  Abrir no Spotify
                </a>
              )}
            </p>
          )}
        </div>
      </div>
    </Ctx.Provider>
  );
}
