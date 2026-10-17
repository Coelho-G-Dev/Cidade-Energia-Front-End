import { describe, expect, expectTypeOf, it } from "vitest";
import type { z } from "zod";
import { criarSimulado } from "@/lib/api/simulado";
import { APARELHOS, BAIRROS, ESCOLAS, LICOES, MISSOES, PERGUNTAS } from "@/lib/api/simulado/conteudo";
import type { atualizarPerfilSchema } from "@/lib/validacao/perfil";
import type { criarSimulacaoSchema } from "@/lib/validacao/simulacao";
import type { tutorSchema } from "@/lib/validacao/tutor";
import type { AtualizarPerfil, CriarSimulacao, PedidoTutor } from "@/types";

function montar() {
  let agora = new Date("2026-10-17T15:00:00Z");
  const simulado = criarSimulado({ atrasoMs: 0, agora: () => agora });
  return {
    ...simulado,
    avancarHoras: (horas: number) => {
      agora = new Date(agora.getTime() + horas * 3_600_000);
    },
  };
}

const anil = BAIRROS.find((b) => b.nome === "Anil")!.id;
const centro = BAIRROS.find((b) => b.nome === "Centro")!.id;
const solNascente = ESCOLAS.find((e) => e.codigo_turma === "SOL2026")!;

describe("os schemas copiados batem com os tipos de src/types", () => {
  it("entradas", () => {
    expectTypeOf<z.input<typeof atualizarPerfilSchema>>().toEqualTypeOf<AtualizarPerfil>();
    expectTypeOf<z.input<typeof criarSimulacaoSchema>>().toEqualTypeOf<CriarSimulacao>();
    expectTypeOf<z.infer<typeof tutorSchema>>().toExtend<PedidoTutor>();
  });
});

describe("conteúdo gerado do seed", () => {
  it("tem os números do seed do back", () => {
    expect(BAIRROS).toHaveLength(12);
    expect(ESCOLAS).toHaveLength(3);
    expect(APARELHOS.map((a) => a.potencia_w).sort((a, b) => a - b)).toEqual([9, 60, 60, 100, 1000, 5500]);
    expect(LICOES).toHaveLength(18);
    expect(LICOES.filter((l) => l.tipo === "pedale")).toHaveLength(1);
    expect(PERGUNTAS).toHaveLength(20);
    expect(PERGUNTAS.every((p) => p.indiceCorreto < p.opcoes.length)).toBe(true);
    expect(MISSOES).toHaveLength(2);
  });
});

describe("simulador", () => {
  it("reproduz o caso de referência do back (380 kWh, R$ 312)", async () => {
    const { api } = montar();
    const r = await api.previaSimulacao({ modo: "conta", consumoKwh: 380, valorConta: 312 });
    expect(r).toMatchObject({ consumoKwh: 380, gastoMensal: 312, economiaMensal: 31.2, placas: 6, retornoAnos: 2.5, co2EvitadoKgAno: 191.2 });
    expect(r.pesos).toEqual([]);
    expect(r.simulacaoId).toBeNull();
  });

  it("modo aparelhos calcula os pesos somando 100", async () => {
    const { api } = montar();
    const chuveiro = APARELHOS.find((a) => a.codigo === "chuveiro")!;
    const geladeira = APARELHOS.find((a) => a.codigo === "geladeira")!;
    const r = await api.previaSimulacao({
      modo: "aparelhos",
      itens: [
        { aparelhoId: chuveiro.id, quantidade: 1, horasDia: 0.5 },
        { aparelhoId: geladeira.id, quantidade: 1, horasDia: 24 },
      ],
    });
    expect(r.pesos[0]!.aparelho).toBe("Chuveiro elétrico");
    expect(r.pesos.reduce((s, p) => s + p.percentual, 0)).toBeCloseTo(100);
  });

  it("a prévia nunca salva; o resultado com login salva e pontua uma vez só", async () => {
    const { api, sessao } = montar();
    await sessao.entrarAnonimo();
    await api.previaSimulacao({ modo: "conta", consumoKwh: 200 });
    await expect(api.ultimaSimulacao()).rejects.toMatchObject({ status: 404, codigo: "NENHUMA_SIMULACAO" });

    const primeira = await api.simular({ modo: "conta", consumoKwh: 200 });
    expect(primeira.simulacaoId).not.toBeNull();
    expect(primeira.pontosGanhos).toBe(20);
    expect(primeira.conquistasNovas).toEqual([{ slug: "primeira_simulacao", nome: "Primeira simulação" }]);

    const segunda = await api.simular({ modo: "conta", consumoKwh: 210 });
    expect(segunda.pontosGanhos).toBe(0);
    expect((await api.ultimaSimulacao()).consumoKwh).toBe(210);
  });

  it("valida a entrada com a mesma mensagem do back", async () => {
    const { api } = montar();
    await expect(api.previaSimulacao({ modo: "conta", consumoKwh: 0 })).rejects.toMatchObject({
      status: 400,
      codigo: "ENTRADA_INVALIDA",
      message: "consumoKwh: O consumo deve ser maior que zero.",
    });
  });
});

describe("login e perfil", () => {
  it("rotas com login respondem 401 sem sessão", async () => {
    const { api } = montar();
    await expect(api.obterPerfil()).rejects.toMatchObject({ status: 401, codigo: "NAO_AUTENTICADO" });
    await expect(api.listarTrilhas()).resolves.toHaveLength(5);
  });

  it("cria o perfil e verifica a escola só pelo código de turma", async () => {
    const { api, sessao } = montar();
    await sessao.entrarAnonimo();
    expect((await api.obterPerfil()).tem_perfil).toBe(false);

    const pelaLista = await api.atualizarPerfil({ primeiro_nome: "Ana", bairro_id: anil, escola_id: solNascente.id });
    expect(pelaLista).toMatchObject({ tem_perfil: true, escola_id: solNascente.id, escola_verificada: false });

    const peloCodigo = await api.atualizarPerfil({ primeiro_nome: "Ana", bairro_id: anil, codigo_turma: "sol2026" });
    expect(peloCodigo.escola_verificada).toBe(true);

    await expect(api.atualizarPerfil({ primeiro_nome: "Ana", bairro_id: anil, codigo_turma: "XYZ999" })).rejects.toMatchObject({
      codigo: "TURMA_NAO_ENCONTRADA",
    });
    await expect(api.atualizarPerfil({ primeiro_nome: "Ana Maria", bairro_id: anil })).rejects.toMatchObject({
      codigo: "ENTRADA_INVALIDA",
    });
  });

  it("limita a 3 trocas de bairro em 30 dias", async () => {
    const { api, sessao } = montar();
    await sessao.entrarAnonimo();
    await api.atualizarPerfil({ primeiro_nome: "Ana", bairro_id: anil });
    for (let i = 0; i < 3; i++) await api.atualizarPerfil({ primeiro_nome: "Ana", bairro_id: i % 2 ? anil : centro });
    expect((await api.obterPerfil()).trocas_restantes).toBe(0);
    await expect(api.atualizarPerfil({ primeiro_nome: "Ana", bairro_id: anil })).rejects.toMatchObject({
      status: 429,
      codigo: "LIMITE_DE_TROCAS",
    });
  });
});

describe("quiz segue as regras do Dia 4 do back", () => {
  const pergunta = PERGUNTAS[0]!;
  const errada = (pergunta.indiceCorreto + 1) % pergunta.opcoes.length;

  it("resposta errada não traz explicação nem libera nova tentativa antes de 24 h", async () => {
    const { api, sessao, avancarHoras } = montar();
    await sessao.entrarAnonimo();
    await api.concluirLicao(pergunta.licaoId);

    const r = await api.responderQuiz({ perguntaId: pergunta.id, opcao: errada });
    expect(r).toMatchObject({ correta: false, explicacao: null, tentativaPontuavel: true, pontosGanhos: 0 });
    expect(r.proximaTentativaEm).not.toBeNull();

    await expect(api.responderQuiz({ perguntaId: pergunta.id, opcao: pergunta.indiceCorreto })).rejects.toMatchObject({
      status: 429,
      codigo: "AGUARDE_NOVA_TENTATIVA",
    });
    const quiz = await api.obterQuiz(pergunta.licaoId);
    expect(quiz.perguntas[0]).toMatchObject({ jaRespondida: true, acertou: false, podePontuar: false });

    avancarHoras(24);
    const certa = await api.responderQuiz({ perguntaId: pergunta.id, opcao: pergunta.indiceCorreto });
    expect(certa).toMatchObject({ correta: true, explicacao: pergunta.explicacao, pontosGanhos: 5 });
  });

  it("depois de acertar, pode responder de novo sem pontos", async () => {
    const { api, sessao } = montar();
    await sessao.entrarAnonimo();
    await api.concluirLicao(pergunta.licaoId);
    await api.responderQuiz({ perguntaId: pergunta.id, opcao: pergunta.indiceCorreto });
    const de_novo = await api.responderQuiz({ perguntaId: pergunta.id, opcao: errada });
    expect(de_novo).toMatchObject({ correta: false, explicacao: null, tentativaPontuavel: false, pontosGanhos: 0 });
  });
});

describe("lições na ordem, como no back", () => {
  const solar = LICOES.filter((l) => l.trilhaSlug === "energia-solar-em-sao-luis").sort((a, b) => a.ordem - b.ordem);
  const [l1, l2, pedale] = solar as [(typeof LICOES)[number], (typeof LICOES)[number], (typeof LICOES)[number]];

  it("só a primeira lição começa liberada, e a lição diz qual falta", async () => {
    const { api, sessao } = montar();
    await sessao.entrarAnonimo();
    expect((await api.obterTrilha("energia-solar-em-sao-luis")).licoes.map((l) => l.liberada)).toEqual([true, false, false, false]);
    expect(await api.obterLicao(l2.id)).toMatchObject({ liberada: false, licaoPendente: { id: l1.id, titulo: l1.titulo } });
    await api.concluirLicao(l1.id);
    expect((await api.obterTrilha("energia-solar-em-sao-luis")).licoes.map((l) => l.liberada)).toEqual([true, true, false, false]);
    expect(await api.obterLicao(l2.id)).toMatchObject({ liberada: true, licaoPendente: null });
  });

  it("concluir fora de ordem dá 409 LICAO_BLOQUEADA, inclusive no Pedale", async () => {
    const { api, sessao } = montar();
    await sessao.entrarAnonimo();
    await expect(api.concluirLicao(l2.id)).rejects.toMatchObject({ status: 409, codigo: "LICAO_BLOQUEADA", message: `Conclua antes a lição "${l1.titulo}".` });
    await expect(api.concluirPedale(pedale.id)).rejects.toMatchObject({ status: 409, codigo: "LICAO_BLOQUEADA" });
  });

  it("o quiz só abre com a lição concluída, sem gravar a tentativa recusada", async () => {
    const { api, sessao } = montar();
    await sessao.entrarAnonimo();
    const pergunta = PERGUNTAS.find((p) => p.licaoId === l1.id)!;
    const antes = await api.obterQuiz(l1.id);
    expect(antes.licaoConcluida).toBe(false);
    expect(antes.perguntas.every((p) => !p.podePontuar)).toBe(true);
    await expect(api.responderQuiz({ perguntaId: pergunta.id, opcao: 0 })).rejects.toMatchObject({ status: 409, codigo: "LICAO_NAO_CONCLUIDA" });

    await api.concluirLicao(l1.id);
    const depois = await api.obterQuiz(l1.id);
    expect(depois.licaoConcluida).toBe(true);
    expect(depois.perguntas[0]).toMatchObject({ jaRespondida: false, podePontuar: true });
  });
});

describe("lições, pedale, missões e conquistas", () => {
  it("concluir toda a trilha solar dá a conquista Amigo do sol", async () => {
    const { api, sessao } = montar();
    await sessao.entrarAnonimo();
    const trilha = await api.obterTrilha("energia-solar-em-sao-luis");
    let novas: string[] = [];
    for (const licao of trilha.licoes) {
      const r = licao.tipo === "pedale" ? await api.concluirPedale(licao.id) : await api.concluirLicao(licao.id);
      expect(r.pontosGanhos).toBe(licao.tipo === "pedale" ? 15 : 10);
      novas = novas.concat(r.conquistasNovas.map((c) => c.slug));
    }
    expect(novas).toContain("amigo_do_sol");
    expect((await api.listarTrilhas()).find((t) => t.slug === "energia-solar-em-sao-luis")?.concluida).toBe(true);
  });

  it("recusa a lição de pedale pela rota de texto e vice-versa", async () => {
    const { api, sessao } = montar();
    await sessao.entrarAnonimo();
    const pedale = LICOES.find((l) => l.tipo === "pedale")!;
    const texto = LICOES.find((l) => l.tipo === "texto")!;
    await expect(api.concluirLicao(pedale.id)).rejects.toMatchObject({ codigo: "LICAO_E_PEDALE" });
    await expect(api.concluirPedale(texto.id)).rejects.toMatchObject({ codigo: "LICAO_NAO_E_PEDALE" });
  });

  it("missão aceita um registro por dia e pontua ao completar", async () => {
    const { api, sessao, avancarHoras } = montar();
    await sessao.entrarAnonimo();
    const noites = MISSOES.find((m) => m.diasNecessarios === 3)!;
    expect((await api.registrarMissao(noites.id)).novoRegistro).toBe(true);
    expect((await api.registrarMissao(noites.id)).novoRegistro).toBe(false);
    avancarHoras(24);
    await api.registrarMissao(noites.id);
    avancarHoras(24);
    const final = await api.registrarMissao(noites.id);
    expect(final).toMatchObject({ diasRegistrados: 3, concluida: true, pontosGanhos: noites.pontos });
    expect(final.diasMarcados).toEqual(["2026-10-17", "2026-10-18", "2026-10-19"]);
    expect((await api.listarMissoes()).find((m) => m.id === noites.id)?.diasMarcados).toEqual(["2026-10-17", "2026-10-18", "2026-10-19"]);
    expect(final.conquistasNovas.map((c) => c.slug)).toContain("noites_frescas");
  });

  it("cada missão diz a sua trilha", async () => {
    const { api } = montar();
    const missoes = await api.listarMissoes();
    expect(Object.fromEntries(missoes.map((m) => [m.slug, m.trilhaSlug]))).toEqual({
      "ar-desligado-antes-de-dormir": "ar-condicionado-sem-susto",
      "descarte-de-lixo-eletronico": "lixo-eletronico-onde-descartar",
    });
    expect(missoes.every((m) => m.diasMarcados.length === 0)).toBe(true);
  });

  it("a lição informa a próxima da trilha", async () => {
    const { api } = montar();
    const primeira = LICOES.find((l) => l.trilhaSlug === "energia-solar-em-sao-luis" && l.ordem === 1)!;
    const segunda = LICOES.find((l) => l.trilhaSlug === "energia-solar-em-sao-luis" && l.ordem === 2)!;
    expect((await api.obterLicao(primeira.id)).proximaLicaoId).toBe(segunda.id);
    await expect(api.obterLicao("0c000000-0000-4000-8000-999999999999")).rejects.toMatchObject({ codigo: "LICAO_NAO_ENCONTRADA" });
  });
});

describe("rankings", () => {
  it("só lista quem tem pontos e soma os pontos do estudante ao bairro", async () => {
    const { api, sessao } = montar();
    const antes = await api.listarRanking("bairros");
    expect(antes.every((l) => l.pontos > 0)).toBe(true);
    const anilAntes = antes.find((l) => l.id === anil)!.pontos;

    await sessao.entrarAnonimo();
    await api.atualizarPerfil({ primeiro_nome: "Ana", bairro_id: anil, escola_id: solNascente.id });
    await api.simular({ modo: "conta", consumoKwh: 200 });

    expect((await api.listarRanking("bairros")).find((l) => l.id === anil)!.pontos).toBe(anilAntes + 20);
    const escolaSemCodigo = (await api.listarRanking("escolas")).find((l) => l.id === solNascente.id)!;
    expect(escolaSemCodigo.pontos).toBe(120);

    await api.atualizarPerfil({ primeiro_nome: "Ana", bairro_id: anil, codigo_turma: "SOL2026" });
    expect((await api.listarRanking("escolas")).find((l) => l.id === solNascente.id)!.pontos).toBe(140);
    expect((await api.obterResumo()).escola).toEqual({ posicao: 1, pontos: 140 });
  });

  it("valida o tipo", async () => {
    const { api } = montar();
    await expect(api.listarRanking("cidades" as "bairros")).rejects.toMatchObject({ codigo: "ENTRADA_INVALIDA" });
  });
});

describe("tutor", () => {
  it("responde com lição relacionada e respeita o limite por hora", async () => {
    const { api, sessao } = montar();
    await sessao.entrarAnonimo();
    const r = await api.perguntarAoTutor({ mensagem: "Como a placa solar funciona?" });
    expect(r.licoesRelacionadas[0]?.titulo).toBe("Como a placa solar funciona");
    for (let i = 0; i < 19; i++) await api.perguntarAoTutor({ mensagem: "oi" });
    await expect(api.perguntarAoTutor({ mensagem: "oi" })).rejects.toMatchObject({ status: 429, codigo: "LIMITE_TUTOR" });
  });

  it("fora do tema não indica lição", async () => {
    const { api, sessao } = montar();
    await sessao.entrarAnonimo();
    expect((await api.perguntarAoTutor({ mensagem: "Quem ganhou o jogo de futebol?" })).licoesRelacionadas).toEqual([]);
  });
});
