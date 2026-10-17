"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Botao } from "@/components/ui/Botao";
import { MensagemErro } from "@/components/ui/Campo";
import { CampoTexto } from "@/components/ui/CampoTexto";
import { Card } from "@/components/ui/Card";
import { Icone } from "@/components/ui/Icone";
import { api, campoDoErro, mensagemParaPessoa } from "@/lib/api";
import { guardarResultado } from "@/lib/resultado";
import { dadosDaPrevia, useInformarPrevia } from "./PreviaSimulacao";

export function paraNumero(texto: string): number | null {
  const limpo = texto.replace(/[^\d,.]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  if (!limpo) return null;
  const valor = Number(limpo);
  return Number.isFinite(valor) ? valor : null;
}

export function TelaSimuladorConta() {
  const router = useRouter();
  const [consumo, setConsumo] = useState("");
  const [valor, setValor] = useState("");
  const [erros, setErros] = useState<{ consumo?: string; valor?: string; geral?: string }>({});
  const [tentativa, setTentativa] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const valorDigitado = valor.trim() ? paraNumero(valor) : null;
  useInformarPrevia("conta", dadosDaPrevia({ modo: "conta", consumoKwh: paraNumero(consumo), ...(valorDigitado ? { valorConta: valorDigitado } : {}) }));

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setTentativa((t) => t + 1);
    const consumoKwh = paraNumero(consumo);
    const valorConta = valor.trim() ? paraNumero(valor) : undefined;
    const novos: typeof erros = {};
    if (!consumoKwh || consumoKwh <= 0) novos.consumo = "Informe o consumo em kWh, como aparece na conta.";
    if (valorConta === null || (valorConta !== undefined && valorConta <= 0)) novos.valor = "Informe o valor em reais ou deixe em branco.";
    setErros(novos);
    if (Object.keys(novos).length) return;

    setEnviando(true);
    try {
      guardarResultado(await api.simular({ modo: "conta", consumoKwh: consumoKwh!, ...(valorConta ? { valorConta } : {}) }));
      router.push("/resultado");
    } catch (e) {
      const campo = campoDoErro(e);
      setErros(campo === "valorConta" ? { valor: mensagemParaPessoa(e) } : campo === "consumoKwh" ? { consumo: mensagemParaPessoa(e) } : { geral: mensagemParaPessoa(e) });
      setEnviando(false);
    }
  }

  return (
    <form noValidate onSubmit={enviar} className="flex flex-col gap-4">
      <CampoTexto
        rotulo="Consumo do mês"
        grande
        sufixo="kWh por mês"
        inputMode="decimal"
        placeholder="380"
        value={consumo}
        onChange={(e) => setConsumo(e.target.value)}
        erro={erros.consumo}
        tentativa={tentativa}
      />
      <CampoTexto
        rotulo="Valor da conta (opcional)"
        inputMode="decimal"
        placeholder="R$ 0,00"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        erro={erros.valor}
        tentativa={tentativa}
      />
      <Card className="flex gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-pequeno bg-destaque text-destaque-tinta">
          <Icone nome="lampada" tamanho={18} />
        </span>
        <span className="flex flex-col gap-1">
          <span className="text-sm font-bold">Onde acho o consumo?</span>
          <span className="text-pequeno text-apoio">Na conta de luz, procure o consumo em kWh, perto do gráfico dos últimos meses.</span>
        </span>
      </Card>
      <MensagemErro id="erro-simulador" erro={erros.geral} />
      <Botao type="submit" carregando={enviando}>
        {enviando ? "Calculando..." : "Ver meu resultado"}
      </Botao>
    </form>
  );
}
