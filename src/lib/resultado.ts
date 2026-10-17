import type { RespostaSimulacao } from "@/types";

let ultimo: RespostaSimulacao | null = null;

export function guardarResultado(resultado: RespostaSimulacao) {
  ultimo = resultado;
}

export function lerResultado(): RespostaSimulacao | null {
  return ultimo;
}
