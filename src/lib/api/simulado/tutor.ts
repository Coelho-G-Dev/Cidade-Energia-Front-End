import type { RespostaTutor } from "@/types";
import { limparMarcadores } from "@/lib/conteudo";
import { LICOES, TRILHAS } from "./conteudo";

const PALAVRAS_VAZIAS = new Set(
  "a o as os um uma de da do das dos e é em no na nos nas que para por com como se mais menos qual quais quanto quantos quantas quanta eu você voce meu minha sua seu isso esse essa este esta tem ter ser vai pra pro ao aos".split(
    " ",
  ),
);

export function normalizar(texto: string): string[] {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((p) => p.length > 2 && !PALAVRAS_VAZIAS.has(p));
}

function primeiroParagrafo(conteudo: string): string {
  return (
    limparMarcadores(conteudo)
      .replace(/\*\*/g, "")
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .find((p) => p.length > 40 && !p.startsWith("#") && !p.startsWith("|") && !p.startsWith("-") && !/^\d+\./.test(p)) ?? ""
  );
}

export function responderTutorSimulado(mensagem: string): RespostaTutor {
  const termos = new Set(normalizar(mensagem));
  const pontuadas = LICOES.map((licao) => {
    const titulo = normalizar(licao.titulo);
    const corpo = new Set(normalizar(licao.conteudo));
    const pontos = [...termos].reduce((soma, termo) => soma + (titulo.includes(termo) ? 3 : 0) + (corpo.has(termo) ? 1 : 0), 0);
    return { licao, pontos };
  }).sort((a, b) => b.pontos - a.pontos);

  const melhor = pontuadas[0];
  if (!melhor || melhor.pontos < 3) {
    return {
      resposta:
        "Eu sou o Energinho e converso sobre energia, conta de luz e sustentabilidade. Tente perguntar, por exemplo, como a placa solar funciona ou por que o ar-condicionado pesa na conta.",
      licoesRelacionadas: [],
    };
  }

  const relacionadas = pontuadas.filter((p) => p.pontos >= Math.max(3, melhor.pontos - 2)).slice(0, 2);
  return {
    resposta: `${primeiroParagrafo(melhor.licao.conteudo)}\n\nPara saber mais, veja a lição: ${melhor.licao.titulo}. (Resposta de exemplo do modo simulado.)`,
    licoesRelacionadas: relacionadas.map(({ licao }) => ({
      id: licao.id,
      titulo: licao.titulo,
      trilhaSlug: TRILHAS.find((t) => t.slug === licao.trilhaSlug)!.slug,
    })),
  };
}
