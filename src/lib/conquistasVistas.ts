import type { ConquistaDoResumo, ConquistaNova } from "@/types";

// Lista dos slugs das conquistas que o app já mostrou neste aparelho. Só slugs ("bairro_unido"), nenhum dado pessoal.
// Serve para avisar as conquistas que chegaram sem `conquistasNovas`, como o Bairro unido: quando o bairro bate a
// meta, todos ganham na hora, mas só quem fez a ação recebe o aviso na resposta.
const CHAVE = "ce-conquistas-vistas";

function ler(): Set<string> | null {
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    if (bruto === null) return null;
    const lista: unknown = JSON.parse(bruto);
    return new Set(Array.isArray(lista) ? lista.filter((s): s is string => typeof s === "string") : []);
  } catch {
    return null;
  }
}

function gravar(slugs: Set<string>) {
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify([...slugs].sort()));
  } catch {}
}

export function marcarConquistasVistas(slugs: readonly string[]) {
  if (slugs.length === 0) return;
  const vistas = ler() ?? new Set<string>();
  slugs.forEach((s) => vistas.add(s));
  gravar(vistas);
}

/**
 * Compara as conquistas obtidas com as já mostradas e devolve as novas, já marcando como vistas.
 * Na primeira vez no aparelho só guarda a lista, sem avisar: são conquistas antigas.
 */
export function conquistasParaAvisar(conquistas: readonly ConquistaDoResumo[]): ConquistaNova[] {
  const obtidas = conquistas.filter((c) => c.obtida);
  const vistas = ler();
  if (vistas === null) {
    gravar(new Set(obtidas.map((c) => c.slug)));
    return [];
  }
  const novas = obtidas.filter((c) => !vistas.has(c.slug)).map(({ slug, nome }) => ({ slug, nome }));
  marcarConquistasVistas(novas.map((c) => c.slug));
  return novas;
}
