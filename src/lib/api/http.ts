import { ErroApi, eCorpoErro } from "./erro";
import type { FonteSessao } from "./sessao";

export type Autenticacao = "exigida" | "opcional" | "nenhuma";

export type Pedido = {
  metodo?: "GET" | "POST" | "PUT";
  corpo?: unknown;
  autenticacao: Autenticacao;
  sinal?: AbortSignal;
};

export type Requisitar = <T>(caminho: string, pedido: Pedido) => Promise<T>;

type Dependencias = {
  apiUrl: string;
  sessao: Pick<FonteSessao, "token" | "renovar">;
  buscar?: typeof fetch;
};

export function criarRequisicao({ apiUrl, sessao, buscar = (...args) => fetch(...args) }: Dependencias): Requisitar {
  async function enviar(caminho: string, pedido: Pedido, token: string | null): Promise<Response> {
    const cabecalhos: Record<string, string> = { Accept: "application/json" };
    if (pedido.corpo !== undefined) cabecalhos["Content-Type"] = "application/json";
    if (token) cabecalhos.Authorization = `Bearer ${token}`;
    try {
      return await buscar(`${apiUrl}${caminho}`, {
        method: pedido.metodo ?? "GET",
        headers: cabecalhos,
        body: pedido.corpo === undefined ? undefined : JSON.stringify(pedido.corpo),
        signal: pedido.sinal,
      });
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") throw e;
      throw new ErroApi(0, "SEM_CONEXAO", "Sem conexão com o servidor.");
    }
  }

  async function ler<T>(resposta: Response): Promise<T> {
    let corpo: unknown;
    try {
      corpo = await resposta.json();
    } catch {
      throw new ErroApi(resposta.status, "RESPOSTA_INVALIDA", "Resposta sem JSON.");
    }
    if (resposta.ok) return corpo as T;
    if (eCorpoErro(corpo)) throw new ErroApi(resposta.status, corpo.erro.codigo, corpo.erro.mensagem);
    throw new ErroApi(resposta.status, "RESPOSTA_INVALIDA", "Resposta de erro fora do formato.");
  }

  return async function requisitar<T>(caminho: string, pedido: Pedido): Promise<T> {
    if (pedido.autenticacao === "nenhuma") return ler<T>(await enviar(caminho, pedido, null));

    const token = await sessao.token();
    if (!token && pedido.autenticacao === "exigida") {
      throw new ErroApi(401, "NAO_AUTENTICADO", "Faça login para acessar este recurso.");
    }

    const resposta = await enviar(caminho, pedido, token);
    if (resposta.status !== 401 || !token) return ler<T>(resposta);

    const renovado = await sessao.renovar();
    if (!renovado) return ler<T>(resposta);
    return ler<T>(await enviar(caminho, pedido, renovado));
  };
}
