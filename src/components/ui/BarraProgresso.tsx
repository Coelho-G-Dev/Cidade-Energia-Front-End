"use client";

import { motion } from "motion/react";
import { juntar } from "@/lib/classes";
import { MOLA_CURTA, TRANSICAO, usePoucoMovimento } from "@/lib/movimento";

type Props = {
  valor: number;
  total?: number;
  rotulo: string;
  mostrarRotulo?: boolean;
  tom?: "primaria" | "destaque" | "sucesso";
  atrasoMs?: number;
  /** Fração (0 a 1) de onde a barra parte ao aparecer. Padrão: vazia. */
  de?: number;
  className?: string;
};

const TONS = { primaria: "bg-primaria", destaque: "bg-destaque", sucesso: "bg-sucesso" } as const;

export function BarraProgresso({ valor, total = 1, rotulo, mostrarRotulo = false, tom = "primaria", atrasoMs = 0, de = 0, className }: Props) {
  const poucoMovimento = usePoucoMovimento();
  const fracao = total > 0 ? Math.min(Math.max(valor / total, 0), 1) : 0;

  return (
    <div className={juntar("flex flex-col gap-1.5", className)}>
      {mostrarRotulo && <span className="text-pequeno text-apoio">{rotulo}</span>}
      <div
        role="progressbar"
        aria-label={rotulo}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={valor}
        className="h-2 overflow-hidden rounded-full bg-trilho"
      >
        <motion.div
          className={juntar("h-full w-full origin-left rounded-full", TONS[tom])}
          initial={poucoMovimento ? false : { scaleX: de }}
          animate={{ scaleX: fracao }}
          transition={
            poucoMovimento ? TRANSICAO.rapida : { ...MOLA_CURTA, delay: atrasoMs / 1000 }
          }
        />
      </div>
    </div>
  );
}
