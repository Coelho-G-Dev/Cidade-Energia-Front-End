"use client";

import { TelaAviso } from "@/components/app/TelaAviso";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { Icone } from "@/components/ui/Icone";

export default function Erro({ retry }: { error: unknown; retry: () => void }) {
  return (
    <TelaAviso titulo="Algo deu errado nesta tela" texto="Tente de novo. Se o problema continuar, volte para o início.">
      <Botao onClick={() => retry()}>
        <Icone nome="recarregar" tamanho={18} />
        Tentar de novo
      </Botao>
      <BotaoLink href="/inicio" variante="secundario">
        Ir para o início
      </BotaoLink>
    </TelaAviso>
  );
}
