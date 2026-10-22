"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Carregando, EstadoErro } from "@/components/app/Estados";
import { Botao, BotaoIcone } from "@/components/ui/Botao";
import { MensagemErro } from "@/components/ui/Campo";
import { Icone } from "@/components/ui/Icone";
import { NumeroRolante } from "@/components/ui/NumeroRolante";
import { api, mensagemParaPessoa } from "@/lib/api";
import { numero } from "@/lib/conteudo";
import { invalidar } from "@/lib/cacheDados";
import { guardarResultado } from "@/lib/resultado";
import { useDados } from "@/lib/useDados";
import { DESKTOP, useMidia } from "@/lib/useMidia";
import type { Aparelho } from "@/types";
import { dadosDaPrevia, PainelPrevia, useInformarPrevia } from "./PreviaSimulacao";

export function descreverHoras(horas: number): string {
  if (horas >= 24) return "ligado o dia todo";
  if (horas < 1) return `${Math.round(horas * 60)} min por dia`;
  return `${numero(horas)} h por dia`;
}

// A tela começa com uma casa de exemplo, que a pessoa ajusta: começar do zero deixava a prévia vazia.
// O chuveiro entra porque, até o back publicar as dicas de geladeira, TV, lâmpada e ventilador (item 14 de
// docs/pedidos-ao-backend.md), só ele e o ar-condicionado têm dica de hábito na API: sem um dos dois, "Mudando
// hábitos" daria zero.
export const CASA_DE_EXEMPLO: Readonly<Record<string, number>> = { geladeira: 1, lampada_led: 4, tv: 1, chuveiro: 1 };

export function casaDeExemplo(aparelhos: readonly Aparelho[]): Record<string, number> {
  return Object.fromEntries(aparelhos.filter((a) => CASA_DE_EXEMPLO[a.codigo]).map((a) => [a.id, CASA_DE_EXEMPLO[a.codigo]!]));
}

export function TelaSimuladorAparelhos() {
  const router = useRouter();
  const aparelhos = useDados("aparelhos", () => api.listarAparelhos());
  const desktop = useMidia(DESKTOP);
  // `null` até a pessoa mexer: aí vale a casa de exemplo.
  const [editadas, setEditadas] = useState<Record<string, number> | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const lista = aparelhos.estado === "pronto" ? aparelhos.dados : [];
  const quantidades = editadas ?? casaDeExemplo(lista);
  const qtd = (a: Aparelho) => quantidades[a.id] ?? 0;
  const escolhidos = lista.filter((a) => qtd(a) > 0);
  const itens = escolhidos.map((a) => ({ aparelhoId: a.id, quantidade: qtd(a), horasDia: a.horas_padrao }));
  // O consumo e os valores vêm sempre da prévia do back, para bater com o Resultado.
  const previa = dadosDaPrevia({ modo: "aparelhos", itens });
  useInformarPrevia("aparelhos", previa);

  function mudar(a: Aparelho, delta: number) {
    setEditadas((atual) => {
      const q = atual ?? casaDeExemplo(lista);
      return { ...q, [a.id]: Math.min(50, Math.max(0, (q[a.id] ?? 0) + delta)) };
    });
  }

  async function verResultado() {
    setEnviando(true);
    setErro(null);
    try {
      guardarResultado(
        await api.simular({
          modo: "aparelhos",
          itens,
        }),
      );
      invalidar("ultima-simulacao", "resumo", "ranking-");
      router.push("/resultado");
    } catch (e) {
      setErro(mensagemParaPessoa(e));
      setEnviando(false);
    }
  }

  if (aparelhos.estado === "carregando") return <Carregando rotulo="Carregando os aparelhos" />;
  if (aparelhos.estado === "erro") return <EstadoErro erro={aparelhos.erro} onTentarDeNovo={aparelhos.recarregar} />;

  return (
    <div className="flex flex-col gap-4">
      {editadas === null && <p className="text-pequeno text-apoio">Começamos com uma casa de exemplo. Use + e − para deixar igual à sua.</p>}
      <ul className="flex flex-col rounded-cartao border-2 border-tinta bg-superficie px-4 py-1 shadow-azulejo">
        {lista.map((a) => (
          <li key={a.id} className="flex items-center gap-3 border-b border-trilho py-2.5 last:border-b-0">
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="font-bold">{a.nome}</span>
              <span className="text-pequeno text-apoio">{descreverHoras(a.horas_padrao)}</span>
            </span>
            <span className="flex items-center gap-2">
              <BotaoIcone rotulo={`Diminuir ${a.nome}`} onClick={() => mudar(a, -1)} disabled={qtd(a) === 0}>
                <Icone nome="menos" tamanho={16} />
              </BotaoIcone>
              <span className="min-w-6 text-center font-bold" role="status" aria-label={`${qtd(a)} ${a.nome}`}>
                <NumeroRolante valor={qtd(a)} />
              </span>
              <BotaoIcone rotulo={`Aumentar ${a.nome}`} onClick={() => mudar(a, 1)} disabled={qtd(a) === 50}>
                <Icone nome="mais" tamanho={16} />
              </BotaoIcone>
            </span>
          </li>
        ))}
      </ul>
      {!desktop && <PainelPrevia dados={previa} />}
      <MensagemErro id="erro-aparelhos" erro={erro} />
      <Botao onClick={verResultado} carregando={enviando} disabled={escolhidos.length === 0}>
        {enviando ? "Calculando..." : "Ver meu resultado"}
      </Botao>
      {escolhidos.length === 0 && (
        <p className="text-center text-pequeno font-semibold text-erro" role="status">
          Adicione pelo menos um aparelho.
        </p>
      )}
    </div>
  );
}
