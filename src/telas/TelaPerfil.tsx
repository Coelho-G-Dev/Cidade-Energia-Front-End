"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AzulejoConquista } from "@/components/app/Celebracao";
import { Carregando, EstadoErro } from "@/components/app/Estados";
import { BotaoLink } from "@/components/ui/Botao";
import { Card } from "@/components/ui/Card";
import { Icone } from "@/components/ui/Icone";
import { NumeroAnimado } from "@/components/ui/NumeroAnimado";
import { Topo } from "@/components/ui/Topo";
import { api } from "@/lib/api";
import { useDados } from "@/lib/useDados";
import type { ConquistaDoResumo, Perfil, ResumoPerfil } from "@/types";

// Conquistas que já viraram nesta visita (só na memória da página).
const jaViradas = new Set<string>();

export function fraseDoRanking(perfil: Perfil, resumo: ResumoPerfil, nomeEscola?: string, nomeBairro?: string): string | null {
  if (perfil.escola_verificada && nomeEscola && resumo.escola?.posicao) {
    return `Seus pontos ajudam a ${nomeEscola} a ficar em ${resumo.escola.posicao}º lugar no ranking das escolas.`;
  }
  if (nomeBairro && resumo.bairro?.posicao) {
    return `Seus pontos ajudam o bairro ${nomeBairro} a ficar em ${resumo.bairro.posicao}º lugar no ranking dos bairros.`;
  }
  return null;
}

function Conquista({ conquista }: { conquista: ConquistaDoResumo }) {
  const [virar] = useState(() => conquista.obtida && !jaViradas.has(conquista.slug));
  useEffect(() => {
    if (conquista.obtida) jaViradas.add(conquista.slug);
  }, [conquista]);

  return (
    <li
      className={
        conquista.obtida
          ? "flex flex-col items-center gap-1.5 rounded-cartao border-2 border-tinta bg-superficie px-2 py-3 text-center text-mini font-bold text-tinta"
          : "flex flex-col items-center gap-1.5 rounded-cartao border-2 border-dashed border-apoio px-2 py-3 text-center text-mini font-bold text-apoio"
      }
    >
      {conquista.obtida ? (
        <AzulejoConquista virar={virar} tamanho={40} />
      ) : (
        <span className="flex size-10 items-center justify-center rounded-full bg-trilho text-apoio">
          <Icone nome="cadeado" tamanho={18} />
        </span>
      )}
      {conquista.nome}
      <span className="sr-only">{conquista.obtida ? "(obtida)" : `(bloqueada: ${conquista.criterio})`}</span>
    </li>
  );
}

export function TelaPerfil() {
  const perfil = useDados("perfil", () => api.obterPerfil());
  const resumo = useDados("resumo", () => api.obterResumo());
  const bairros = useDados("bairros", () => api.listarBairros());
  const escolas = useDados("escolas", () => api.listarEscolas());

  const erro = perfil.estado === "erro" ? perfil : resumo.estado === "erro" ? resumo : null;
  const nomeBairro = bairros.estado === "pronto" && perfil.estado === "pronto" ? bairros.dados.find((b) => b.id === perfil.dados.bairro_id)?.nome : undefined;
  const nomeEscola = escolas.estado === "pronto" && perfil.estado === "pronto" ? escolas.dados.find((e) => e.id === perfil.dados.escola_id)?.nome : undefined;
  const pronto = perfil.estado === "pronto" && resumo.estado === "pronto";

  return (
    <div className="pagina-media flex flex-col gap-4">
      <Topo
        titulo="Meu perfil"
        voltarPara="/inicio"
        acao={
          perfil.estado === "pronto" && perfil.dados.tem_perfil ? (
            <Link href="/entrar" className="flex min-h-11 items-center px-2 font-bold text-primaria">
              Editar perfil
            </Link>
          ) : undefined
        }
      />
      {erro && <EstadoErro erro={erro.erro} onTentarDeNovo={erro.recarregar} />}
      {!erro && !pronto && <Carregando rotulo="Carregando o perfil" />}
      {pronto && (
        <>
          <div className="flex items-center gap-3.5">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primaria text-primaria-tinta">
              <Icone nome="perfil" tamanho={30} />
            </span>
            <div className="flex flex-col gap-0.5">
              <h1 className="text-titulo-2">{perfil.dados.primeiro_nome ?? "Visitante"}</h1>
              <span className="text-pequeno text-apoio">{[nomeBairro && `Bairro ${nomeBairro}`, nomeEscola].filter(Boolean).join(", ") || "Sem bairro informado"}</span>
            </div>
          </div>

          {!perfil.dados.tem_perfil && (
            <Card tom="primaria" sombra={false} className="flex flex-col items-start gap-2">
              <span className="font-bold">Crie seu perfil para aparecer nos rankings</span>
              <span className="text-pequeno text-apoio">Só pedimos o primeiro nome e o bairro.</span>
              <BotaoLink href="/entrar" variante="escuro">
                Criar meu perfil
              </BotaoLink>
            </Card>
          )}

          <Card className="flex px-2">
            {[
              { valor: resumo.dados.pontos, rotulo: "pontos" },
              { valor: resumo.dados.trilhasConcluidas, rotulo: "trilhas" },
              { valor: resumo.dados.missoesConcluidas, rotulo: "missões" },
            ].map((item) => (
              <div key={item.rotulo} className="flex flex-1 flex-col items-center gap-0.5">
                <NumeroAnimado valor={item.valor} className="font-titulo text-titulo-2 font-extrabold tabular-nums" />
                <span className="text-pequeno text-apoio">{item.rotulo}</span>
              </div>
            ))}
          </Card>

          <h2 className="text-titulo-3">Conquistas</h2>
          <ul className="grid grid-cols-3 gap-2.5">
            {resumo.dados.conquistas.map((c) => (
              <Conquista key={c.slug} conquista={c} />
            ))}
          </ul>

          {(() => {
            const frase = fraseDoRanking(perfil.dados, resumo.dados, nomeEscola, nomeBairro);
            return frase ? (
              <p className="rounded-cartao bg-primaria-suave px-4 py-3 text-sm font-semibold text-primaria">{frase}</p>
            ) : null;
          })()}
          {perfil.dados.tem_perfil && perfil.dados.escola_id && !perfil.dados.escola_verificada && (
            <Card tom="destaque" sombra={false} className="flex flex-col items-start gap-1">
              <span className="font-bold">Seus pontos ainda não contam para a sua escola</span>
              <span className="text-sm">Você escolheu a escola da lista. Com o código da turma, seus pontos passam a somar para ela.</span>
              <Link href="/entrar" className="flex min-h-11 items-center font-bold text-tinta underline underline-offset-2">
                Adicionar o código da turma
              </Link>
            </Card>
          )}

          <BotaoLink href="/simulador" variante="secundario">
            Refazer minha simulação
          </BotaoLink>
        </>
      )}
    </div>
  );
}
