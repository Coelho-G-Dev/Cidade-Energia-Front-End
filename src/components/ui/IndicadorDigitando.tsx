"use client";

import { motion } from "motion/react";
import { juntar } from "@/lib/classes";
import { usePoucoMovimento } from "@/lib/movimento";

type Props = {
  rotulo?: string;
  className?: string;
};

export function IndicadorDigitando({ rotulo = "O Energinho está escrevendo", className }: Props) {
  const poucoMovimento = usePoucoMovimento();

  return (
    <div
      role="status"
      aria-label={rotulo}
      className={juntar(
        "inline-flex items-center gap-1.5 rounded-cartao border-2 border-tinta bg-superficie px-4 py-3",
        className,
      )}
    >
      {[0, 1, 2].map((indice) => (
        <motion.span
          key={indice}
          aria-hidden="true"
          className="size-2 rounded-full bg-primaria"
          animate={poucoMovimento ? { opacity: [0.35, 1, 0.35] } : { y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut", delay: indice * 0.15 }}
        />
      ))}
    </div>
  );
}
