"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { BotaoIcone } from "@/components/ui/Botao";
import { MensagemErro } from "@/components/ui/Campo";
import { Icone } from "@/components/ui/Icone";
import { IndicadorDigitando } from "@/components/ui/IndicadorDigitando";
import { api, mensagemParaPessoa } from "@/lib/api";
import { juntar } from "@/lib/classes";
import { CURVA, DURACAO, usePoucoMovimento } from "@/lib/movimento";
import { TUTOR_HISTORICO_MAXIMO, TUTOR_MENSAGEM_MAXIMA } from "@/lib/validacao/tutor";
import type { LicaoRelacionada, MensagemTutor } from "@/types";

type Mensagem = MensagemTutor & { id: number; licoes?: LicaoRelacionada[] };

export const SUGESTOES = ["Como economizar no ar-condicionado?", "O que é kWh?", "Vale a pena ter placa solar em São Luís?"];

const SAUDACAO = "Oi! Pode perguntar o que quiser sobre a sua conta de luz ou sobre energia solar.";

function Balao({ papel, children }: { papel: MensagemTutor["papel"]; children: React.ReactNode }) {
  const poucoMovimento = usePoucoMovimento();
  return (
    <motion.li
      className={juntar(
        "max-w-[85%] rounded-cartao border-2 border-tinta px-4 py-3 whitespace-pre-line",
        papel === "usuario" ? "self-end bg-primaria text-primaria-tinta" : "self-start bg-superficie",
      )}
      initial={poucoMovimento ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURACAO.padrao, ease: CURVA }}
    >
      {children}
    </motion.li>
  );
}

type Props = {
  /** Ao lado da lição, no desktop: altura fixa e a conversa rola por dentro. */
  lateral?: boolean;
};

export function ConversaTutor({ lateral = false }: Props) {
  const poucoMovimento = usePoucoMovimento();
  const idErro = `erro-tutor-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [esperando, setEsperando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const fim = useRef<HTMLDivElement>(null);
  const rolagem = useRef<HTMLDivElement>(null);
  const entrada = useRef<HTMLInputElement>(null);
  const sequencia = useRef(0);

  // Rola até a última mensagem (ou o "digitando") sempre que a conversa muda.
  useEffect(() => {
    if (mensagens.length === 0 && !esperando) return;
    const comportamento = poucoMovimento ? "auto" : "smooth";
    // Ao lado da lição só a conversa rola; a página fica onde a pessoa está lendo.
    if (lateral) rolagem.current?.scrollTo({ top: rolagem.current.scrollHeight, behavior: comportamento });
    else fim.current?.scrollIntoView({ behavior: comportamento, block: "end" });
  }, [mensagens, esperando, poucoMovimento, lateral]);

  async function perguntar(pergunta: string) {
    const mensagem = pergunta.trim();
    if (!mensagem || esperando) return;
    // Só a memória desta tela guarda a conversa; o back recebe as últimas mensagens a cada pergunta.
    const historico = mensagens.slice(-TUTOR_HISTORICO_MAXIMO).map(({ papel, texto: t }) => ({ papel, texto: t }));
    sequencia.current += 1;
    const id = sequencia.current;
    setMensagens((m) => [...m, { id, papel: "usuario", texto: mensagem }]);
    setTexto("");
    setErro(null);
    setEsperando(true);
    try {
      const resposta = await api.perguntarAoTutor({ mensagem, historico });
      sequencia.current += 1;
      const idResposta = sequencia.current;
      setMensagens((m) => [...m, { id: idResposta, papel: "energinho", texto: resposta.resposta, licoes: resposta.licoesRelacionadas }]);
    } catch (e) {
      // Devolve a pergunta para o campo, para a pessoa tentar de novo sem digitar tudo.
      setMensagens((m) => m.filter((x) => x.id !== id));
      setTexto(mensagem);
      setErro(mensagemParaPessoa(e));
      entrada.current?.focus();
    } finally {
      setEsperando(false);
    }
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    void perguntar(texto);
  }

  const Titulo = lateral ? "h2" : "h1";

  return (
    <div
      className={juntar(
        "flex flex-col gap-4",
        lateral ? "h-full min-h-0" : "min-h-[calc(100dvh-8rem)] lg:min-h-[calc(100dvh-4rem)] deitado:min-h-[calc(100dvh-2rem)]",
      )}
    >
      <header className="flex items-center gap-3">
        <span
          className={juntar(
            "flex shrink-0 items-center justify-center rounded-full border-2 border-tinta bg-destaque text-destaque-tinta",
            lateral ? "size-10" : "size-12",
          )}
        >
          <Icone nome="sol" tamanho={lateral ? 20 : 24} />
        </span>
        <div className="flex flex-col">
          <Titulo className="font-titulo text-titulo-3 font-extrabold">{lateral ? "Tire uma dúvida" : "Energinho"}</Titulo>
          <span className="text-pequeno text-apoio">{lateral ? "Com o Energinho, o tutor de energia" : "Tutor de energia"}</span>
        </div>
      </header>
      <p className="text-pequeno text-apoio">A conversa não fica salva: ela some quando você sai desta tela.</p>

      <div ref={rolagem} className={juntar("flex flex-1 flex-col gap-4", lateral && "-mx-1 min-h-0 overflow-y-auto px-1 pb-1")}>
        <ol className="flex flex-1 flex-col gap-3" aria-label="Conversa com o Energinho" aria-live="polite">
          <li className="max-w-[85%] self-start rounded-cartao border-2 border-tinta bg-superficie px-4 py-3">
            <span className="sr-only">Energinho: </span>
            {SAUDACAO}
          </li>
          <AnimatePresence initial={false}>
            {mensagens.map((m) => (
              <Balao key={m.id} papel={m.papel}>
                <span className="sr-only">{m.papel === "usuario" ? "Você: " : "Energinho: "}</span>
                {m.texto}
                {m.licoes && m.licoes.length > 0 && (
                  <span className="mt-2 flex flex-col gap-1">
                    <span className="text-pequeno text-apoio">Para saber mais:</span>
                    {m.licoes.map((l) => (
                      <Link key={l.id} href={`/trilhas/${l.trilhaSlug}/${l.id}`} className="flex min-h-11 items-center font-bold text-primaria underline underline-offset-2">
                        {l.titulo}
                      </Link>
                    ))}
                  </span>
                )}
              </Balao>
            ))}
          </AnimatePresence>
          {esperando && (
            <li className="self-start">
              <IndicadorDigitando />
            </li>
          )}
        </ol>

        {mensagens.length === 0 && !esperando && (
          <div role="group" aria-label="Sugestões de pergunta" className="flex flex-wrap gap-2">
            {SUGESTOES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => perguntar(s)}
                className="afundar-leve inline-flex min-h-11 items-center rounded-full border-2 border-primaria bg-superficie px-3 text-left text-pequeno font-semibold text-primaria"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        ref={fim}
        className={juntar(
          "flex flex-col gap-1",
          !lateral &&
            "sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] -mx-4 bg-fundo px-4 pt-2 pb-2 sm:-mx-6 sm:px-6 lg:bottom-0 lg:pb-4 deitado:bottom-0",
        )}
      >
        <MensagemErro id={idErro} erro={erro} />
        <form onSubmit={enviar} className="flex items-center gap-2">
          <input
            ref={entrada}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={TUTOR_MENSAGEM_MAXIMA}
            placeholder="Escreva sua dúvida"
            aria-label="Sua dúvida"
            aria-describedby={erro ? idErro : undefined}
            enterKeyHint="send"
            className="min-h-[52px] w-full min-w-0 flex-1 rounded-pequeno border-2 border-tinta bg-superficie px-4 text-base"
          />
          <BotaoIcone rotulo="Enviar pergunta" type="submit" disabled={!texto.trim() || esperando} className="size-[52px] bg-destaque disabled:bg-trilho">
            <Icone nome="enviar" tamanho={20} />
          </BotaoIcone>
        </form>
      </div>
    </div>
  );
}
