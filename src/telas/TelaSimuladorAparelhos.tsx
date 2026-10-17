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
import { guardarResultado } from "@/lib/resultado";
import { useDados } from "@/lib/useDados";
import type { Aparelho } from "@/types";
import { dadosDaPrevia, useInformarPrevia } from "./PreviaSimulacao";

export function descreverHoras(horas: number): string {
  if (horas >= 24) return "ligado o dia todo";
  if (horas < 1) return `${Math.round(horas * 60)} min por dia`;
  return `${numero(horas)} h por dia`;
}

const consumoMes = (a: Aparelho, quantidade: number) => (a.potencia_w * a.horas_padrao * 30 * quantidade) / 1000;

export function TelaSimuladorAparelhos() {
  const router = useRouter();
  const aparelhos = useDados("aparelhos", () => api.listarAparelhos());
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const lista = aparelhos.estado === "pronto" ? aparelhos.dados : [];
  const qtd = (a: Aparelho) => quantidades[a.id] ?? 0;
  const estimativa = lista.reduce((soma, a) => soma + consumoMes(a, qtd(a)), 0);
  const escolhidos = lista.filter((a) => qtd(a) > 0);
  const itens = escolhidos.map((a) => ({ aparelhoId: a.id, quantidade: qtd(a), horasDia: a.horas_padrao }));
  useInformarPrevia("aparelhos", dadosDaPrevia({ modo: "aparelhos", itens }));

  function mudar(a: Aparelho, delta: number) {
    setQuantidades((q) => ({ ...q, [a.id]: Math.min(50, Math.max(0, (q[a.id] ?? 0) + delta)) }));
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
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-pequeno text-apoio">Estimativa</span>
        <span className="font-titulo text-titulo-3 font-extrabold tabular-nums">≈ {numero(estimativa, 0)} kWh por mês</span>
      </div>
      <MensagemErro id="erro-aparelhos" erro={erro} />
      <Botao onClick={verResultado} carregando={enviando} disabled={escolhidos.length === 0}>
        {enviando ? "Calculando..." : "Ver meu resultado"}
      </Botao>
      {escolhidos.length === 0 && <p className="text-center text-pequeno text-apoio">Toque em + para incluir os aparelhos da sua casa.</p>}
    </div>
  );
}
