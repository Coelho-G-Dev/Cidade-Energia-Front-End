import type { RespostaSimulacao, ResultadoSalvo } from "@/types";

// Caso de referência do back (docs/api.md): conta de 380 kWh e R$ 312,00.
export const RESULTADO_REFERENCIA: RespostaSimulacao = {
  consumoKwh: 380,
  gastoMensal: 312,
  economiaHabitosMensal: 31.2,
  economiaSolarMensal: 312,
  kwhGeradoMes: 413.9,
  custoSistemaSolar: 9372,
  retornoSolarAnos: 2.5,
  placas: 6,
  co2EvitadoKgAno: 191.2,
  pesos: [],
  comoCalculamos: {
    economiaHabitos: "Meta de 10% da conta com mudança de hábitos, sem investimento: R$ 312,00 × 10%.",
    economiaSolar:
      "Cada placa de 550 W gera cerca de 69 kWh por mês com o sol de São Luís. A conta de luz ainda cobra uma taxa mínima, que as placas não zeram.",
    custoSistemaSolar: "6 × 0,55 kWp × R$ 2.840,00 por kWp instalado = R$ 9.372,00 (preço médio de mercado, estimativa).",
    retornoSolar: "R$ 9.372,00 ÷ (R$ 312,00 × 12 meses) = 2,5 anos. Usa a economia com energia solar, não a de hábitos.",
  },
  simulacaoId: null,
  pontosGanhos: 0,
  conquistasNovas: [],
};

// Simulação salva antes da separação entre hábitos e solar.
export const RESULTADO_ANTIGO: ResultadoSalvo = {
  consumoKwh: 380,
  gastoMensal: 312,
  economiaHabitosMensal: 31.2,
  economiaSolarMensal: null,
  kwhGeradoMes: null,
  custoSistemaSolar: null,
  retornoSolarAnos: 2.5,
  placas: 6,
  co2EvitadoKgAno: 191.2,
  pesos: [],
  comoCalculamos: null,
};
