"use client";

import { motion, useAnimationFrame, useMotionValue } from "motion/react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { AvisoLicaoTravada } from "@/components/app/AvisoLicaoTravada";
import { useCelebrar } from "@/components/app/Celebracao";
import { Carregando, EstadoErro } from "@/components/app/Estados";
import { BarraProgresso } from "@/components/ui/BarraProgresso";
import { BotaoLink } from "@/components/ui/Botao";
import { MensagemErro } from "@/components/ui/Campo";
import { Chip } from "@/components/ui/Chip";
import { Icone, type NomeIcone } from "@/components/ui/Icone";
import { Topo } from "@/components/ui/Topo";
import { api, ErroApi, mensagemParaPessoa } from "@/lib/api";
import { juntar } from "@/lib/classes";
import { numero } from "@/lib/conteudo";
import { passoDepoisDaLicao } from "@/lib/missoesDasTrilhas";
import { CURVA, DURACAO, usePoucoMovimento } from "@/lib/movimento";
import { useDados } from "@/lib/useDados";
import { useTemSessao } from "@/lib/useTemSessao";

const TRILHA = "energia-solar-em-sao-luis";

export const WATTS_POR_PEDALADA = 14;
export const WATTS_MAXIMO = 110;
export const WATTS_POR_PESSOA = 85;
const PERDA_POR_SEGUNDO = 45;
const PAUSA_ANTES_DE_PERDER_MS = 300;
const INTERVALO_SEGURANDO_MS = 200;

type Meta = { nome: string; potencia: number; icone: NomeIcone; ligado: string };

export const METAS: readonly Meta[] = [
  { nome: "Lâmpada LED", potencia: 9, icone: "lampada", ligado: "Acendeu" },
  { nome: "Ventilador", potencia: 60, icone: "ventilador", ligado: "Ligou" },
  { nome: "Televisão", potencia: 100, icone: "tv", ligado: "Ligou" },
  { nome: "Ar-condicionado", potencia: 1000, icone: "arCondicionado", ligado: "Ligou" },
];

/** Quantas pessoas pedalando seriam precisas para ligar um aparelho. */
export const pessoasPedalando = (potencia: number) => Math.ceil(potencia / WATTS_POR_PESSOA);

/** Acrescenta uma pedalada sem passar do que uma pessoa consegue gerar. */
export const somarPedalada = (watts: number) => Math.min(WATTS_MAXIMO, watts + WATTS_POR_PEDALADA);

/** Os watts caem aos poucos quando a pessoa para de pedalar. */
export function perderWatts(watts: number, msParado: number, dtMs: number): number {
  if (msParado < PAUSA_ANTES_DE_PERDER_MS) return watts;
  return Math.max(0, watts - (PERDA_POR_SEGUNDO * dtMs) / 1000);
}

function Roda({ cx, rotacao }: { cx: number; rotacao: ReturnType<typeof useMotionValue<number>> }) {
  return (
    <motion.g style={{ rotate: rotacao }}>
      <circle cx={cx} cy={34} r={10} />
      <path d={`M${cx} 24v20M${cx - 10} 34h20M${cx - 7} 27l14 14M${cx + 7} 27l-14 14`} strokeWidth={1.5} />
    </motion.g>
  );
}

function Bicicleta({ rotacao }: { rotacao: ReturnType<typeof useMotionValue<number>> }) {
  return (
    <svg width={64} height={48} viewBox="0 0 64 48" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <Roda cx={14} rotacao={rotacao} />
      <Roda cx={50} rotacao={rotacao} />
      <path d="M14 34l10-18h14l12 18M24 16l8 18M34 8h7" />
    </svg>
  );
}

function LinhaAparelho({ meta, watts, avisar }: { meta: Meta; watts: number; avisar: boolean }) {
  const poucoMovimento = usePoucoMovimento();
  const ligado = watts >= meta.potencia;
  const pessoas = pessoasPedalando(meta.potencia);
  // Só o que passa do limite de uma pessoa pede mais gente pedalando.
  const impossivel = meta.potencia > WATTS_MAXIMO;
  const perto = !ligado && watts >= meta.potencia * 0.6;

  return (
    <li className="flex items-center gap-3 border-b border-trilho py-2 last:border-b-0">
      <motion.span
        className={juntar(
          "flex size-10 shrink-0 items-center justify-center rounded-pequeno border-2 transition-colors duration-200",
          ligado ? "border-tinta bg-destaque text-destaque-tinta" : "border-transparent bg-trilho text-apoio",
        )}
        animate={ligado && !poucoMovimento ? { scale: [1, 1.18, 1] } : { scale: 1 }}
        transition={{ duration: DURACAO.enfatica, ease: CURVA }}
      >
        <Icone nome={meta.icone} tamanho={20} />
      </motion.span>
      <span className="flex flex-1 flex-col">
        <span className="font-semibold">{meta.nome}</span>
        <span className="text-pequeno text-apoio">
          {numero(meta.potencia, 0)} W{impossivel ? `, seriam ${pessoas} pessoas pedalando` : ""}
        </span>
      </span>
      {impossivel ? (
        <Chip tom="destaque">{pessoas} pessoas</Chip>
      ) : ligado ? (
        <Chip tom="sucesso">{meta.ligado}</Chip>
      ) : perto ? (
        <Chip tom="primaria">Quase lá</Chip>
      ) : (
        <Chip tom="neutro">Faltam {numero(Math.ceil(meta.potencia - watts), 0)} W</Chip>
      )}
      {avisar && ligado && (
        <span className="sr-only" role="status">
          {meta.nome}: {meta.ligado.toLowerCase()}.
        </span>
      )}
    </li>
  );
}

export function TelaPedale() {
  const celebrar = useCelebrar();
  const poucoMovimento = usePoucoMovimento();
  const trilha = useDados(`trilha-${TRILHA}`, () => api.obterTrilha(TRILHA));
  const idLicao = trilha.estado === "pronto" ? trilha.dados.licoes.find((l) => l.tipo === "pedale")?.id : undefined;
  const licao = useDados(idLicao ? `licao-${idLicao}` : null, () => api.obterLicao(idLicao!));
  const missoes = useDados("missoes", () => api.listarMissoes());
  const temSessao = useTemSessao();

  const watts = useRef(0);
  const ultimoToque = useRef(-Infinity);
  const segurando = useRef<ReturnType<typeof setInterval> | null>(null);
  const ultimoExibido = useRef(0);
  const rotacao = useMotionValue(0);
  const lista = useRef<HTMLUListElement>(null);
  const [exibidos, setExibidos] = useState(0);
  const [pedalou, setPedalou] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // A TV (100 W) é o limite do que uma pessoa gera: acender a TV conclui a lição.
  const licaoAtual = useRef(licao);
  useEffect(() => {
    licaoAtual.current = licao;
  });
  const jaConcluiu = useRef(false);
  function concluirSeAcendeuTv(watts: number) {
    const atual = licaoAtual.current;
    if (watts < 100 || jaConcluiu.current || atual.estado !== "pronto") return;
    jaConcluiu.current = true;
    setConcluido(true);
    // Com uma lição anterior pendente o back recusaria (e sem login não salva): pedalar vale como experiência.
    if (atual.dados.concluida || atual.dados.licaoPendente) return;
    api.concluirPedale(atual.dados.id).then(
      (resultado) => celebrar(resultado, lista.current),
      (e) => {
        if (!(e instanceof ErroApi && e.codigo === "NAO_AUTENTICADO")) setErro(mensagemParaPessoa(e));
      },
    );
  }

  useAnimationFrame((agora, dt) => {
    const novo = perderWatts(watts.current, agora - ultimoToque.current, dt);
    watts.current = novo;
    if (!poucoMovimento && novo > 0) rotacao.set((rotacao.get() + novo * 0.012 * dt) % 360);
    const arredondado = Math.round(novo);
    if (arredondado !== ultimoExibido.current) {
      ultimoExibido.current = arredondado;
      setExibidos(arredondado);
      concluirSeAcendeuTv(arredondado);
    }
  });

  const pedalar = useCallback(() => {
    watts.current = somarPedalada(watts.current);
    ultimoToque.current = performance.now();
    setPedalou(true);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(8);
  }, []);

  const pararDeSegurar = useCallback(() => {
    if (segurando.current) clearInterval(segurando.current);
    segurando.current = null;
  }, []);

  useEffect(() => pararDeSegurar, [pararDeSegurar]);

  function teclar(evento: KeyboardEvent<HTMLButtonElement>) {
    if (evento.key !== "Enter" && evento.key !== " ") return;
    evento.preventDefault();
    pedalar();
  }

  function clicar(evento: MouseEvent<HTMLButtonElement>) {
    // Clique sem ponteiro nem teclado: leitor de tela ou controle por voz.
    if (evento.detail === 0) pedalar();
  }

  const total = trilha.estado === "pronto" ? trilha.dados.totalLicoes : 0;
  const ordem = licao.estado === "pronto" ? licao.dados.ordem : 0;
  const passo =
    licao.estado === "pronto"
      ? licao.dados.totalPerguntas > 0
        ? { href: `/quiz/${licao.dados.id}`, rotulo: "Fazer o quiz" }
        : passoDepoisDaLicao(licao.dados, missoes.estado === "pronto" ? missoes.dados : null)
      : null;
  const erroCarga = trilha.estado === "erro" ? trilha : licao.estado === "erro" ? licao : null;
  const pendente = licao.estado === "pronto" && temSessao ? licao.dados.licaoPendente : null;

  return (
    <div className="pagina-media flex flex-col gap-4">
      <Topo titulo={trilha.estado === "pronto" ? trilha.dados.titulo : "Energia solar em São Luís"} voltarPara={`/trilhas/${TRILHA}/continuar`} />
      {total > 0 && ordem > 0 && <BarraProgresso valor={ordem} total={total} rotulo={`Parte ${ordem} de ${total}`} mostrarRotulo />}
      <h1 className="text-titulo-2">Quanta energia você gera pedalando?</h1>
      {pendente && (
        <AvisoLicaoTravada slug={TRILHA} pendente={pendente} texto={`Você pode pedalar, mas esta parte só conta depois de "${pendente.titulo}".`} />
      )}

      {/* Do tablet para cima (e no celular deitado) a bicicleta e os aparelhos ficam lado a lado, sem rolar. */}
      <div className="grid gap-4 md:grid-cols-2 md:items-start">
        <div className="flex items-center gap-4 rounded-cartao border-2 border-tinta bg-superficie p-4 shadow-azulejo">
          <button
            type="button"
            aria-label="Pedalar"
            aria-describedby="watts-gerados"
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              pedalar();
              pararDeSegurar();
              segurando.current = setInterval(pedalar, INTERVALO_SEGURANDO_MS);
            }}
            onPointerUp={pararDeSegurar}
            onPointerCancel={pararDeSegurar}
            onLostPointerCapture={pararDeSegurar}
            onKeyDown={teclar}
            onKeyUp={(e) => e.key === " " && e.preventDefault()}
            onClick={clicar}
            onContextMenu={(e) => e.preventDefault()}
            className="afundar flex size-[124px] shrink-0 touch-manipulation flex-col items-center justify-center gap-1 rounded-full border-2 border-tinta bg-destaque px-3 text-center text-pequeno leading-tight font-bold text-destaque-tinta shadow-azulejo select-none [-webkit-touch-callout:none]"
          >
            <Bicicleta rotacao={rotacao} />
            <span>{pedalou ? "Segure para continuar" : "Toque para pedalar"}</span>
          </button>
          <div className="flex min-w-0 flex-col gap-0.5" id="watts-gerados">
            <span className="text-pequeno text-apoio">Você está gerando</span>
            <span className="font-titulo text-[2.5rem] leading-none font-extrabold tabular-nums">{exibidos} W</span>
            <span className="text-pequeno text-apoio">Uma pessoa pedalando gera de 75 a 100 W.</span>
          </div>
        </div>
  
        <ul ref={lista} aria-label="Aparelhos" className="flex flex-col rounded-cartao border-2 border-tinta bg-superficie px-4 py-1 shadow-azulejo">
          {METAS.map((meta) => (
            <LinhaAparelho key={meta.nome} meta={meta} watts={exibidos} avisar={pedalou} />
          ))}
        </ul>
      </div>

      {concluido && (
        <p className="font-semibold text-sucesso" role="status">
          Você ligou a TV só com as pernas. Para um ar-condicionado, seriam {pessoasPedalando(1000)} pessoas pedalando sem parar.
        </p>
      )}
      <MensagemErro id="erro-pedale" erro={erro} />
      {erroCarga && <EstadoErro erro={erroCarga.erro} onTentarDeNovo={erroCarga.recarregar} />}
      {!erroCarga && !passo && <Carregando rotulo="Carregando a lição" linhas={1} className="[&>div]:h-[52px]" />}
      {passo && (
        <BotaoLink href={passo.href} variante={concluido && !pendente ? "primario" : "secundario"}>
          {passo.rotulo}
        </BotaoLink>
      )}
    </div>
  );
}
