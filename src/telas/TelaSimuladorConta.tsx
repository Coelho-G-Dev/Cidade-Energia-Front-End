"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Botao } from "@/components/ui/Botao";
import { MensagemErro } from "@/components/ui/Campo";
import { CampoTexto } from "@/components/ui/CampoTexto";
import { Card } from "@/components/ui/Card";
import { Icone } from "@/components/ui/Icone";
import { api, campoDoErro, mensagemParaPessoa } from "@/lib/api";
import { brl } from "@/lib/conteudo";
import { invalidar } from "@/lib/cacheDados";
import { guardarResultado } from "@/lib/resultado";
import { DESKTOP, useMidia } from "@/lib/useMidia";
import { dadosDaPrevia, PainelPrevia, useInformarPrevia } from "./PreviaSimulacao";

export function paraNumero(texto: string): number | null {
  const limpo = texto.replace(/[^\d,.]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  if (!limpo) return null;
  const valor = Number(limpo);
  return Number.isFinite(valor) ? valor : null;
}

// O back aceita até R$ 1.000.000,00 na conta.
const MAXIMO_CENTAVOS = 100_000_000;

/**
 * Máscara de moeda: os dígitos viram centavos, da direita para a esquerda ("31200" vira "R$ 312,00").
 * Colar "R$ 312,00" dá o mesmo resultado. Zero ou vazio deixam o campo vazio (o valor é opcional).
 * Acima do máximo, mantém o valor anterior.
 */
export function mascararReais(digitado: string, anterior: number | null = null): number | null {
  const digitos = digitado.replace(/\D/g, "").replace(/^0+/, "");
  if (!digitos) return null;
  const centavos = Number(digitos);
  return centavos > MAXIMO_CENTAVOS ? anterior : centavos;
}

export const textoReais = (centavos: number | null) => (centavos === null ? "" : brl(centavos / 100));

export function TelaSimuladorConta() {
  const router = useRouter();
  const [consumo, setConsumo] = useState("");
  const [centavos, setCentavos] = useState<number | null>(null);
  const [erros, setErros] = useState<{ consumo?: string; valor?: string; geral?: string }>({});
  const [tentativa, setTentativa] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const desktop = useMidia(DESKTOP);
  const valorConta = centavos === null ? undefined : centavos / 100;
  const previa = dadosDaPrevia({ modo: "conta", consumoKwh: paraNumero(consumo), ...(valorConta ? { valorConta } : {}) });
  useInformarPrevia("conta", previa);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setTentativa((t) => t + 1);
    const consumoKwh = paraNumero(consumo);
    const novos: typeof erros = {};
    if (!consumoKwh || consumoKwh <= 0) novos.consumo = "Informe o consumo em kWh, como aparece na conta.";
    setErros(novos);
    if (Object.keys(novos).length) return;

    setEnviando(true);
    try {
      guardarResultado(await api.simular({ modo: "conta", consumoKwh: consumoKwh!, ...(valorConta ? { valorConta } : {}) }));
      invalidar("ultima-simulacao", "resumo", "ranking-");
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
        dica="Digite só os números. Para R$ 312,00, digite 31200."
        value={textoReais(centavos)}
        onChange={(e) => setCentavos((atual) => mascararReais(e.target.value, atual))}
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
      {!desktop && <PainelPrevia dados={previa} />}
      <MensagemErro id="erro-simulador" erro={erros.geral} />
      <Botao type="submit" carregando={enviando}>
        {enviando ? "Calculando..." : "Ver meu resultado"}
      </Botao>
    </form>
  );
}
