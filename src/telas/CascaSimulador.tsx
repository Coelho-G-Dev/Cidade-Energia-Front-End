"use client";

import { usePathname } from "next/navigation";
import { useCallback, useState, type ReactNode } from "react";
import { Cabecalho } from "@/components/app/Cabecalho";
import { SeletorDuplo } from "@/components/ui/SeletorDuplo";
import { Topo } from "@/components/ui/Topo";
import { DESKTOP, useMidia } from "@/lib/useMidia";
import type { CriarSimulacao } from "@/lib/validacao/simulacao";
import type { ModoSimulacao } from "@/types";
import { PainelPrevia, ProvedorPrevia } from "./PreviaSimulacao";

const MODOS = {
  conta: { titulo: "Quanto você gasta de luz?", texto: "Use os dados da sua última conta." },
  aparelhos: { titulo: "Monte a sua casa", texto: "Diga quantos aparelhos você tem e por quanto tempo usa." },
} as const;

export function CascaSimulador({ children }: { children: ReactNode }) {
  const modo = usePathname().startsWith("/simulador/aparelhos") ? "aparelhos" : "conta";
  // A prévia ao lado só existe no desktop; no celular a tela já mostra a estimativa embaixo.
  const desktop = useMidia(DESKTOP);
  const [preenchido, setPreenchido] = useState<Record<ModoSimulacao, CriarSimulacao | null>>({ conta: null, aparelhos: null });
  const informar = useCallback((qual: ModoSimulacao, dados: CriarSimulacao | null) => {
    setPreenchido((atual) => (atual[qual] === dados ? atual : { ...atual, [qual]: dados }));
  }, []);

  return (
    <ProvedorPrevia value={informar}>
      <div className="flex flex-col gap-4">
        <Topo titulo="Simulador" voltarPara="/inicio" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
          <div className="flex flex-col gap-4">
            <Cabecalho titulo={MODOS[modo].titulo} texto={MODOS[modo].texto} />
            <SeletorDuplo
              rotulo="Como você quer simular"
              grupo="modo-simulador"
              valor={modo}
              opcoes={[
                { valor: "conta", rotulo: "Pela conta", href: "/simulador" },
                { valor: "aparelhos", rotulo: "Pelos aparelhos", href: "/simulador/aparelhos" },
              ]}
            />
            {children}
          </div>
          {desktop && <PainelPrevia dados={preenchido[modo]} />}
        </div>
      </div>
    </ProvedorPrevia>
  );
}
