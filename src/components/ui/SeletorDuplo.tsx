"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useId } from "react";
import { juntar } from "@/lib/classes";
import { MOLA_CURTA } from "@/lib/movimento";

export type OpcaoDupla<T extends string> = { valor: T; rotulo: string; href?: string };

type Props<T extends string> = {
  rotulo: string;
  opcoes: readonly [OpcaoDupla<T>, OpcaoDupla<T>];
  valor: T;
  onTrocar?: (valor: T) => void;
  grupo?: string;
  className?: string;
};

const ITEM =
  "relative flex min-h-11 flex-1 items-center justify-center rounded-botao px-3 text-sm font-bold no-underline select-none";

// Um fundo só, sempre montado: anda de uma opção para a outra e não reage quando a página muda de layout.
function Fundo({ segunda }: { segunda: boolean }) {
  return (
    <motion.span
      aria-hidden="true"
      initial={false}
      animate={{ x: segunda ? "100%" : "0%" }}
      transition={MOLA_CURTA}
      className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-botao bg-primaria"
    />
  );
}

export function SeletorDuplo<T extends string>({ rotulo, opcoes, valor, onTrocar, grupo: grupoFixo, className }: Props<T>) {
  const idGerado = useId().replace(/[^a-zA-Z0-9]/g, "");
  const grupo = grupoFixo ?? idGerado;
  const comLinks = opcoes.every((opcao) => opcao.href);
  const caixa = juntar("relative flex rounded-botao bg-primaria-suave p-1", className);
  const fundo = <Fundo segunda={valor === opcoes[1].valor} />;

  if (comLinks) {
    return (
      <nav aria-label={rotulo} className={caixa}>
        {fundo}
        {opcoes.map((opcao) => {
          const ativo = opcao.valor === valor;
          return (
            <Link
              key={opcao.valor}
              href={opcao.href!}
              replace
              scroll={false}
              aria-current={ativo ? "page" : undefined}
              className={juntar(ITEM, ativo ? "text-primaria-tinta foco-claro" : "text-tinta")}
            >
              {opcao.rotulo}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div role="radiogroup" aria-label={rotulo} className={caixa}>
      {fundo}
      {opcoes.map((opcao) => {
        const ativo = opcao.valor === valor;
        return (
          <label
            key={opcao.valor}
            className={juntar(
              ITEM,
              "cursor-pointer has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-tinta",
              ativo ? "text-primaria-tinta" : "text-tinta",
            )}
          >
            <input
              type="radio"
              name={grupo}
              value={opcao.valor}
              checked={ativo}
              onChange={() => onTrocar?.(opcao.valor)}
              className="sr-only"
            />
            {opcao.rotulo}
          </label>
        );
      })}
    </div>
  );
}
