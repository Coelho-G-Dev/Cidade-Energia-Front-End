import type { ResultadoEvento } from "./gamificacao";

export type ModoSimulacao = "conta" | "aparelhos";

export type ItemSimulacao = { aparelhoId: string; quantidade: number; horasDia: number };

export type CriarSimulacao =
  | { modo: "conta"; consumoKwh: number; valorConta?: number }
  | { modo: "aparelhos"; itens: ItemSimulacao[] };

export type Peso = { aparelho: string; percentual: number };

export type ResultadoSimulacao = {
  consumoKwh: number;
  gastoMensal: number;
  economiaMensal: number;
  placas: number;
  retornoAnos: number;
  co2EvitadoKgAno: number;
  pesos: Peso[];
};

export type RespostaSimulacao = ResultadoSimulacao & ResultadoEvento & { simulacaoId: string | null };

export type SimulacaoSalva = {
  id: string;
  modo: ModoSimulacao;
  consumoKwh: number;
  valorConta: number | null;
  criadoEm: string;
  resultado: ResultadoSimulacao;
};
