"use client";

import { useState, type FormEvent } from "react";
import { Carregando } from "@/components/app/Estados";
import { Botao } from "@/components/ui/Botao";
import { CampoTexto } from "@/components/ui/CampoTexto";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Icone } from "@/components/ui/Icone";
import { Topo } from "@/components/ui/Topo";
import { api, ErroApi, mensagemParaPessoa, modoSimulado } from "@/lib/api";
import { CHAVE_IMPACTO_SIMULADA } from "@/lib/api/simulado";
import { brl, dataCurta, diaEHora, numero } from "@/lib/conteudo";
import type { FiltroPeriodoImpacto, PainelImpacto } from "@/types";
import { percentualOuOculto, TEXTO_MENOS_DE_3, TEXTO_MENOS_DE_5_RESPOSTAS, valorOuOculto } from "./TelaProfessor";

export function formatarPeriodoImpacto(de: string, ate: string): string {
  const [anoDe, mesDe, diaDe] = de.slice(0, 10).split("-");
  const [anoAte, mesAte, diaAte] = ate.slice(0, 10).split("-");
  if (!anoDe || !mesDe || !diaDe || !anoAte || !mesAte || !diaAte) {
    return `${dataCurta(de)} a ${dataCurta(ate)}`;
  }
  if (anoDe !== anoAte) {
    return `${diaDe}/${mesDe}/${anoDe} a ${diaAte}/${mesAte}/${anoAte}`;
  }
  return `${diaDe}/${mesDe} a ${diaAte}/${mesAte}`;
}

function mensagemErroImpacto(erro: unknown): string {
  if (erro instanceof ErroApi) {
    if (erro.codigo === "NAO_AUTENTICADO" || erro.status === 401) {
      return "Chave de acesso inválida. Confira a chave de impacto e tente de novo.";
    }
    if (erro.codigo === "IMPACTO_DESLIGADO" || erro.status === 503) {
      return erro.message || "O painel de impacto está desligado neste ambiente.";
    }
    if (erro.codigo === "ENTRADA_INVALIDA" || erro.status === 400) {
      return erro.message || "Período inválido. Confira as datas informadas.";
    }
    if (erro.codigo === "LIMITE_DE_REQUISICOES" || erro.status === 429) {
      return erro.message || "Muitas tentativas seguidas. Espere um pouco e tente de novo.";
    }
  }
  return mensagemParaPessoa(erro);
}

function ItemIndicador({
  rotulo,
  valor,
  complemento,
}: {
  rotulo: string;
  valor: string;
  complemento?: string;
}) {
  const oculto = valor === TEXTO_MENOS_DE_3 || valor === TEXTO_MENOS_DE_5_RESPOSTAS;
  return (
    <div className="flex flex-col gap-0.5 rounded-pequeno border-2 border-tinta bg-superficie p-3">
      <span className="text-pequeno text-apoio">{rotulo}</span>
      <strong className={oculto ? "text-sm font-bold text-apoio" : "font-titulo text-titulo-2 font-extrabold tabular-nums"}>
        {valor}
      </strong>
      {complemento && <span className="text-pequeno text-apoio">{complemento}</span>}
    </div>
  );
}

export function baixarArquivoCsv(conteudoCsv: string, nomeArquivo: string) {
  const comBom = conteudoCsv.startsWith("\uFEFF") ? conteudoCsv : `\uFEFF${conteudoCsv}`;
  const blob = new Blob([comBom], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function TelaImpacto() {
  // D-003: a chave fica somente na memória da página (nunca em localStorage, sessionStorage ou URL).
  const [chave, setChave] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [ultimaChave, setUltimaChave] = useState("");
  const [ultimoPeriodo, setUltimoPeriodo] = useState<FiltroPeriodoImpacto | undefined>(undefined);
  const [erroCampo, setErroCampo] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [baixandoCsv, setBaixandoCsv] = useState(false);
  const [erroApi, setErroApi] = useState<unknown>(null);
  const [impacto, setImpacto] = useState<PainelImpacto | null>(null);

  function montarPeriodo(): FiltroPeriodoImpacto | undefined {
    const limpoDe = de.trim();
    const limpoAte = ate.trim();
    if (!limpoDe && !limpoAte) return undefined;
    return {
      ...(limpoDe ? { de: limpoDe } : {}),
      ...(limpoAte ? { ate: limpoAte } : {}),
    };
  }

  async function buscarImpacto(chaveAlvo: string, periodoAlvo?: FiltroPeriodoImpacto) {
    setCarregando(true);
    setErroApi(null);
    setUltimaChave(chaveAlvo);
    setUltimoPeriodo(periodoAlvo);
    try {
      const resposta = await api.obterImpacto(chaveAlvo, periodoAlvo);
      setImpacto(resposta);
    } catch (e) {
      setImpacto(null);
      setErroApi(e);
    } finally {
      setCarregando(false);
    }
  }

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault();
    setTentativa((t) => t + 1);
    const limpa = chave.trim();
    if (!limpa) {
      setErroCampo("Digite a chave de acesso ao painel de impacto.");
      return;
    }
    setErroCampo(null);
    await buscarImpacto(limpa, montarPeriodo());
  }

  async function aoBaixarCsv() {
    if (!ultimaChave) return;
    setBaixandoCsv(true);
    setErroApi(null);
    try {
      const csv = await api.exportarImpactoCsv(ultimaChave, ultimoPeriodo);
      const dataArquivo = impacto?.periodo.ate ?? new Date().toISOString().slice(0, 10);
      baixarArquivoCsv(csv, `cidade-energia-impacto-${dataArquivo}.csv`);
    } catch (e) {
      setErroApi(e);
    } finally {
      setBaixandoCsv(false);
    }
  }

  function aoSalvarPdf() {
    window.print();
  }

  return (
    <main className="painel-impacto-impressao mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-5 px-[max(1.25rem,env(safe-area-inset-left),env(safe-area-inset-right))] pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] lg:py-10">
      <div className="ocultar-impressao">
        <Topo titulo="Painel de impacto" voltarPara="/" />
      </div>

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tom="destaque">Piloto Cidade Energia · São Luís (MA)</Chip>
          <Chip tom="neutro">Estimativa · Só dados agregados</Chip>
        </div>
        <h1 className="text-titulo-1">Painel de impacto do piloto</h1>
        <p className="text-apoio">
          Indicadores agregados de estudantes, escolas, bairros, trilhas, missões e estimativa de potencial de economia com hábitos.
        </p>
      </header>

      <Card className="ocultar-impressao flex flex-col gap-4 p-4">
        <form noValidate onSubmit={aoSubmeter} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <CampoTexto
              rotulo="Chave de impacto"
              type="password"
              placeholder="Digite a chave de acesso"
              autoComplete="off"
              spellCheck={false}
              value={chave}
              onChange={(e) => setChave(e.target.value)}
              dica={
                modoSimulado
                  ? `A chave fica só na memória desta página. No modo simulado, use ${CHAVE_IMPACTO_SIMULADA}.`
                  : "A chave fica guardada apenas na memória enquanto esta página estiver aberta."
              }
              erro={erroCampo}
              tentativa={tentativa}
            />
            <CampoTexto
              rotulo="Data inicial (opcional)"
              type="date"
              value={de}
              onChange={(e) => setDe(e.target.value)}
              dica="Formato AAAA-MM-DD"
            />
            <CampoTexto
              rotulo="Data final (opcional)"
              type="date"
              value={ate}
              onChange={(e) => setAte(e.target.value)}
              dica="Intervalo máximo de 366 dias"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Botao type="submit" carregando={carregando}>
              {carregando ? "Consultando..." : "Consultar impacto"}
            </Botao>
            {impacto && (
              <>
                <Botao variante="secundario" onClick={aoBaixarCsv} carregando={baixandoCsv}>
                  {baixandoCsv ? "Gerando CSV..." : "Baixar CSV"}
                </Botao>
                <Botao variante="escuro" onClick={aoSalvarPdf}>
                  Salvar em PDF
                </Botao>
              </>
            )}
          </div>
        </form>
      </Card>

      {carregando && <Carregando rotulo="Carregando o painel de impacto" linhas={3} />}

      {!carregando && erroApi !== null && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-cartao border-2 border-erro bg-erro-suave p-4">
          <p className="flex items-start gap-2 font-semibold text-erro">
            <Icone nome="alerta" tamanho={20} className="mt-0.5 shrink-0" />
            {mensagemErroImpacto(erroApi)}
          </p>
          {ultimaChave && (
            <Botao
              variante="secundario"
              className="ocultar-impressao"
              onClick={() => buscarImpacto(ultimaChave, ultimoPeriodo)}
            >
              <Icone nome="recarregar" tamanho={18} />
              Tentar de novo
            </Botao>
          )}
        </div>
      )}

      {!carregando && impacto && (
        <div className="flex flex-col gap-4">
          <Card tom="primaria" sombra={false} className="flex flex-wrap items-center justify-between gap-2 p-3.5">
            <div className="flex flex-col">
              <span className="text-pequeno font-semibold text-primaria">Período consultado (fuso de São Luís)</span>
              <strong className="text-base">{formatarPeriodoImpacto(impacto.periodo.de, impacto.periodo.ate)}</strong>
            </div>
            <span className="text-pequeno text-apoio">
              Atualizado em {diaEHora(impacto.atualizadoEm)} · Perfis de teste excluídos
            </span>
          </Card>

          <Card tom="sucesso" className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-titulo-2">Potencial de economia com hábitos (estimativa)</h2>
              <Chip tom="sucesso">Estimativa</Chip>
            </div>
            <p className="text-sm font-semibold">
              É o que as famílias <strong>poderiam</strong> economizar por mês seguindo as dicas do simulador;{" "}
              <strong>não é economia medida</strong> na conta de luz.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-0.5 rounded-pequeno border-2 border-tinta bg-superficie p-3">
                <span className="text-pequeno text-apoio">Economia mensal em reais (estimativa)</span>
                <strong className="font-titulo text-titulo-2 font-extrabold tabular-nums text-sucesso">
                  {valorOuOculto(impacto.economiaEstimada.potencialHabitos.reaisMes, (n) => `${brl(n)} / mês`)}
                </strong>
                <span className="text-pequeno text-apoio">
                  Estimativa — como calculamos: {impacto.economiaEstimada.comoCalculamos.potencialHabitos}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 rounded-pequeno border-2 border-tinta bg-superficie p-3">
                <span className="text-pequeno text-apoio">Energia economizada por mês (estimativa)</span>
                <strong className="font-titulo text-titulo-2 font-extrabold tabular-nums text-sucesso">
                  {valorOuOculto(impacto.economiaEstimada.potencialHabitos.kwhMes, (n) => `${numero(n, 1)} kWh / mês`)}
                </strong>
                <span className="text-pequeno text-apoio">
                  Estimativa — como calculamos: {impacto.economiaEstimada.comoCalculamos.potencialHabitos}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 rounded-pequeno border-2 border-tinta bg-superficie p-3">
                <span className="text-pequeno text-apoio">Estudantes na estimativa de hábitos</span>
                <strong className="font-titulo text-titulo-2 font-extrabold tabular-nums">
                  {valorOuOculto(impacto.economiaEstimada.potencialHabitos.estudantes, (n) => numero(n, 0))}
                </strong>
                <span className="text-pequeno text-apoio">Última simulação salva de cada estudante</span>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="flex flex-col gap-3 p-4">
              <h2 className="text-titulo-3">Alcance: estudantes, escolas e bairros</h2>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                <ItemIndicador
                  rotulo="Estudantes com perfil"
                  valor={valorOuOculto(impacto.estudantes.comPerfil, (n) => numero(n, 0))}
                />
                <ItemIndicador
                  rotulo="Ativos no período"
                  valor={valorOuOculto(impacto.estudantes.ativosNoPeriodo, (n) => numero(n, 0))}
                />
                <ItemIndicador
                  rotulo="Verificados por turma"
                  valor={valorOuOculto(impacto.estudantes.verificadosPorTurma, (n) => numero(n, 0))}
                />
                <ItemIndicador
                  rotulo="Escolas com estudantes"
                  valor={valorOuOculto(impacto.escolas.comEstudantes, (n) => numero(n, 0))}
                />
                <ItemIndicador
                  rotulo="Escolas com turma"
                  valor={valorOuOculto(impacto.escolas.comTurma, (n) => numero(n, 0))}
                />
                <ItemIndicador
                  rotulo="Bairros com estudantes"
                  valor={valorOuOculto(impacto.bairros.comEstudantes, (n) => numero(n, 0))}
                />
              </div>
            </Card>

            <Card className="flex flex-col gap-3 p-4">
              <h2 className="text-titulo-3">Aprendizado, missões e simulações</h2>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                <ItemIndicador
                  rotulo="Lições concluídas"
                  valor={valorOuOculto(impacto.aprendizado.licoesConcluidas, (n) => numero(n, 0))}
                />
                <ItemIndicador
                  rotulo="Trilhas concluídas"
                  valor={valorOuOculto(impacto.aprendizado.trilhasConcluidas, (n) => numero(n, 0))}
                />
                <ItemIndicador
                  rotulo="Acertos no quiz"
                  valor={percentualOuOculto(impacto.aprendizado.percentualAcertos)}
                  complemento={
                    impacto.aprendizado.respostasDoQuiz !== null
                      ? `${numero(impacto.aprendizado.respostasDoQuiz, 0)} respostas`
                      : TEXTO_MENOS_DE_3
                  }
                />
                <ItemIndicador
                  rotulo="Noites registradas"
                  valor={valorOuOculto(impacto.missoes.registros, (n) => numero(n, 0))}
                  complemento="autodeclaradas nas missões"
                />
                <ItemIndicador
                  rotulo="Missões concluídas"
                  valor={valorOuOculto(impacto.missoes.concluidas, (n) => numero(n, 0))}
                />
                <ItemIndicador
                  rotulo="Simulações salvas"
                  valor={valorOuOculto(impacto.simulacoes.salvas, (n) => numero(n, 0))}
                  complemento={
                    impacto.simulacoes.estudantesQueSimularam !== null
                      ? `${numero(impacto.simulacoes.estudantesQueSimularam, 0)} estudantes`
                      : TEXTO_MENOS_DE_3
                  }
                />
              </div>
            </Card>
          </div>

          <p className="text-pequeno text-apoio">
            Grupos com menos de 3 estudantes ficam ocultos e percentuais exigem pelo menos 5 respostas. Nenhum dado individual aparece.
          </p>
        </div>
      )}
    </main>
  );
}
