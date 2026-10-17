export type FonteIrradiacao = "nasa-power" | "cache" | "config";

export type SolDeHoje = {
  data: string | null;
  irradiacao: number;
  kwhPorPlaca: number;
  horasArCondicionado: number;
  co2EvitadoKg: number;
  estimativa: true;
  fonte: FonteIrradiacao;
};
