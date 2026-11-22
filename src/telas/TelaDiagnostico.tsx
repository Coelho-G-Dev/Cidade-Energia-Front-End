"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Carregando, EstadoErro, EstadoVazio } from "@/components/app/Estados";
import { BarraProgresso } from "@/components/ui/BarraProgresso";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { MensagemErro } from "@/components/ui/Campo";
import { Card } from "@/components/ui/Card";
import { CheckDesenhado } from "@/components/ui/CheckDesenhado";
import { Chip } from "@/components/ui/Chip";
import { Icone } from "@/components/ui/Icone";
import { Topo } from "@/components/ui/Topo";
import { api, ErroApi, mensagemParaPessoa } from "@/lib/api";
import { invalidar } from "@/lib/cacheDados";
import { juntar } from "@/lib/classes";
import { limparMarcadores } from "@/lib/conteudo";
import { useDados } from "@/lib/useDados";
import type { MomentoDiagnostico, PerguntaDiagnostico, ResultadoDiagnostico } from "@/types";

type Props = {
  slug: string;
  momento?: MomentoDiagnostico;
};

export function TelaDiagnostico({ slug, momento = "antes" }: Props) {
  const router = useRouter();
  const chaveCache = `diagnostico-${slug}-${momento}`;
  const diagnostico = useDados(chaveCache, () => api.obterDiagnostico(slug, momento));
  const [indice, setIndice] = useState(0);
  const [escolhas, setEscolhas] = useState<Record<string, number>>({});
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [conflito, setConflito] = useState<"ja_respondido" | "indisponivel" | null>(null);
  const [resultado, setResultado] = useState<ResultadoDiagnostico | null>(null);
  const [perguntasEnviadas, setPerguntasEnviadas] = useState<PerguntaDiagnostico[]>([]);

  const voltarParaTrilha = `/trilhas/${slug}/continuar`;
  const tituloTopo = momento === "antes" ? "Ver o que você já sabe" : "Ver o quanto você aprendeu";

  const jaRespondido =
    conflito === "ja_respondido" || (diagnostico.estado === "pronto" && diagnostico.dados.respondido);
  const indisponivel =
    conflito === "indisponivel" ||
    (diagnostico.estado === "pronto" && !diagnostico.dados.respondido && !diagnostico.dados.disponivel);

  const perguntas =
    diagnostico.estado === "pronto" && diagnostico.dados.disponivel && !diagnostico.dados.respondido
      ? diagnostico.dados.perguntas
      : [];
  const pergunta = resultado === null && !jaRespondido && !indisponivel ? perguntas[indice] : undefined;
  const opcaoEscolhida = pergunta ? escolhas[pergunta.id] : undefined;
  const ultima = indice + 1 >= perguntas.length;

  function escolherOpcao(idPergunta: string, opcao: number) {
    if (enviando) return;
    setEscolhas((atual) => ({ ...atual, [idPergunta]: opcao }));
    setErroEnvio(null);
  }

  function pular() {
    // D-013: pular não grava nada, apenas segue para a lição.
    router.push(voltarParaTrilha);
  }

  async function enviar() {
    if (enviando || perguntas.length === 0) return;
    const faltando = perguntas.some((p) => escolhas[p.id] === undefined);
    if (faltando) {
      setErroEnvio("Escolha uma opção para continuar.");
      return;
    }
    setEnviando(true);
    setErroEnvio(null);
    const snapshotPerguntas = [...perguntas];
    try {
      const resposta = await api.enviarDiagnostico(slug, {
        momento,
        respostas: snapshotPerguntas.map((p) => ({ perguntaId: p.id, opcao: escolhas[p.id]! })),
      });
      invalidar("diagnostico-");
      setPerguntasEnviadas(snapshotPerguntas);
      setResultado(resposta);
    } catch (e) {
      if (e instanceof ErroApi && e.codigo === "DIAGNOSTICO_JA_RESPONDIDO") {
        setConflito("ja_respondido");
      } else if (e instanceof ErroApi && e.codigo === "DIAGNOSTICO_INDISPONIVEL") {
        setConflito("indisponivel");
      } else {
        setErroEnvio(mensagemParaPessoa(e));
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="pagina-estreita flex flex-col gap-4">
      <Topo
        titulo={tituloTopo}
        voltarPara={voltarParaTrilha}
        acao={
          momento === "antes" && resultado === null && !jaRespondido && !indisponivel ? (
            <button
              type="button"
              onClick={pular}
              className="afundar-leve inline-flex min-h-11 items-center justify-center rounded-botao px-3 font-bold text-primaria"
            >
              Pular
            </button>
          ) : undefined
        }
      />

      {diagnostico.estado === "carregando" && <Carregando rotulo="Carregando o diagnóstico" />}
      {diagnostico.estado === "erro" && (
        <EstadoErro erro={diagnostico.erro} onTentarDeNovo={diagnostico.recarregar} />
      )}

      {resultado === null && jaRespondido && (
        <EstadoVazio
          icone="check"
          titulo="Você já respondeu este diagnóstico"
          texto={
            momento === "antes"
              ? "Suas respostas iniciais já estão guardadas. Siga para as lições da trilha."
              : "Você já concluiu o diagnóstico final desta trilha."
          }
          acao={<BotaoLink href={voltarParaTrilha}>Ir para a trilha</BotaoLink>}
        />
      )}

      {resultado === null && !jaRespondido && indisponivel && (
        <EstadoVazio
          icone="cadeado"
          titulo={
            momento === "antes"
              ? "O diagnóstico inicial não está mais disponível"
              : "Conclua a trilha antes do diagnóstico final"
          }
          texto={
            momento === "antes"
              ? "Ele só fica aberto antes de você concluir a primeira lição da trilha."
              : "O diagnóstico final abre quando você conclui todas as lições da trilha e já respondeu o diagnóstico inicial."
          }
          acao={<BotaoLink href={voltarParaTrilha}>Voltar para a trilha</BotaoLink>}
        />
      )}

      {pergunta && (
        <div key={pergunta.id} className="flex flex-col gap-4">
          <BarraProgresso
            valor={indice + 1}
            total={perguntas.length}
            de={indice / perguntas.length}
            rotulo={`Pergunta ${indice + 1} de ${perguntas.length}`}
            mostrarRotulo
          />
          <div className="flex flex-wrap items-center gap-2">
            <Chip tom="neutro">Não vale pontos</Chip>
            <span className="text-pequeno text-apoio">
              {momento === "antes"
                ? "Responda com o que você já sabe hoje. O gabarito só aparece no final da trilha."
                : "As mesmas 4 perguntas do início para comparar o quanto você aprendeu."}
            </span>
          </div>
          <h1 className="text-titulo-2">{limparMarcadores(pergunta.enunciado)}</h1>

          <div className="flex flex-col gap-2.5" role="group" aria-label="Opções de resposta">
            {pergunta.opcoes.map((texto, i) => {
              const selecionada = opcaoEscolhida === i;
              return (
                <button
                  key={`${pergunta.id}-${i}`}
                  type="button"
                  disabled={enviando}
                  aria-pressed={selecionada}
                  onClick={() => escolherOpcao(pergunta.id, i)}
                  className={juntar(
                    "afundar flex min-h-14 w-full items-center gap-3 rounded-cartao border-2 px-4 py-3 text-left font-bold text-tinta transition-colors duration-200",
                    selecionada
                      ? "border-primaria bg-primaria-suave shadow-azulejo"
                      : "border-tinta bg-superficie shadow-azulejo",
                  )}
                >
                  <span className="flex-1">{texto}</span>
                  {selecionada && (
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primaria text-superficie">
                      <CheckDesenhado tamanho={16} />
                      <span className="sr-only">Opção escolhida</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <MensagemErro id="erro-diagnostico" erro={erroEnvio} />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {indice > 0 ? (
              <Botao variante="secundario" onClick={() => setIndice((i) => i - 1)} disabled={enviando}>
                Pergunta anterior
              </Botao>
            ) : momento === "antes" ? (
              <Botao variante="secundario" onClick={pular} disabled={enviando}>
                Pular diagnóstico
              </Botao>
            ) : (
              <span />
            )}

            {ultima ? (
              <Botao onClick={enviar} carregando={enviando} disabled={opcaoEscolhida === undefined}>
                {enviando ? "Guardando..." : "Guardar respostas"}
              </Botao>
            ) : (
              <Botao
                variante="escuro"
                onClick={() => setIndice((i) => i + 1)}
                disabled={opcaoEscolhida === undefined}
              >
                Próxima pergunta
              </Botao>
            )}
          </div>
        </div>
      )}

      {resultado?.momento === "antes" && (
        <Card role="status" aria-live="polite" className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sucesso-suave text-sucesso">
              <Icone nome="check" tamanho={22} />
            </span>
            <h1 className="text-titulo-1">Respostas guardadas</h1>
          </div>
          <p className="text-apoio">
            Guardamos suas respostas iniciais. Quando você concluir a última lição desta trilha, poderá responder de novo e ver o gabarito.
          </p>
          <BotaoLink href={voltarParaTrilha}>Começar a primeira lição</BotaoLink>
        </Card>
      )}

      {resultado?.momento === "depois" && (
        <div role="status" aria-live="polite" className="flex flex-col gap-4">
          <Card tom="sucesso" className="flex flex-col gap-2 p-5">
            <Chip tom="sucesso" className="self-start">
              Diagnóstico concluído
            </Chip>
            <h1 className="text-titulo-1">Veja o quanto você aprendeu</h1>
            <p className="text-base font-bold">
              Você acertou {resultado.acertosAntes} de {resultado.total} antes e {resultado.acertosDepois} de{" "}
              {resultado.total} agora.
            </p>
          </Card>

          <section aria-label="Gabarito comentado" className="flex flex-col gap-3">
            <h2 className="text-titulo-3">Gabarito e explicações</h2>
            <ul className="flex flex-col gap-3">
              {resultado.perguntas.map((item, i) => {
                const original = perguntasEnviadas.find((p) => p.id === item.perguntaId);
                const textoOpcaoCerta = original?.opcoes[item.indiceCorreto];
                return (
                  <li key={item.perguntaId}>
                    <Card className="flex flex-col gap-2 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Chip tom={item.acertouAntes ? "sucesso" : "neutro"}>
                          Antes: {item.acertouAntes ? "acertou" : "errou"}
                        </Chip>
                        <Chip tom={item.acertouDepois ? "sucesso" : "neutro"}>
                          Agora: {item.acertouDepois ? "acertou" : "errou"}
                        </Chip>
                      </div>
                      <p className="font-bold">
                        {original ? limparMarcadores(original.enunciado) : `Pergunta ${i + 1}`}
                      </p>
                      {textoOpcaoCerta && (
                        <p className="text-sm font-semibold text-sucesso">
                          Resposta certa: {limparMarcadores(textoOpcaoCerta)}
                        </p>
                      )}
                      <p className="text-sm text-apoio">{limparMarcadores(item.explicacao)}</p>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </section>

          <BotaoLink href="/trilhas">Voltar para as trilhas</BotaoLink>
        </div>
      )}
    </div>
  );
}
