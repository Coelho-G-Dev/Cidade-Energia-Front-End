import type { Metadata } from "next";
import { TelaAviso } from "@/components/app/TelaAviso";
import { BotaoLink } from "@/components/ui/Botao";

export const metadata: Metadata = { title: "Página não encontrada" };

export default function NaoEncontrada() {
  return (
    <TelaAviso titulo="Esta página não existe" texto="O endereço pode ter mudado ou ter sido digitado com algum erro.">
      <BotaoLink href="/inicio">Ir para o início</BotaoLink>
    </TelaAviso>
  );
}
