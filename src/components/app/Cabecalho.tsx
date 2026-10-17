import type { ReactNode } from "react";
import { juntar } from "@/lib/classes";

type Props = { titulo: string; texto?: ReactNode; acao?: ReactNode; className?: string };

export function Cabecalho({ titulo, texto, acao, className }: Props) {
  return (
    <div className={juntar("flex items-start justify-between gap-3", className)}>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-titulo-1">{titulo}</h1>
        {texto && <p className="text-apoio">{texto}</p>}
      </div>
      {acao}
    </div>
  );
}
