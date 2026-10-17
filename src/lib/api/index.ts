import { API_URL, USAR_DADOS_SIMULADOS } from "./config";
import { criarRequisicao } from "./http";
import { criarClienteReal } from "./real";
import { sessaoSupabase, type FonteSessao } from "./sessao";
import { criarSimulado } from "./simulado";
import type { ClienteApi } from "./tipos";

function montar(): { api: ClienteApi; sessao: FonteSessao } {
  if (USAR_DADOS_SIMULADOS) return criarSimulado({ lembrarLogin: true });
  return { api: criarClienteReal(criarRequisicao({ apiUrl: API_URL, sessao: sessaoSupabase })), sessao: sessaoSupabase };
}

const cliente = montar();

export const api: ClienteApi = cliente.api;
export const sessao: FonteSessao = cliente.sessao;
export const modoSimulado = USAR_DADOS_SIMULADOS;

export { ErroApi, mensagemParaPessoa, campoDoErro, semNomeDoCampo } from "./erro";
export type { ClienteApi } from "./tipos";
export type { FonteSessao } from "./sessao";
