import type { CodigoErro, CorpoErro } from "@/types";

export type CodigoErroFront =
  | CodigoErro
  | "SEM_CONEXAO"
  | "RESPOSTA_INVALIDA"
  | "LIMITE_DE_LOGIN"
  | "LOGIN_INDISPONIVEL"
  | "CAPTCHA_FALHOU";

export class ErroApi extends Error {
  constructor(
    readonly status: number,
    readonly codigo: CodigoErroFront | (string & {}),
    mensagem: string,
  ) {
    super(mensagem);
    this.name = "ErroApi";
  }
}

const MENSAGENS: Partial<Record<CodigoErroFront, string>> = {
  SEM_CONEXAO: "Sem conexão com o servidor. Confira a internet e tente de novo.",
  RESPOSTA_INVALIDA: "O servidor respondeu de um jeito inesperado. Tente de novo.",
  JSON_INVALIDO: "Não deu para enviar os dados. Tente de novo.",
  NAO_AUTENTICADO: "Sua sessão acabou. Entre de novo para continuar.",
  ERRO_INTERNO: "Algo deu errado do nosso lado. Tente de novo.",
  TUTOR_INDISPONIVEL: "O Energinho não respondeu agora. Tente de novo em alguns minutos.",
  LIMITE_DE_LOGIN: "Muita gente entrou agora pela mesma rede. Espere alguns minutos e tente de novo.",
  LOGIN_INDISPONIVEL: "Não deu para entrar agora. Confira a internet e tente de novo.",
  CAPTCHA_FALHOU: "A verificação de segurança não passou. Tente de novo.",
  ROTA_NAO_ENCONTRADA: "Algo deu errado do nosso lado. Tente de novo.",
  METODO_NAO_PERMITIDO: "Algo deu errado do nosso lado. Tente de novo.",
};

const USAR_MENSAGEM_DO_SERVIDOR = new Set<string>([
  "ENTRADA_INVALIDA",
  "TURMA_NAO_ENCONTRADA",
  "BAIRRO_OU_ESCOLA_NAO_ENCONTRADO",
  "LIMITE_DE_TROCAS",
  "LIMITE_TUTOR",
  "LIMITE_DE_REQUISICOES",
  "ESCOLA_INATIVA",
  "LICAO_BLOQUEADA",
  "LICAO_NAO_CONCLUIDA",
  "NENHUMA_SIMULACAO",
  "TRILHA_NAO_ENCONTRADA",
  "LICAO_NAO_ENCONTRADA",
  "PERGUNTA_NAO_ENCONTRADA",
  "MISSAO_NAO_ENCONTRADA",
  "PERFIL_NAO_ENCONTRADO",
  "APARELHO_NAO_ENCONTRADO",
  "REFERENCIA_INVALIDA",
]);

export function semNomeDoCampo(mensagem: string): string {
  return mensagem.replace(/^[\w.]+:\s+/, "");
}

export function mensagemParaPessoa(erro: unknown): string {
  if (!(erro instanceof ErroApi)) return MENSAGENS.ERRO_INTERNO!;
  if (USAR_MENSAGEM_DO_SERVIDOR.has(erro.codigo) && erro.message) return semNomeDoCampo(erro.message);
  return MENSAGENS[erro.codigo as CodigoErroFront] ?? MENSAGENS.ERRO_INTERNO!;
}

export function campoDoErro(erro: unknown): string | null {
  if (!(erro instanceof ErroApi) || erro.codigo !== "ENTRADA_INVALIDA") return null;
  return /^([\w.]+):\s/.exec(erro.message)?.[1] ?? null;
}

export function eCorpoErro(corpo: unknown): corpo is CorpoErro {
  if (typeof corpo !== "object" || corpo === null || !("erro" in corpo)) return false;
  const erro = (corpo as { erro: unknown }).erro;
  return (
    typeof erro === "object" &&
    erro !== null &&
    typeof (erro as Record<string, unknown>).codigo === "string" &&
    typeof (erro as Record<string, unknown>).mensagem === "string"
  );
}
