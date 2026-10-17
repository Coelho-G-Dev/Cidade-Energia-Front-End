"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, type MouseEvent } from "react";
import { useCelebrar } from "@/components/app/Celebracao";
import { Carregando, EstadoErro, EstadoVazio } from "@/components/app/Estados";
import { BarraProgresso } from "@/components/ui/BarraProgresso";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { MensagemErro } from "@/components/ui/Campo";
import { CheckDesenhado } from "@/components/ui/CheckDesenhado";
import { Icone } from "@/components/ui/Icone";
import { Topo } from "@/components/ui/Topo";
import { api, ErroApi, mensagemParaPessoa } from "@/lib/api";
import { juntar } from "@/lib/classes";
import { diaEHora, limparMarcadores } from "@/lib/conteudo";
import { passoDepoisDaLicao } from "@/lib/missoesDasTrilhas";
import { CURVA, DURACAO, usePoucoMovimento } from "@/lib/movimento";
import { useDados } from "@/lib/useDados";
import { useTemSessao } from "@/lib/useTemSessao";
import type { PerguntaDoQuiz } from "@/types";

type Situacao =
  | { tipo: "aberta" }
  | { tipo: "certa"; opcao: number; explicacao: string | null }
  | { tipo: "errada"; opcao: number; liberaEm: string | null }
  | { tipo: "bloqueada"; liberaEm: string | null; mensagem?: string };

// Como a pergunta começa, a partir do que o servidor já sabe das tentativas anteriores.
export function situacaoInicial(p: PerguntaDoQuiz): Situacao {
  if (p.jaRespondida && p.acertou === false && p.proximaTentativaEm && !p.podePontuar) return { tipo: "bloqueada", liberaEm: p.proximaTentativaEm };
  return { tipo: "aberta" };
}

export const textoNovaTentativa = (liberaEm: string | null) =>
  liberaEm ? `Você poderá tentar de novo a partir de ${diaEHora(liberaEm)}.` : "Você poderá tentar de novo amanhã.";

type PropsOpcao = {
  texto: string;
  estado: "normal" | "certa" | "errada";
  desabilitada: boolean;
  enviando: boolean;
  onEscolher: (evento: MouseEvent<HTMLButtonElement>) => void;
};

function Opcao({ texto, estado, desabilitada, enviando, onEscolher }: PropsOpcao) {
  const poucoMovimento = usePoucoMovimento();
  return (
    <motion.button
      type="button"
      onClick={onEscolher}
      disabled={desabilitada}
      aria-pressed={estado !== "normal"}
      aria-busy={enviando || undefined}
      animate={estado === "errada" && !poucoMovimento ? { x: [0, -4, 4, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.32, ease: "easeInOut" }}
      className={juntar(
        "flex min-h-14 w-full items-center gap-3 rounded-cartao border-2 px-4 py-3 text-left font-bold text-tinta transition-colors duration-200",
        estado === "certa" && "border-sucesso bg-sucesso-suave",
        estado === "errada" && "border-erro bg-erro-suave",
        estado === "normal" && "afundar border-tinta bg-superficie shadow-azulejo disabled:shadow-none",
        desabilitada && estado === "normal" && "cursor-not-allowed text-apoio",
      )}
    >
      <span className="flex-1">{texto}</span>
      {estado === "certa" && (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sucesso text-superficie">
          <CheckDesenhado tamanho={16} />
          <span className="sr-only">Resposta certa</span>
        </span>
      )}
      {estado === "errada" && (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-erro text-superficie">
          <Icone nome="fechar" tamanho={16} espessura={3} />
          <span className="sr-only">Resposta errada</span>
        </span>
      )}
    </motion.button>
  );
}

function Explicacao({ situacao }: { situacao: Situacao }) {
  const poucoMovimento = usePoucoMovimento();
  const aberta = situacao.tipo !== "aberta";
  return (
    <div aria-live="polite">
      <AnimatePresence initial={false}>
        {aberta && (
          <motion.div
            key={situacao.tipo}
            className="overflow-hidden"
            initial={poucoMovimento ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={poucoMovimento ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={poucoMovimento ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: DURACAO.enfatica, ease: CURVA }}
          >
            {situacao.tipo === "certa" ? (
              <div className="flex flex-col gap-1 rounded-cartao bg-sucesso-suave px-4 py-3.5">
                <p className="font-bold text-sucesso">Isso mesmo!</p>
                {situacao.explicacao && <p className="text-sm">{limparMarcadores(situacao.explicacao)}</p>}
              </div>
            ) : (
              <div className="flex flex-col gap-1 rounded-cartao bg-erro-suave px-4 py-3.5">
                <p className="font-bold text-erro">{situacao.tipo === "errada" ? "Não foi dessa vez." : "Você errou esta da última vez."}</p>
                <p className="text-sm">
                  {situacao.tipo === "bloqueada" && situacao.mensagem ? situacao.mensagem : textoNovaTentativa(situacao.liberaEm)} Releia a lição enquanto
                  isso.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TelaQuiz({ licaoId }: { licaoId: string }) {
  const celebrar = useCelebrar();
  const quiz = useDados(`quiz-${licaoId}`, () => api.obterQuiz(licaoId));
  const licao = useDados(`licao-${licaoId}`, () => api.obterLicao(licaoId));
  const missoes = useDados("missoes", () => api.listarMissoes());
  const temSessao = useTemSessao();
  const [indice, setIndice] = useState(0);
  const [situacoes, setSituacoes] = useState<Record<string, Situacao>>({});
  const [acertos, setAcertos] = useState<Record<string, boolean>>({});
  const [enviando, setEnviando] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // O quiz abre depois que a pessoa conclui a lição. Sem login nada é salvo, então segue aberto.
  const fechado = quiz.estado === "pronto" && temSessao === true && !quiz.dados.licaoConcluida;
  const perguntas = quiz.estado === "pronto" && !fechado ? quiz.dados.perguntas : [];
  const pergunta = perguntas[indice];
  const fim = quiz.estado === "pronto" && perguntas.length > 0 && indice >= perguntas.length;
  const situacao: Situacao = pergunta ? (situacoes[pergunta.id] ?? situacaoInicial(pergunta)) : { tipo: "aberta" };
  const voltar = licao.estado === "pronto" ? `/trilhas/${licao.dados.trilha.slug}/${licaoId}` : "/trilhas";
  const titulo = licao.estado === "pronto" ? licao.dados.trilha.titulo : "Quiz";

  async function responder(opcao: number, evento: MouseEvent<HTMLButtonElement>) {
    if (!pergunta || situacao.tipo !== "aberta" || enviando !== null) return;
    const botao = evento.currentTarget;
    setEnviando(opcao);
    setErro(null);
    try {
      const resposta = await api.responderQuiz({ perguntaId: pergunta.id, opcao });
      setSituacoes((s) => ({
        ...s,
        [pergunta.id]: resposta.correta
          ? { tipo: "certa", opcao, explicacao: resposta.explicacao }
          : { tipo: "errada", opcao, liberaEm: resposta.proximaTentativaEm },
      }));
      setAcertos((a) => ({ ...a, [pergunta.id]: resposta.correta }));
      celebrar(resposta, botao);
    } catch (e) {
      if (e instanceof ErroApi && e.codigo === "AGUARDE_NOVA_TENTATIVA") {
        setSituacoes((s) => ({ ...s, [pergunta.id]: { tipo: "bloqueada", liberaEm: null, mensagem: mensagemParaPessoa(e) } }));
      } else if (e instanceof ErroApi && e.codigo === "LICAO_NAO_CONCLUIDA") {
        // A tela estava desatualizada: busca o quiz de novo, e ele mostra o convite para ler a lição.
        quiz.recarregar();
      } else {
        setErro(mensagemParaPessoa(e));
      }
    } finally {
      setEnviando(null);
    }
  }

  const ultima = indice + 1 >= perguntas.length;
  const totalAcertos = Object.values(acertos).filter(Boolean).length;
  const respondidas = Object.keys(acertos).length;
  const passo = licao.estado === "pronto" ? passoDepoisDaLicao(licao.dados, missoes.estado === "pronto" ? missoes.dados : null) : null;

  return (
    <div className="pagina-estreita flex flex-col gap-4">
      <Topo titulo={titulo} voltarPara={voltar} />
      {quiz.estado === "carregando" && <Carregando rotulo="Carregando o quiz" />}
      {quiz.estado === "erro" && <EstadoErro erro={quiz.erro} onTentarDeNovo={quiz.recarregar} />}
      {fechado && (
        <EstadoVazio
          icone="cadeado"
          titulo="Leia a lição antes do quiz"
          texto="O quiz abre quando você conclui a lição."
          acao={<BotaoLink href={voltar}>Ler a lição</BotaoLink>}
        />
      )}
      {quiz.estado === "pronto" && !fechado && perguntas.length === 0 && (
        <EstadoVazio titulo="Esta lição não tem quiz" texto="Siga para a próxima lição." acao={<BotaoLink href={voltar}>Voltar para a lição</BotaoLink>} />
      )}

      {pergunta && (
        <div key={pergunta.id} className="flex flex-col gap-4">
          <BarraProgresso valor={indice + 1} total={perguntas.length} de={indice / perguntas.length} rotulo={`Pergunta ${indice + 1} de ${perguntas.length}`} mostrarRotulo />
          <h1 className="text-titulo-2">{limparMarcadores(pergunta.enunciado)}</h1>
          {pergunta.jaRespondida && pergunta.acertou && situacao.tipo === "aberta" && (
            <p className="text-pequeno text-apoio">Você já acertou esta. Pode responder de novo para treinar, sem ganhar pontos.</p>
          )}
          <div className="flex flex-col gap-2.5" role="group" aria-label="Opções de resposta">
            {pergunta.opcoes.map((texto, i) => (
              <Opcao
                key={`${pergunta.id}-${i}`}
                texto={texto}
                estado={(situacao.tipo === "certa" || situacao.tipo === "errada") && situacao.opcao === i ? (situacao.tipo === "certa" ? "certa" : "errada") : "normal"}
                desabilitada={situacao.tipo !== "aberta" || (enviando !== null && enviando !== i)}
                enviando={enviando === i}
                onEscolher={(e) => responder(i, e)}
              />
            ))}
          </div>
          <MensagemErro id="erro-quiz" erro={erro} />
          <Explicacao situacao={situacao} />
          {situacao.tipo !== "aberta" && (
            <Botao variante="escuro" onClick={() => setIndice((i) => i + 1)}>
              {ultima ? "Ver como fui" : "Próxima pergunta"}
            </Botao>
          )}
          {situacao.tipo === "aberta" && !ultima && (
            <button type="button" onClick={() => setIndice((i) => i + 1)} className="flex min-h-11 items-center justify-center self-center font-bold text-primaria">
              Pular esta pergunta
            </button>
          )}
        </div>
      )}

      {fim && (
        <div className="flex flex-col gap-4">
          <BarraProgresso valor={perguntas.length} total={perguntas.length} rotulo="Quiz terminado" tom="sucesso" de={(perguntas.length - 1) / perguntas.length} />
          <h1 className="text-titulo-1">{respondidas === 0 ? "Quiz terminado" : totalAcertos === respondidas ? "Você acertou tudo!" : "Quiz terminado"}</h1>
          <p className="text-apoio">
            {respondidas === 0
              ? "Você não respondeu nenhuma pergunta agora."
              : `Você acertou ${totalAcertos} de ${respondidas} ${respondidas === 1 ? "pergunta" : "perguntas"}.`}{" "}
            {totalAcertos < respondidas && "As que você errou ficam liberadas de novo em 24 horas."}
          </p>
          {passo && <BotaoLink href={passo.href}>{passo.rotulo}</BotaoLink>}
          <BotaoLink href={voltar} variante="secundario">
            Reler a lição
          </BotaoLink>
        </div>
      )}
    </div>
  );
}
