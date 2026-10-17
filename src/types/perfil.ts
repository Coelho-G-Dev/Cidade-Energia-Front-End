type LinhaPerfil = {
  id: string;
  primeiro_nome: string | null;
  bairro_id: string | null;
  escola_id: string | null;
  escola_verificada: boolean;
  criado_em: string;
};

type SituacaoTrocas = {
  limite_trocas: number;
  trocas_restantes: number;
  proxima_troca_em: string | null;
};

export type Perfil = LinhaPerfil & SituacaoTrocas & { tem_perfil: boolean };

export type AtualizarPerfil = {
  primeiro_nome: string;
  bairro_id: string;
  escola_id?: string;
  codigo_turma?: string;
};

export type PosicaoRanking = { posicao: number | null; pontos: number };

export type ConquistaDoResumo = {
  slug: string;
  nome: string;
  criterio: string;
  obtida: boolean;
  obtidaEm: string | null;
};

export type ResumoPerfil = {
  pontos: number;
  licoesConcluidas: number;
  trilhasConcluidas: number;
  missoesConcluidas: number;
  conquistas: ConquistaDoResumo[];
  escola: PosicaoRanking | null;
  bairro: PosicaoRanking | null;
};
