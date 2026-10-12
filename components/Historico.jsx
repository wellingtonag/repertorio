const fmtData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export default function Historico({ itens }) {
  return (
    <details className="mt-8 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <summary className="cursor-pointer text-sm font-semibold">
        Histórico de alterações ({itens.length} mais recentes)
      </summary>
      {itens.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Nenhuma alteração registrada ainda.</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100 text-sm">
          {itens.map((h) => (
            <li key={h.id} className="flex flex-wrap gap-x-2 py-1.5">
              <span className="tabular-nums text-slate-500">{fmtData.format(new Date(h.em))}</span>
              <span>
                <strong>{h.usuario}</strong> {h.acao} <em>{h.titulo}</em>
              </span>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
