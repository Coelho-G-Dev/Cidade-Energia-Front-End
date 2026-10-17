import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { juntar } from "@/lib/classes";

export type TomCard = "superficie" | "sucesso" | "primaria" | "destaque";

const TONS: Record<TomCard, string> = {
  superficie: "bg-superficie",
  sucesso: "bg-sucesso-suave",
  primaria: "bg-primaria-suave",
  destaque: "bg-destaque",
};

const BASE = "rounded-cartao border-2 border-tinta text-tinta";

type PropsCard = HTMLAttributes<HTMLDivElement> & {
  tom?: TomCard;
  sombra?: boolean;
  children: ReactNode;
};

export function Card({ tom = "superficie", sombra = true, className, children, ...resto }: PropsCard) {
  return (
    <div className={juntar(BASE, TONS[tom], sombra && "shadow-azulejo", "p-3.5", className)} {...resto}>
      {children}
    </div>
  );
}

const PRESSIONAVEL = "afundar block shadow-azulejo p-3.5 text-left no-underline";

type PropsCardLink = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    tom?: TomCard;
    children: ReactNode;
  };

export function CardLink({ tom = "superficie", className, children, ...resto }: PropsCardLink) {
  return (
    <Link className={juntar(BASE, TONS[tom], PRESSIONAVEL, className)} {...resto}>
      {children}
    </Link>
  );
}

type PropsCardBotao = ButtonHTMLAttributes<HTMLButtonElement> & {
  tom?: TomCard;
  children: ReactNode;
};

export function CardBotao({ tom = "superficie", className, type = "button", children, ...resto }: PropsCardBotao) {
  return (
    <button type={type} className={juntar(BASE, TONS[tom], PRESSIONAVEL, "w-full font-[inherit]", className)} {...resto}>
      {children}
    </button>
  );
}
