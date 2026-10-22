"use client";

import type { ReactNode } from "react";
import { ComoCalculamos } from "@/components/app/ComoCalculamos";
import { BotaoLink } from "@/components/ui/Botao";
import { Icone } from "@/components/ui/Icone";
import { NumeroAnimado } from "@/components/ui/NumeroAnimado";
import { juntar } from "@/lib/classes";
import { anos, brl, numero, placas } from "@/lib/conteudo";
import type { ResultadoSalvo } from "@/types";

// A prévia e o Resultado usam os mesmos formatos: a mesma entrada mostra o mesmo número nas duas telas.
export const reais = (valor: number) => brl(valor);

export const SEM_DICA_DE_HABITO = "Ainda não temos dica de hábito para estes aparelhos. Inclua outros aparelhos da sua casa para ver quanto dá para economizar.";

/** Custo e retorno das placas. Nunca usa a economia com hábitos: o retorno vem da economia solar. */
export function fraseSolar(r: Pick<ResultadoSalvo, "custoSistemaSolar" | "retornoSolarAnos">): string | null {
  if (r.retornoSolarAnos === null) return null;
  if (r.custoSistemaSolar === null) return `O sistema se paga em cerca de ${anos(r.retornoSolarAnos)}.`;
  return `O sistema custa ${reais(r.custoSistemaSolar)} e se paga em ${anos(r.retornoSolarAnos)}.`;
}

type Props = { resultado: ResultadoSalvo; compacto?: boolean; deZero?: boolean };

function Bloco({ compacto, tom, children }: { compacto?: boolean; tom: "sucesso" | "superficie"; children: ReactNode }) {
  return (
    <section
      className={juntar(
        "flex flex-col items-start gap-1.5 rounded-cartao",
        compacto ? "px-3 py-2.5" : "border-2 border-tinta p-4 shadow-azulejo",
        tom === "sucesso" ? "bg-sucesso-suave" : compacto ? "bg-fundo" : "bg-superficie",
      )}
    >
      {children}
    </section>
  );
}

function Titulo({ icone, children, compacto }: { icone: "lampada" | "sol"; children: ReactNode; compacto?: boolean }) {
  return (
    <h3 className={juntar("flex items-center gap-2", compacto ? "text-sm" : "text-base")}>
      <Icone nome={icone} tamanho={compacto ? 16 : 20} className="shrink-0" />
      {children}
    </h3>
  );
}

export function BlocosEconomia({ resultado: r, compacto, deZero = true }: Props) {
  const numeroGrande = juntar("font-titulo font-extrabold tabular-nums", compacto ? "text-titulo-3" : "text-numero");
  const duracao = compacto ? 300 : undefined;
  const solarCompleto = r.economiaSolarMensal !== null;
  const frase = fraseSolar(r);
  const como = r.comoCalculamos;

  return (
    <div className={juntar("grid gap-3", !compacto && "md:grid-cols-2")}>
      {r.economiaHabitosMensal !== null && (
        <Bloco compacto={compacto} tom="sucesso">
          <Titulo icone="lampada" compacto={compacto}>
            Mudando hábitos:
          </Titulo>
          {r.economiaHabitosMensal > 0 ? (
            <p className="flex flex-wrap items-baseline gap-x-1.5 text-sucesso">
              <NumeroAnimado valor={r.economiaHabitosMensal} formatar={reais} deZero={deZero} duracaoMs={duracao} className={numeroGrande} />
              <span className="text-sm font-semibold">por mês, sem gastar nada</span>
            </p>
          ) : (
            // O back só tem dica de hábito para o ar-condicionado e o chuveiro: sem eles, a economia é zero.
            <p className="text-sm font-semibold">{SEM_DICA_DE_HABITO}</p>
          )}
          {como && <ComoCalculamos textos={[como.economiaHabitos]} />}
        </Bloco>
      )}

      <Bloco compacto={compacto} tom="superficie">
        <Titulo icone="sol" compacto={compacto}>
          Com {placas(r.placas)} {r.placas === 1 ? "solar" : "solares"}:
        </Titulo>
        {solarCompleto && (
          <p className="flex flex-wrap items-baseline gap-x-1.5">
            <span className="text-sm font-semibold">economia de</span>
            <NumeroAnimado valor={r.economiaSolarMensal!} formatar={reais} deZero={deZero} duracaoMs={duracao} className={numeroGrande} />
            <span className="text-sm font-semibold">por mês.</span>
          </p>
        )}
        {frase && <p className="text-sm">{frase}</p>}
        {r.kwhGeradoMes !== null && !compacto && (
          <p className="text-pequeno text-apoio">
            As placas geram cerca de {numero(r.kwhGeradoMes)} kWh por mês e evitam {numero(r.co2EvitadoKgAno, 0)} kg de CO₂ por ano.
          </p>
        )}
        {como ? (
          <ComoCalculamos textos={[como.economiaSolar, como.custoSistemaSolar, como.retornoSolar]} />
        ) : (
          !solarCompleto && (
            <div className="flex flex-col items-start gap-2 pt-1">
              <p className="text-sm font-semibold text-primaria">Simule de novo para ver quanto as placas economizam.</p>
              {!compacto && (
                <BotaoLink href="/simulador" variante="secundario">
                  Simular de novo
                </BotaoLink>
              )}
            </div>
          )
        )}
      </Bloco>
    </div>
  );
}
