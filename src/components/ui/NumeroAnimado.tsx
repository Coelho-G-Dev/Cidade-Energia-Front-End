"use client";

import { animate } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { CURVA, usePoucoMovimento } from "@/lib/movimento";

type Props = {
  valor: number;
  formatar?: (valor: number) => string;
  duracaoMs?: number;
  deZero?: boolean;
  className?: string;
};

const formatoPadrao = (valor: number) => Math.round(valor).toLocaleString("pt-BR");

export function NumeroAnimado({ valor, formatar = formatoPadrao, duracaoMs = 600, deZero = true, className }: Props) {
  const poucoMovimento = usePoucoMovimento();
  const [exibido, setExibido] = useState(() => (deZero ? 0 : valor));
  const anterior = useRef(exibido);

  useEffect(() => {
    if (poucoMovimento) {
      anterior.current = valor;
      return;
    }
    const controle = animate(anterior.current, valor, {
      duration: duracaoMs / 1000,
      ease: CURVA,
      onUpdate: (atual) => {
        anterior.current = atual;
        setExibido(atual);
      },
    });
    return () => controle.stop();
  }, [valor, duracaoMs, poucoMovimento]);

  return (
    <span className={className}>
      <span aria-hidden="true">{formatar(poucoMovimento ? valor : exibido)}</span>
      <span className="sr-only">{formatar(valor)}</span>
    </span>
  );
}
