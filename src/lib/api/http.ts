import { ErroApi, eCorpoErro } from "./erro";
import type { FonteSessao } from "./sessao";

export type Autenticacao = "exigida" | "opcional" | "nenhuma";

export type Pedido = {
  metodo?: "GET" | "POST" | "PUT";
  corpo?: unknown;
  autenticacao: Autenticacao;
  sinal?: AbortSignal;
  cabecalhos?: Record<string, string>;
  formato?: "json" | "texto";
};

export type Requisitar = <T>(caminho: string, pedido: Pedido) => Promise<T>;

type Dependencias = {
  apiUrl: string;
  sessao: Pick<FonteSessao, "token" | "renovar">;
  buscar?: typeof fetch;
};

export function criarRequisicao({ apiUrl, sessao, buscar = (...args) => fetch(...args) }: Dependencias): Requisitar {
  async function enviar(caminho: string, pedido: Pedido, token: string | null): Promise<Response> {
    const cabecalhos: Record<string, string> = {
      Accept: pedido.formato === "texto" ? "text/csv, application/json" : "application/json",
      ...pedido.cabecalhos,
    };
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

  async function ler<T>(resposta: Response, formato: "json" | "texto" = "json"): Promise<T> {
    if (resposta.ok && formato === "texto") {
      const bytes = new Uint8Array(await resposta.arrayBuffer());
      const temBom = bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
      const texto = new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes);
      return (temBom && !texto.startsWith("\uFEFF") ? `\uFEFF${texto}` : texto) as T;
    }
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
    if (pedido.autenticacao === "nenhuma") return ler<T>(await enviar(caminho, pedido, null), pedido.formato);

    const token = await sessao.token();
    if (!token && pedido.autenticacao === "exigida") {
      throw new ErroApi(401, "NAO_AUTENTICADO", "Faça login para acessar este recurso.");
    }

    const resposta = await enviar(caminho, pedido, token);
    if (resposta.status !== 401 || !token) return ler<T>(resposta, pedido.formato);

    const renovado = await sessao.renovar();
    if (!renovado) return ler<T>(resposta, pedido.formato);
    return ler<T>(await enviar(caminho, pedido, renovado), pedido.formato);
  };
}
