const base = { viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": "true" };

export function IconePlay({ tamanho = 14 }) {
  return (
    <svg {...base} width={tamanho} height={tamanho}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function IconePause({ tamanho = 14 }) {
  return (
    <svg {...base} width={tamanho} height={tamanho}>
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}

export function IconeAnterior({ tamanho = 16 }) {
  return (
    <svg {...base} width={tamanho} height={tamanho}>
      <path d="M6 5h2v14H6zM20 5v14L9 12z" />
    </svg>
  );
}

export function IconeProxima({ tamanho = 16 }) {
  return (
    <svg {...base} width={tamanho} height={tamanho}>
      <path d="M16 5h2v14h-2zM4 5l11 7L4 19z" />
    </svg>
  );
}
