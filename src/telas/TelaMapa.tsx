"use client";

import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Cabecalho } from "@/components/app/Cabecalho";
import { Carregando, EstadoErro, EstadoVazio } from "@/components/app/Estados";
import { BotaoIcone } from "@/components/ui/Botao";
import { Card } from "@/components/ui/Card";
import { Chip, ChipBotao } from "@/components/ui/Chip";
import { Icone } from "@/components/ui/Icone";
import { SeletorDuplo } from "@/components/ui/SeletorDuplo";
import { api } from "@/lib/api";
import { juntar } from "@/lib/classes";
import { limparMarcadores } from "@/lib/conteudo";
import { DURACAO, MOLA_CURTA, usePoucoMovimento } from "@/lib/movimento";
import { useDados } from "@/lib/useDados";
import type { TipoPontoMapa, TipoRanking } from "@/types";

const MapaLeaflet = dynamic(() => import("@/components/app/MapaLeaflet"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-primaria-suave" aria-hidden="true" />,
});

export const TIPOS: Record<TipoPontoMapa, { rotulo: string; tom: "destaque" | "sucesso" | "primaria" }> = {
  solar: { rotulo: "Energia solar", tom: "destaque" },
  coleta: { rotulo: "Coleta e reciclagem", tom: "sucesso" },
  acao: { rotulo: "Ações no bairro", tom: "primaria" },
};

const ORDEM_TIPOS = Object.keys(TIPOS) as TipoPontoMapa[];

// O back só mostra quem tem pelo menos 3 estudantes com pontos, para a soma não revelar os pontos de ninguém.
export const VAZIO_RANKING: Record<TipoRanking, { titulo: string; texto: string }> = {
  bairros: {
    titulo: "O ranking ainda não começou",
    texto: "O ranking aparece quando 3 estudantes do bairro tiverem pontos. Chame os colegas!",
  },
  escolas: {
    titulo: "O ranking ainda não começou",
    texto:
      "O ranking aparece quando 3 estudantes da escola tiverem pontos. Só contam os pontos de quem entrou pelo código da turma. Chame os colegas!",
  },
};

export function TelaMapa() {
  const poucoMovimento = usePoucoMovimento();
  const pontos = useDados("pontos-mapa", () => api.listarPontosMapa());
  const perfil = useDados("perfil", () => api.obterPerfil());
  const [filtro, setFiltro] = useState<TipoPontoMapa | null>(null);
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [tipo, setTipo] = useState<TipoRanking>("bairros");
  const ranking = useDados(`ranking-${tipo}`, () => api.listarRanking(tipo));
  const cartao = useRef<HTMLDivElement>(null);

  const todos = pontos.estado === "pronto" ? pontos.dados : [];
  const visiveis = filtro ? todos.filter((p) => p.tipo === filtro) : todos;
  const ponto = visiveis.find((p) => p.id === selecionado) ?? null;
  const meu = perfil.estado === "pronto" ? (tipo === "bairros" ? perfil.dados.bairro_id : perfil.dados.escola_verificada ? perfil.dados.escola_id : null) : null;

  const origem = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!ponto) return;
    const ativo = document.activeElement;
    if (ativo instanceof HTMLElement && !cartao.current?.contains(ativo)) origem.current = ativo;
    cartao.current?.focus({ preventScroll: true });
  }, [ponto]);

  // Ao fechar o cartão, o foco volta para o pino que o abriu.
  function fechar() {
    setSelecionado(null);
    if (origem.current?.isConnected) origem.current.focus({ preventScroll: true });
    origem.current = null;
  }

  return (
    <div className="flex flex-col gap-4">
      <Cabecalho titulo="Mapa da energia" texto="Pontos de energia e sustentabilidade em São Luís." />

      {/* No desktop o ranking fica ao lado do mapa; no celular e no tablet, embaixo. */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6">
        <div className="flex min-w-0 flex-col gap-4">
          <section
            aria-label="Mapa de São Luís com pontos de energia"
            className="relative h-[300px] overflow-hidden rounded-cartao border-2 border-tinta sm:h-[360px] md:h-[440px] lg:h-[calc(100dvh-16rem)] lg:min-h-[420px] lg:max-h-[620px] deitado:h-[70dvh]"
          >
            {pontos.estado === "erro" ? (
              <div className="flex h-full items-center p-4">
                <EstadoErro erro={pontos.erro} onTentarDeNovo={pontos.recarregar} className="w-full" />
              </div>
            ) : pontos.estado === "carregando" ? (
              <div className="flex h-full items-center justify-center bg-primaria-suave" role="status">
                <span className="font-semibold text-primaria">Carregando os pontos...</span>
              </div>
            ) : (
              <MapaLeaflet pontos={visiveis} selecionado={ponto?.id ?? null} onSelecionar={setSelecionado} />
            )}
            <AnimatePresence>
              {ponto && (
                <motion.div
                  key={ponto.id}
                  ref={cartao}
                  tabIndex={-1}
                  role="dialog"
                  aria-label={ponto.nome}
                  className="absolute inset-x-2 bottom-2 z-[1000] outline-none"
                  initial={poucoMovimento ? { opacity: 0 } : { y: "110%" }}
                  animate={poucoMovimento ? { opacity: 1 } : { y: 0 }}
                  exit={poucoMovimento ? { opacity: 0 } : { y: "110%" }}
                  transition={poucoMovimento ? { duration: DURACAO.rapida } : MOLA_CURTA}
                  onKeyDown={(e) => e.key === "Escape" && fechar()}
                >
                  <Card className="flex items-start gap-2">
                    <div className="flex flex-1 flex-col gap-1">
                      <Chip tom={TIPOS[ponto.tipo].tom} className="self-start">
                        {TIPOS[ponto.tipo].rotulo}
                      </Chip>
                      <span className="font-bold">{ponto.nome}</span>
                      <span className="text-pequeno text-apoio">{limparMarcadores(ponto.descricao)}</span>
                    </div>
                    <BotaoIcone rotulo="Fechar detalhes do ponto" onClick={fechar} className="border-transparent">
                      <Icone nome="fechar" tamanho={20} />
                    </BotaoIcone>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <div role="group" aria-label="Mostrar só um tipo de ponto" className="flex flex-wrap gap-2">
            {ORDEM_TIPOS.map((t) => (
              <ChipBotao
                key={t}
                tom={TIPOS[t].tom}
                ativo={filtro === t}
                onClick={() => {
                  setFiltro((atual) => (atual === t ? null : t));
                  setSelecionado(null);
                }}
              >
                {TIPOS[t].rotulo}
              </ChipBotao>
            ))}
          </div>

          {pontos.estado === "pronto" && (
            <details className="group rounded-cartao border-2 border-trilho bg-superficie">
              <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-2 px-4 font-bold text-primaria">
                Ver os pontos em lista
                <Icone nome="chevronBaixo" tamanho={20} className="transition-transform duration-200 group-open:rotate-180" />
              </summary>
              {visiveis.length === 0 ? (
                <p className="px-4 pb-3 text-apoio">Nenhum ponto deste tipo por enquanto.</p>
              ) : (
                <ul className="flex flex-col px-2 pb-2">
                  {visiveis.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => setSelecionado(p.id)}
                        className="flex min-h-11 w-full items-center gap-2 rounded-pequeno px-2 py-1.5 text-left hover:bg-fundo"
                      >
                        <Chip tom={TIPOS[p.tipo].tom}>{TIPOS[p.tipo].rotulo}</Chip>
                        <span className="flex-1 font-semibold">{p.nome}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </details>
          )}
        </div>

        <Card className="flex flex-col gap-3 p-4 lg:sticky lg:top-8">
          <h2 className="text-base">Ranking da cidade</h2>
          <SeletorDuplo
            rotulo="Tipo de ranking"
            valor={tipo}
            onTrocar={setTipo}
            opcoes={[
              { valor: "bairros", rotulo: "Bairros" },
              { valor: "escolas", rotulo: "Escolas" },
            ]}
          />
          {ranking.estado === "carregando" && <Carregando rotulo="Carregando o ranking" linhas={1} />}
          {ranking.estado === "erro" && <EstadoErro erro={ranking.erro} onTentarDeNovo={ranking.recarregar} />}
          {ranking.estado === "pronto" &&
            (ranking.dados.length === 0 ? (
              <EstadoVazio icone="grupo" {...VAZIO_RANKING[tipo]} />
            ) : (
              <ol className="flex flex-col">
                {ranking.dados.map((item) => (
                  <motion.li
                    key={item.id}
                    layout={!poucoMovimento}
                    layoutDependency={ranking.dados}
                    transition={MOLA_CURTA}
                    className={juntar("-mx-2 flex min-h-11 items-center gap-3 rounded-pequeno px-2", item.id === meu && "bg-primaria-suave")}
                  >
                    <span className="w-8 font-bold text-primaria">{item.posicao}º</span>
                    <span className={juntar("flex-1", item.posicao === 1 ? "font-bold" : "font-medium")}>
                      {item.nome}
                      {item.id === meu && <span className="ml-2 text-pequeno font-semibold text-primaria">{tipo === "bairros" ? "seu bairro" : "sua escola"}</span>}
                    </span>
                    <span className="text-pequeno text-apoio">{item.pontos} pts</span>
                  </motion.li>
                ))}
              </ol>
            ))}
          {tipo === "escolas" && perfil.estado === "pronto" && perfil.dados.escola_id && !perfil.dados.escola_verificada && (
            <p className="text-pequeno text-apoio">Seus pontos ainda não contam para a sua escola. Adicione o código da turma no seu perfil.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
