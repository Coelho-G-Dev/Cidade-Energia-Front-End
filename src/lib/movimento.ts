"use client";

import { useSyncExternalStore } from "react";
import type { Transition } from "motion/react";

export const DURACAO_MS = { rapida: 120, padrao: 220, enfatica: 400 } as const;

export const DURACAO = {
  rapida: DURACAO_MS.rapida / 1000,
  padrao: DURACAO_MS.padrao / 1000,
  enfatica: DURACAO_MS.enfatica / 1000,
} as const;

export const CURVA = [0.2, 0.8, 0.2, 1] as const;

export const MOLA_CURTA = { type: "spring", stiffness: 500, damping: 30 } as const satisfies Transition;

export const TRANSICAO = {
  rapida: { duration: DURACAO.rapida, ease: CURVA },
  padrao: { duration: DURACAO.padrao, ease: CURVA },
  enfatica: { duration: DURACAO.enfatica, ease: CURVA },
} as const satisfies Record<string, Transition>;

const CONSULTA = "(prefers-reduced-motion: reduce)";

function assinar(aviso: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const lista = window.matchMedia(CONSULTA);
  lista.addEventListener("change", aviso);
  return () => lista.removeEventListener("change", aviso);
}

function lerPreferencia(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(CONSULTA).matches;
}

export function usePoucoMovimento(): boolean {
  return useSyncExternalStore(assinar, lerPreferencia, () => false);
}

export function transicaoOuFade(poucoMovimento: boolean, transicao: Transition): Transition {
  return poucoMovimento ? { duration: DURACAO.rapida, ease: "linear" } : transicao;
}
