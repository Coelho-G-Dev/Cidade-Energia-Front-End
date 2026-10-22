import type { ResultadoEvento } from "./gamificacao";

export type PerguntaDoQuiz = {
  id: string;
  ordem: number;
  enunciado: string;
  opcoes: string[];
  jaRespondida: boolean;
  acertou: boolean | null;
  podePontuar: boolean;
};

export type Quiz = { licaoId: string; licaoConcluida: boolean; perguntas: PerguntaDoQuiz[] };

export type PedidoResposta = { perguntaId: string; opcao: number };

export type RespostaDoQuiz = ResultadoEvento & {
  correta: boolean;
  /** Índice da opção certa em `opcoes`. Vem no acerto e no erro. */
  opcaoCorreta: number;
  explicacao: string;
  /** `false` quando a pergunta já tinha sido respondida: é treino, sem pontos. */
  tentativaPontuavel: boolean;
};
