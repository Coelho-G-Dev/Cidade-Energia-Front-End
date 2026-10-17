"use client";

import { useSyncExternalStore } from "react";

// Mesmo ponto do `lg:` do Tailwind (1024 px).
export const DESKTOP = "(min-width: 64rem)";

/**
 * Diz se a consulta de mídia vale agora. No servidor e na hidratação é sempre `false`,
 * então o que só existe no desktop entra depois, sem diferença entre servidor e cliente.
 */
export function useMidia(consulta: string): boolean {
  return useSyncExternalStore(
    (aviso) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => {};
      const lista = window.matchMedia(consulta);
      lista.addEventListener("change", aviso);
      return () => lista.removeEventListener("change", aviso);
    },
    () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(consulta).matches,
    () => false,
  );
}
