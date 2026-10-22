"use client";

import { useState, type MouseEvent } from "react";
import { useCelebrar } from "@/components/app/Celebracao";
import { Carregando, EstadoErro, EstadoVazio } from "@/components/app/Estados";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { MensagemErro } from "@/components/ui/Campo";
import { CheckDesenhado } from "@/components/ui/CheckDesenhado";
import { Chip } from "@/components/ui/Chip";
import { Icone } from "@/components/ui/Icone";
import { Topo } from "@/components/ui/Topo";
import { api, ErroApi, mensagemParaPessoa } from "@/lib/api";
import { juntar } from "@/lib/classes";
import { dataCurta, limparMarcadores } from "@/lib/conteudo";
import { unidadeDaMissao } from "@/lib/missoesDasTrilhas";
import { invalidar } from "@/lib/cacheDados";
import { useDados } from "@/lib/useDados";
import type { Missao } from "@/types";

const unidade = unidadeDaMissao;
const maiuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

export function rotuloDoBotao(m: Missao): string {
  if (m.diasNecessarios === 1) return "Marcar como feita";
  return `Marcar ${unidade(m).singular} ${m.diasRegistrados + 1} como feita`;
}

export function TelaMissao({ missaoId }: { missaoId: string }) {
  const celebrar = useCelebrar();
  const missoes = useDados("missoes", () => api.listarMissoes());
  const [atualizada, setAtualizada] = useState<Missao | null>(null);
  const [recemMarcado, setRecemMarcado] = useState<number | null>(null);
  const [registrando, setRegistrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const daLista = missoes.estado === "pronto" ? missoes.dados.find((m) => m.id === missaoId) : undefined;
  const missao = atualizada ?? daLista;

  async function registrar(evento: MouseEvent<HTMLButtonElement>) {
    if (!missao) return;
    const botao = evento.currentTarget;
    setRegistrando(true);
    setErro(null);
    try {
      const registro = await api.registrarMissao(missao.id);
      invalidar("missoes", "resumo");
      setAtualizada({
        ...missao,
        diasRegistrados: registro.diasRegistrados,
        diasMarcados: registro.diasMarcados,
        concluida: registro.concluida,
        registradaHoje: true,
      });
      if (registro.novoRegistro) setRecemMarcado(registro.diasMarcados.indexOf(registro.dia));
      celebrar(registro, botao);
    } catch (e) {
      setErro(e instanceof ErroApi && e.codigo === "NAO_AUTENTICADO" ? "Entre no app para registrar a missão." : mensagemParaPessoa(e));
    } finally {
      setRegistrando(false);
    }
  }

  return (
    <div className="pagina-estreita flex flex-col gap-4">
      <Topo titulo="Missão prática" voltarPara="/trilhas" />
      {missoes.estado === "carregando" && <Carregando rotulo="Carregando a missão" linhas={2} />}
      {missoes.estado === "erro" && <EstadoErro erro={missoes.erro} onTentarDeNovo={missoes.recarregar} />}
      {missoes.estado === "pronto" && !missao && (
        <EstadoVazio titulo="Não encontramos esta missão" texto="Ela pode ter saído do ar." acao={<BotaoLink href="/trilhas">Ver as trilhas</BotaoLink>} />
      )}
      {missao && (
        <>
          <div className="flex flex-wrap gap-2">
            <Chip tom="destaque">+{missao.pontos} pontos</Chip>
            <Chip tom={missao.concluida ? "sucesso" : "primaria"}>
              {missao.diasRegistrados} de {missao.diasNecessarios} {missao.diasNecessarios === 1 ? unidade(missao).singular : unidade(missao).plural}
            </Chip>
          </div>
          <h1 className="text-titulo-1">{missao.titulo}</h1>
          <p className="text-apoio">{limparMarcadores(missao.descricao)}</p>

          <ol
            className="flex flex-col rounded-cartao border-2 border-tinta bg-superficie px-4 py-2 shadow-azulejo"
            aria-label={`${missao.diasRegistrados} de ${missao.diasNecessarios} registrados`}
          >
            {Array.from({ length: missao.diasNecessarios }, (_, i) => {
              const dia = missao.diasMarcados[i];
              const feito = dia !== undefined;
              const nome = missao.diasNecessarios === 1 ? "Missão" : `${maiuscula(unidade(missao).singular)} ${i + 1}`;
              return (
                <li key={i} className="flex min-h-12 items-center gap-3">
                  <span
                    className={juntar(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200",
                      feito ? "border-sucesso bg-sucesso text-superficie" : "border-apoio",
                    )}
                  >
                    {feito && (i === recemMarcado ? <CheckDesenhado tamanho={16} atrasoMs={80} /> : <Icone nome="check" tamanho={16} espessura={3} />)}
                  </span>
                  <span className={juntar("font-semibold", !feito && "text-apoio")}>{feito ? `${nome} feita em ${dataCurta(dia)}` : nome}</span>
                </li>
              );
            })}
          </ol>

          <MensagemErro id="erro-missao" erro={erro} />
          {missao.concluida ? (
            <p className="font-bold text-sucesso" role="status">
              Missão completa. Você ganhou {missao.pontos} pontos.
            </p>
          ) : missao.registradaHoje ? (
            <p className="text-apoio" role="status">
              Hoje já está marcado. Volte amanhã para marcar {missao.diasNecessarios === 1 ? "de novo" : `a ${unidade(missao).singular} ${missao.diasRegistrados + 1}`}.
            </p>
          ) : null}
          {!missao.concluida && (
            <Botao onClick={registrar} carregando={registrando} disabled={missao.registradaHoje}>
              {registrando ? "Marcando..." : missao.registradaHoje ? "Hoje já está marcado" : rotuloDoBotao(missao)}
            </Botao>
          )}
          {missao.concluida && <BotaoLink href="/perfil">Ver meus pontos</BotaoLink>}
        </>
      )}
    </div>
  );
}
