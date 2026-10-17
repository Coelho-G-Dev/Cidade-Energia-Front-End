import type { ResultadoEvento } from "./gamificacao";

export type PerguntaDoQuiz = {
  id: string;
  ordem: number;
  enunciado: string;
  opcoes: string[];
  jaRespondida: boolean;
  acertou: boolean | null;
  podePontuar: boolean;
  proximaTentativaEm: string | null;
};

export type Quiz = { licaoId: string; licaoConcluida: boolean; perguntas: PerguntaDoQuiz[] };

export type PedidoResposta = { perguntaId: string; opcao: number };

export type RespostaDoQuiz = ResultadoEvento & {
  correta: boolean;
  explicacao: string | null;
  tentativaPontuavel: boolean;
  proximaTentativaEm: string | null;
};
