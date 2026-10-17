"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { juntar } from "@/lib/classes";
import { MOLA_CURTA } from "@/lib/movimento";
import { Icone, type NomeIcone } from "./Icone";
import { Azulejo } from "./PadraoAzulejo";

export type ItemNavegacao = { href: string; rotulo: string; icone: NomeIcone };

export const ITENS_NAVEGACAO: readonly ItemNavegacao[] = [
  { href: "/inicio", rotulo: "Início", icone: "inicio" },
  { href: "/simulador", rotulo: "Simulador", icone: "simulador" },
  { href: "/trilhas", rotulo: "Trilhas", icone: "trilhas" },
  { href: "/tutor", rotulo: "Tutor", icone: "tutor" },
  { href: "/mapa", rotulo: "Mapa", icone: "mapa" },
];

// No celular o perfil fica no topo do Início; no trilho lateral sobra lugar para ele embaixo.
export const ITEM_PERFIL: ItemNavegacao = { href: "/perfil", rotulo: "Perfil", icone: "perfil" };

export function itemAtivo(caminho: string, itens: readonly ItemNavegacao[] = ITENS_NAVEGACAO): string | null {
  const encontrado = [...itens, ITEM_PERFIL].find((item) => caminho === item.href || caminho.startsWith(`${item.href}/`));
  if (encontrado) return encontrado.href;
  if (caminho.startsWith("/resultado")) return "/simulador";
  if (caminho.startsWith("/quiz") || caminho.startsWith("/pedale") || caminho.startsWith("/missoes")) return "/trilhas";
  return null;
}

type Props = {
  ativo?: string | null;
  className?: string;
};

function Aba({ item, ativo, className }: { item: ItemNavegacao; ativo: boolean; className?: string }) {
  return (
    <li className={juntar("flex-1 lg:flex-none deitado:flex-none", className)}>
      <Link
        href={item.href}
        aria-current={ativo ? "page" : undefined}
        data-direcao="aba"
        className={juntar(
          "relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-botao px-1 py-1 text-mini font-bold no-underline lg:min-h-16 deitado:min-h-12",
          ativo ? "text-primaria" : "text-apoio",
        )}
      >
        {ativo && <motion.span layoutId="indicador-navegacao" className="absolute inset-0 rounded-botao bg-primaria-suave" transition={MOLA_CURTA} />}
        <span className="relative">
          <Icone nome={item.icone} tamanho={22} />
        </span>
        <span className="relative">{item.rotulo}</span>
      </Link>
    </li>
  );
}

export function Navegacao({ ativo, className }: Props) {
  const caminho = usePathname();
  const atual = ativo === undefined ? itemAtivo(caminho) : ativo;

  return (
    // layoutScroll: a barra é fixa, então a rolagem da página não conta como movimento do indicador.
    <motion.nav
      layoutScroll
      aria-label="Navegação principal"
      className={juntar(
        "fixed inset-x-0 bottom-0 z-40 border-t-2 border-tinta bg-superficie pb-[max(0.5rem,env(safe-area-inset-bottom))]",
        "lg:inset-y-0 lg:right-auto lg:flex lg:w-24 lg:flex-col lg:border-t-0 lg:border-r-2 lg:pt-6 lg:pb-4",
        "deitado:inset-y-0 deitado:right-auto deitado:flex deitado:w-[calc(5rem+env(safe-area-inset-left))] deitado:flex-col deitado:overflow-y-auto deitado:border-t-0 deitado:border-r-2 deitado:pt-2 deitado:pb-2 deitado:pl-[env(safe-area-inset-left)]",
        className,
      )}
    >
      <Azulejo className="mx-auto mb-6 hidden lg:block deitado:hidden" />
      <ul className="mx-auto flex w-full max-w-xl px-2 pt-2 lg:flex-1 lg:flex-col lg:gap-2 lg:pt-0 deitado:flex-1 deitado:flex-col deitado:gap-1 deitado:pt-0">
        {ITENS_NAVEGACAO.map((item) => (
          <Aba key={item.href} item={item} ativo={item.href === atual} />
        ))}
        <Aba item={ITEM_PERFIL} ativo={atual === ITEM_PERFIL.href} className="hidden lg:mt-auto lg:block deitado:mt-auto deitado:block" />
      </ul>
    </motion.nav>
  );
}
