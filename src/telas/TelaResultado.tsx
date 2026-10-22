"use client";

import { useEffect, useRef, useState } from "react";
import { useCelebrar } from "@/components/app/Celebracao";
import { Carregando, EstadoErro, EstadoVazio } from "@/components/app/Estados";
import { BarraProgresso } from "@/components/ui/BarraProgresso";
import { BotaoLink } from "@/components/ui/Botao";
import { Card } from "@/components/ui/Card";
import { CardNumero } from "@/components/ui/CardNumero";
import { Chip } from "@/components/ui/Chip";
import { Topo } from "@/components/ui/Topo";
import { api, ErroApi } from "@/lib/api";
import { juntar } from "@/lib/classes";
import { numero } from "@/lib/conteudo";
import { lerResultado } from "@/lib/resultado";
import { useDados } from "@/lib/useDados";
import type { ResultadoSalvo } from "@/types";
import { BlocosEconomia, reais } from "./BlocosEconomia";

export function TelaResultado() {
  const [guardado] = useState(lerResultado);
  const ultima = useDados(guardado ? null : "ultima-simulacao", () => api.ultimaSimulacao());
  const resultado: ResultadoSalvo | null = guardado ?? (ultima.estado === "pronto" ? ultima.dados.resultado : null);
  const semSimulacao = ultima.estado === "erro" && ultima.erro instanceof ErroApi && ultima.erro.codigo === "NENHUMA_SIMULACAO";
  const celebrar = useCelebrar();
  const numeros = useRef<HTMLDivElement>(null);
  const celebrado = useRef(false);

  // Os pontos da primeira simulação vêm do servidor junto com o resultado.
  useEffect(() => {
    if (!guardado || celebrado.current) return;
    celebrado.current = true;
    celebrar(guardado, numeros.current);
  }, [guardado, celebrar]);

  return (
    <div className="flex flex-col gap-4">
      <Topo titulo="Seu resultado" voltarPara="/simulador" />
      {!resultado && ultima.estado === "carregando" && <Carregando rotulo="Carregando a sua última simulação" linhas={2} />}
      {semSimulacao && (
        <EstadoVazio
          icone="simulador"
          titulo="Você ainda não simulou a sua conta"
          texto="Leva 1 minuto e mostra onde dá para economizar."
          acao={<BotaoLink href="/simulador">Simular minha conta</BotaoLink>}
        />
      )}
      {!semSimulacao && ultima.estado === "erro" && <EstadoErro erro={ultima.erro} onTentarDeNovo={ultima.recarregar} />}
      {resultado && (
        <>
          <Chip tom="neutro" className="self-start">
            Valores estimados
          </Chip>
          <div ref={numeros} className="flex flex-col gap-3">
            <CardNumero rotulo="Gasto por mês" valor={resultado.gastoMensal} formatar={reais} complemento={`≈ ${numero(resultado.consumoKwh, 0)} kWh por mês`} />
            <h2 className="text-titulo-3">Dois jeitos de economizar</h2>
            <BlocosEconomia resultado={resultado} />
          </div>
          {/* No desktop o peso dos aparelhos fica ao lado do que fazer em seguida. */}
          <div className={juntar("grid gap-4", resultado.pesos.length > 0 && "lg:grid-cols-2 lg:items-start lg:gap-6")}>
            {resultado.pesos.length > 0 && (
              <Card className="flex flex-col gap-3 p-4">
                <h2 className="text-base">Quem mais pesa na sua conta</h2>
                {resultado.pesos.map((peso, i) => (
                  <div key={peso.aparelho} className="flex flex-col gap-1.5">
                    <span className="flex justify-between text-pequeno font-semibold">
                      <span>{peso.aparelho}</span>
                      <span className="text-apoio">{numero(peso.percentual)}%</span>
                    </span>
                    <BarraProgresso valor={peso.percentual} total={100} rotulo={`${peso.aparelho}: ${numero(peso.percentual)}%`} tom={i === 0 ? "destaque" : "primaria"} atrasoMs={i * 60} />
                  </div>
                ))}
              </Card>
            )}
            <div className="flex flex-col gap-4">
              <p className="text-pequeno text-apoio">Todos os valores são estimativas para aprender. Um projeto de verdade é feito por um profissional.</p>
              <BotaoLink href="/trilhas">Aprender a economizar</BotaoLink>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
