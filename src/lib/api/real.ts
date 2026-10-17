import type { Requisitar } from "./http";
import type { ClienteApi } from "./tipos";

const id = (valor: string) => encodeURIComponent(valor);

export function criarClienteReal(requisitar: Requisitar): ClienteApi {
  return {
    listarBairros: () => requisitar("/api/bairros", { autenticacao: "nenhuma" }),
    listarEscolas: (bairroId) =>
      requisitar(bairroId ? `/api/escolas?bairro=${id(bairroId)}` : "/api/escolas", { autenticacao: "nenhuma" }),
    listarAparelhos: () => requisitar("/api/aparelhos", { autenticacao: "nenhuma" }),
    obterPerfil: () => requisitar("/api/perfil", { autenticacao: "exigida" }),
    atualizarPerfil: (dados) => requisitar("/api/perfil", { metodo: "PUT", corpo: dados, autenticacao: "exigida" }),
    obterResumo: () => requisitar("/api/perfil/resumo", { autenticacao: "exigida" }),
    simular: (dados) => requisitar("/api/simulacoes", { metodo: "POST", corpo: dados, autenticacao: "opcional" }),
    previaSimulacao: (dados, sinal) =>
      requisitar("/api/simulacoes/previa", { metodo: "POST", corpo: dados, autenticacao: "opcional", sinal }),
    ultimaSimulacao: () => requisitar("/api/simulacoes/ultima", { autenticacao: "exigida" }),
    solDeHoje: () => requisitar("/api/sol-de-hoje", { autenticacao: "nenhuma" }),
    perguntarAoTutor: (dados) => requisitar("/api/tutor", { metodo: "POST", corpo: dados, autenticacao: "exigida" }),
    listarTrilhas: () => requisitar("/api/trilhas", { autenticacao: "opcional" }),
    obterTrilha: (slug) => requisitar(`/api/trilhas/${id(slug)}`, { autenticacao: "opcional" }),
    obterLicao: (licaoId) => requisitar(`/api/licoes/${id(licaoId)}`, { autenticacao: "opcional" }),
    concluirLicao: (licaoId) =>
      requisitar(`/api/licoes/${id(licaoId)}/concluir`, { metodo: "POST", autenticacao: "exigida" }),
    obterQuiz: (licaoId) => requisitar(`/api/licoes/${id(licaoId)}/quiz`, { autenticacao: "opcional" }),
    responderQuiz: (dados) =>
      requisitar("/api/quiz/responder", { metodo: "POST", corpo: dados, autenticacao: "exigida" }),
    concluirPedale: (licaoId) =>
      requisitar("/api/pedale/concluir", { metodo: "POST", corpo: { licaoId }, autenticacao: "exigida" }),
    listarMissoes: () => requisitar("/api/missoes", { autenticacao: "opcional" }),
    registrarMissao: (missaoId) =>
      requisitar(`/api/missoes/${id(missaoId)}/registrar`, { metodo: "POST", autenticacao: "exigida" }),
    listarRanking: (tipo) => requisitar(`/api/rankings?tipo=${tipo}`, { autenticacao: "nenhuma" }),
    listarPontosMapa: (tipo) =>
      requisitar(tipo ? `/api/mapa/pontos?tipo=${tipo}` : "/api/mapa/pontos", { autenticacao: "nenhuma" }),
  };
}
