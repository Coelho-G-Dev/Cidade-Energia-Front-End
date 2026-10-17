"use client";

import type { ReactNode } from "react";
import { BotaoLink, Botao } from "@/components/ui/Botao";
import { Icone, type NomeIcone } from "@/components/ui/Icone";
import { ErroApi, mensagemParaPessoa } from "@/lib/api";
import { juntar } from "@/lib/classes";

export function Carregando({ rotulo = "Carregando", linhas = 3, className }: { rotulo?: string; linhas?: number; className?: string }) {
  return (
    <div role="status" aria-label={rotulo} className={juntar("flex flex-col gap-3", className)}>
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} aria-hidden="true" className="h-20 rounded-cartao border-2 border-trilho bg-superficie" />
      ))}
    </div>
  );
}

type PropsErro = { erro: unknown; onTentarDeNovo?: () => void; className?: string };

export function EstadoErro({ erro, onTentarDeNovo, className }: PropsErro) {
  const semLogin = erro instanceof ErroApi && (erro.codigo === "NAO_AUTENTICADO" || erro.codigo === "PERFIL_NAO_ENCONTRADO");
  return (
    <div role="alert" className={juntar("flex flex-col items-start gap-3 rounded-cartao border-2 border-erro bg-erro-suave p-4", className)}>
      <p className="flex items-start gap-2 font-semibold text-erro">
        <Icone nome="alerta" tamanho={20} className="mt-0.5 shrink-0" />
        {semLogin ? "Entre no app para ver esta tela." : mensagemParaPessoa(erro)}
      </p>
      {semLogin ? (
        <BotaoLink href="/entrar" variante="escuro">
          Entrar
        </BotaoLink>
      ) : (
        onTentarDeNovo && (
          <Botao variante="secundario" onClick={onTentarDeNovo}>
            <Icone nome="recarregar" tamanho={18} />
            Tentar de novo
          </Botao>
        )
      )}
    </div>
  );
}

type PropsVazio = { icone?: NomeIcone; titulo: string; texto?: string; acao?: ReactNode; className?: string };

export function EstadoVazio({ icone = "folha", titulo, texto, acao, className }: PropsVazio) {
  return (
    <div className={juntar("flex flex-col items-start gap-3 rounded-cartao border-2 border-dashed border-apoio p-5", className)}>
      <span className="flex size-11 items-center justify-center rounded-full bg-primaria-suave text-primaria">
        <Icone nome={icone} tamanho={22} />
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-titulo text-titulo-3 font-extrabold">{titulo}</p>
        {texto && <p className="text-apoio">{texto}</p>}
      </div>
      {acao}
    </div>
  );
}
