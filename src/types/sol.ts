/** `nasa`: buscado agora; `cache`: último dia válido guardado; `padrao`: média anual de reserva. */
export type FonteIrradiacao = "nasa" | "cache" | "padrao";

export type SolDeHoje = {
  /** Dia real da medição (AAAA-MM-DD, fuso de São Luís). `null` com a fonte `padrao`. */
  data: string | null;
  atualizadoEm: string | null;
  /** Dias entre `data` e hoje em São Luís (a NASA atrasa de 2 a 7 dias). `null` com a fonte `padrao`. */
  diasDeAtraso: number | null;
  irradiacao: number;
  kwhPorPlaca: number;
  horasArCondicionado: number;
  co2EvitadoKg: number;
  estimativa: true;
  fonte: FonteIrradiacao;
};
