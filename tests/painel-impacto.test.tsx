import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErroApi } from "@/lib/api/erro";
import { criarRequisicao } from "@/lib/api/http";
import { criarClienteReal } from "@/lib/api/real";
import { CHAVE_IMPACTO_SIMULADA, criarSimulado, gerarCsvImpacto, IMPACTO_SIMULADO } from "@/lib/api/simulado";
import { formatarPeriodoImpacto, TelaImpacto } from "@/telas/TelaImpacto";
import type { PainelImpacto } from "@/types";

const api = vi.hoisted(() => ({
  obterImpacto: vi.fn(),
  exportarImpactoCsv: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const erro = await vi.importActual<typeof import("@/lib/api/erro")>("@/lib/api/erro");
  return { ...erro, api, modoSimulado: false };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("painel de impacto — cliente real e simulado", () => {
  it("envia a chave no cabeçalho X-Chave-Impacto sem Bearer e chama a rota de exportar CSV", async () => {
    const buscar = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(IMPACTO_SIMULADO), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(gerarCsvImpacto(IMPACTO_SIMULADO), {
          status: 200,
          headers: { "Content-Type": "text/csv; charset=utf-8" },
        }),
      );

    const cliente = criarClienteReal(
      criarRequisicao({
        apiUrl: "http://api.teste",
        sessao: { token: async () => "token-estudante", renovar: async () => "token-2" },
        buscar,
      }),
    );

    await cliente.obterImpacto("segredo-123", { de: "2026-10-23", ate: "2026-11-20" });
    expect(buscar).toHaveBeenNthCalledWith(
      1,
      "http://api.teste/api/impacto?de=2026-10-23&ate=2026-11-20",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ "X-Chave-Impacto": "segredo-123" }),
      }),
    );
    const headers1 = (buscar.mock.calls[0]![1] as RequestInit).headers as Record<string, string>;
    expect(headers1.Authorization).toBeUndefined();

    const csv = await cliente.exportarImpactoCsv("segredo-123", { de: "2026-10-23", ate: "2026-11-20" });
    expect(buscar).toHaveBeenNthCalledWith(
      2,
      "http://api.teste/api/impacto/exportar?formato=csv&de=2026-10-23&ate=2026-11-20",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ "X-Chave-Impacto": "segredo-123" }),
      }),
    );
    expect(csv.startsWith("\uFEFFindicador;valor;unidade;periodo_de;periodo_ate;observacao")).toBe(true);
    expect(csv).toContain("4210,5");
    expect(csv).toContain("3742,4");
    expect(csv).not.toContain("missoesRegistradas");
  });

  it("no modo simulado valida a chave (401), o período (400) e formata valores ocultos no CSV", async () => {
    const { api: sim } = criarSimulado({ atrasoMs: 0 });

    await expect(sim.obterImpacto("chave-errada")).rejects.toMatchObject({
      status: 401,
      codigo: "NAO_AUTENTICADO",
    });

    await expect(sim.obterImpacto(CHAVE_IMPACTO_SIMULADA, { de: "2026-11-20", ate: "2026-10-23" })).rejects.toMatchObject({
      status: 400,
      codigo: "ENTRADA_INVALIDA",
    });

    const dados = await sim.obterImpacto(CHAVE_IMPACTO_SIMULADA);
    expect(dados.estimativa).toBe(true);
    expect(dados.economiaEstimada).not.toHaveProperty("missoesRegistradas");

    const impactoOculto: PainelImpacto = {
      ...IMPACTO_SIMULADO,
      estudantes: { comPerfil: null, ativosNoPeriodo: null, verificadosPorTurma: null },
      economiaEstimada: {
        ...IMPACTO_SIMULADO.economiaEstimada,
        potencialHabitos: { kwhMes: null, reaisMes: null, estudantes: null },
      },
    };
    const csvOculto = gerarCsvImpacto(impactoOculto);
    expect(csvOculto).toContain("Estudantes com perfil;;estudantes;2026-10-23;2026-11-20;menos de 3 estudantes");
    expect(csvOculto).toContain('Potencial de hábitos em kWh por mês;;kWh/mês;2026-10-23;2026-11-20;"menos de 3 estudantes;');
  });
});

describe("TelaImpacto", () => {
  it("formata o período com o ano quando os anos forem diferentes e sem ano no mesmo ano", () => {
    expect(formatarPeriodoImpacto("2026-10-23", "2026-11-20")).toBe("23/10 a 20/11");
    expect(formatarPeriodoImpacto("2025-11-21", "2026-11-21")).toBe("21/11/2025 a 21/11/2026");
  });
  it("mostra estado carregando enquanto aguarda a API", async () => {
    api.obterImpacto.mockReturnValue(new Promise(() => {}));
    render(<TelaImpacto />);

    await userEvent.type(screen.getByLabelText("Chave de impacto"), CHAVE_IMPACTO_SIMULADA);
    await userEvent.click(screen.getByRole("button", { name: "Consultar impacto" }));

    expect(screen.getByRole("status", { name: "Carregando o painel de impacto" })).toBeInTheDocument();
  });

  it("exibe erros 401 (chave inválida), 503 (impacto desligado), 400 (período inválido) e 429", async () => {
    api.obterImpacto.mockRejectedValueOnce(new ErroApi(401, "NAO_AUTENTICADO", "Chave inválida."));
    render(<TelaImpacto />);

    await userEvent.type(screen.getByLabelText("Chave de impacto"), "errada");
    await userEvent.click(screen.getByRole("button", { name: "Consultar impacto" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Chave de acesso inválida/i);

    api.obterImpacto.mockRejectedValueOnce(
      new ErroApi(503, "IMPACTO_DESLIGADO", "O painel de impacto está desligado neste ambiente."),
    );
    await userEvent.click(screen.getByRole("button", { name: /Tentar de novo/i }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/painel de impacto está desligado/i);
    });

    api.obterImpacto.mockRejectedValueOnce(
      new ErroApi(400, "ENTRADA_INVALIDA", "O período deve ter no máximo 366 dias."),
    );
    await userEvent.click(screen.getByRole("button", { name: /Tentar de novo/i }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/máximo 366 dias/i);
    });

    api.obterImpacto.mockRejectedValueOnce(
      new ErroApi(429, "LIMITE_DE_REQUISICOES", "Muitas tentativas seguidas. Espere um pouco e tente de novo."),
    );
    await userEvent.click(screen.getByRole("button", { name: /Tentar de novo/i }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Muitas tentativas seguidas/i);
    });
  });

  it("exibe estado oculto ('menos de 3 estudantes') quando os totais vêm null, nunca mostrando 0", async () => {
    const impactoOculto: PainelImpacto = {
      ...IMPACTO_SIMULADO,
      estudantes: { comPerfil: null, ativosNoPeriodo: null, verificadosPorTurma: null },
      aprendizado: {
        licoesConcluidas: null,
        trilhasConcluidas: null,
        respostasDoQuiz: null,
        percentualAcertos: null,
        diagnostico: {
          estudantes: null,
          acertoMedioAntes: null,
          acertoMedioDepois: null,
          porTrilha: IMPACTO_SIMULADO.aprendizado.diagnostico.porTrilha.map((t) => ({
            ...t,
            estudantes: null,
            acertoMedioAntes: null,
            acertoMedioDepois: null,
          })),
        },
      },
      missoes: { registros: null, concluidas: null },
      simulacoes: { salvas: null, estudantesQueSimularam: null },
      economiaEstimada: {
        ...IMPACTO_SIMULADO.economiaEstimada,
        potencialHabitos: { kwhMes: null, reaisMes: null, estudantes: null },
      },
      energinho: { respostasAvaliadas: null, percentualUtil: null },
    };
    api.obterImpacto.mockResolvedValue(impactoOculto);
    render(<TelaImpacto />);

    await userEvent.type(screen.getByLabelText("Chave de impacto"), CHAVE_IMPACTO_SIMULADA);
    await userEvent.click(screen.getByRole("button", { name: "Consultar impacto" }));

    expect(await screen.findByRole("heading", { name: /Potencial de economia com hábitos \(estimativa\)/i })).toBeInTheDocument();
    expect(screen.getAllByText("menos de 5 respostas").length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText("menos de 3 estudantes").length).toBeGreaterThanOrEqual(8);
  });

  it("exibe potencial de economia com 'estimativa' e 'como calculamos', missões só como noites registradas, sem jargão interno, baixa CSV e aciona window.print()", async () => {
    api.obterImpacto.mockResolvedValue(IMPACTO_SIMULADO);
    api.exportarImpactoCsv.mockResolvedValue(gerarCsvImpacto(IMPACTO_SIMULADO));
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
    const createObjectUrlSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:csv-teste");
    const revokeObjectUrlSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const clickAnchorSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    try {
      render(<TelaImpacto />);

      await userEvent.type(screen.getByLabelText("Chave de impacto"), CHAVE_IMPACTO_SIMULADA);
      await userEvent.click(screen.getByRole("button", { name: "Consultar impacto" }));

      expect(await screen.findByRole("heading", { name: /Potencial de economia com hábitos \(estimativa\)/i })).toBeInTheDocument();
      // Palavra "estimativa" e "como calculamos" junto de cada número de economia, e frase de "poderiam economizar / não é economia medida"
      expect(screen.getByText(/Economia mensal em reais \(estimativa\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Energia economizada por mês \(estimativa\)/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Estimativa — como calculamos:/i)).toHaveLength(2);
      expect(screen.getAllByText(/não é economia medida/i).length).toBeGreaterThanOrEqual(1);

      // Missões só como "Noites registradas" (sem kWh/R$ de missões - D-011)
      expect(screen.getByText("Noites registradas")).toBeInTheDocument();
      expect(screen.getByText("512")).toBeInTheDocument();

      // Sem jargão interno (k ≥ 3 ou D-001) e sem repetição de datas entre parênteses
      expect(screen.queryByText(/k\s*≥\s*3/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/D-001/i)).not.toBeInTheDocument();
      expect(screen.getByText("23/10 a 20/11")).toBeInTheDocument();
      expect(screen.getByText(/Grupos com menos de 3 estudantes ficam ocultos/i)).toBeInTheDocument();

      // T-033b / T-035b: Diagnóstico antes e depois e avaliação do Energinho no painel de impacto
      expect(screen.getByRole("heading", { name: "Diagnóstico antes e depois" })).toBeInTheDocument();
      expect(
        screen.getByText(
          "Compara os mesmos estudantes antes e depois da trilha. Não há grupo de comparação, então não mede só o efeito do app.",
        ),
      ).toBeInTheDocument();
      expect(screen.getAllByText("48% antes → 80% depois").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Respostas do Energinho avaliadas como úteis")).toBeInTheDocument();
      expect(screen.getByText("82,1%")).toBeInTheDocument();

      // Botão Salvar em PDF chama window.print()
      await userEvent.click(screen.getByRole("button", { name: "Salvar em PDF" }));
      expect(printSpy).toHaveBeenCalledOnce();

      // Botão Baixar CSV chama api.exportarImpactoCsv
      await userEvent.click(screen.getByRole("button", { name: "Baixar CSV" }));
      await waitFor(() => {
        expect(api.exportarImpactoCsv).toHaveBeenCalledWith(CHAVE_IMPACTO_SIMULADA, undefined);
      });
      expect(createObjectUrlSpy).toHaveBeenCalledOnce();
      expect(clickAnchorSpy).toHaveBeenCalledOnce();

      // D-003: chave só na memória da página
      expect(window.localStorage.length).toBe(0);
      expect(window.sessionStorage.length).toBe(0);
      expect(window.location.search).toBe("");
    } finally {
      printSpy.mockRestore();
      createObjectUrlSpy.mockRestore();
      revokeObjectUrlSpy.mockRestore();
      clickAnchorSpy.mockRestore();
    }
  });

  it("aplica classes de impressão A4 (T-033c) nos blocos, cartões, títulos e grades lado a lado sem cortar cartões", async () => {
    api.obterImpacto.mockResolvedValue(IMPACTO_SIMULADO);
    const { container } = render(<TelaImpacto />);

    await userEvent.type(screen.getByLabelText("Chave de impacto"), CHAVE_IMPACTO_SIMULADA);
    await userEvent.click(screen.getByRole("button", { name: "Consultar impacto" }));

    expect(await screen.findByRole("heading", { name: /Potencial de economia com hábitos \(estimativa\)/i })).toBeInTheDocument();

    // Todos os 5 blocos de resultados têm bloco-impressao (período, potencial de economia, alcance, aprendizado e diagnóstico)
    const blocosImpressao = container.querySelectorAll(".bloco-impressao");
    expect(blocosImpressao).toHaveLength(5);

    // Todos os cartões internos (3 economia + 6 alcance + 7 aprendizado/Energinho + 2 diagnóstico geral + 5 trilhas = 23) têm cartao-impressao
    const cartoesImpressao = container.querySelectorAll(".cartao-impressao");
    expect(cartoesImpressao).toHaveLength(23);

    // O cartão "Respostas do Energinho avaliadas como úteis" tem cartao-impressao e cartao-impressao-largo
    const cartaoEnerginho = screen.getByText("Respostas do Energinho avaliadas como úteis").closest(".cartao-impressao");
    expect(cartaoEnerginho).not.toBeNull();
    expect(cartaoEnerginho).toHaveClass("cartao-impressao", "cartao-impressao-largo");

    // Todos os títulos de bloco (h1 e h2) têm titulo-bloco-impressao para manter o título junto do conteúdo
    const titulos = container.querySelectorAll("h1, h2");
    expect(titulos.length).toBeGreaterThanOrEqual(5);
    for (const titulo of titulos) {
      expect(titulo).toHaveClass("titulo-bloco-impressao");
    }

    // Grades lado a lado na impressão: 3 grades de 2 colunas (alcance+aprendizado, resumo diagnóstico, lista de 5 trilhas) e 3 grades de 3 colunas
    expect(container.querySelectorAll(".grade-impressao-2")).toHaveLength(3);
    expect(container.querySelectorAll(".grade-impressao-3")).toHaveLength(3);

    // Verifica que globals.css define @media print com break-inside: avoid nos cartões/blocos, break-after: avoid nos títulos e fonte >= 9pt
    const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf-8");
    expect(css).toContain("@media print");
    expect(css).toContain(".painel-impacto-impressao .cartao-impressao");
    expect(css).toContain(".painel-impacto-impressao .bloco-impressao");
    expect(css).toContain("break-inside: avoid !important;");
    expect(css).toContain("page-break-inside: avoid !important;");
    expect(css).toContain("break-after: avoid !important;");
    expect(css).toContain("page-break-after: avoid !important;");
    expect(css).toContain("--text-pequeno: 9pt;");
    expect(css).toContain("font-size: 9.5pt !important;");
  });
});
