"use client";

import type { SelectHTMLAttributes } from "react";
import { juntar } from "@/lib/classes";
import { CLASSES_ENTRADA, MolduraCampo } from "./Campo";
import { Icone } from "./Icone";

export type OpcaoSeletor = { valor: string; rotulo: string };

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "children"> & {
  rotulo: string;
  opcoes: readonly OpcaoSeletor[];
  textoVazio?: string;
  dica?: string;
  erro?: string | null;
  tentativa?: number;
};

export function Seletor({ rotulo, opcoes, textoVazio, dica, erro, tentativa, className, ...resto }: Props) {
  return (
    <MolduraCampo rotulo={rotulo} dica={dica} erro={erro} tentativa={tentativa} className={className}>
      {({ id, descricao, invalido }) => (
        <span className="relative block">
          <select
            id={id}
            aria-invalid={invalido || undefined}
            aria-describedby={descricao}
            className={juntar(CLASSES_ENTRADA, "appearance-none pr-12", invalido ? "border-erro" : "border-tinta")}
            {...resto}
          >
            {textoVazio !== undefined && <option value="">{textoVazio}</option>}
            {opcoes.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
              </option>
            ))}
          </select>
          <Icone nome="chevronBaixo" className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2" />
        </span>
      )}
    </MolduraCampo>
  );
}
