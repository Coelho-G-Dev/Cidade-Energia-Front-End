import type {
  Aparelho,
  AtualizarPerfil,
  Bairro,
  CriarSimulacao,
  Escola,
  ItemRanking,
  LicaoConcluida,
  LicaoDetalhada,
  Missao,
  PedidoResposta,
  PedidoTutor,
  Perfil,
  PontoMapa,
  Quiz,
  RegistroMissao,
  RespostaDoQuiz,
  RespostaSimulacao,
  RespostaTutor,
  ResumoPerfil,
  ResumoTrilha,
  SimulacaoSalva,
  SolDeHoje,
  TipoPontoMapa,
  TipoRanking,
  TrilhaDetalhada,
} from "@/types";

export type ClienteApi = {
  listarBairros(): Promise<Bairro[]>;
  listarEscolas(bairroId?: string): Promise<Escola[]>;
  listarAparelhos(): Promise<Aparelho[]>;
  obterPerfil(): Promise<Perfil>;
  atualizarPerfil(dados: AtualizarPerfil): Promise<Perfil>;
  obterResumo(): Promise<ResumoPerfil>;
  simular(dados: CriarSimulacao): Promise<RespostaSimulacao>;
  previaSimulacao(dados: CriarSimulacao, sinal?: AbortSignal): Promise<RespostaSimulacao>;
  ultimaSimulacao(): Promise<SimulacaoSalva>;
  solDeHoje(): Promise<SolDeHoje>;
  perguntarAoTutor(dados: PedidoTutor): Promise<RespostaTutor>;
  listarTrilhas(): Promise<ResumoTrilha[]>;
  obterTrilha(slug: string): Promise<TrilhaDetalhada>;
  obterLicao(id: string): Promise<LicaoDetalhada>;
  concluirLicao(id: string): Promise<LicaoConcluida>;
  obterQuiz(licaoId: string): Promise<Quiz>;
  responderQuiz(dados: PedidoResposta): Promise<RespostaDoQuiz>;
  concluirPedale(licaoId: string): Promise<LicaoConcluida>;
  listarMissoes(): Promise<Missao[]>;
  registrarMissao(id: string): Promise<RegistroMissao>;
  listarRanking(tipo: TipoRanking): Promise<ItemRanking[]>;
  listarPontosMapa(tipo?: TipoPontoMapa): Promise<PontoMapa[]>;
};
