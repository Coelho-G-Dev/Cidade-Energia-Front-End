export type PapelMensagem = "usuario" | "energinho";

export type MensagemTutor = { papel: PapelMensagem; texto: string };

export type PedidoTutor = { mensagem: string; historico?: MensagemTutor[] };

export type LicaoRelacionada = { id: string; titulo: string; trilhaSlug: string };

export type RespostaTutor = { resposta: string; licoesRelacionadas: LicaoRelacionada[] };
