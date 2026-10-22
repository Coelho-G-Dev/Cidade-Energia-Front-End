"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { NumeroAnimado } from "@/components/ui/NumeroAnimado";
import { api, mensagemParaPessoa } from "@/lib/api";
import { juntar } from "@/lib/classes";
import { numero } from "@/lib/conteudo";
import { criarSimulacaoSchema, type CriarSimulacao } from "@/lib/validacao/simulacao";
import type { ModoSimulacao, ResultadoSimulacao } from "@/types";
import { BlocosEconomia, reais } from "./BlocosEconomia";

// Espera depois do último toque antes de pedir a prévia, para não chamar o back a cada tecla.
export const ESPERA_PREVIA_MS = 400;

type Informar = (modo: ModoSimulacao, dados: CriarSimulacao | null) => void;

const Contexto = createContext<Informar>(() => {});

export const ProvedorPrevia = Contexto.Provider;

/** Só manda para a prévia o que o back aceitaria; o resto vira `null`. */
export function dadosDaPrevia(dados: unknown): CriarSimulacao | null {
  const validado = criarSimulacaoSchema.safeParse(dados);
  return validado.success ? validado.data : null;
}

/** Cada tela do simulador conta à casca o que a pessoa preencheu até agora. */
export function useInformarPrevia(modo: ModoSimulacao, dados: CriarSimulacao | null) {
  const informar = useContext(Contexto);
  const chave = dados ? JSON.stringify(dados) : null;
  useEffect(() => {
    informar(modo, chave ? (JSON.parse(chave) as CriarSimulacao) : null);
  }, [informar, modo, chave]);
}

type Estado = { chave: string; resultado: ResultadoSimulacao | null; erro: string | null };

// A prévia usa POST /api/simulacoes/previa, que nunca salva nem pontua; com token, o limite de uso conta por perfil.
export function usePrevia(dados: CriarSimulacao | null) {
  const chave = dados ? JSON.stringify(dados) : null;
  const [estado, setEstado] = useState<Estado | null>(null);

  useEffect(() => {
    if (!chave) return;
    const controle = new AbortController();
    const espera = setTimeout(() => {
      api.previaSimulacao(JSON.parse(chave) as CriarSimulacao, controle.signal).then(
        (resultado) => setEstado({ chave, resultado, erro: null }),
        (e) => {
          if (!controle.signal.aborted) setEstado((atual) => ({ chave, resultado: atual?.resultado ?? null, erro: mensagemParaPessoa(e) }));
        },
      );
    }, ESPERA_PREVIA_MS);
    return () => {
      clearTimeout(espera);
      controle.abort();
    };
  }, [chave]);

  if (!chave) return { resultado: null, erro: null, atualizando: false };
  return {
    resultado: estado?.resultado ?? null,
    erro: estado?.chave === chave ? estado.erro : null,
    atualizando: estado?.chave !== chave,
  };
}

// No desktop a prévia fica fixa ao lado do formulário; no celular, logo acima do botão de ver o resultado.
export function PainelPrevia({ dados, lateral = false }: { dados: CriarSimulacao | null; lateral?: boolean }) {
  const { resultado, erro, atualizando } = usePrevia(dados);
  const mostrar = dados && resultado;

  return (
    <section
      aria-labelledby="titulo-previa"
      className={juntar("flex flex-col gap-3 rounded-cartao border-2 border-tinta bg-superficie p-4 shadow-azulejo", lateral && "sticky top-8")}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="titulo-previa" className="text-titulo-3">
          Prévia
        </h2>
        <Chip tom="neutro">Valores estimados</Chip>
      </div>
      {mostrar ? (
        <div aria-busy={atualizando} className={juntar("flex flex-col gap-2 transition-opacity duration-200", atualizando && "opacity-60")}>
          <div className="flex flex-col gap-0.5 rounded-pequeno bg-fundo px-3 py-2.5">
            <span className="text-pequeno text-apoio">Gasto por mês</span>
            <NumeroAnimado valor={resultado.gastoMensal} formatar={reais} deZero={false} duracaoMs={300} className="font-titulo text-titulo-3 font-extrabold tabular-nums" />
            <span className="text-pequeno text-apoio">≈ {numero(resultado.consumoKwh, 0)} kWh por mês</span>
          </div>
          <BlocosEconomia resultado={resultado} compacto deZero={false} />
        </div>
      ) : (
        <p className="text-apoio">
          {dados ? "Calculando a prévia..." : "Preencha o consumo ou escolha os aparelhos. A prévia aparece aqui enquanto você digita."}
        </p>
      )}
      {erro && <p className="text-pequeno text-erro">{erro}</p>}
      <p className="text-pequeno text-apoio">A prévia não fica salva. Para guardar o resultado, use Ver meu resultado.</p>
      <span className="sr-only" aria-live="polite">
        {mostrar && !atualizando ? `Prévia: gasto de cerca de ${reais(resultado.gastoMensal)} por mês.` : ""}
      </span>
    </section>
  );
}
