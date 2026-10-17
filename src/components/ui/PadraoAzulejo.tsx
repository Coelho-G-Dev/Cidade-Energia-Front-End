"use client";

import { motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { juntar } from "@/lib/classes";
import { CURVA, usePoucoMovimento } from "@/lib/movimento";

export const LADO_AZULEJO = 52;

const DURACAO_TOTAL_S = 1.1;
const DURACAO_PECA_S = 0.36;

const COR = {
  fundo: "var(--color-primaria)",
  traco: "#FFFFFF",
  centro: "var(--color-destaque)",
};

function Peca() {
  return (
    <>
      <rect width={LADO_AZULEJO} height={LADO_AZULEJO} fill={COR.fundo} />
      <path d="M26 5 L47 26 L26 47 L5 26 Z" fill="none" stroke={COR.traco} strokeOpacity={0.5} strokeWidth={2} />
      <circle cx={26} cy={26} r={7} fill={COR.centro} />
      <path
        d="M0 0 L10 0 L0 10 Z M52 0 L42 0 L52 10 Z M0 52 L10 52 L0 42 Z M52 52 L42 52 L52 42 Z"
        fill={COR.traco}
        fillOpacity={0.5}
      />
    </>
  );
}

// Uma peça só, a marca do app no trilho lateral.
export function Azulejo({ tamanho = 44, className }: { tamanho?: number; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${LADO_AZULEJO} ${LADO_AZULEJO}`} width={tamanho} height={tamanho} className={juntar("block rounded-pequeno", className)}>
      <Peca />
    </svg>
  );
}

type Props = {
  /** Altura em px. Sem altura, o padrão ocupa todo o espaço do elemento pai. */
  altura?: number;
  assentar?: boolean;
  onAssentado?: () => void;
  className?: string;
};

export function PadraoAzulejo({ altura, assentar = false, onAssentado, className }: Props) {
  const id = `azulejo-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const poucoMovimento = usePoucoMovimento();
  const caixa = useRef<HTMLDivElement>(null);
  const [medida, setMedida] = useState({ largura: 0, altura: 0 });
  const animar = assentar && !poucoMovimento;

  useEffect(() => {
    if (!animar || !caixa.current) return;
    const elemento = caixa.current;
    const observador = new ResizeObserver(([entrada]) => {
      if (entrada) setMedida({ largura: entrada.contentRect.width, altura: entrada.contentRect.height });
    });
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [animar]);

  useEffect(() => {
    if (assentar && poucoMovimento) onAssentado?.();
  }, [assentar, poucoMovimento, onAssentado]);

  const alturaReal = altura ?? medida.altura;
  const colunas = Math.ceil(medida.largura / LADO_AZULEJO);
  const linhas = Math.ceil(alturaReal / LADO_AZULEJO);
  const passo = colunas + linhas > 2 ? (DURACAO_TOTAL_S - DURACAO_PECA_S) / (colunas + linhas - 2) : 0;

  return (
    <div
      ref={caixa}
      aria-hidden="true"
      className={juntar("relative overflow-hidden", altura === undefined && "h-full", !animar && "bg-primaria", className)}
      style={altura === undefined ? undefined : { height: altura }}
    >
      <svg width="100%" height={altura ?? "100%"} className={juntar("block", altura === undefined && "absolute inset-0")}>
        {animar ? (
          medida.largura > 0 &&
          alturaReal > 0 &&
          Array.from({ length: linhas }, (_, linha) =>
            Array.from({ length: colunas }, (_, coluna) => {
              const ultima = linha === linhas - 1 && coluna === colunas - 1;
              return (
                <motion.g
                  key={`${linha}-${coluna}`}
                  style={{ transformBox: "fill-box", originX: 0.5, originY: 0.5 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: DURACAO_PECA_S, ease: CURVA, delay: (linha + coluna) * passo }}
                  onAnimationComplete={ultima ? onAssentado : undefined}
                >
                  <g transform={`translate(${coluna * LADO_AZULEJO} ${linha * LADO_AZULEJO})`}>
                    <Peca />
                  </g>
                </motion.g>
              );
            }),
          )
        ) : (
          <>
            <defs>
              <pattern id={id} width={LADO_AZULEJO} height={LADO_AZULEJO} patternUnits="userSpaceOnUse">
                <Peca />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${id})`} />
          </>
        )}
      </svg>
    </div>
  );
}
