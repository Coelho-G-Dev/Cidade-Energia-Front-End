// Cache em memória das leituras da API, compartilhado entre as telas. Uma chave por recurso
// ("trilha-<slug>", "licao-<id>", "missoes"...). Nada vai para o localStorage: some ao recarregar a página.
//
// - Duas telas pedindo a mesma chave ao mesmo tempo dividem a mesma chamada.
// - Ao voltar para uma tela, os dados guardados aparecem na hora.
// - Depois de VALIDADE_MS, os dados ainda aparecem, mas a tela busca de novo em segundo plano.
// - Depois de uma ação que muda o progresso, `invalidar` marca as chaves afetadas. Uma tela montada continua
//   mostrando o que tem; a próxima que montar busca de novo.

export const VALIDADE_MS = 60_000;

/** Chaves que mudam quando uma lição ou o Pedale é concluído. */
export const AFETADAS_POR_LICAO = ["trilhas", "trilha-", "licao-", "quiz-", "resumo"] as const;

export type Entrada<T = unknown> = {
  readonly dados?: T;
  readonly erro?: unknown;
  readonly falhou: boolean;
  readonly em: number;
  readonly invalida: boolean;
  readonly carregando: boolean;
};

const entradas = new Map<string, Entrada>();
const promessas = new Map<string, Promise<unknown>>();
const ouvintes = new Map<string, Set<() => void>>();

function definir(chave: string, entrada: Entrada) {
  entradas.set(chave, entrada);
  ouvintes.get(chave)?.forEach((avisar) => avisar());
}

export function lerEntrada<T>(chave: string): Entrada<T> | undefined {
  return entradas.get(chave) as Entrada<T> | undefined;
}

export function assinar(chave: string, avisar: () => void): () => void {
  const lista = ouvintes.get(chave) ?? new Set();
  lista.add(avisar);
  ouvintes.set(chave, lista);
  return () => {
    lista.delete(avisar);
    if (lista.size === 0) ouvintes.delete(chave);
  };
}

/** Precisa buscar? Sim quando não há dados, quando a última busca falhou, quando foi invalidada ou envelheceu. */
export function precisaBuscar(entrada: Entrada | undefined, agora = Date.now()): boolean {
  if (!entrada || entrada.falhou || entrada.invalida) return true;
  return agora - entrada.em > VALIDADE_MS;
}

/** Busca a chave, reaproveitando a chamada em andamento. Nunca repete sozinha depois de um erro. */
export function carregar<T>(chave: string, buscar: () => Promise<T>): Promise<T> {
  const emAndamento = promessas.get(chave);
  if (emAndamento) return emAndamento as Promise<T>;

  const anterior = entradas.get(chave);
  definir(chave, { ...(anterior ?? { falhou: false, em: 0, invalida: false }), carregando: true });
  // new Promise também transforma um erro síncrono de `buscar` em rejeição.
  const promessa = new Promise<T>((resolver) => resolver(buscar())).then(
    (dados) => {
      if (promessas.get(chave) === promessa) {
        promessas.delete(chave);
        definir(chave, { dados, falhou: false, em: Date.now(), invalida: false, carregando: false });
      }
      return dados;
    },
    (erro: unknown) => {
      if (promessas.get(chave) === promessa) {
        promessas.delete(chave);
        definir(chave, { erro, falhou: true, em: Date.now(), invalida: false, carregando: false });
      }
      throw erro;
    },
  );
  promessas.set(chave, promessa);
  return promessa;
}

/** Busca antes de a pessoa chegar na tela (a próxima lição, o quiz). Ignora erros: a tela tenta de novo ao montar. */
export function preCarregar<T>(chave: string, buscar: () => Promise<T>) {
  if (!precisaBuscar(entradas.get(chave))) return;
  carregar(chave, buscar).catch(() => {});
}

function casa(chave: string, prefixos: readonly string[]) {
  return prefixos.some((p) => chave === p || (p.endsWith("-") && chave.startsWith(p)));
}

/**
 * Marca as chaves como desatualizadas depois de uma ação. Prefixo terminado em "-" vale para todas as chaves que
 * começam com ele ("licao-"). Uma chamada em andamento deixa de valer, para não gravar um dado antigo por cima.
 */
export function invalidar(...prefixos: string[]) {
  for (const [chave, entrada] of entradas) {
    if (!casa(chave, prefixos)) continue;
    promessas.delete(chave);
    if (ouvintes.has(chave)) definir(chave, { ...entrada, invalida: true, carregando: false });
    else entradas.delete(chave);
  }
}

/** Esquece tudo. Usado quando a sessão muda: o que foi lido sem login vem com o progresso zerado. */
export function limparCache() {
  promessas.clear();
  for (const chave of [...entradas.keys()]) {
    if (ouvintes.has(chave)) definir(chave, { ...entradas.get(chave)!, invalida: true, carregando: false });
    else entradas.delete(chave);
  }
}
