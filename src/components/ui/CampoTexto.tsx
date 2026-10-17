"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { juntar } from "@/lib/classes";
import { CLASSES_ENTRADA, MolduraCampo } from "./Campo";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  rotulo: string;
  dica?: string;
  erro?: string | null;
  tentativa?: number;
  sufixo?: ReactNode;
  grande?: boolean;
};

export function CampoTexto({ rotulo, dica, erro, tentativa, sufixo, grande = false, className, ...resto }: Props) {
  return (
    <MolduraCampo rotulo={rotulo} dica={dica} erro={erro} tentativa={tentativa} className={className}>
      {({ id, descricao, invalido }) =>
        sufixo || grande ? (
          <span
            className={juntar(
              "flex items-center gap-2 rounded-pequeno border-2 bg-superficie px-4 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-tinta",
              grande ? "min-h-16" : "min-h-[52px]",
              invalido ? "border-erro" : grande ? "border-primaria" : "border-tinta",
            )}
          >
            <input
              id={id}
              aria-invalid={invalido || undefined}
              aria-describedby={descricao}
              className={juntar(
                "w-full min-w-0 flex-1 bg-transparent text-tinta outline-none placeholder:text-apoio",
                grande ? "font-titulo text-[2rem] font-extrabold" : "text-base",
              )}
              {...resto}
            />
            {sufixo && <span className="shrink-0 text-pequeno text-apoio">{sufixo}</span>}
          </span>
        ) : (
          <input
            id={id}
            aria-invalid={invalido || undefined}
            aria-describedby={descricao}
            className={juntar(CLASSES_ENTRADA, invalido ? "border-erro" : "border-tinta")}
            {...resto}
          />
        )
      }
    </MolduraCampo>
  );
}
