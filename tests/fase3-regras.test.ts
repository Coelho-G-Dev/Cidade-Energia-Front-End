import { describe, expect, it } from "vitest";
import { diaEHora } from "@/lib/conteudo";
import { passoDepoisDaLicao, progressoDaMissao } from "@/lib/missoesDasTrilhas";
import { validarPerfil } from "@/telas/TelaEntrar";
import { METAS, perderWatts, pessoasPedalando, somarPedalada, WATTS_MAXIMO } from "@/telas/TelaPedale";
import { frasesDoRanking } from "@/telas/TelaPerfil";
import { estadoDaOpcao, seloDaPergunta, situacaoDaResposta } from "@/telas/TelaQuiz";
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

  it("manda o código da turma em maiúsculas, sem espaços", () => {
    expect(validarPerfil({ ...base, codigo: "k7m2 q9xa" }, null).dados).toEqual({ primeiro_nome: "Ana", bairro_id: BAIRRO, codigo_turma: "K7M2Q9XA" });
  });

  it("aceita só 8 letras e números, sem 0, O, 1 e I", () => {
    const mensagem = "O código tem 8 letras e números, sem 0, O, 1 e I. Confira com o seu professor.";
    for (const codigo of ["AB", "K7M2Q9X", "K7M2Q9XAB", "K7M2Q9X0", "K7M2Q9XO", "K7M2Q9X1", "K7M2Q9XI", "K7M2-Q9X!"]) {
      expect(validarPerfil({ ...base, codigo }, null).erros.codigo).toBe(mensagem);
    }
    expect(validarPerfil({ ...base, codigo: "TESTE2AB" }, null).erros.codigo).toBeUndefined();
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
  const pergunta: PerguntaDoQuiz = { id: "p", ordem: 1, enunciado: "?", opcoes: ["a", "b", "c"], jaRespondida: false, acertou: null, podePontuar: true };
  const resposta = { correta: false, opcaoCorreta: 2, explicacao: "Porque sim.", tentativaPontuavel: true, pontosGanhos: 0, conquistasNovas: [] };

  it("no erro, destaca a escolhida como errada e a certa como certa", () => {
    const situacao = situacaoDaResposta(0, resposta);
    expect([0, 1, 2].map((i) => estadoDaOpcao(situacao, i))).toEqual(["errada", "normal", "certa"]);
    expect(estadoDaOpcao({ tipo: "aberta" }, 2)).toBe("normal");
  });

  it("no acerto, só a escolhida fica certa", () => {
    const situacao = situacaoDaResposta(2, { ...resposta, correta: true });
    expect([0, 1, 2].map((i) => estadoDaOpcao(situacao, i))).toEqual(["normal", "normal", "certa"]);
  });

  it("marca o treino quando a tentativa não vale pontos", () => {
    expect(situacaoDaResposta(0, resposta)).toMatchObject({ treino: false });
    expect(situacaoDaResposta(0, { ...resposta, tentativaPontuavel: false })).toMatchObject({ treino: true });
  });

  it("diz se a pergunta vale pontos ou já foi respondida", () => {
    expect(seloDaPergunta(pergunta, false)).toBe("Vale pontos");
    expect(seloDaPergunta({ ...pergunta, jaRespondida: true, acertou: false, podePontuar: false }, false)).toBe("Já respondida");
    expect(seloDaPergunta(pergunta, true)).toBe("Já respondida");
    expect(seloDaPergunta({ ...pergunta, podePontuar: false }, false)).toBeNull();
  });
});

describe("datas", () => {
  it("mostra dia e hora no horário de São Luís", () => {
    expect(diaEHora("2026-10-18T15:30:00Z")).toBe("18/10 às 12:30");
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

describe("frases do ranking no perfil", () => {
  const perfil = { bairro_id: BAIRRO, escola_id: ESCOLA, escola_verificada: true } as Perfil;
  const resumo = { escola: { posicao: 1, pontos: 10 }, bairro: { posicao: 3, pontos: 10 } } as ResumoPerfil;

  it("mostra a posição do bairro e da escola confirmada pelo código", () => {
    expect(frasesDoRanking(perfil, resumo, "Escola Sol", "Cohama")).toEqual([
      "Seus pontos ajudam o bairro Cohama a ficar em 3º lugar no ranking dos bairros.",
      "Seus pontos ajudam a Escola Sol a ficar em 1º lugar no ranking das escolas.",
    ]);
    expect(frasesDoRanking({ ...perfil, escola_verificada: false }, resumo, "Escola Sol", "Cohama")).toEqual([
      "Seus pontos ajudam o bairro Cohama a ficar em 3º lugar no ranking dos bairros.",
    ]);
  });

  it("sem posição, diz que ainda não entrou no ranking, nunca 0 pontos", () => {
    const fora = { escola: { posicao: null, pontos: 0 }, bairro: { posicao: null, pontos: 0 } } as ResumoPerfil;
    const frases = frasesDoRanking(perfil, fora, "Escola Sol", "Cohama");
    expect(frases[0]).toMatch(/^Seu bairro ainda não entrou no ranking/);
    expect(frases[1]).toMatch(/^Sua escola ainda não entrou no ranking/);
    expect(frases.join(" ")).not.toMatch(/0 pontos/);
  });

  it("sem escola, fala só do bairro", () => {
    expect(frasesDoRanking({ ...perfil, escola_id: null }, { ...resumo, escola: null }, undefined, "Cohama")).toHaveLength(1);
  });
});
