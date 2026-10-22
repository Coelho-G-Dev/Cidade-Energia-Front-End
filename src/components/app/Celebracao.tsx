"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { BotaoIcone } from "@/components/ui/Botao";
import { CLASSES_BROTO } from "@/components/ui/BrotoPontos";
import { Icone } from "@/components/ui/Icone";
import { conquistasParaAvisar, marcarConquistasVistas } from "@/lib/conquistasVistas";
import { CURVA, DURACAO, MOLA_CURTA, usePoucoMovimento } from "@/lib/movimento";
import type { ConquistaDoResumo, ConquistaNova, ResultadoEvento } from "@/types";

type Celebrar = (evento: ResultadoEvento, origem?: Element | null) => void;

const Contexto = createContext<Celebrar>(() => {});

// Mostra os pontos e as conquistas que o servidor devolveu. O front nunca calcula pontos.
export const useCelebrar = () => useContext(Contexto);

/** A cada leitura do resumo (perfil, início), mostra as conquistas obtidas que o app ainda não mostrou. */
export function useAvisarConquistasNovas(conquistas: readonly ConquistaDoResumo[] | undefined) {
  const celebrar = useCelebrar();
  useEffect(() => {
    if (!conquistas) return;
    const novas = conquistasParaAvisar(conquistas);
    if (novas.length > 0) celebrar({ pontosGanhos: 0, conquistasNovas: novas });
  }, [conquistas, celebrar]);
}

type Broto = { id: number; pontos: number; x: number; y: number };

const TEMPO_CONQUISTA_MS = 6000;

export function ProvedorCelebracao({ children }: { children: ReactNode }) {
  const poucoMovimento = usePoucoMovimento();
  const sequencia = useRef(0);
  const [brotos, setBrotos] = useState<Broto[]>([]);
  const [anuncio, setAnuncio] = useState("");
  const [fila, setFila] = useState<ConquistaNova[]>([]);
  const conquista = fila[0];

  const celebrar = useCallback<Celebrar>((evento, origem) => {
    const partes: string[] = [];
    if (evento.pontosGanhos > 0) {
      const caixa = origem?.getBoundingClientRect();
      const x = caixa ? caixa.left + caixa.width / 2 : window.innerWidth / 2;
      const y = caixa ? caixa.top : window.innerHeight / 2;
      sequencia.current += 1;
      setBrotos((atuais) => [...atuais, { id: sequencia.current, pontos: evento.pontosGanhos, x, y }]);
      partes.push(`Você ganhou ${evento.pontosGanhos} pontos.`);
    }
    if (evento.conquistasNovas.length > 0) {
      marcarConquistasVistas(evento.conquistasNovas.map((c) => c.slug));
      setFila((atual) => [...atual, ...evento.conquistasNovas]);
      partes.push(...evento.conquistasNovas.map((c) => `Conquista nova: ${c.nome}.`));
    }
    if (partes.length) setAnuncio(partes.join(" "));
  }, []);

  // Com o ponteiro ou o foco no aviso, ele espera a pessoa terminar antes de sumir.
  const [pausado, setPausado] = useState(false);
  const fechar = useCallback(() => {
    setPausado(false);
    setFila((atual) => atual.slice(1));
  }, []);

  useEffect(() => {
    if (!conquista || pausado) return;
    const tempo = setTimeout(fechar, TEMPO_CONQUISTA_MS);
    return () => clearTimeout(tempo);
  }, [conquista, fechar, pausado]);

  return (
    <Contexto.Provider value={celebrar}>
      {children}
      <span className="sr-only" aria-live="polite">
        {anuncio}
      </span>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
        {brotos.map((b) => (
          <motion.span
            key={b.id}
            className={CLASSES_BROTO}
            style={{ position: "absolute", left: b.x, top: b.y, translateX: "-50%" }}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 1, 0], y: poucoMovimento ? 0 : [0, -18, -36, -52] }}
            transition={{ duration: 1.1, ease: CURVA, times: [0, 0.15, 0.7, 1] }}
            onAnimationComplete={() => setBrotos((atuais) => atuais.filter((x) => x.id !== b.id))}
          >
            +{b.pontos}
          </motion.span>
        ))}
      </div>
      <AnimatePresence>
        {conquista && (
          <motion.div
            key={conquista.slug}
            className="fixed inset-x-4 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-sm lg:right-6 lg:bottom-6 lg:left-auto lg:mx-0 lg:w-sm deitado:right-[max(1rem,env(safe-area-inset-right))] deitado:bottom-4 deitado:left-auto deitado:mx-0 deitado:w-sm"
            initial={{ opacity: 0, y: poucoMovimento ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: poucoMovimento ? 0 : 16 }}
            transition={{ duration: DURACAO.padrao, ease: CURVA }}
            onPointerEnter={() => setPausado(true)}
            onPointerLeave={() => setPausado(false)}
            onFocus={() => setPausado(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setPausado(false);
            }}
          >
            <div className="flex items-center gap-3 rounded-cartao border-2 border-tinta bg-superficie p-3 shadow-azulejo">
              <AzulejoConquista />
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-pequeno text-apoio">Conquista nova</span>
                <span className="font-titulo text-titulo-3 font-extrabold">{conquista.nome}</span>
                <Link href="/perfil" onClick={fechar} className="flex min-h-11 items-center self-start text-sm font-bold text-primaria">
                  Ver no meu perfil
                </Link>
              </div>
              <BotaoIcone rotulo="Fechar aviso de conquista" onClick={fechar} className="self-start border-transparent">
                <Icone nome="fechar" tamanho={20} />
              </BotaoIcone>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Contexto.Provider>
  );
}

// O azulejo da conquista vira no eixo Y: sai do cadeado e mostra a estrela.
export function AzulejoConquista({ virar = true, tamanho = 64 }: { virar?: boolean; tamanho?: number }) {
  const poucoMovimento = usePoucoMovimento();
  const face = "absolute inset-0 flex items-center justify-center rounded-cartao border-2 border-tinta [backface-visibility:hidden]";

  if (poucoMovimento || !virar) {
    return (
      <motion.span
        aria-hidden="true"
        className="relative shrink-0"
        style={{ width: tamanho, height: tamanho }}
        initial={virar ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
      >
        <span className={`${face} bg-destaque text-destaque-tinta`}>
          <Icone nome="estrela" tamanho={tamanho * 0.45} />
        </span>
      </motion.span>
    );
  }

  return (
    <span aria-hidden="true" className="relative shrink-0 [perspective:400px]" style={{ width: tamanho, height: tamanho }}>
      <motion.span
        className="absolute inset-0 [transform-style:preserve-3d]"
        initial={{ rotateY: 180 }}
        animate={{ rotateY: 0 }}
        transition={{ ...MOLA_CURTA, stiffness: 260, damping: 18, delay: 0.15 }}
      >
        <span className={`${face} bg-destaque text-destaque-tinta`}>
          <Icone nome="estrela" tamanho={tamanho * 0.45} />
        </span>
        <span className={`${face} bg-trilho text-apoio [transform:rotateY(180deg)]`}>
          <Icone nome="cadeado" tamanho={tamanho * 0.4} />
        </span>
      </motion.span>
    </span>
  );
}
