import SyncButton from "./SyncButton";

const fmtData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export default function SpotifyPlayer({ playlistId, usuario, sync }) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">Playlist no Spotify</h2>
        <a
          href={`https://open.spotify.com/playlist/${playlistId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-slate-700 underline"
        >
          Abrir no Spotify
        </a>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          {sync.configurado ? (
            <>
              <span>
                {sync.ultimaEm
                  ? `Última sincronização: ${fmtData.format(new Date(sync.ultimaEm))}`
                  : "Ainda não sincronizada"}
              </span>
              {usuario && <SyncButton />}
            </>
          ) : (
            usuario && <span>Sincronização com o Spotify não configurada (veja o README).</span>
          )}
        </div>
      </div>

      {usuario && sync.configurado && sync.resultado?.startsWith("erro") && (
        <p role="alert" className="mb-2 text-sm text-red-700">
          {sync.resultado}
        </p>
      )}

      <iframe
        data-testid="embed-iframe"
        style={{ borderRadius: "12px" }}
        src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&si=f5e29286385c47e0`}
        width="100%"
        height="352"
        frameBorder="0"
        allowFullScreen
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        title="Playlist do repertório no Spotify"
      />
    </section>
  );
}
