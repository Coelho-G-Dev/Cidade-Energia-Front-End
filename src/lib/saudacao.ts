"use client";

import { useSyncExternalStore } from "react";

const formatoHora = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Fortaleza", hour: "numeric", hourCycle: "h23" });

/** Hora de 0 a 23 no fuso de São Luís, qualquer que seja o fuso do aparelho. */
export function horaEmSaoLuis(agora: Date): number {
  return Number(formatoHora.formatToParts(agora).find((p) => p.type === "hour")?.value ?? 12);
}

export function saudacaoPara(agora: Date): string {
  const hora = horaEmSaoLuis(agora);
  if (hora >= 5 && hora < 12) return "Bom dia";
  if (hora >= 12 && hora < 18) return "Boa tarde";
  return "Boa noite";
}

export const SAUDACAO_NEUTRA = "Olá";

const nadaParaOuvir = () => () => {};

// No servidor a página não sabe a hora de quem abre: mostra "Olá". No navegador, já montado, calcula a saudação
// pelo relógio do aparelho no fuso de São Luís. useSyncExternalStore faz a troca sem aviso de hidratação.
export function useSaudacao(): string {
  return useSyncExternalStore(
    nadaParaOuvir,
    () => saudacaoPara(new Date()),
    () => SAUDACAO_NEUTRA,
  );
}
