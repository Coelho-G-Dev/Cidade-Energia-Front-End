import type { Missao } from "@/types";

// A missão prática que fecha cada trilha: o back diz a trilha de cada missão em `trilhaSlug`.
export function missaoDaTrilha(trilhaSlug: string, missoes: readonly Missao[]): Missao | undefined {
  return missoes.find((m) => m.trilhaSlug === trilhaSlug);
}

export type ProximoPasso = { href: string; rotulo: string };

// Para onde a pessoa vai depois de terminar uma lição (ou o quiz dela).
export function passoDepoisDaLicao(
  licao: { proximaLicaoId: string | null; trilha: { slug: string } },
  missoes: readonly Missao[] | null,
): ProximoPasso {
  if (licao.proximaLicaoId) return { href: `/trilhas/${licao.trilha.slug}/${licao.proximaLicaoId}`, rotulo: "Ir para a próxima lição" };
  const missao = missoes ? missaoDaTrilha(licao.trilha.slug, missoes) : undefined;
  if (missao && !missao.concluida) return { href: `/missoes/${missao.id}`, rotulo: "Fazer a missão prática" };
  return { href: "/trilhas", rotulo: "Escolher outra trilha" };
}

// A missão do ar-condicionado conta noites; as outras contam dias.
const UNIDADE: Record<string, { singular: string; plural: string }> = {
  "ar-desligado-antes-de-dormir": { singular: "noite", plural: "noites" },
};

export const unidadeDaMissao = (m: Pick<Missao, "slug">) => UNIDADE[m.slug] ?? { singular: "dia", plural: "dias" };

/** "Leva 3 noites", "1 de 3 noites" ou "Concluída". */
export function progressoDaMissao(m: Pick<Missao, "slug" | "diasRegistrados" | "diasNecessarios" | "concluida">): string {
  if (m.concluida) return "Concluída";
  const u = unidadeDaMissao(m);
  const nome = m.diasNecessarios === 1 ? u.singular : u.plural;
  if (m.diasRegistrados === 0) return `Leva ${m.diasNecessarios} ${nome}`;
  return `${m.diasRegistrados} de ${m.diasNecessarios} ${nome}`;
}
