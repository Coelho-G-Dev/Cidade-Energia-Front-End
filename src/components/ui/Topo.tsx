"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { juntar } from "@/lib/classes";
import { marcarDirecao } from "@/lib/navegacao";
import { Icone } from "./Icone";

type Props = {
  titulo: string;
  voltarPara?: string;
  acao?: ReactNode;
  className?: string;
};

const CLASSES_VOLTAR = "afundar-leve -ml-3 inline-flex size-11 items-center justify-center rounded-botao text-tinta";

export function Topo({ titulo, voltarPara, acao, className }: Props) {
  const router = useRouter();

  return (
    <header className={juntar("flex min-h-11 items-center gap-1", className)}>
      {voltarPara ? (
        <Link href={voltarPara} aria-label="Voltar" data-direcao="voltar" className={CLASSES_VOLTAR}>
          <Icone nome="voltar" />
        </Link>
      ) : (
        <button
          type="button"
          aria-label="Voltar"
          onClick={() => {
            marcarDirecao("voltar");
            router.back();
          }}
          className={CLASSES_VOLTAR}
        >
          <Icone nome="voltar" />
        </button>
      )}
      <span className="flex-1 truncate text-base font-bold">{titulo}</span>
      {acao}
    </header>
  );
}
