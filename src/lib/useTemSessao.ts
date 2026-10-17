"use client";

import { useEffect, useState } from "react";
import { sessao } from "@/lib/api";

/** Diz se a pessoa entrou no app (sessão anônima). É `null` enquanto confere. */
export function useTemSessao(): boolean | null {
  const [tem, setTem] = useState<boolean | null>(null);

  useEffect(() => {
    let ativo = true;
    sessao.token().then(
      (token) => ativo && setTem(Boolean(token)),
      () => ativo && setTem(false),
    );
    return () => {
      ativo = false;
    };
  }, []);

  return tem;
}
