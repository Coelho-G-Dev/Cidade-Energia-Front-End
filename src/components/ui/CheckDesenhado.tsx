"use client";

import { motion } from "motion/react";
import { CURVA, DURACAO, usePoucoMovimento } from "@/lib/movimento";

type Props = { tamanho?: number; espessura?: number; atrasoMs?: number; className?: string };

// Check que se desenha do começo ao fim quando aparece.
export function CheckDesenhado({ tamanho = 20, espessura = 3, atrasoMs = 0, className }: Props) {
  const poucoMovimento = usePoucoMovimento();
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <motion.path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth={espessura}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={poucoMovimento ? { opacity: 0 } : { pathLength: 0 }}
        animate={poucoMovimento ? { opacity: 1 } : { pathLength: 1 }}
        transition={{ duration: poucoMovimento ? DURACAO.rapida : DURACAO.enfatica, ease: CURVA, delay: atrasoMs / 1000 }}
      />
    </svg>
  );
}
