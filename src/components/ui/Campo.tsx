"use client";

import { AnimatePresence, motion, useAnimate } from "motion/react";
import { useEffect, useId, type ReactNode } from "react";
import { juntar } from "@/lib/classes";
import { CURVA, DURACAO, usePoucoMovimento } from "@/lib/movimento";
import { Icone } from "./Icone";

export function useTremor<T extends HTMLElement>(erro: string | null | undefined, tentativa = 0) {
  const [escopo, animar] = useAnimate<T>();
  const poucoMovimento = usePoucoMovimento();

  useEffect(() => {
    if (!erro || poucoMovimento || !escopo.current) return;
    animar(escopo.current, { x: [0, -4, 4, -4, 4, 0] }, { duration: 0.32, ease: "easeInOut" });
  }, [erro, tentativa, poucoMovimento, animar, escopo]);

  return escopo;
}

export function MensagemErro({ id, erro }: { id: string; erro: string | null | undefined }) {
  const poucoMovimento = usePoucoMovimento();
  return (
    <div aria-live="polite">
      <AnimatePresence initial={false}>
        {erro && (
          <motion.p
            key={erro}
            id={id}
            className="overflow-hidden text-pequeno font-semibold text-erro"
            initial={poucoMovimento ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={poucoMovimento ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={poucoMovimento ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: DURACAO.padrao, ease: CURVA }}
          >
            <span className="flex items-start gap-1.5 pt-1.5">
              <Icone nome="alerta" tamanho={16} className="mt-px shrink-0" />
              {erro}
            </span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export const CLASSES_ENTRADA =
  "w-full min-h-[52px] rounded-pequeno border-2 bg-superficie px-4 text-base text-tinta placeholder:text-apoio " +
  "focus-visible:outline-offset-0 disabled:cursor-not-allowed disabled:bg-fundo";

type PropsMoldura = {
  rotulo: string;
  dica?: string;
  erro?: string | null;
  tentativa?: number;
  children: (ids: { id: string; descricao: string | undefined; invalido: boolean }) => ReactNode;
  className?: string;
};

export function MolduraCampo({ rotulo, dica, erro, tentativa, children, className }: PropsMoldura) {
  const base = useId();
  const id = `${base}campo`;
  const idDica = `${base}dica`;
  const idErro = `${base}erro`;
  const escopo = useTremor<HTMLDivElement>(erro, tentativa);
  const descricao = [dica && idDica, erro && idErro].filter(Boolean).join(" ") || undefined;

  return (
    <div className={juntar("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-bold">
        {rotulo}
      </label>
      <div ref={escopo}>{children({ id, descricao, invalido: Boolean(erro) })}</div>
      {dica && (
        <p id={idDica} className="text-pequeno text-apoio">
          {dica}
        </p>
      )}
      <MensagemErro id={idErro} erro={erro} />
    </div>
  );
}

