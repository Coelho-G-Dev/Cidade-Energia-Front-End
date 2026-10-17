import type { ButtonHTMLAttributes, ReactNode } from "react";
import { juntar } from "@/lib/classes";

export type TomChip = "destaque" | "sucesso" | "primaria" | "neutro";

const TONS: Record<TomChip, string> = {
  destaque: "bg-destaque text-destaque-tinta",
  sucesso: "bg-sucesso-suave text-sucesso",
  primaria: "bg-primaria-suave text-primaria",
  neutro: "bg-trilho text-tinta",
};

const BASE = "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-pequeno font-semibold";

type PropsChip = {
  tom?: TomChip;
  icone?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function Chip({ tom = "primaria", icone, className, children }: PropsChip) {
  return (
    <span className={juntar(BASE, TONS[tom], className)}>
      {icone}
      {children}
    </span>
  );
}

type PropsChipBotao = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-pressed"> & {
  tom?: TomChip;
  ativo: boolean;
  icone?: ReactNode;
  children: ReactNode;
};

export function ChipBotao({ tom = "primaria", ativo, icone, className, type = "button", children, ...resto }: PropsChipBotao) {
  return (
    <button
      type={type}
      aria-pressed={ativo}
      className={juntar(
        "afundar-leve inline-flex min-h-11 items-center",
        "rounded-full border-2 px-3 text-pequeno font-semibold",
        ativo ? juntar(TONS[tom], "border-tinta") : "border-apoio bg-superficie text-tinta",
        className,
      )}
      {...resto}
    >
      <span className="inline-flex items-center gap-1">
        {icone}
        {children}
      </span>
    </button>
  );
}
