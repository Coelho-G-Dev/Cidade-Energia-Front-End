import { juntar } from "@/lib/classes";
import { NumeroAnimado } from "./NumeroAnimado";

type Props = {
  rotulo: string;
  valor: number;
  formatar?: (valor: number) => string;
  complemento?: string;
  tom?: "superficie" | "sucesso";
  duracaoMs?: number;
  className?: string;
};

export function CardNumero({ rotulo, valor, formatar, complemento, tom = "superficie", duracaoMs, className }: Props) {
  return (
    <div
      className={juntar(
        "flex flex-col gap-0.5 rounded-cartao border-2 border-tinta p-3.5 shadow-azulejo",
        tom === "sucesso" ? "bg-sucesso-suave" : "bg-superficie",
        className,
      )}
    >
      <span className="text-pequeno text-apoio">{rotulo}</span>
      <NumeroAnimado
        valor={valor}
        formatar={formatar}
        duracaoMs={duracaoMs}
        className={juntar(
          "font-titulo text-numero font-extrabold tabular-nums",
          tom === "sucesso" ? "text-sucesso" : "text-tinta",
        )}
      />
      {complemento && <span className="text-pequeno text-apoio">{complemento}</span>}
    </div>
  );
}
