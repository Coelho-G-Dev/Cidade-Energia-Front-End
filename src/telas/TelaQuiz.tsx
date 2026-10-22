"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, type MouseEvent } from "react";
import { useCelebrar } from "@/components/app/Celebracao";
import { Carregando, EstadoErro, EstadoVazio } from "@/components/app/Estados";
import { BarraProgresso } from "@/components/ui/BarraProgresso";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { MensagemErro } from "@/components/ui/Campo";
import { CheckDesenhado } from "@/components/ui/CheckDesenhado";
import { Chip } from "@/components/ui/Chip";
import { Icone } from "@/components/ui/Icone";
import { Topo } from "@/components/ui/Topo";
import { api, ErroApi, mensagemParaPessoa } from "@/lib/api";
import { juntar } from "@/lib/classes";
import { limparMarcadores } from "@/lib/conteudo";
import { passoDepoisDaLicao } from "@/lib/missoesDasTrilhas";
import { CURVA, DURACAO, usePoucoMovimento } from "@/lib/movimento";
import { invalidar } from "@/lib/cacheDados";
import { useDados } from "@/lib/useDados";
import { useTemSessao } from "@/lib/useTemSessao";
import type { PerguntaDoQuiz, RespostaDoQuiz } from "@/types";

type Situacao =
  | { tipo: "aberta" }
  | { tipo: "respondida"; opcao: number; correta: boolean; opcaoCorreta: number; explicacao: string; treino: boolean };

type EstadoOpcao = "normal" | "certa" | "errada";

export function situacaoDaResposta(opcao: number, r: RespostaDoQuiz): Situacao {
  return { tipo: "respondida", opcao, correta: r.correta, opcaoCorreta: r.opcaoCorreta, explicacao: r.explicacao, treino: !r.tentativaPontuavel };
}

/** Depois de responder, a opção certa aparece sempre; a escolhida, se errada, fica com a borda de erro. */
export function estadoDaOpcao(situacao: Situacao, indice: number): EstadoOpcao {
  if (situacao.tipo !== "respondida") return "normal";
  if (indice === situacao.opcaoCorreta) return "certa";
  if (indice === situacao.opcao) return "errada";
  return "normal";
}

/** "Vale pontos" antes da primeira tentativa; "Já respondida" depois dela, quando responder é treino. */
export function seloDaPergunta(p: PerguntaDoQuiz, respondidaAgora: boolean): string | null {
  if (respondidaAgora || p.jaRespondida) return "Já respondida";
  if (p.podePontuar) return "Vale pontos";
  return null;
}

type PropsOpcao = {
  texto: string;
  estado: EstadoOpcao;
  escolhida: boolean;
  desabilitada: boolean;
  enviando: boolean;
  onEscolher: (evento: MouseEvent<HTMLButtonElement>) => void;
};

function Opcao({ texto, estado, escolhida, desabilitada, enviando, onEscolher }: PropsOpcao) {
  const poucoMovimento = usePoucoMovimento();
  return (
    <motion.button
      type="button"
      onClick={onEscolher}
      disabled={desabilitada}
      aria-pressed={escolhida}
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

function Explicacao({ situacao, opcoes }: { situacao: Situacao; opcoes: string[] }) {
  const poucoMovimento = usePoucoMovimento();
  return (
    <div aria-live="polite">
      <AnimatePresence initial={false}>
        {situacao.tipo === "respondida" && (
          <motion.div
            key="explicacao"
            className="overflow-hidden"
            initial={poucoMovimento ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={poucoMovimento ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={poucoMovimento ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: DURACAO.enfatica, ease: CURVA }}
          >
            <div className={juntar("flex flex-col items-start gap-1.5 rounded-cartao px-4 py-3.5", situacao.correta ? "bg-sucesso-suave" : "bg-erro-suave")}>
              <p className={juntar("font-bold", situacao.correta ? "text-sucesso" : "text-erro")}>
                {situacao.correta ? "Isso mesmo!" : `Não foi dessa vez. A resposta certa é: ${limparMarcadores(opcoes[situacao.opcaoCorreta] ?? "")}.`}
              </p>
              <p className="text-sm">{limparMarcadores(situacao.explicacao)}</p>
              {situacao.treino && <Chip tom="neutro">Treino: esta resposta não vale pontos</Chip>}
            </div>
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
  // Perguntas respondidas nesta visita: daqui em diante, responder de novo é treino.
  const [respondidasAgora, setRespondidasAgora] = useState<Record<string, true>>({});
  const [acertos, setAcertos] = useState<Record<string, boolean>>({});
  const [enviando, setEnviando] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // O quiz abre depois que a pessoa conclui a lição. Sem login nada é salvo, então segue aberto.
  const fechado = quiz.estado === "pronto" && temSessao === true && !quiz.dados.licaoConcluida;
  const perguntas = quiz.estado === "pronto" && !fechado ? quiz.dados.perguntas : [];
  const pergunta = perguntas[indice];
  const fim = quiz.estado === "pronto" && perguntas.length > 0 && indice >= perguntas.length;
  const situacao: Situacao = (pergunta && situacoes[pergunta.id]) || { tipo: "aberta" };
  const voltar = licao.estado === "pronto" ? `/trilhas/${licao.dados.trilha.slug}/${licaoId}` : "/trilhas";
  const titulo = licao.estado === "pronto" ? licao.dados.trilha.titulo : "Quiz";

  async function responder(opcao: number, evento: MouseEvent<HTMLButtonElement>) {
    if (!pergunta || situacao.tipo !== "aberta" || enviando !== null) return;
    const botao = evento.currentTarget;
    setEnviando(opcao);
    setErro(null);
    try {
      const resposta = await api.responderQuiz({ perguntaId: pergunta.id, opcao });
      invalidar(`quiz-${licaoId}`, "resumo");
      setSituacoes((s) => ({ ...s, [pergunta.id]: situacaoDaResposta(opcao, resposta) }));
      setRespondidasAgora((r) => ({ ...r, [pergunta.id]: true }));
      setAcertos((a) => ({ ...a, [pergunta.id]: resposta.correta }));
      celebrar(resposta, botao);
    } catch (e) {
      if (e instanceof ErroApi && e.codigo === "LICAO_NAO_CONCLUIDA") {
        // A tela estava desatualizada: busca o quiz de novo, e ele mostra o convite para ler a lição.
        quiz.recarregar();
      } else {
        // Inclui o 429 LIMITE_DE_REQUISICOES: mostra a mensagem e espera a pessoa tentar de novo.
        setErro(mensagemParaPessoa(e));
      }
    } finally {
      setEnviando(null);
    }
  }

  function responderDeNovo() {
    if (!pergunta) return;
    setSituacoes((s) => ({ ...s, [pergunta.id]: { tipo: "aberta" } }));
    setErro(null);
  }

  const ultima = indice + 1 >= perguntas.length;
  const selo = pergunta && temSessao ? seloDaPergunta(pergunta, Boolean(respondidasAgora[pergunta.id])) : null;
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
          {selo && situacao.tipo === "aberta" && (
            <p className="flex flex-wrap items-center gap-2 text-pequeno text-apoio">
              <Chip tom={selo === "Vale pontos" ? "sucesso" : "neutro"}>{selo}</Chip>
              {selo === "Já respondida" && "Responder de novo é treino: não vale pontos."}
            </p>
          )}
          <div className="flex flex-col gap-2.5" role="group" aria-label="Opções de resposta">
            {pergunta.opcoes.map((texto, i) => (
              <Opcao
                key={`${pergunta.id}-${i}`}
                texto={texto}
                estado={estadoDaOpcao(situacao, i)}
                escolhida={situacao.tipo === "respondida" && situacao.opcao === i}
                desabilitada={situacao.tipo !== "aberta" || (enviando !== null && enviando !== i)}
                enviando={enviando === i}
                onEscolher={(e) => responder(i, e)}
              />
            ))}
          </div>
          <MensagemErro id="erro-quiz" erro={erro} />
          <Explicacao situacao={situacao} opcoes={pergunta.opcoes} />
          {situacao.tipo !== "aberta" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Botao variante="secundario" onClick={responderDeNovo}>
                Responder de novo como treino
              </Botao>
              <Botao variante="escuro" onClick={() => setIndice((i) => i + 1)}>
                {ultima ? "Ver como fui" : "Próxima pergunta"}
              </Botao>
            </div>
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
            {respondidas > 0 && "Pode responder de novo quando quiser para treinar, sem ganhar pontos."}
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
