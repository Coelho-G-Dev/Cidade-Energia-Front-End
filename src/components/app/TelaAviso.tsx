import type { ReactNode } from "react";
import { Azulejo } from "@/components/ui/PadraoAzulejo";

type Props = { titulo: string; texto: string; children: ReactNode };

// Casca das telas de "página não existe" e "algo deu errado", fora da navegação do app.
export function TelaAviso({ titulo, texto, children }: Props) {
  return (
    <main
      className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center gap-4 px-[max(1.5rem,env(safe-area-inset-left),env(safe-area-inset-right))] pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]"
    >
      <Azulejo tamanho={52} />
      <h1 className="text-titulo-1">{titulo}</h1>
      <p className="text-apoio">{texto}</p>
      <div className="mt-2 flex flex-col gap-3">{children}</div>
    </main>
  );
}
