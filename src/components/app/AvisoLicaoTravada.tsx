import { BotaoLink } from "@/components/ui/Botao";
import { Icone } from "@/components/ui/Icone";
import { juntar } from "@/lib/classes";
import type { LicaoPendente } from "@/types";

type Props = { slug: string; pendente: LicaoPendente; texto: string; className?: string };

// As lições de uma trilha são concluídas na ordem: ler é livre, concluir espera a anterior.
export function AvisoLicaoTravada({ slug, pendente, texto, className }: Props) {
  return (
    <div className={juntar("flex flex-col items-start gap-3 rounded-cartao bg-primaria-suave p-4", className)}>
      <p className="flex items-start gap-2 font-semibold text-primaria">
        <Icone nome="cadeado" tamanho={20} className="mt-0.5 shrink-0" />
        {texto}
      </p>
      <BotaoLink href={`/trilhas/${slug}/${pendente.id}`}>Ir para a lição que falta</BotaoLink>
    </div>
  );
}
