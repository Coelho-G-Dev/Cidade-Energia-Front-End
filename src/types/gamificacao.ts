export const ORIGENS = [
  "primeira_simulacao",
  "licao_concluida",
  "resposta_correta",
  "pedale_concluido",
  "missao_concluida",
] as const;

export type Origem = (typeof ORIGENS)[number];

export const CONQUISTAS = [
  "primeira_simulacao",
  "amigo_do_sol",
  "conta_decifrada",
  "noites_frescas",
  "descarte_certo",
  "bairro_unido",
] as const;

export type SlugConquista = (typeof CONQUISTAS)[number];

export type ConquistaNova = { slug: string; nome: string };

export type ResultadoEvento = { pontosGanhos: number; conquistasNovas: ConquistaNova[] };
