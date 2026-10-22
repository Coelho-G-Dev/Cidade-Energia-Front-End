"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useEffect } from "react";
import { useAvisarConquistasNovas } from "@/components/app/Celebracao";
import { Carregando, EstadoErro, EstadoVazio } from "@/components/app/Estados";
import { BarraProgresso } from "@/components/ui/BarraProgresso";
import { BotaoLink } from "@/components/ui/Botao";
import { Card, CardLink } from "@/components/ui/Card";
import { Icone } from "@/components/ui/Icone";
import { PadraoAzulejo } from "@/components/ui/PadraoAzulejo";
import { api } from "@/lib/api";
import { dataCurta, numero } from "@/lib/conteudo";
import { CURVA, usePoucoMovimento } from "@/lib/movimento";
import { preCarregar } from "@/lib/cacheDados";
import { useDados } from "@/lib/useDados";
import { useSaudacao } from "@/lib/saudacao";
import { useTemSessao } from "@/lib/useTemSessao";
import type { SolDeHoje } from "@/types";

// A NASA publica com alguns dias de atraso: só chama de "hoje" quando o dado é mesmo de hoje.
export function textosDoSol(sol: Pick<SolDeHoje, "data" | "diasDeAtraso" | "fonte">): { titulo: string; quando: string } {
  if (sol.fonte === "padrao" || !sol.data || sol.diasDeAtraso === null) {
    return { titulo: "Sol em São Luís", quando: "Média de São Luís, estimativa com a média anual de irradiação" };
  }
  if (sol.diasDeAtraso <= 0) return { titulo: "Sol de hoje em São Luís", quando: "Estimativa com dados de irradiação da NASA" };
  const ha = sol.diasDeAtraso === 1 ? "há 1 dia" : `há ${sol.diasDeAtraso} dias`;
  return { titulo: "Sol mais recente em São Luís", quando: `Sol de ${dataCurta(sol.data)}, ${ha}. Estimativa com dados de irradiação da NASA` };
}

// Os raios giram enquanto o sol de hoje carrega e param quando a resposta chega.
function SolDeHojeIcone({ girando }: { girando: boolean }) {
  const poucoMovimento = usePoucoMovimento();
  return (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-pequeno bg-destaque text-destaque-tinta">
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <motion.g
          initial={false}
          animate={{ rotate: girando && !poucoMovimento ? [0, 360] : 360 }}
          transition={girando && !poucoMovimento ? { duration: 2.4, ease: "linear", repeat: Infinity } : { duration: 0.6, ease: CURVA }}
        >
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </motion.g>
      </svg>
    </span>
  );
}

export function TelaInicio() {
  const saudacao = useSaudacao();
  const perfil = useDados("perfil", () => api.obterPerfil());
  const sol = useDados("sol", () => api.solDeHoje());
  const trilhas = useDados("trilhas", () => api.listarTrilhas());
  const missoes = useDados("missoes", () => api.listarMissoes());
  // O resumo traz as conquistas: as que chegaram sem aviso (como o Bairro unido) aparecem aqui.
  const temSessao = useTemSessao();
  const resumo = useDados(temSessao ? "resumo" : null, () => api.obterResumo());
  useAvisarConquistasNovas(resumo.estado === "pronto" ? resumo.dados.conquistas : undefined);
  const missaoAberta = missoes.estado === "pronto" ? missoes.dados.find((m) => m.diasRegistrados > 0 && !m.concluida) : undefined;
  const nome = perfil.estado === "pronto" ? perfil.dados.primeiro_nome : null;
  const emAndamento =
    trilhas.estado === "pronto" ? (trilhas.dados.find((t) => t.licoesConcluidas > 0 && !t.concluida) ?? trilhas.dados[0]) : null;

  const slugEmAndamento = emAndamento?.slug;
  useEffect(() => {
    if (slugEmAndamento) preCarregar(`trilha-${slugEmAndamento}`, () => api.obterTrilha(slugEmAndamento));
  }, [slugEmAndamento]);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-pequeno text-apoio">
            {saudacao}
            {nome ? `, ${nome}` : ""}!
          </span>
          <h1 className="text-titulo-2">Vamos entender a sua energia?</h1>
        </div>
        <Link
          href="/perfil"
          aria-label="Meu perfil"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primaria-suave text-primaria"
        >
          <Icone nome="perfil" />
        </Link>
      </header>

      {/* No desktop o convite para simular fica à esquerda e o resto do dia à direita. */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-6">
        <section className="foco-claro overflow-hidden rounded-cartao border-2 border-tinta bg-primaria text-primaria-tinta shadow-azulejo">
          <div className="h-[84px] lg:h-[156px]">
            <PadraoAzulejo />
          </div>
          <div className="flex flex-col gap-3 px-5 pt-4 pb-5">
            <h2 className="text-titulo-3 text-primaria-tinta">Quanto da sua conta dá para economizar?</h2>
            <p className="text-primaria-tinta/90">Simule em 1 minuto com o consumo da sua última conta.</p>
            <BotaoLink href="/simulador">Simular minha conta</BotaoLink>
          </div>
        </section>

        <div className="flex flex-col gap-4">
          {sol.estado === "erro" ? (
            <EstadoErro erro={sol.erro} onTentarDeNovo={sol.recarregar} />
          ) : (
            <Card className="flex items-center gap-3" aria-busy={sol.estado === "carregando"}>
              <SolDeHojeIcone girando={sol.estado === "carregando"} />
              <span className="flex flex-1 flex-col gap-0.5" aria-live="polite">
                <span className="font-bold">{sol.estado === "pronto" ? textosDoSol(sol.dados).titulo : "Sol em São Luís"}</span>
                {sol.estado === "carregando" ? (
                  <span className="text-pequeno text-apoio">Buscando o sol mais recente...</span>
                ) : (
                  <>
                    <span className="text-pequeno text-apoio">
                      Uma placa solar geraria cerca de {numero(sol.dados.kwhPorPlaca)} kWh, o bastante para{" "}
                      {numero(sol.dados.horasArCondicionado)} h de ar-condicionado.
                    </span>
                    <span className="text-mini text-apoio">{textosDoSol(sol.dados).quando}</span>
                  </>
                )}
              </span>
            </Card>
          )}

          <h2 className="text-titulo-3">Continue aprendendo</h2>
          {trilhas.estado === "carregando" && <Carregando rotulo="Carregando as trilhas" linhas={1} />}
          {trilhas.estado === "erro" && <EstadoErro erro={trilhas.erro} onTentarDeNovo={trilhas.recarregar} />}
          {trilhas.estado === "pronto" &&
            (emAndamento ? (
              <CardLink href={`/trilhas/${emAndamento.slug}/continuar`} className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-pequeno bg-primaria-suave text-primaria">
                  <Icone nome="trilhas" tamanho={22} />
                </span>
                <span className="flex flex-1 flex-col gap-1.5">
                  <span className="font-bold">{emAndamento.titulo}</span>
                  <span className="text-pequeno text-apoio">
                    Parte {Math.min(emAndamento.licoesConcluidas + 1, emAndamento.totalLicoes)} de {emAndamento.totalLicoes}
                  </span>
                  <BarraProgresso valor={emAndamento.licoesConcluidas} total={emAndamento.totalLicoes} rotulo={`Progresso em ${emAndamento.titulo}`} />
                </span>
              </CardLink>
            ) : (
              <EstadoVazio titulo="Nenhuma trilha por aqui ainda" texto="Volte mais tarde para começar a aprender." />
            ))}
          {missaoAberta && (
            <CardLink href={`/missoes/${missaoAberta.id}`} tom="sucesso" className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-pequeno bg-superficie text-sucesso">
                <Icone nome="check" tamanho={22} />
              </span>
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="font-bold">{missaoAberta.titulo}</span>
                <span className="text-pequeno text-apoio">
                  {missaoAberta.registradaHoje ? "Hoje já está marcado" : "Marque o dia de hoje"}, {missaoAberta.diasRegistrados} de {missaoAberta.diasNecessarios}
                </span>
              </span>
            </CardLink>
          )}
        </div>
      </div>
    </div>
  );
}
