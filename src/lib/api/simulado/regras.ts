// Cópia das regras de src/lib/gamificacao/regras.ts do back, usada só no modo simulado.
import type { SlugConquista } from "@/types";

export const FUSO_SAO_LUIS = "America/Fortaleza";
export const HORAS_ENTRE_TENTATIVAS_QUIZ = 24;
export const PONTOS_BAIRRO_UNIDO = 500;
export const TRILHA_ENERGIA_SOLAR = "energia-solar-em-sao-luis";
export const TRILHA_CONTA_DE_LUZ = "entendendo-a-sua-conta-de-luz";
export const MISSAO_AR_CONDICIONADO = "ar-desligado-antes-de-dormir";
export const MISSAO_DESCARTE = "descarte-de-lixo-eletronico";

export const PONTOS_POR_ORIGEM = {
  primeira_simulacao: 20,
  licao_concluida: 10,
  resposta_correta: 5,
  pedale_concluido: 15,
} as const;

export type RetratoUsuario = {
  temSimulacao: boolean;
  trilhasConcluidas: readonly string[];
  missoesConcluidas: readonly string[];
  pontosBairro: number;
};

export function conquistasMerecidas(r: RetratoUsuario): SlugConquista[] {
  const regras: Record<SlugConquista, boolean> = {
    primeira_simulacao: r.temSimulacao,
    amigo_do_sol: r.trilhasConcluidas.includes(TRILHA_ENERGIA_SOLAR),
    conta_decifrada: r.trilhasConcluidas.includes(TRILHA_CONTA_DE_LUZ),
    noites_frescas: r.missoesConcluidas.includes(MISSAO_AR_CONDICIONADO),
    descarte_certo: r.missoesConcluidas.includes(MISSAO_DESCARTE),
    bairro_unido: r.pontosBairro >= PONTOS_BAIRRO_UNIDO,
  };
  return (Object.keys(regras) as SlugConquista[]).filter((slug) => regras[slug]);
}

export type RespostaAnterior = { correta: boolean; tentativaEm: Date } | null;
export type DecisaoTentativa = { pontuavel: boolean; proximaTentativaEm: Date | null };

const MS_POR_HORA = 3_600_000;

export function avaliarTentativa(anterior: RespostaAnterior, agora: Date): DecisaoTentativa {
  if (!anterior) return { pontuavel: true, proximaTentativaEm: null };
  if (anterior.correta) return { pontuavel: false, proximaTentativaEm: null };
  const liberadaEm = new Date(anterior.tentativaEm.getTime() + HORAS_ENTRE_TENTATIVAS_QUIZ * MS_POR_HORA);
  return agora >= liberadaEm
    ? { pontuavel: true, proximaTentativaEm: null }
    : { pontuavel: false, proximaTentativaEm: liberadaEm };
}

const formatoDia = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO_SAO_LUIS,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function diaEmSaoLuis(agora: Date): string {
  const partes = Object.fromEntries(formatoDia.formatToParts(agora).map((p) => [p.type, p.value]));
  return `${partes.year}-${partes.month}-${partes.day}`;
}

const formatoHora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO_SAO_LUIS,
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function diaEHora(data: Date): { dia: string; hora: string } {
  const p = Object.fromEntries(formatoHora.formatToParts(data).map((parte) => [parte.type, parte.value]));
  return { dia: `${p.day}/${p.month}`, hora: `${p.hour}:${p.minute}` };
}
