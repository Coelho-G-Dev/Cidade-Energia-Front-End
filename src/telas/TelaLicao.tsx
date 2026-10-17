"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import { AvisoLicaoTravada } from "@/components/app/AvisoLicaoTravada";
import { useCelebrar } from "@/components/app/Celebracao";
import { ConversaTutor } from "@/components/app/ConversaTutor";
import { Carregando, EstadoErro } from "@/components/app/Estados";
import { iconeDoTema } from "@/components/app/iconesTema";
import { Markdown } from "@/components/app/Markdown";
import { BarraProgresso } from "@/components/ui/BarraProgresso";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { MensagemErro } from "@/components/ui/Campo";
import { Icone } from "@/components/ui/Icone";
import { Topo } from "@/components/ui/Topo";
import { api, ErroApi, mensagemParaPessoa } from "@/lib/api";
import { passoDepoisDaLicao } from "@/lib/missoesDasTrilhas";
import { MOLA_CURTA } from "@/lib/movimento";
import { useDados } from "@/lib/useDados";
import { DESKTOP, useMidia } from "@/lib/useMidia";
import { useTemSessao } from "@/lib/useTemSessao";
import type { LicaoDetalhada, Missao } from "@/types";

type Props = { slug: string; licaoId: string };

// Última parte vista em cada trilha, para a barra sair dali com a mola em vez de sair do zero.
const ultimaParte = new Map<string, number>();

function destino(licao: LicaoDetalhada, missoes: Missao[] | null) {
  if (licao.totalPerguntas > 0) return { href: `/quiz/${licao.id}`, rotulo: "Responder o quiz" };
  return passoDepoisDaLicao(licao, missoes);
}

export function TelaLicao({ slug, licaoId }: Props) {
  const router = useRouter();
  const celebrar = useCelebrar();
  const trilha = useDados(`trilha-${slug}`, () => api.obterTrilha(slug));
  const resolvida =
    licaoId === "continuar" && trilha.estado === "pronto"
      ? (trilha.dados.licoes.find((l) => !l.concluida) ?? trilha.dados.licoes[0])?.id
      : licaoId === "continuar"
        ? null
        : licaoId;
  const licao = useDados(resolvida ? `licao-${resolvida}` : null, () => api.obterLicao(resolvida!));
  const missoes = useDados("missoes", () => api.listarMissoes());
  // No desktop o tutor fica ao lado da lição; no celular o botão "Tirar dúvida" leva até ele.
  const desktop = useMidia(DESKTOP);
  const temSessao = useTemSessao();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (licaoId === "continuar" && resolvida) router.replace(`/trilhas/${slug}/${resolvida}`, { scroll: false });
  }, [licaoId, resolvida, router, slug]);

  const total = trilha.estado === "pronto" ? trilha.dados.totalLicoes : 0;
  const ordem = licao.estado === "pronto" ? licao.dados.ordem : 0;
  const [partida] = useState(() => ultimaParte.get(slug) ?? 0);
  useEffect(() => {
    if (total > 0 && ordem > 0) ultimaParte.set(slug, ordem / total);
  }, [slug, ordem, total]);

  const erroCarga = trilha.estado === "erro" ? trilha : licao.estado === "erro" ? licao : null;
  const passo = licao.estado === "pronto" ? destino(licao.dados, missoes.estado === "pronto" ? missoes.dados : null) : null;
  // Sem login nada é salvo, então a ordem das lições só vale para quem entrou.
  const pendente = licao.estado === "pronto" && temSessao ? licao.dados.licaoPendente : null;

  async function concluir(evento: MouseEvent<HTMLButtonElement>) {
    if (licao.estado !== "pronto" || !passo) return;
    const botao = evento.currentTarget;
    if (licao.dados.concluida) return router.push(passo.href);
    setSalvando(true);
    setErro(null);
    try {
      celebrar(await api.concluirLicao(licao.dados.id), botao);
      router.push(passo.href);
    } catch (e) {
      // Sem login a lição pode ser lida, mas não salva: segue em frente sem pontos.
      if (e instanceof ErroApi && e.codigo === "NAO_AUTENTICADO") return router.push(passo.href);
      setSalvando(false);
      // A tela estava desatualizada: busca a lição de novo, e o aviso mostra qual lição falta.
      if (e instanceof ErroApi && e.codigo === "LICAO_BLOQUEADA") return licao.recarregar();
      setErro(mensagemParaPessoa(e));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <motion.span
          layoutId={`trilha-${slug}`}
          transition={MOLA_CURTA}
          className="absolute -inset-x-2 -inset-y-1 rounded-cartao border-2 border-tinta bg-superficie"
        />
        <div className="relative flex flex-col gap-2 px-1 pb-2">
          <Topo titulo={trilha.estado === "pronto" ? trilha.dados.titulo : "Trilha"} voltarPara="/trilhas" />
          {total > 0 && ordem > 0 && <BarraProgresso valor={ordem} total={total} de={partida} rotulo={`Parte ${ordem} de ${total}`} mostrarRotulo />}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-4">
          {erroCarga && <EstadoErro erro={erroCarga.erro} onTentarDeNovo={erroCarga.recarregar} />}
          {!erroCarga && licao.estado !== "pronto" && <Carregando rotulo="Carregando a lição" linhas={3} />}
          {licao.estado === "pronto" && (
            <article className="flex flex-col gap-4">
              {trilha.estado === "pronto" && (
                <span className="flex size-14 items-center justify-center rounded-cartao bg-primaria-suave text-primaria">
                  <Icone nome={iconeDoTema(trilha.dados.tema)} tamanho={28} />
                </span>
              )}
              <h1 className="text-titulo-1">{licao.dados.titulo}</h1>
              <Markdown texto={licao.dados.conteudo} />
              {pendente && (
                <AvisoLicaoTravada
                  slug={licao.dados.trilha.slug}
                  pendente={pendente}
                  texto={`Você pode ler esta lição, mas só conclui depois de "${pendente.titulo}".`}
                />
              )}
              <MensagemErro id="erro-licao" erro={erro} />
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {!desktop && (
                  <BotaoLink href="/tutor" variante="secundario">
                    Tirar dúvida
                  </BotaoLink>
                )}
                {pendente ? null : licao.dados.tipo === "pedale" ? (
                  <BotaoLink href="/pedale" className="lg:col-start-2">
                    Pedalar e ver
                  </BotaoLink>
                ) : (
                  passo && (
                    <Botao onClick={concluir} carregando={salvando} className="lg:col-start-2">
                      {salvando ? "Salvando..." : passo.rotulo}
                    </Botao>
                  )
                )}
              </div>
            </article>
          )}
        </div>
        {desktop && (
          <aside aria-label="Tutor Energinho" className="sticky top-8 h-[calc(100dvh-4rem)] max-h-[44rem] rounded-cartao border-2 border-tinta bg-superficie p-4">
            <ConversaTutor lateral />
          </aside>
        )}
      </div>
    </div>
  );
}
