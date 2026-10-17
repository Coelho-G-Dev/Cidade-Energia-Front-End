"use client";

import { MotionConfig } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { TRANSICAO } from "@/lib/movimento";
import { observarDirecao } from "@/lib/navegacao";

function registrarServiceWorker() {
  if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
}

export function Provedores({ children }: { children: ReactNode }) {
  useEffect(registrarServiceWorker, []);
  useEffect(observarDirecao, []);

  return (
    <MotionConfig reducedMotion="user" transition={TRANSICAO.padrao}>
      {children}
    </MotionConfig>
  );
}
