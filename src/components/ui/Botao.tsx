import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { juntar } from "@/lib/classes";

export type VarianteBotao = "primario" | "secundario" | "escuro";

const BASE =
  "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-botao border-2 px-6 text-base font-bold no-underline select-none " +
  "disabled:cursor-not-allowed disabled:border-apoio disabled:bg-trilho disabled:text-apoio disabled:shadow-none " +
  "aria-disabled:cursor-not-allowed aria-disabled:border-apoio aria-disabled:bg-trilho aria-disabled:text-apoio aria-disabled:shadow-none";

const VARIANTES: Record<VarianteBotao, string> = {
  primario: "afundar border-tinta bg-destaque text-destaque-tinta shadow-azulejo",
  secundario: "afundar-leve border-primaria bg-superficie text-tinta",
  escuro: "afundar-leve border-tinta bg-tinta text-superficie",
};

export function classesBotao(variante: VarianteBotao = "primario", largo = false, className?: string): string {
  return juntar(BASE, VARIANTES[variante], largo && "w-full", className);
}

type PropsBotao = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: VarianteBotao;
  largo?: boolean;
  carregando?: boolean;
  children: ReactNode;
};

export function Botao({ variante, largo, carregando = false, disabled, className, type = "button", children, ...resto }: PropsBotao) {
  return (
    <button
      type={type}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      className={classesBotao(variante, largo, className)}
      {...resto}
    >
      {children}
    </button>
  );
}

type PropsBotaoLink = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    variante?: VarianteBotao;
    largo?: boolean;
    children: ReactNode;
  };

export function BotaoLink({ variante, largo, className, children, ...resto }: PropsBotaoLink) {
  return (
    <Link className={classesBotao(variante, largo, className)} {...resto}>
      {children}
    </Link>
  );
}

type PropsBotaoIcone = ButtonHTMLAttributes<HTMLButtonElement> & {
  rotulo: string;
  children: ReactNode;
};

export function BotaoIcone({ rotulo, className, type = "button", children, ...resto }: PropsBotaoIcone) {
  return (
    <button
      type={type}
      aria-label={rotulo}
      className={juntar(
        "afundar-leve inline-flex size-11 shrink-0 items-center justify-center rounded-pequeno border-2 border-tinta bg-superficie text-tinta",
        "disabled:cursor-not-allowed disabled:border-trilho disabled:text-apoio",
        className,
      )}
      {...resto}
    >
      {children}
    </button>
  );
}
