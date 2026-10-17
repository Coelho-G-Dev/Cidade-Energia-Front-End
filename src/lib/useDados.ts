"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type EstadoDados<T> =
  | { estado: "carregando"; dados: undefined; erro: undefined }
  | { estado: "pronto"; dados: T; erro: undefined }
  | { estado: "erro"; dados: undefined; erro: unknown };

type Resultado<T> = { chave: string; dados?: T; erro?: unknown; falhou: boolean };

export function useDados<T>(chave: string | null, buscar: () => Promise<T>): EstadoDados<T> & { recarregar: () => void } {
  const [resultado, setResultado] = useState<Resultado<T> | null>(null);
  const [versao, setVersao] = useState(0);
  const funcao = useRef(buscar);

  useEffect(() => {
    funcao.current = buscar;
  });

  const atual = chave === null ? null : `${chave}#${versao}`;

  useEffect(() => {
    if (atual === null) return;
    let ativo = true;
    funcao.current().then(
      (dados) => ativo && setResultado({ chave: atual, dados, falhou: false }),
      (erro: unknown) => ativo && setResultado({ chave: atual, erro, falhou: true }),
    );
    return () => {
      ativo = false;
    };
  }, [atual]);

  const recarregar = useCallback(() => setVersao((v) => v + 1), []);

  if (!resultado || resultado.chave !== atual) return { estado: "carregando", dados: undefined, erro: undefined, recarregar };
  if (resultado.falhou) return { estado: "erro", dados: undefined, erro: resultado.erro, recarregar };
  return { estado: "pronto", dados: resultado.dados as T, erro: undefined, recarregar };
}
