export type PapelMensagem = "usuario" | "energinho";

export type MensagemTutor = { papel: PapelMensagem; texto: string };

export type PedidoTutor = { mensagem: string; historico?: MensagemTutor[] };

export type LicaoRelacionada = { id: string; titulo: string; trilhaSlug: string };

export type RespostaTutor = {
  resposta: string;
  licoesRelacionadas: LicaoRelacionada[];
  respostaId?: string;
};

export type MotivoAvaliacaoTutor = "errada" | "confusa" | "fora_do_tema";

export type PedidoAvaliacaoTutor = {
  respostaId: string;
  util: boolean;
  motivo?: MotivoAvaliacaoTutor;
};

export type ResultadoAvaliacaoTutor = {
  registrado: true;
};
