"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { assinar, carregar, invalidar, lerEntrada, precisaBuscar, type Entrada } from "./cacheDados";

export type EstadoDados<T> =
  | { estado: "carregando"; dados: undefined; erro: undefined }
  | { estado: "pronto"; dados: T; erro: undefined }
  | { estado: "erro"; dados: undefined; erro: unknown };

const nadaParaOuvir = () => () => {};

/**
 * Lê um recurso da API pelo cache compartilhado (ver `cacheDados.ts`). A mesma chave em telas diferentes usa os
 * mesmos dados e a mesma chamada. Depois de um erro, só busca de novo quando a pessoa pede (`recarregar`) ou
 * quando a tela monta outra vez: nunca em laço.
 */
export function useDados<T>(chave: string | null, buscar: () => Promise<T>): EstadoDados<T> & { recarregar: () => void } {
  const funcao = useRef(buscar);
  useEffect(() => {
    funcao.current = buscar;
  });

  const ouvir = useCallback((avisar: () => void) => (chave === null ? () => {} : assinar(chave, avisar)), [chave]);
  const entrada = useSyncExternalStore(
    chave === null ? nadaParaOuvir : ouvir,
    () => (chave === null ? undefined : lerEntrada<T>(chave)),
    () => undefined,
  ) as Entrada<T> | undefined;

  useEffect(() => {
    if (chave === null || !precisaBuscar(lerEntrada(chave))) return;
    carregar(chave, () => funcao.current()).catch(() => {});
  }, [chave]);

  const recarregar = useCallback(() => {
    if (chave === null) return;
    invalidar(chave);
    carregar(chave, () => funcao.current()).catch(() => {});
  }, [chave]);

  if (entrada?.dados !== undefined && !entrada.falhou) return { estado: "pronto", dados: entrada.dados, erro: undefined, recarregar };
  if (entrada?.falhou && !entrada.carregando) return { estado: "erro", dados: undefined, erro: entrada.erro, recarregar };
  return { estado: "carregando", dados: undefined, erro: undefined, recarregar };
}
