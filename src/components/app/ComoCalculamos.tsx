"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import { Icone } from "@/components/ui/Icone";
import { juntar } from "@/lib/classes";
import { CURVA, DURACAO, usePoucoMovimento } from "@/lib/movimento";

// Os textos vêm prontos do back, já com os números da simulação.
export function ComoCalculamos({ textos, className }: { textos: readonly string[]; className?: string }) {
  const [aberto, setAberto] = useState(false);
  const poucoMovimento = usePoucoMovimento();
  const id = useId();

  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={aberto}
        aria-controls={id}
        onClick={() => setAberto((a) => !a)}
        className="flex min-h-11 items-center gap-1.5 font-bold text-primaria"
      >
        Como calculamos?
        <Icone nome="chevronBaixo" tamanho={18} className={juntar("transition-transform duration-200", aberto && "rotate-180")} />
      </button>
      <div id={id}>
        <AnimatePresence initial={false}>
          {aberto && (
            <motion.div
              className="overflow-hidden"
              initial={poucoMovimento ? { opacity: 0 } : { height: 0, opacity: 0 }}
              animate={poucoMovimento ? { opacity: 1 } : { height: "auto", opacity: 1 }}
              exit={poucoMovimento ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: DURACAO.padrao, ease: CURVA }}
            >
              <ul className="flex flex-col gap-2 pt-1 text-pequeno text-apoio">
                {textos.map((texto) => (
                  <li key={texto}>{texto}</li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
