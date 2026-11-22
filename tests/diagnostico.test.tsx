import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConversaTutor } from "@/components/app/ConversaTutor";
import { ProvedorCelebracao } from "@/components/app/Celebracao";
import { ErroApi } from "@/lib/api/erro";
import { criarRequisicao } from "@/lib/api/http";
import { criarClienteReal } from "@/lib/api/real";
import { criarSimulado, PERGUNTAS_DIAGNOSTICO, perguntasDiagnosticoSemGabarito } from "@/lib/api/simulado";
import { LICOES } from "@/lib/api/simulado/conteudo";
import { limparCache } from "@/lib/cacheDados";
import { TelaDiagnostico } from "@/telas/TelaDiagnostico";
import { TelaLicao } from "@/telas/TelaLicao";
import { TelaTrilhas } from "@/telas/TelaTrilhas";

const api = vi.hoisted(() => ({
  obterDiagnostico: vi.fn(),
  enviarDiagnostico: vi.fn(),
  listarTrilhas: vi.fn(),
  listarMissoes: vi.fn(),
  obterTrilha: vi.fn(),
  obterLicao: vi.fn(),
  obterQuiz: vi.fn(),
  perguntarAoTutor: vi.fn(),
  avaliarTutor: vi.fn(),
}));

const sessao = vi.hoisted(() => ({
  token: vi.fn(async (): Promise<string | null> => "token"),
}));

const roteador = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const erro = await vi.importActual<typeof import("@/lib/api/erro")>("@/lib/api/erro");
  return { ...erro, api, sessao, modoSimulado: false };
});

vi.mock("next/navigation", () => ({
  useRouter: () => roteador,
  usePathname: () => "/trilhas/energia-solar-em-sao-luis/diagnostico",
}));

beforeEach(() => {
  vi.clearAllMocks();
  limparCache();
  sessao.token.mockResolvedValue("token");
});

describe("diagnóstico e avaliação do Energinho — cliente real e simulado", () => {
  it("cliente real chama as rotas de diagnóstico e de avaliar tutor com autenticação exigida", async () => {
    const requisitar = vi.fn(async () => ({}));
    const cliente = criarClienteReal(requisitar as unknown as ReturnType<typeof criarRequisicao>);

    await cliente.obterDiagnostico("energia-solar-em-sao-luis", "antes");
    expect(requisitar).toHaveBeenNthCalledWith(
      1,
      "/api/trilhas/energia-solar-em-sao-luis/diagnostico?momento=antes",
      { autenticacao: "exigida" },
    );

    const envio = {
      momento: "antes" as const,
      respostas: [{ perguntaId: "05000000-0000-4000-8000-000000000101", opcao: 0 }],
    };
    await cliente.enviarDiagnostico("energia-solar-em-sao-luis", envio);
    expect(requisitar).toHaveBeenNthCalledWith(
      2,
      "/api/trilhas/energia-solar-em-sao-luis/diagnostico",
      { metodo: "POST", corpo: envio, autenticacao: "exigida" },
    );

    await cliente.avaliarTutor({ respostaId: "r-1", util: false, motivo: "confusa" });
    expect(requisitar).toHaveBeenNthCalledWith(
      3,
      "/api/tutor/avaliar",
      { metodo: "POST", corpo: { respostaId: "r-1", util: false, motivo: "confusa" }, autenticacao: "exigida" },
    );
  });

  it("simulado respeita as regras do D-013: 'antes' sem gabarito e só antes da 1ª lição; 'depois' só após concluir a trilha e o 'antes'; 409 na 2ª tentativa", async () => {
    const { api: sim, sessao: sessaoSim } = criarSimulado({ atrasoMs: 0 });
    await sessaoSim.entrarAnonimo();
    const slug = "energia-solar-em-sao-luis";

    // 'depois' não está disponível antes da trilha concluída
    const depoisAntes = await sim.obterDiagnostico(slug, "depois");
    expect(depoisAntes).toEqual({ momento: "depois", disponivel: false, respondido: false, perguntas: [] });

    // 'antes' disponível e sem indiceCorreto nem explicacao
    const antes = await sim.obterDiagnostico(slug, "antes");
    expect(antes.disponivel).toBe(true);
    expect(antes.respondido).toBe(false);
    expect(antes.perguntas).toHaveLength(4);
    for (const p of antes.perguntas) {
      expect(p).not.toHaveProperty("indiceCorreto");
      expect(p).not.toHaveProperty("explicacao");
    }

    // Envio parcial dá 400 ENTRADA_INVALIDA
    await expect(
      sim.enviarDiagnostico(slug, {
        momento: "antes",
        respostas: [{ perguntaId: antes.perguntas[0]!.id, opcao: 0 }],
      }),
    ).rejects.toMatchObject({ status: 400, codigo: "ENTRADA_INVALIDA" });

    // Gabarito aprovado da trilha solar (D1.1 a D1.4): [1, 3, 0, 2]
    expect(PERGUNTAS_DIAGNOSTICO.map((p) => p.indiceCorreto)).toEqual([
      1, 3, 0, 2, 0, 2, 3, 1, 3, 0, 1, 2, 2, 1, 3, 0, 0, 3, 2, 1,
    ]);
    const gabarito = [1, 3, 0, 2];

    // Envio do 'antes': acerta 2 (primeiras com gabarito[i]) e erra 2 (últimas com opção 1)
    const envioAntes = await sim.enviarDiagnostico(slug, {
      momento: "antes",
      respostas: antes.perguntas.map((p, i) => ({ perguntaId: p.id, opcao: i < 2 ? gabarito[i]! : 1 })),
    });
    expect(envioAntes).toEqual({ momento: "antes", registrado: true });
    expect(envioAntes).not.toHaveProperty("acertosAntes");

    // 2ª tentativa no 'antes' dá 409 DIAGNOSTICO_JA_RESPONDIDO
    await expect(
      sim.enviarDiagnostico(slug, {
        momento: "antes",
        respostas: antes.perguntas.map((p) => ({ perguntaId: p.id, opcao: 0 })),
      }),
    ).rejects.toMatchObject({ status: 409, codigo: "DIAGNOSTICO_JA_RESPONDIDO" });

    // Tentar enviar 'depois' antes de concluir as lições dá 409 DIAGNOSTICO_INDISPONIVEL
    await expect(
      sim.enviarDiagnostico(slug, {
        momento: "depois",
        respostas: antes.perguntas.map((p) => ({ perguntaId: p.id, opcao: 0 })),
      }),
    ).rejects.toMatchObject({ status: 409, codigo: "DIAGNOSTICO_INDISPONIVEL" });

    // Conclui todas as lições da trilha solar
    const licoesSolar = LICOES.filter((l) => l.trilhaSlug === slug).sort((a, b) => a.ordem - b.ordem);
    for (const l of licoesSolar) {
      if (l.tipo === "pedale") await sim.concluirPedale(l.id);
      else await sim.concluirLicao(l.id);
    }

    const depois = await sim.obterDiagnostico(slug, "depois");
    expect(depois.disponivel).toBe(true);
    expect(depois.perguntas).toHaveLength(4);

    // No 'depois' acerta as 4 (gabarito da trilha solar: 1, 3, 0, 2)
    const envioDepois = await sim.enviarDiagnostico(slug, {
      momento: "depois",
      respostas: depois.perguntas.map((p, i) => ({ perguntaId: p.id, opcao: gabarito[i]! })),
    });
    expect(envioDepois).toMatchObject({
      momento: "depois",
      registrado: true,
      total: 4,
      acertosAntes: 2,
      acertosDepois: 4,
    });
  });

  it("simulado devolve respostaId no tutor e permite avaliar uma única vez", async () => {
    const { api: sim, sessao: sessaoSim } = criarSimulado({ atrasoMs: 0 });
    await sessaoSim.entrarAnonimo();

    const r = await sim.perguntarAoTutor({ mensagem: "Como a placa solar funciona?" });
    expect(r.respostaId).toBeDefined();

    await expect(sim.avaliarTutor({ respostaId: r.respostaId!, util: true })).resolves.toEqual({ registrado: true });
    await expect(sim.avaliarTutor({ respostaId: r.respostaId!, util: false })).rejects.toMatchObject({
      status: 409,
      codigo: "AVALIACAO_JA_REGISTRADA",
    });
    await expect(sim.avaliarTutor({ respostaId: "inexistente", util: true })).rejects.toMatchObject({
      status: 404,
      codigo: "RESPOSTA_NAO_ENCONTRADA",
    });
  });
});

describe("TelaDiagnostico", () => {
  const slug = "energia-solar-em-sao-luis";
  const perguntas = perguntasDiagnosticoSemGabarito(slug);

  it("mostra estado carregando e estado de erro", async () => {
    api.obterDiagnostico.mockReturnValueOnce(new Promise(() => {}));
    const { unmount } = render(<TelaDiagnostico slug={slug} momento="antes" />);
    expect(screen.getByRole("status", { name: "Carregando o diagnóstico" })).toBeInTheDocument();
    unmount();

    limparCache();
    api.obterDiagnostico.mockRejectedValueOnce(new ErroApi(500, "ERRO_INTERNO", "Erro interno."));
    render(<TelaDiagnostico slug={slug} momento="antes" />);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  it("mostra estados indisponível e já respondido", async () => {
    api.obterDiagnostico.mockResolvedValueOnce({
      momento: "antes",
      disponivel: false,
      respondido: false,
      perguntas: [],
    });
    const { unmount } = render(<TelaDiagnostico slug={slug} momento="antes" />);
    expect(await screen.findByText("O diagnóstico inicial não está mais disponível")).toBeInTheDocument();
    unmount();

    limparCache();
    api.obterDiagnostico.mockResolvedValueOnce({
      momento: "antes",
      disponivel: false,
      respondido: true,
      perguntas: [],
    });
    render(<TelaDiagnostico slug={slug} momento="antes" />);
    expect(await screen.findByText("Você já respondeu este diagnóstico")).toBeInTheDocument();
  });

  it("no 'antes': mostra botão Pular sempre visível, uma pergunta por tela, e ao enviar mostra só 'Respostas guardadas' sem gabarito", async () => {
    api.obterDiagnostico.mockResolvedValue({
      momento: "antes",
      disponivel: true,
      respondido: false,
      perguntas,
    });
    api.enviarDiagnostico.mockResolvedValue({ momento: "antes", registrado: true });

    render(<TelaDiagnostico slug={slug} momento="antes" />);

    for (let i = 0; i < perguntas.length; i++) {
      const p = perguntas[i]!;
      expect(await screen.findByRole("heading", { name: p.enunciado })).toBeInTheDocument();
      // Botão Pular sempre visível no "antes"
      expect(screen.getByRole("button", { name: "Pular" })).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: p.opcoes[0]! }));

      if (i < perguntas.length - 1) {
        await userEvent.click(screen.getByRole("button", { name: "Próxima pergunta" }));
      } else {
        await userEvent.click(screen.getByRole("button", { name: "Guardar respostas" }));
      }
    }

    expect(await screen.findByRole("heading", { name: "Respostas guardadas" })).toBeInTheDocument();
    expect(screen.queryByText(/Resposta certa:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Você acertou/i)).not.toBeInTheDocument();
  });

  it("no 'depois': mostra 'Você acertou X de 4 antes e Y de 4 agora' com gabarito e explicação", async () => {
    api.obterDiagnostico.mockResolvedValue({
      momento: "depois",
      disponivel: true,
      respondido: false,
      perguntas,
    });
    api.enviarDiagnostico.mockResolvedValue({
      momento: "depois",
      registrado: true,
      total: 4,
      acertosAntes: 1,
      acertosDepois: 4,
      perguntas: [
        { perguntaId: perguntas[0]!.id, indiceCorreto: 1, acertouAntes: true, acertouDepois: true, explicacao: "Explicação 1." },
        { perguntaId: perguntas[1]!.id, indiceCorreto: 3, acertouAntes: false, acertouDepois: true, explicacao: "Explicação 2." },
        { perguntaId: perguntas[2]!.id, indiceCorreto: 0, acertouAntes: false, acertouDepois: true, explicacao: "Explicação 3." },
        { perguntaId: perguntas[3]!.id, indiceCorreto: 2, acertouAntes: false, acertouDepois: true, explicacao: "Explicação 4." },
      ],
    });

    render(<TelaDiagnostico slug={slug} momento="depois" />);

    for (let i = 0; i < perguntas.length; i++) {
      const p = perguntas[i]!;
      expect(await screen.findByRole("heading", { name: p.enunciado })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Pular" })).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: p.opcoes[0]! }));

      if (i < perguntas.length - 1) {
        await userEvent.click(screen.getByRole("button", { name: "Próxima pergunta" }));
      } else {
        await userEvent.click(screen.getByRole("button", { name: "Guardar respostas" }));
      }
    }

    expect(await screen.findByText("Você acertou 1 de 4 antes e 4 de 4 agora.")).toBeInTheDocument();
    expect(
      screen.getByText(/Resposta certa: As nuvens diminuem um pouco essa energia, mas ela continua alta/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Explicação 1.")).toBeInTheDocument();
  });
});

describe("convites do diagnóstico em TelaTrilhas e TelaLicao", () => {
  it("mostra 'Ver o que você já sabe' sem lição concluída e 'Ver o quanto você aprendeu' com a trilha concluída", async () => {
    api.listarTrilhas.mockResolvedValue([
      {
        id: "t1",
        slug: "energia-solar-em-sao-luis",
        titulo: "Energia solar em São Luís",
        descricao: "Descrição",
        tema: "solar",
        minutos: 15,
        totalLicoes: 4,
        licoesConcluidas: 0,
        concluida: false,
      },
      {
        id: "t2",
        slug: "a-energia-do-maranhao",
        titulo: "A energia do Maranhão",
        descricao: "Descrição",
        tema: "renovaveis",
        minutos: 15,
        totalLicoes: 4,
        licoesConcluidas: 4,
        concluida: true,
      },
    ]);
    api.listarMissoes.mockResolvedValue([]);

    const { unmount } = render(<TelaTrilhas />);
    expect(await screen.findByRole("link", { name: "Ver o que você já sabe" })).toHaveAttribute(
      "href",
      "/trilhas/energia-solar-em-sao-luis/diagnostico?momento=antes",
    );
    expect(screen.getByRole("link", { name: "Ver o quanto você aprendeu" })).toHaveAttribute(
      "href",
      "/trilhas/a-energia-do-maranhao/diagnostico?momento=depois",
    );
    unmount();

    limparCache();
    api.obterTrilha.mockResolvedValue({
      slug: "energia-solar-em-sao-luis",
      titulo: "Energia solar em São Luís",
      tema: "solar",
      totalLicoes: 4,
      licoesConcluidas: 4,
      concluida: true,
      licoes: [{ id: "l4", ordem: 4, titulo: "Última lição", tipo: "texto", concluida: true, liberada: true }],
    });
    api.obterLicao.mockResolvedValue({
      id: "l4",
      trilha: { slug: "energia-solar-em-sao-luis", titulo: "Energia solar em São Luís" },
      ordem: 4,
      titulo: "Última lição",
      conteudo: "Texto final.",
      tipo: "texto",
      totalPerguntas: 0,
      concluida: true,
      liberada: true,
      licaoPendente: null,
      proximaLicaoId: null,
    });
    api.obterQuiz.mockResolvedValue({ licaoId: "l4", licaoConcluida: true, perguntas: [] });

    render(
      <ProvedorCelebracao>
        <TelaLicao slug="energia-solar-em-sao-luis" licaoId="l4" />
      </ProvedorCelebracao>,
    );
    expect(await screen.findByRole("link", { name: "Ver o quanto você aprendeu" })).toHaveAttribute(
      "href",
      "/trilhas/energia-solar-em-sao-luis/diagnostico?momento=depois",
    );
  });
});

describe("T-035b — 'Ajudou? Sim / Não' em ConversaTutor", () => {
  it("mostra Sim/Não quando há respostaId, abre 3 motivos no Não, envia o voto e mostra Obrigado!", async () => {
    api.perguntarAoTutor
      .mockResolvedValueOnce({
        resposta: "O kWh mede a energia consumida.",
        licoesRelacionadas: [],
        respostaId: "resp-1",
      })
      .mockResolvedValueOnce({
        resposta: "A bandeira verde não tem custo extra.",
        licoesRelacionadas: [],
        respostaId: "resp-2",
      });
    api.avaliarTutor.mockResolvedValue({ registrado: true });

    render(<ConversaTutor />);

    // Envia primeira pergunta e vota "Sim"
    await userEvent.click(screen.getByRole("button", { name: "O que é kWh?" }));
    expect(await screen.findByText("O kWh mede a energia consumida.")).toBeInTheDocument();
    expect(screen.getByText("Ajudou?")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Sim" }));

    await waitFor(() => {
      expect(api.avaliarTutor).toHaveBeenCalledWith({ respostaId: "resp-1", util: true });
    });
    expect(await screen.findByText("Obrigado!")).toBeInTheDocument();

    // Envia segunda pergunta, clica em "Não" e escolhe um dos 3 motivos ("Fora do assunto")
    await userEvent.type(screen.getByLabelText("Sua dúvida"), "E a bandeira verde?");
    await userEvent.click(screen.getByRole("button", { name: "Enviar pergunta" }));
    expect(await screen.findByText("A bandeira verde não tem custo extra.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Não" }));
    expect(screen.getByRole("button", { name: "Resposta errada" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confusa" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fora do assunto" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Fora do assunto" }));
    await waitFor(() => {
      expect(api.avaliarTutor).toHaveBeenCalledWith({
        respostaId: "resp-2",
        util: false,
        motivo: "fora_do_tema",
      });
    });
    expect(screen.getAllByText("Obrigado!")).toHaveLength(2);
  });

  it("não mostra os botões de avaliação quando a resposta vem sem respostaId (back antigo)", async () => {
    api.perguntarAoTutor.mockResolvedValueOnce({
      resposta: "Resposta do servidor antigo sem id.",
      licoesRelacionadas: [],
    });

    render(<ConversaTutor />);
    await userEvent.click(screen.getByRole("button", { name: "O que é kWh?" }));
    expect(await screen.findByText("Resposta do servidor antigo sem id.")).toBeInTheDocument();
    expect(screen.queryByText("Ajudou?")).not.toBeInTheDocument();
  });
});
