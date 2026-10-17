import { describe, expect, it } from "vitest";
import { diaEHora } from "@/lib/conteudo";
import { passoDepoisDaLicao, progressoDaMissao } from "@/lib/missoesDasTrilhas";
import { validarPerfil } from "@/telas/TelaEntrar";
import { METAS, perderWatts, pessoasPedalando, somarPedalada, WATTS_MAXIMO } from "@/telas/TelaPedale";
import { fraseDoRanking } from "@/telas/TelaPerfil";
import { situacaoInicial, textoNovaTentativa } from "@/telas/TelaQuiz";
import { filtrarTrilhas } from "@/telas/TelaTrilhas";
import type { Missao, Perfil, PerguntaDoQuiz, ResumoPerfil, ResumoTrilha } from "@/types";

const BAIRRO = "0b000000-0000-4000-8000-000000000001";
const ESCOLA = "0e000000-0000-4000-8000-000000000002";
const base = { nome: "Ana", bairro: BAIRRO, modo: "codigo" as const, codigo: "", escola: "" };

describe("perfil no Entrar", () => {
  it("pede nome e bairro em português", () => {
    const { erros, dados } = validarPerfil({ ...base, nome: " ", bairro: "" }, null);
    expect(dados).toBeNull();
    expect(erros).toEqual({ nome: "Escreva o seu primeiro nome.", bairro: "Escolha o seu bairro." });
  });

  it("usa a regra do back para o nome", () => {
    expect(validarPerfil({ ...base, nome: "Ana Maria" }, null).erros.nome).toBe("Informe só o primeiro nome, sem espaços ou números.");
  });

  it("manda o código da turma em maiúsculas", () => {
    expect(validarPerfil({ ...base, codigo: "sol2026" }, null).dados).toEqual({ primeiro_nome: "Ana", bairro_id: BAIRRO, codigo_turma: "SOL2026" });
  });

  it("explica o formato do código inválido", () => {
    expect(validarPerfil({ ...base, codigo: "AB" }, null).erros.codigo).toBe("O código tem de 4 a 12 letras ou números, sem espaços.");
  });

  it("escola da lista vai como escola_id", () => {
    expect(validarPerfil({ ...base, modo: "lista", escola: ESCOLA }, null).dados).toEqual({ primeiro_nome: "Ana", bairro_id: BAIRRO, escola_id: ESCOLA });
  });

  it("mantém a escola confirmada quando o código fica em branco", () => {
    expect(validarPerfil(base, ESCOLA).dados?.escola_id).toBe(ESCOLA);
    expect(validarPerfil(base, null).dados).toEqual({ primeiro_nome: "Ana", bairro_id: BAIRRO });
  });
});

describe("Pedale", () => {
  it("cada pedalada soma watts até o limite de uma pessoa", () => {
    expect(somarPedalada(0)).toBe(14);
    expect(somarPedalada(105)).toBe(WATTS_MAXIMO);
  });

  it("os watts só caem depois de uma pausa", () => {
    expect(perderWatts(80, 100, 1000)).toBe(80);
    expect(perderWatts(80, 400, 1000)).toBe(35);
    expect(perderWatts(10, 400, 1000)).toBe(0);
  });

  it("o ar-condicionado precisaria de 12 pessoas", () => {
    expect(pessoasPedalando(1000)).toBe(12);
    expect(METAS.map((m) => m.potencia)).toEqual([9, 60, 100, 1000]);
    expect(METAS.filter((m) => m.potencia <= WATTS_MAXIMO)).toHaveLength(3);
  });
});

describe("quiz", () => {
  const pergunta: PerguntaDoQuiz = { id: "p", ordem: 1, enunciado: "?", opcoes: ["a", "b"], jaRespondida: false, acertou: null, podePontuar: true, proximaTentativaEm: null };

  it("bloqueia a pergunta errada até a nova tentativa", () => {
    expect(situacaoInicial(pergunta)).toEqual({ tipo: "aberta" });
    expect(situacaoInicial({ ...pergunta, jaRespondida: true, acertou: false, podePontuar: false, proximaTentativaEm: "2026-10-18T15:30:00Z" })).toEqual({
      tipo: "bloqueada",
      liberaEm: "2026-10-18T15:30:00Z",
    });
    expect(situacaoInicial({ ...pergunta, jaRespondida: true, acertou: true, podePontuar: false })).toEqual({ tipo: "aberta" });
  });

  it("diz quando dá para tentar de novo no horário de São Luís", () => {
    expect(diaEHora("2026-10-18T15:30:00Z")).toBe("18/10 às 12:30");
    expect(textoNovaTentativa("2026-10-18T15:30:00Z")).toBe("Você poderá tentar de novo a partir de 18/10 às 12:30.");
    expect(textoNovaTentativa(null)).toBe("Você poderá tentar de novo amanhã.");
  });
});

describe("trilhas e missões", () => {
  const trilha = (slug: string, tema: string) => ({ slug, tema }) as ResumoTrilha;
  const trilhas = [trilha("solar", "solar"), trilha("ar", "eficiencia"), trilha("lixo", "descarte"), trilha("mar", "renovaveis")];
  const missao = (slug: string, extra: Partial<Missao> = {}) =>
    ({ id: `id-${slug}`, slug, titulo: slug, descricao: "", trilhaSlug: null, pontos: 30, diasNecessarios: 3, diasRegistrados: 0, diasMarcados: [], registradaHoje: false, concluida: false, ...extra }) as Missao;

  it("filtra por tema", () => {
    expect(filtrarTrilhas(trilhas, "todas")).toHaveLength(4);
    expect(filtrarTrilhas(trilhas, "solar").map((t) => t.slug)).toEqual(["solar", "mar"]);
    expect(filtrarTrilhas(trilhas, "reciclagem").map((t) => t.slug)).toEqual(["lixo"]);
  });

  it("descreve o progresso da missão", () => {
    expect(progressoDaMissao(missao("ar-desligado-antes-de-dormir"))).toBe("Leva 3 noites");
    expect(progressoDaMissao(missao("ar-desligado-antes-de-dormir", { diasRegistrados: 1 }))).toBe("1 de 3 noites");
    expect(progressoDaMissao(missao("descarte-de-lixo-eletronico", { diasNecessarios: 1 }))).toBe("Leva 1 dia");
    expect(progressoDaMissao(missao("x", { concluida: true }))).toBe("Concluída");
  });

  it("depois da última lição vai para a missão da trilha", () => {
    const missoes = [missao("ar-desligado-antes-de-dormir", { trilhaSlug: "ar-condicionado-sem-susto" })];
    expect(passoDepoisDaLicao({ proximaLicaoId: "l2", trilha: { slug: "ar-condicionado-sem-susto" } }, missoes).href).toBe("/trilhas/ar-condicionado-sem-susto/l2");
    expect(passoDepoisDaLicao({ proximaLicaoId: null, trilha: { slug: "ar-condicionado-sem-susto" } }, missoes)).toEqual({
      href: "/missoes/id-ar-desligado-antes-de-dormir",
      rotulo: "Fazer a missão prática",
    });
    expect(passoDepoisDaLicao({ proximaLicaoId: null, trilha: { slug: "energia-solar-em-sao-luis" } }, missoes).href).toBe("/trilhas");
  });
});

describe("frase do ranking no perfil", () => {
  const perfil = { escola_verificada: true } as Perfil;
  const resumo = { escola: { posicao: 1, pontos: 10 }, bairro: { posicao: 3, pontos: 10 } } as ResumoPerfil;

  it("fala da escola só quando ela foi confirmada pelo código", () => {
    expect(fraseDoRanking(perfil, resumo, "Escola Sol", "Cohama")).toBe("Seus pontos ajudam a Escola Sol a ficar em 1º lugar no ranking das escolas.");
    expect(fraseDoRanking({ ...perfil, escola_verificada: false }, resumo, "Escola Sol", "Cohama")).toBe(
      "Seus pontos ajudam o bairro Cohama a ficar em 3º lugar no ranking dos bairros.",
    );
    expect(fraseDoRanking({ ...perfil, escola_verificada: false }, { ...resumo, bairro: { posicao: null, pontos: 0 } }, undefined, "Cohama")).toBeNull();
  });
});
