"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { Cabecalho } from "@/components/app/Cabecalho";
import { Carregando, EstadoErro, EstadoVazio } from "@/components/app/Estados";
import { iconeDoTema } from "@/components/app/iconesTema";
import { BarraProgresso } from "@/components/ui/BarraProgresso";
import { CardLink } from "@/components/ui/Card";
import { Chip, ChipBotao } from "@/components/ui/Chip";
import { Icone } from "@/components/ui/Icone";
import { api } from "@/lib/api";
import { progressoDaMissao } from "@/lib/missoesDasTrilhas";
import { DURACAO, MOLA_CURTA } from "@/lib/movimento";
import { useDados } from "@/lib/useDados";
import type { ResumoTrilha } from "@/types";

function situacao(t: ResumoTrilha): string {
  if (t.concluida) return "Concluída";
  if (t.licoesConcluidas > 0) return `Parte ${t.licoesConcluidas + 1} de ${t.totalLicoes}`;
  return `Nova, ${t.minutos} min`;
}

export const FILTROS = [
  { id: "todas", rotulo: "Todas", temas: null },
  { id: "economia", rotulo: "Economia", temas: ["eficiencia", "conta"] },
  { id: "solar", rotulo: "Energia solar", temas: ["solar", "renovaveis"] },
  { id: "reciclagem", rotulo: "Reciclagem", temas: ["descarte"] },
] as const;

type IdFiltro = (typeof FILTROS)[number]["id"];

export function filtrarTrilhas(trilhas: readonly ResumoTrilha[], filtro: IdFiltro): ResumoTrilha[] {
  const temas: readonly string[] | null = FILTROS.find((f) => f.id === filtro)?.temas ?? null;
  return temas ? trilhas.filter((t) => temas.includes(t.tema)) : [...trilhas];
}

export function CardTrilha({ trilha }: { trilha: ResumoTrilha }) {
  return (
    <Link
      href={`/trilhas/${trilha.slug}/continuar`}
      data-direcao="expandir"
      className="afundar relative block h-full rounded-cartao text-tinta no-underline shadow-azulejo"
    >
      <motion.span
        layoutId={`trilha-${trilha.slug}`}
        transition={MOLA_CURTA}
        className="absolute inset-0 rounded-cartao border-2 border-tinta bg-superficie"
      />
      <span className="relative flex items-center gap-3 p-3.5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-pequeno bg-primaria-suave text-primaria">
          <Icone nome={iconeDoTema(trilha.tema)} tamanho={22} />
        </span>
        <span className="flex flex-1 flex-col gap-1.5">
          <span className="font-bold">{trilha.titulo}</span>
          <span className="text-pequeno text-apoio">{situacao(trilha)}</span>
          {trilha.licoesConcluidas > 0 && (
            <BarraProgresso valor={trilha.licoesConcluidas} total={trilha.totalLicoes} rotulo={`Progresso em ${trilha.titulo}`} tom={trilha.concluida ? "sucesso" : "primaria"} />
          )}
        </span>
      </span>
    </Link>
  );
}

export function TelaTrilhas() {
  const trilhas = useDados("trilhas", () => api.listarTrilhas());
  const missoes = useDados("missoes", () => api.listarMissoes());
  const [filtro, setFiltro] = useState<IdFiltro>("todas");
  const visiveis = trilhas.estado === "pronto" ? filtrarTrilhas(trilhas.dados, filtro) : [];

  return (
    <div className="flex flex-col gap-4">
      <Cabecalho titulo="Trilhas" texto="Lições de 3 minutos com quiz e uma missão prática." />
      <div role="group" aria-label="Filtrar trilhas por tema" className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <ChipBotao key={f.id} ativo={filtro === f.id} onClick={() => setFiltro(f.id)}>
            {f.rotulo}
          </ChipBotao>
        ))}
      </div>
      {trilhas.estado === "carregando" && <Carregando rotulo="Carregando as trilhas" linhas={5} />}
      {trilhas.estado === "erro" && <EstadoErro erro={trilhas.erro} onTentarDeNovo={trilhas.recarregar} />}
      {trilhas.estado === "pronto" &&
        (trilhas.dados.length === 0 ? (
          <EstadoVazio titulo="As trilhas estão chegando" texto="Volte mais tarde para começar a aprender." />
        ) : visiveis.length === 0 ? (
          <EstadoVazio titulo="Nenhuma trilha com esse tema ainda" texto="Escolha outro tema ou veja todas." />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence initial={false} mode="popLayout">
              {visiveis.map((trilha) => (
                <motion.li
                  key={trilha.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ ...MOLA_CURTA, opacity: { duration: DURACAO.rapida } }}
                >
                  <CardTrilha trilha={trilha} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        ))}

      {missoes.estado === "pronto" && missoes.dados.length > 0 && (
        <section className="mt-2 flex flex-col gap-3" aria-labelledby="titulo-missoes">
          <h2 id="titulo-missoes" className="text-titulo-3">
            Missões práticas
          </h2>
          <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {missoes.dados.map((m) => (
              <li key={m.id}>
                <CardLink href={`/missoes/${m.id}`} tom={m.concluida ? "sucesso" : "superficie"} className="flex h-full items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-pequeno bg-sucesso-suave text-sucesso">
                    <Icone nome={m.concluida ? "check" : "folha"} tamanho={22} />
                  </span>
                  <span className="flex flex-1 flex-col gap-1">
                    <span className="font-bold">{m.titulo}</span>
                    <span className="text-pequeno text-apoio">
                      {progressoDaMissao(m)}
                    </span>
                  </span>
                  {!m.concluida && <Chip tom="destaque">+{m.pontos} pontos</Chip>}
                </CardLink>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
