import type { ResultadoEvento } from "./gamificacao";

export type TipoLicao = "texto" | "pedale";

export type ResumoTrilha = {
  id: string;
  slug: string;
  titulo: string;
  descricao: string;
  tema: string;
  minutos: number;
  totalLicoes: number;
  licoesConcluidas: number;
  concluida: boolean;
};

export type LicaoDaTrilha = { id: string; ordem: number; titulo: string; tipo: TipoLicao; concluida: boolean; liberada: boolean };

export type TrilhaDetalhada = ResumoTrilha & { licoes: LicaoDaTrilha[] };

export type LicaoPendente = { id: string; titulo: string };

export type LicaoDetalhada = {
  id: string;
  trilha: { slug: string; titulo: string };
  ordem: number;
  titulo: string;
  conteudo: string;
  tipo: TipoLicao;
  totalPerguntas: number;
  concluida: boolean;
  liberada: boolean;
  licaoPendente: LicaoPendente | null;
  proximaLicaoId: string | null;
};

export type LicaoConcluida = ResultadoEvento & { licaoId: string; concluida: true };

export type PedidoPedale = { licaoId: string };
