"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { juntar } from "@/lib/classes";
import { CURVA, DURACAO, usePoucoMovimento } from "@/lib/movimento";

type Props = { valor: number; className?: string };

// O número sobe quando aumenta e desce quando diminui, como um contador de rolo.
export function NumeroRolante({ valor, className }: Props) {
  const poucoMovimento = usePoucoMovimento();
  const [ultimo, setUltimo] = useState({ valor, sentido: 1 });
  if (ultimo.valor !== valor) setUltimo({ valor, sentido: valor > ultimo.valor ? 1 : -1 });
  const sentido = ultimo.valor !== valor ? (valor > ultimo.valor ? 1 : -1) : ultimo.sentido;

  return (
    <span className={juntar("relative inline-flex h-[1.5em] items-center justify-center overflow-hidden tabular-nums", className)}>
      <AnimatePresence initial={false} mode="popLayout" custom={sentido}>
        <motion.span
          key={valor}
          custom={sentido}
          className="block"
          variants={{
            entrar: (s: number) => (poucoMovimento ? { opacity: 0 } : { y: `${s * 100}%`, opacity: 0 }),
            parado: { y: 0, opacity: 1 },
            sair: (s: number) => (poucoMovimento ? { opacity: 0 } : { y: `${s * -100}%`, opacity: 0 }),
          }}
          initial="entrar"
          animate="parado"
          exit="sair"
          transition={{ duration: DURACAO.padrao, ease: CURVA }}
        >
          {valor}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
