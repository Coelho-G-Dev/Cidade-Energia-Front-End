// Contrato D-013, seção 1 (GET e POST /api/trilhas/{slug}/diagnostico).

export type MomentoDiagnostico = "antes" | "depois";

export type PerguntaDiagnostico = {
  id: string;
  ordem: number;
  enunciado: string;
  opcoes: string[];
};

export type Diagnostico = {
  momento: MomentoDiagnostico;
  disponivel: boolean;
  respondido: boolean;
  perguntas: PerguntaDiagnostico[];
};

export type RespostaEnvioDiagnostico = {
  perguntaId: string;
  opcao: number;
};

export type PedidoDiagnostico = {
  momento: MomentoDiagnostico;
  respostas: RespostaEnvioDiagnostico[];
};

export type ResultadoPerguntaDiagnostico = {
  perguntaId: string;
  indiceCorreto: number;
  acertouAntes: boolean;
  acertouDepois: boolean;
  explicacao: string;
};

export type ResultadoDiagnosticoAntes = {
  momento: "antes";
  registrado: true;
};

export type ResultadoDiagnosticoDepois = {
  momento: "depois";
  registrado: true;
  total: number;
  acertosAntes: number;
  acertosDepois: number;
  perguntas: ResultadoPerguntaDiagnostico[];
};

export type ResultadoDiagnostico = ResultadoDiagnosticoAntes | ResultadoDiagnosticoDepois;
