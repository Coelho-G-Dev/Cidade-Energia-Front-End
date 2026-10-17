"use client";

import { useEffect, useRef } from "react";
import { TURNSTILE_SITE_KEY } from "@/lib/api/config";

// Verificação anti-robô do login anônimo (Cloudflare Turnstile). Só aparece quando
// NEXT_PUBLIC_TURNSTILE_SITE_KEY está preenchida, ou seja, quando o back ligar o CAPTCHA no Supabase.

type OpcoesWidget = {
  sitekey: string;
  language?: string;
  theme?: "light" | "dark" | "auto";
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
};

type ApiTurnstile = {
  render(elemento: HTMLElement, opcoes: OpcoesWidget): string;
  reset(id?: string): void;
  remove(id?: string): void;
};

declare global {
  interface Window {
    turnstile?: ApiTurnstile;
  }
}

const URL_SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let carregamento: Promise<ApiTurnstile> | null = null;

function carregarTurnstile(): Promise<ApiTurnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  carregamento ??= new Promise((resolver, rejeitar) => {
    const script = document.createElement("script");
    script.src = URL_SCRIPT;
    script.async = true;
    script.onload = () => (window.turnstile ? resolver(window.turnstile) : rejeitar(new Error("Turnstile não carregou.")));
    script.onerror = () => {
      carregamento = null;
      rejeitar(new Error("Turnstile não carregou."));
    };
    document.head.appendChild(script);
  });
  return carregamento;
}

export const turnstileLigado = Boolean(TURNSTILE_SITE_KEY);

type Props = {
  /** Recebe o token quando a pessoa passa na verificação, e undefined quando ele expira. */
  onToken: (token: string | undefined) => void;
  onFalha?: () => void;
};

// Para pedir um token novo depois de uma tentativa (cada token vale uma vez), troque a key do componente.
export function Turnstile({ onToken, onFalha }: Props) {
  const caixa = useRef<HTMLDivElement>(null);
  const avisos = useRef({ onToken, onFalha });

  useEffect(() => {
    avisos.current = { onToken, onFalha };
  });

  useEffect(() => {
    if (!turnstileLigado) return;
    let ativo = true;
    let id: string | null = null;
    carregarTurnstile().then(
      (turnstile) => {
        if (!ativo || !caixa.current) return;
        id = turnstile.render(caixa.current, {
          sitekey: TURNSTILE_SITE_KEY,
          language: "pt-br",
          theme: "light",
          callback: (token) => avisos.current.onToken(token),
          "expired-callback": () => avisos.current.onToken(undefined),
          "error-callback": () => avisos.current.onFalha?.(),
        });
      },
      () => ativo && avisos.current.onFalha?.(),
    );
    return () => {
      ativo = false;
      if (id) window.turnstile?.remove(id);
    };
  }, []);

  if (!turnstileLigado) return null;
  return <div ref={caixa} className="min-h-[65px]" />;
}
