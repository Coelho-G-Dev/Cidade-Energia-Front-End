"use client";

import { AnimatePresence, motion } from "motion/react";
import { juntar } from "@/lib/classes";
import { CURVA, usePoucoMovimento } from "@/lib/movimento";

export const CLASSES_BROTO =
  "block whitespace-nowrap rounded-full border-2 border-tinta bg-destaque px-2.5 py-0.5 font-titulo text-base font-extrabold text-destaque-tinta";

export type GanhoPontos = { id: number; pontos: number };

type Props = {
  ganho: GanhoPontos | null;
  onFim?: () => void;
  className?: string;
};

export function BrotoPontos({ ganho, onFim, className }: Props) {
  const poucoMovimento = usePoucoMovimento();
  const visivel = ganho && ganho.pontos > 0 ? ganho : null;

  return (
    <span className={juntar("pointer-events-none absolute", className)}>
      <span className="sr-only" aria-live="polite">
        {visivel ? `Você ganhou ${visivel.pontos} pontos.` : ""}
      </span>
      <AnimatePresence>
        {visivel && (
          <motion.span
            key={visivel.id}
            aria-hidden="true"
            className={juntar(CLASSES_BROTO, "absolute left-1/2 -translate-x-1/2")}
            initial={{ opacity: 0, y: poucoMovimento ? 0 : 4 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: poucoMovimento ? 0 : [4, -10, -22, -32],
            }}
            transition={{ duration: 1.1, ease: CURVA, times: [0, 0.15, 0.7, 1] }}
            onAnimationComplete={onFim}
          >
            +{visivel.pontos}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
