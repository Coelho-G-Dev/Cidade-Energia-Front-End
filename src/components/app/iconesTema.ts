import type { NomeIcone } from "@/components/ui/Icone";

const POR_TEMA: Record<string, NomeIcone> = {
  solar: "sol",
  renovaveis: "folha",
  eficiencia: "arCondicionado",
  conta: "lampada",
  descarte: "reciclar",
};

export const iconeDoTema = (tema: string): NomeIcone => POR_TEMA[tema] ?? "trilhas";
