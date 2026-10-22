import type { ResultadoEvento } from "./gamificacao";

export type ModoSimulacao = "conta" | "aparelhos";

export type ItemSimulacao = { aparelhoId: string; quantidade: number; horasDia: number };

export type CriarSimulacao =
  | { modo: "conta"; consumoKwh: number; valorConta?: number }
  | { modo: "aparelhos"; itens: ItemSimulacao[] };

export type Peso = { aparelho: string; percentual: number };

/** Textos prontos, já com os números, para cada "Como calculamos?". */
export type ComoCalculamos = {
  economiaHabitos: string;
  economiaSolar: string;
  custoSistemaSolar: string;
  retornoSolar: string;
};

// O back ainda manda `economiaMensal` e `retornoAnos`, obsoletos e iguais a `economiaHabitosMensal` e
// `retornoSolarAnos`. O front não usa os nomes antigos.
export type ResultadoSimulacao = {
  consumoKwh: number;
  gastoMensal: number;
  economiaHabitosMensal: number;
  economiaSolarMensal: number;
  kwhGeradoMes: number;
  custoSistemaSolar: number;
  retornoSolarAnos: number;
  placas: number;
  co2EvitadoKgAno: number;
  pesos: Peso[];
  comoCalculamos: ComoCalculamos;
};

export type RespostaSimulacao = ResultadoSimulacao & ResultadoEvento & { simulacaoId: string | null };

type CamposSolares = "economiaSolarMensal" | "kwhGeradoMes" | "custoSistemaSolar" | "retornoSolarAnos" | "economiaHabitosMensal";

/** Simulações salvas antes da separação entre hábitos e solar trazem os campos novos como `null`. */
export type ResultadoSalvo = Omit<ResultadoSimulacao, CamposSolares | "comoCalculamos"> & {
  [K in CamposSolares]: number | null;
} & { comoCalculamos: ComoCalculamos | null };

export type SimulacaoSalva = {
  id: string;
  modo: ModoSimulacao;
  consumoKwh: number;
  valorConta: number | null;
  criadoEm: string;
  resultado: ResultadoSalvo;
};
