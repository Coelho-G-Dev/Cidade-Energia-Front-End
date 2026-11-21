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

const VIRADAS_HORA = [5, 12, 18] as const;

/** Milissegundos até a próxima virada de período (5h, 12h ou 18h) no fuso de São Luís (UTC-3). */
export function msAteProximaVirada(agora: Date): number {
  const hora = horaEmSaoLuis(agora);
  const proximaHora = VIRADAS_HORA.find((h) => h > hora) ?? VIRADAS_HORA[0] + 24;
  const msPassadosNaHora = (agora.getUTCMinutes() * 60 + agora.getUTCSeconds()) * 1000 + agora.getUTCMilliseconds();
  return Math.max(1, (proximaHora - hora) * 3_600_000 - msPassadosNaHora);
}

function assinarSaudacao(notificar: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const agendar = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      notificar();
      agendar();
    }, msAteProximaVirada(new Date()));
  };

  const aoMudarVisibilidade = () => {
    if (document.visibilityState === "hidden") return;
    notificar();
    agendar();
  };

  agendar();
  document.addEventListener("visibilitychange", aoMudarVisibilidade);

  return () => {
    if (timer !== undefined) clearTimeout(timer);
    document.removeEventListener("visibilitychange", aoMudarVisibilidade);
  };
}

// No servidor a página não sabe a hora de quem abre: mostra "Olá". No navegador, já montado, calcula a saudação
// pelo relógio do aparelho no fuso de São Luís e reavalia nas viradas de período e ao voltar para a aba.
// useSyncExternalStore faz a troca sem aviso de hidratação.
export function useSaudacao(): string {
  return useSyncExternalStore(
    assinarSaudacao,
    () => saudacaoPara(new Date()),
    () => SAUDACAO_NEUTRA,
  );
}
