// Contratos D-004 (GET /api/professor/escola) e D-005 + D-011 (GET /api/impacto).

export type EscolaPainelProfessor = {
  nome: string;
  bairro: string;
  codigoEstudante: string;
};

export type TrilhaPainelProfessor = {
  slug: string;
  titulo: string;
  totalLicoes: number;
  estudantesQueComecaram: number | null;
  estudantesQueConcluiram: number | null;
};

export type ProgressoPainelProfessor = {
  licoesConcluidas: number | null;
  mediaLicoesPorEstudante: number | null;
  trilhas: TrilhaPainelProfessor[];
};

export type PerguntaErradaPainelProfessor = {
  perguntaId: string;
  enunciado: string;
  licaoTitulo: string;
  respostas: number;
  percentualAcertos: number | null;
};

export type QuizPainelProfessor = {
  respostas: number | null;
  percentualAcertos: number | null;
  perguntasMaisErradas: PerguntaErradaPainelProfessor[];
};

export type MissaoPainelProfessor = {
  slug: string;
  titulo: string;
  estudantesQueComecaram: number | null;
  estudantesQueConcluiram: number | null;
  diasRegistrados: number | null;
};

export type SimulacoesPainelProfessor = {
  estudantesQueSimularam: number | null;
};

export type PainelProfessor = {
  escola: EscolaPainelProfessor;
  estudantes: number | null;
  oculto: boolean;
  progresso: ProgressoPainelProfessor | null;
  quiz: QuizPainelProfessor | null;
  missoes: MissaoPainelProfessor[] | null;
  simulacoes: SimulacoesPainelProfessor | null;
  atualizadoEm: string;
  dadosAte: string;
};

export type FiltroPeriodoImpacto = {
  de?: string;
  ate?: string;
};

export type PainelImpacto = {
  periodo: { de: string; ate: string };
  estudantes: {
    comPerfil: number | null;
    ativosNoPeriodo: number | null;
    verificadosPorTurma: number | null;
  };
  escolas: {
    comEstudantes: number | null;
    comTurma: number | null;
  };
  bairros: {
    comEstudantes: number | null;
  };
  aprendizado: {
    licoesConcluidas: number | null;
    trilhasConcluidas: number | null;
    respostasDoQuiz: number | null;
    percentualAcertos: number | null;
  };
  missoes: {
    registros: number | null;
    concluidas: number | null;
  };
  simulacoes: {
    salvas: number | null;
    estudantesQueSimularam: number | null;
  };
  economiaEstimada: {
    potencialHabitos: {
      kwhMes: number | null;
      reaisMes: number | null;
      estudantes: number | null;
    };
    comoCalculamos: {
      potencialHabitos: string;
    };
  };
  estimativa: true;
  atualizadoEm: string;
};
