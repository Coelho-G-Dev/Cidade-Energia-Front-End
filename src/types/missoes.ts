import type { ResultadoEvento } from "./gamificacao";

export type Missao = {
  id: string;
  slug: string;
  titulo: string;
  descricao: string;
  trilhaSlug: string | null;
  pontos: number;
  diasNecessarios: number;
  diasRegistrados: number;
  diasMarcados: string[];
  registradaHoje: boolean;
  concluida: boolean;
};

export type RegistroMissao = ResultadoEvento & {
  missaoId: string;
  dia: string;
  novoRegistro: boolean;
  diasRegistrados: number;
  diasMarcados: string[];
  diasNecessarios: number;
  concluida: boolean;
};
