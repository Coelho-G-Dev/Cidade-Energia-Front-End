"use client";

import { LayoutGroup } from "motion/react";
import type { ReactNode } from "react";
import { Navegacao } from "@/components/ui/Navegacao";
import { ProvedorCelebracao } from "./Celebracao";

export function CascaApp({ children }: { children: ReactNode }) {
  return (
    <ProvedorCelebracao>
      <LayoutGroup>
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-botao focus:bg-superficie focus:px-4 focus:py-3 focus:font-bold"
        >
          Pular para o conteúdo
        </a>
        {/* O trilho lateral entra no desktop e no celular deitado; a margem acompanha a área segura do entalhe. */}
        <div className="min-h-dvh pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-24 deitado:pb-0 deitado:pl-[calc(5rem+env(safe-area-inset-left))]">
          <main
            id="conteudo"
            className="mx-auto w-full max-w-[1120px] pt-[max(1.5rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-8 pl-[max(1rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] lg:pt-8 deitado:pt-4 deitado:pl-4"
          >
            {children}
          </main>
        </div>
        <Navegacao />
      </LayoutGroup>
    </ProvedorCelebracao>
  );
}
