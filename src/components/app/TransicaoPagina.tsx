"use client";

import { motion, type TargetAndTransition } from "motion/react";
import { useState, type ReactNode } from "react";
import { lerDirecao } from "@/lib/navegacao";
import { TRANSICAO, usePoucoMovimento } from "@/lib/movimento";

const DESLOCAMENTO = 24;

export function TransicaoPagina({ children }: { children: ReactNode }) {
  const [{ direcao, primeiraCarga }] = useState(lerDirecao);
  const poucoMovimento = usePoucoMovimento();

  let inicial: TargetAndTransition | false = { opacity: 0, x: direcao === "voltar" ? -DESLOCAMENTO : DESLOCAMENTO };
  if (direcao === "aba" || poucoMovimento) inicial = { opacity: 0 };
  if (direcao === "expandir" || primeiraCarga) inicial = false;

  return (
    <motion.div initial={inicial} animate={{ opacity: 1, x: 0 }} transition={TRANSICAO.padrao}>
      {children}
    </motion.div>
  );
}
