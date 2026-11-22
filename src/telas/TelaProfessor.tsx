"use client";

import { useState, type FormEvent } from "react";
import { Carregando } from "@/components/app/Estados";
import { BarraProgresso } from "@/components/ui/BarraProgresso";
import { Botao } from "@/components/ui/Botao";
import { CampoTexto } from "@/components/ui/CampoTexto";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Icone } from "@/components/ui/Icone";
import { Topo } from "@/components/ui/Topo";
import { api, ErroApi, mensagemParaPessoa, modoSimulado } from "@/lib/api";
import { CODIGO_PROFESSOR_OCULTO_SIMULADO, CODIGO_PROFESSOR_SIMULADO } from "@/lib/api/simulado";
import { dataCurta, diaEHora, numero } from "@/lib/conteudo";
import type { PainelProfessor } from "@/types";

export const TEXTO_MENOS_DE_3 = "menos de 3 estudantes";
export const TEXTO_MENOS_DE_5_RESPOSTAS = "menos de 5 respostas";
export const NOTA_COMPARACAO_DIAGNOSTICO =
  "Compara os mesmos estudantes antes e depois da trilha. Não há grupo de comparação, então não mede só o efeito do app.";

export const normalizarCodigoProfessor = (codigo: string): string =>
  codigo.replace(/[\s-]/g, "").toUpperCase();

export function valorOuOculto(valor: number | null, formatar: (n: number) => string = (n) => numero(n, 1)): string {
  if (valor === null) return TEXTO_MENOS_DE_3;
  return formatar(valor);
}

export function percentualOuOculto(valor: number | null): string {
  if (valor === null) return TEXTO_MENOS_DE_5_RESPOSTAS;
  return `${numero(valor, 1)}%`;
}

export function formatarAntesDepois(antes: number | null, depois: number | null): string {
  if (antes === null || depois === null) return TEXTO_MENOS_DE_5_RESPOSTAS;
  return `${numero(antes, 1)}% antes → ${numero(depois, 1)}% depois`;
}

function mensagemErroProfessor(erro: unknown): string {
  if (erro instanceof ErroApi) {
    if (erro.codigo === "ESCOLA_NAO_ENCONTRADA" || erro.status === 404) {
      return "Não encontramos uma escola com esse código. Confira o código do professor e tente de novo.";
    }
    if (erro.codigo === "LIMITE_DE_REQUISICOES" || erro.status === 429) {
      return erro.message || "Muitas tentativas seguidas. Espere um minuto e tente de novo.";
    }
  }
  return mensagemParaPessoa(erro);
}

function CartaoResumo({
  rotulo,
  valor,
  complemento,
  tom = "superficie",
}: {
  rotulo: string;
  valor: string;
  complemento?: string;
  tom?: "superficie" | "sucesso";
}) {
  const oculto = valor === TEXTO_MENOS_DE_3 || valor === TEXTO_MENOS_DE_5_RESPOSTAS;
  return (
    <Card tom={tom} className="flex flex-col gap-1 p-3.5">
      <span className="text-pequeno text-apoio">{rotulo}</span>
      <span className={oculto ? "text-base font-bold text-apoio" : "font-titulo text-numero font-extrabold tabular-nums"}>
        {valor}
      </span>
      {complemento && <span className="text-pequeno text-apoio">{complemento}</span>}
    </Card>
  );
}

export function TelaProfessor() {
  // D-003: o código fica somente na memória da página (nunca em localStorage, sessionStorage ou URL).
  const [codigo, setCodigo] = useState("");
  const [ultimoCodigo, setUltimoCodigo] = useState("");
  const [erroCampo, setErroCampo] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [erroApi, setErroApi] = useState<unknown>(null);
  const [painel, setPainel] = useState<PainelProfessor | null>(null);

  async function buscarPainel(codigoAlvo: string) {
    setCarregando(true);
    setErroApi(null);
    setUltimoCodigo(codigoAlvo);
    try {
      const resposta = await api.obterPainelProfessor(codigoAlvo);
      setPainel(resposta);
    } catch (e) {
      setPainel(null);
      setErroApi(e);
    } finally {
      setCarregando(false);
    }
  }

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault();
    setTentativa((t) => t + 1);
    const limpo = normalizarCodigoProfessor(codigo);
    if (!limpo) {
      setErroCampo("Digite o código do professor da sua escola.");
      return;
    }
    setErroCampo(null);
    await buscarPainel(limpo);
  }

  function limparConsulta() {
    setCodigo("");
    setUltimoCodigo("");
    setPainel(null);
    setErroApi(null);
    setErroCampo(null);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col gap-5 px-[max(1.25rem,env(safe-area-inset-left),env(safe-area-inset-right))] pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] lg:py-12">
      <Topo titulo="Painel do professor" voltarPara="/" />

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tom="primaria">Acompanhamento da escola</Chip>
          <Chip tom="neutro">Só dados agregados</Chip>
        </div>
        <h1 className="text-titulo-1">Acompanhe o progresso da sua escola</h1>
        <p className="text-apoio">
          Digite o código do professor para ver as lições concluídas, o desempenho no quiz e as missões práticas da escola inteira.
        </p>
      </header>

      <Card className="flex flex-col gap-4 p-4">
        <form noValidate onSubmit={aoSubmeter} className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex-1">
            <CampoTexto
              rotulo="Código do professor"
              placeholder="12 letras e números"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              maxLength={20}
              value={codigo}
              onChange={(e) => setCodigo(normalizarCodigoProfessor(e.target.value))}
              dica={
                modoSimulado
                  ? `O código fica só na memória desta página. No modo simulado, teste ${CODIGO_PROFESSOR_SIMULADO} (escola com dados) ou ${CODIGO_PROFESSOR_OCULTO_SIMULADO} (menos de 3 estudantes).`
                  : "O código tem 12 letras e números e fica guardado só enquanto esta página estiver aberta."
              }
              erro={erroCampo}
              tentativa={tentativa}
            />
          </div>
          <div className="flex flex-col gap-2 sm:pt-[26px]">
            <Botao type="submit" carregando={carregando}>
              {carregando ? "Consultando..." : "Ver painel da escola"}
            </Botao>
            {painel && (
              <Botao variante="secundario" onClick={limparConsulta}>
                Limpar código
              </Botao>
            )}
          </div>
        </form>
      </Card>

      {carregando && <Carregando rotulo="Carregando os dados da escola" linhas={3} />}

      {!carregando && erroApi !== null && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-cartao border-2 border-erro bg-erro-suave p-4">
          <p className="flex items-start gap-2 font-semibold text-erro">
            <Icone nome="alerta" tamanho={20} className="mt-0.5 shrink-0" />
            {mensagemErroProfessor(erroApi)}
          </p>
          {ultimoCodigo && (
            <Botao variante="secundario" onClick={() => buscarPainel(ultimoCodigo)}>
              <Icone nome="recarregar" tamanho={18} />
              Tentar de novo
            </Botao>
          )}
        </div>
      )}

      {!carregando && painel && (
        <div className="flex flex-col gap-5">
          <Card tom="primaria" sombra={false} className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-pequeno font-semibold text-primaria">Escola consultada</span>
                <h2 className="text-titulo-2">{painel.escola.nome}</h2>
                <span className="text-pequeno text-apoio">
                  Bairro: {painel.escola.bairro} · Dados até {dataCurta(painel.dadosAte)}
                </span>
              </div>
              <div className="flex flex-col items-start rounded-pequeno border-2 border-tinta bg-superficie px-3.5 py-2">
                <span className="text-pequeno text-apoio">Código para os estudantes</span>
                <strong className="font-titulo text-titulo-3 font-extrabold tracking-wide text-primaria">
                  {painel.escola.codigoEstudante}
                </strong>
              </div>
            </div>
            <p className="text-pequeno text-apoio">
              Contam neste painel os estudantes que entraram no app com o código da turma da escola. Nenhum nome ou dado individual é exibido.
            </p>
          </Card>

          {painel.oculto ? (
            <Card className="flex flex-col gap-3 p-5">
              <div className="flex items-center gap-2.5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-pequeno bg-destaque text-destaque-tinta">
                  <Icone nome="cadeado" tamanho={22} />
                </span>
                <div className="flex flex-col">
                  <h3 className="text-titulo-3">Ainda não há 3 estudantes verificados nesta escola</h3>
                  <span className="text-pequeno text-apoio">Estudantes verificados: {TEXTO_MENOS_DE_3}</span>
                </div>
              </div>
              <p className="text-apoio">
                Para proteger a privacidade dos estudantes, o painel só mostra os números quando pelo menos 3 estudantes entram no app usando o código da escola.
              </p>
              <div className="flex flex-col gap-1 rounded-pequeno border-2 border-tinta bg-primaria-suave p-3.5">
                <span className="text-pequeno font-semibold text-tinta">
                  Compartilhe este código com as turmas da escola:
                </span>
                <strong className="font-titulo text-numero font-extrabold tracking-wider text-primaria">
                  {painel.escola.codigoEstudante}
                </strong>
                <span className="text-pequeno text-apoio">
                  Os estudantes digitam esse código em Criar meu perfil, na opção Código da turma.
                </span>
              </div>
            </Card>
          ) : (
            <>
              <section aria-label="Resumo da escola" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <CartaoResumo
                  rotulo="Estudantes verificados"
                  valor={valorOuOculto(painel.estudantes, (n) => numero(n, 0))}
                  complemento="com código da turma"
                />
                <CartaoResumo
                  rotulo="Lições concluídas"
                  valor={valorOuOculto(painel.progresso?.licoesConcluidas ?? null, (n) => numero(n, 0))}
                  complemento={
                    painel.progresso?.mediaLicoesPorEstudante != null
                      ? `Média de ${numero(painel.progresso.mediaLicoesPorEstudante, 1)} por estudante`
                      : undefined
                  }
                />
                <CartaoResumo
                  rotulo="Acertos no quiz"
                  valor={percentualOuOculto(painel.quiz?.percentualAcertos ?? null)}
                  complemento={
                    painel.quiz?.respostas != null
                      ? `${numero(painel.quiz.respostas, 0)} respostas na 1ª tentativa`
                      : undefined
                  }
                  tom="sucesso"
                />
                <CartaoResumo
                  rotulo="Simularam a conta"
                  valor={valorOuOculto(painel.simulacoes?.estudantesQueSimularam ?? null, (n) => numero(n, 0))}
                  complemento="estudantes com simulação"
                />
              </section>

              {painel.progresso && (
                <Card className="flex flex-col gap-4 p-4">
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-titulo-3">Progresso nas trilhas</h3>
                    <p className="text-pequeno text-apoio">
                      Recortes com menos de 3 estudantes aparecem como &ldquo;{TEXTO_MENOS_DE_3}&rdquo;.
                    </p>
                  </div>
                  <ul className="flex flex-col gap-3">
                    {painel.progresso.trilhas.map((trilha) => {
                      const totalEstudantes = painel.estudantes ?? 0;
                      const concluidos = trilha.estudantesQueConcluiram ?? 0;
                      return (
                        <li
                          key={trilha.slug}
                          className="flex flex-col gap-2 rounded-pequeno border-2 border-trilho bg-fundo p-3.5"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className="font-bold">{trilha.titulo}</span>
                            <span className="text-pequeno text-apoio">{trilha.totalLicoes} lições</span>
                          </div>
                          <div className="grid grid-cols-1 gap-2 text-pequeno sm:grid-cols-2">
                            <div>
                              <span className="text-apoio">Começaram: </span>
                              <strong className="text-tinta">
                                {valorOuOculto(trilha.estudantesQueComecaram, (n) => `${numero(n, 0)} estudantes`)}
                              </strong>
                            </div>
                            <div>
                              <span className="text-apoio">Concluíram: </span>
                              <strong className="text-tinta">
                                {valorOuOculto(trilha.estudantesQueConcluiram, (n) => `${numero(n, 0)} estudantes`)}
                              </strong>
                            </div>
                          </div>
                          {trilha.estudantesQueConcluiram !== null && totalEstudantes > 0 && (
                            <BarraProgresso
                              valor={concluidos}
                              total={totalEstudantes}
                              rotulo={`Concluíram ${trilha.titulo}`}
                              tom="primaria"
                            />
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              )}

              {painel.quiz && (
                <Card className="flex flex-col gap-4 p-4">
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-titulo-3">Perguntas com mais erros no quiz</h3>
                    <p className="text-pequeno text-apoio">
                      Considera a primeira tentativa de cada pergunta, quando pelo menos 5 estudantes responderam.
                    </p>
                  </div>
                  {painel.quiz.perguntasMaisErradas.length === 0 ? (
                    <p className="text-pequeno text-apoio">
                      Ainda não há perguntas com 5 ou mais respostas para mostrar.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-3">
                      {painel.quiz.perguntasMaisErradas.map((pergunta) => (
                        <li
                          key={pergunta.perguntaId}
                          className="flex flex-col gap-1.5 rounded-pequeno border-2 border-trilho bg-fundo p-3.5"
                        >
                          <span className="text-pequeno font-semibold text-primaria">{pergunta.licaoTitulo}</span>
                          <p className="font-bold">{pergunta.enunciado}</p>
                          <div className="flex flex-wrap items-center gap-3 text-pequeno text-apoio">
                            <span>
                              Acertos: <strong className="text-tinta">{percentualOuOculto(pergunta.percentualAcertos)}</strong>
                            </span>
                            <span>
                              Respostas: <strong className="text-tinta">{numero(pergunta.respostas, 0)}</strong>
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              )}

              {painel.diagnostico && (
                <Card className="flex flex-col gap-4 p-4">
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-titulo-3">Diagnóstico antes e depois</h3>
                    <p className="text-pequeno text-apoio">{NOTA_COMPARACAO_DIAGNOSTICO}</p>
                  </div>
                  <ul className="flex flex-col gap-3">
                    {painel.diagnostico.map((item) => (
                      <li
                        key={item.slug}
                        className="flex flex-col gap-1.5 rounded-pequeno border-2 border-trilho bg-fundo p-3.5"
                      >
                        <span className="font-bold">{item.titulo}</span>
                        <div className="grid grid-cols-1 gap-2 text-pequeno sm:grid-cols-2">
                          <div>
                            <span className="text-apoio">Estudantes (antes e depois): </span>
                            <strong className="text-tinta">
                              {valorOuOculto(item.estudantes, (n) => `${numero(n, 0)} estudantes`)}
                            </strong>
                          </div>
                          <div>
                            <span className="text-apoio">Acertos no diagnóstico: </span>
                            <strong className="text-tinta">
                              {formatarAntesDepois(item.acertoMedioAntes, item.acertoMedioDepois)}
                            </strong>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {painel.missoes && (
                <Card className="flex flex-col gap-4 p-4">
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-titulo-3">Missões práticas em casa</h3>
                    <p className="text-pequeno text-apoio">
                      Hábitos registrados pelos estudantes da escola ao longo dos dias.
                    </p>
                  </div>
                  <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {painel.missoes.map((missao) => (
                      <li
                        key={missao.slug}
                        className="flex flex-col gap-2 rounded-pequeno border-2 border-trilho bg-fundo p-3.5"
                      >
                        <span className="font-bold">{missao.titulo}</span>
                        <div className="flex flex-col gap-1 text-pequeno">
                          <div>
                            <span className="text-apoio">Começaram: </span>
                            <strong className="text-tinta">
                              {valorOuOculto(missao.estudantesQueComecaram, (n) => `${numero(n, 0)} estudantes`)}
                            </strong>
                          </div>
                          <div>
                            <span className="text-apoio">Concluíram: </span>
                            <strong className="text-tinta">
                              {valorOuOculto(missao.estudantesQueConcluiram, (n) => `${numero(n, 0)} estudantes`)}
                            </strong>
                          </div>
                          <div>
                            <span className="text-apoio">Dias registrados: </span>
                            <strong className="text-tinta">
                              {valorOuOculto(missao.diasRegistrados, (n) => numero(n, 0))}
                            </strong>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </>
          )}

          <p className="text-pequeno text-apoio">
            Atualizado em {diaEHora(painel.atualizadoEm)}. O código do professor permanece apenas na memória desta página.
          </p>
        </div>
      )}
    </main>
  );
}
