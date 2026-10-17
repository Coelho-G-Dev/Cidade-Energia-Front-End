import type { ReactNode } from "react";

const TRACOS = {
  voltar: <path d="M19 12H5M12 19l-7-7 7-7" />,
  inicio: <path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z" />,
  simulador: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  trilhas: (
    <>
      <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" />
      <path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />
    </>
  ),
  tutor: <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.2a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.5 3a8.4 8.4 0 0 1 8.5 8.5z" />,
  mapa: (
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  perfil: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  grupo: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2 20a7 7 0 0 1 14 0" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 13.5a7 7 0 0 1 4 6.5" />
    </>
  ),
  sol: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  lampada: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z" />
    </>
  ),
  folha: (
    <>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z" />
      <path d="M2 21c0-3 1.9-5.4 5.1-6" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  enviar: <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  estrela: <path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z" />,
  bicicleta: (
    <>
      <circle cx="6" cy="17" r="3.5" />
      <circle cx="18" cy="17" r="3.5" />
      <path d="M6 17l4-8h5l3 8M10 9l2 8M14 5h3" />
    </>
  ),
  menos: <path d="M5 12h14" />,
  mais: <path d="M12 5v14M5 12h14" />,
  check: <path d="M20 6L9 17l-5-5" />,
  fechar: <path d="M18 6L6 18M6 6l12 12" />,
  alerta: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5v.01" />
    </>
  ),
  recarregar: (
    <>
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 4v7h-7" />
    </>
  ),
  lua: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />,
  cadeado: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  reciclar: (
    <>
      <path d="M7 19H4.5a1.5 1.5 0 0 1-1.3-2.3L5.5 13" />
      <path d="M11 19h8.5a1.5 1.5 0 0 0 1.3-2.3L19 14" />
      <path d="M14 6.5l-1.2-2a1.5 1.5 0 0 0-2.6 0L8 8.5" />
      <path d="M9 16l2 3-2 3M3.5 10.5l2 2.5 3-1M16.5 4.5l-2.5 2 1 3" />
    </>
  ),
  chevronBaixo: <path d="M6 9l6 6 6-6" />,
  chevronDireita: <path d="M9 6l6 6-6 6" />,
  chuveiro: (
    <>
      <path d="M4 4h6a6 6 0 0 1 6 6" />
      <path d="M12 10h8l-1 3h-6z" />
      <path d="M14 17v1M17 17v2M20 17v1M15.5 20.5v.5M18.5 20.5v.5" />
    </>
  ),
  arCondicionado: (
    <>
      <rect x="2" y="4" width="20" height="9" rx="2" />
      <path d="M6 10h12M8 17c0 1.5-1 2-1 3M12 16v4M16 17c0 1.5 1 2 1 3" />
    </>
  ),
  geladeira: (
    <>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M5 10h14M9 6v1.5M9 13v2.5" />
    </>
  ),
  tv: (
    <>
      <rect x="2" y="5" width="20" height="13" rx="2" />
      <path d="M8 22h8M12 18v4" />
    </>
  ),
  ventilador: (
    <>
      <circle cx="12" cy="10" r="1.5" />
      <path d="M12 8.5c0-3 1-5.5 3.5-5.5 2 0 2.5 2.5.5 4L13.4 9M13.4 11l2.6 2c2 1.5 1.5 4-.5 4-2.5 0-3.5-2.5-3.5-5.5M10.6 10.5c-3 0-5.6-1-5.6-3.5 0-2 2.5-2.5 4-.5l1.6 2.2" />
      <path d="M12 11.5V21M8 21h8" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type NomeIcone = keyof typeof TRACOS;

type Props = {
  nome: NomeIcone;
  tamanho?: number;
  espessura?: number;
  rotulo?: string;
  className?: string;
};

export function Icone({ nome, tamanho = 24, espessura = 2, rotulo, className }: Props) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={espessura}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...(rotulo ? { role: "img", "aria-label": rotulo } : { "aria-hidden": true })}
    >
      {TRACOS[nome]}
    </svg>
  );
}
