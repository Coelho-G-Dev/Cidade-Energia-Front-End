import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErroApi } from "@/lib/api/erro";
import { criarRequisicao } from "@/lib/api/http";
import { criarClienteReal } from "@/lib/api/real";
import {
  CODIGO_PROFESSOR_OCULTO_SIMULADO,
  CODIGO_PROFESSOR_SIMULADO,
  criarSimulado,
  PAINEL_PROFESSOR_OCULTO_SIMULADO,
  PAINEL_PROFESSOR_SIMULADO,
} from "@/lib/api/simulado";
import {
  formatarAntesDepois,
  NOTA_COMPARACAO_DIAGNOSTICO,
  percentualOuOculto,
  TelaProfessor,
  valorOuOculto,
} from "@/telas/TelaProfessor";

const api = vi.hoisted(() => ({
  obterPainelProfessor: vi.fn(),
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

describe("painel do professor — cliente real e simulado", () => {
  it("envia o código no cabeçalho X-Codigo-Professor sem Bearer nem query na URL", async () => {
    const buscar = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(PAINEL_PROFESSOR_SIMULADO), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const cliente = criarClienteReal(
      criarRequisicao({
        apiUrl: "http://api.teste",
        sessao: { token: async () => "token-estudante", renovar: async () => "token-2" },
        buscar,
      }),
    );

    const resposta = await cliente.obterPainelProfessor("PRFS2LNASC24");
    expect(resposta.escola.nome).toBe("Escola Estadual Sol Nascente (fictícia)");
    expect(buscar).toHaveBeenCalledWith(
      "http://api.teste/api/professor/escola",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "X-Codigo-Professor": "PRFS2LNASC24",
        }),
      }),
    );
    const headers = (buscar.mock.calls[0]![1] as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it("no modo simulado devolve escola preenchida, escola oculta (< 3 estudantes), 404 para código errado e 429 acima de 30/min", async () => {
    let instante = new Date("2026-11-20T14:00:00Z");
    const { api: sim } = criarSimulado({ atrasoMs: 0, agora: () => instante });

    const preenchida = await sim.obterPainelProfessor(CODIGO_PROFESSOR_SIMULADO);
    expect(preenchida.oculto).toBe(false);
    expect(preenchida.estudantes).toBe(24);
    expect(preenchida.dadosAte).toBe("2026-11-19");
    expect(preenchida.progresso?.trilhas.find((t) => t.slug === "lixo-eletronico-onde-descartar")?.estudantesQueConcluiram).toBeNull();
    // Garante ausência de nome ou id individual de estudante na resposta
    expect(JSON.stringify(preenchida)).not.toMatch(/primeiro_nome|perfil_id/i);

    const oculta = await sim.obterPainelProfessor(CODIGO_PROFESSOR_OCULTO_SIMULADO);
    expect(oculta.oculto).toBe(true);
    expect(oculta.estudantes).toBeNull();
    expect(oculta.progresso).toBeNull();
    expect(oculta.escola.codigoEstudante).toBe("TESTE4EF");

    await expect(sim.obterPainelProfessor("TESTE2AB")).rejects.toMatchObject({
      status: 404,
      codigo: "ESCOLA_NAO_ENCONTRADA",
    });

    for (let i = 0; i < 27; i++) {
      await sim.obterPainelProfessor(CODIGO_PROFESSOR_SIMULADO);
    }
    await expect(sim.obterPainelProfessor(CODIGO_PROFESSOR_SIMULADO)).rejects.toMatchObject({
      status: 429,
      codigo: "LIMITE_DE_REQUISICOES",
    });

    instante = new Date(instante.getTime() + 61_000);
    await expect(sim.obterPainelProfessor(CODIGO_PROFESSOR_SIMULADO)).resolves.toMatchObject({ oculto: false });
  });
});

describe("TelaProfessor", () => {
  it("formata contagens null como 'menos de 3 estudantes' e percentuais null como 'menos de 5 respostas', nunca como 0", () => {
    expect(valorOuOculto(null)).toBe("menos de 3 estudantes");
    expect(valorOuOculto(12, (n) => `${n} estudantes`)).toBe("12 estudantes");
    expect(percentualOuOculto(null)).toBe("menos de 5 respostas");
    expect(percentualOuOculto(71.4)).toBe("71,4%");
    expect(formatarAntesDepois(48, 80)).toBe("48% antes → 80% depois");
    expect(formatarAntesDepois(null, 80)).toBe("menos de 5 respostas");
    expect(formatarAntesDepois(48, null)).toBe("menos de 5 respostas");
  });

  it("mostra estado carregando enquanto aguarda a API", async () => {
    api.obterPainelProfessor.mockReturnValue(new Promise(() => {}));
    render(<TelaProfessor />);

    await userEvent.type(screen.getByLabelText("Código do professor"), "PRFS2LNASC24");
    await userEvent.click(screen.getByRole("button", { name: "Ver painel da escola" }));

    expect(screen.getByRole("status", { name: "Carregando os dados da escola" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Consultando..." })).toBeDisabled();
  });

  it("exibe erro 404 quando o código não é encontrado e erro 429 quando excede o limite", async () => {
    api.obterPainelProfessor.mockRejectedValueOnce(
      new ErroApi(404, "ESCOLA_NAO_ENCONTRADA", "Escola não encontrada."),
    );
    render(<TelaProfessor />);

    await userEvent.type(screen.getByLabelText("Código do professor"), "CODIGOERRADO");
    await userEvent.click(screen.getByRole("button", { name: "Ver painel da escola" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Não encontramos uma escola com esse código/i,
    );

    api.obterPainelProfessor.mockRejectedValueOnce(
      new ErroApi(429, "LIMITE_DE_REQUISICOES", "Muitas tentativas seguidas. Espere um minuto e tente de novo."),
    );
    await userEvent.click(screen.getByRole("button", { name: /Tentar de novo/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Muitas tentativas seguidas/i);
    });
  });

  it("exibe estado oculto ('ainda não há 3 estudantes') com o código para distribuir aos estudantes e sem zero", async () => {
    api.obterPainelProfessor.mockResolvedValue(PAINEL_PROFESSOR_OCULTO_SIMULADO);
    render(<TelaProfessor />);

    await userEvent.type(screen.getByLabelText("Código do professor"), "prfra2luz234");
    await userEvent.click(screen.getByRole("button", { name: "Ver painel da escola" }));

    expect(
      await screen.findByRole("heading", { name: /Ainda não há 3 estudantes verificados nesta escola/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Escola Municipal Raio de Luz (fictícia)")).toBeInTheDocument();
    expect(screen.getAllByText("TESTE4EF").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Estudantes verificados: menos de 3 estudantes/i)).toBeInTheDocument();
    expect(api.obterPainelProfessor).toHaveBeenCalledWith("PRFRA2LUZ234");
  });

  it("exibe progresso, quiz, missões e recortes null como 'menos de 3 estudantes', mantendo o código só em memória", async () => {
    api.obterPainelProfessor.mockResolvedValue(PAINEL_PROFESSOR_SIMULADO);
    render(<TelaProfessor />);

    await userEvent.type(screen.getByLabelText("Código do professor"), CODIGO_PROFESSOR_SIMULADO);
    await userEvent.click(screen.getByRole("button", { name: "Ver painel da escola" }));

    expect(await screen.findByRole("heading", { name: "Escola Estadual Sol Nascente (fictícia)" })).toBeInTheDocument();
    expect(screen.getByText(/Dados até 19\/11/)).toBeInTheDocument();
    expect(screen.getByText("24")).toBeInTheDocument();
    expect(screen.getByText("212")).toBeInTheDocument();
    expect(screen.getByText("71,4%")).toBeInTheDocument();
    expect(screen.getByText("Para que serve o inversor em um sistema solar de casa?")).toBeInTheDocument();
    expect(screen.getByText("Ar desligado antes de dormir")).toBeInTheDocument();
    // Bloco Diagnóstico antes e depois (T-033b) com formato "48% antes → 80% depois" e nota fixa
    expect(screen.getByRole("heading", { name: "Diagnóstico antes e depois" })).toBeInTheDocument();
    expect(screen.getByText(NOTA_COMPARACAO_DIAGNOSTICO)).toBeInTheDocument();
    expect(screen.getByText("48% antes → 80% depois")).toBeInTheDocument();
    // Recortes com 4 pares (menos de 5 respostas) e menos de 3 estudantes
    expect(screen.getAllByText("menos de 5 respostas").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("menos de 3 estudantes").length).toBeGreaterThanOrEqual(2);

    // D-003: código nunca vai para localStorage, sessionStorage ou URL
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
    expect(window.location.search).toBe("");
  });

  it("escola visível com totais ocultos pelo back (menos de 3 com lições, quiz ou dias) não mostra NaN nem 0", async () => {
    // O back (T-021) devolve null em licoesConcluidas, mediaLicoesPorEstudante, quiz.respostas e
    // diasRegistrados quando menos de 3 estudantes participaram daquele recorte.
    api.obterPainelProfessor.mockResolvedValue({
      ...PAINEL_PROFESSOR_SIMULADO,
      progresso: { ...PAINEL_PROFESSOR_SIMULADO.progresso!, licoesConcluidas: null, mediaLicoesPorEstudante: null },
      quiz: { ...PAINEL_PROFESSOR_SIMULADO.quiz!, respostas: null, percentualAcertos: null },
      missoes: PAINEL_PROFESSOR_SIMULADO.missoes!.map((m) => ({ ...m, diasRegistrados: null })),
    });
    render(<TelaProfessor />);

    await userEvent.type(screen.getByLabelText("Código do professor"), CODIGO_PROFESSOR_SIMULADO);
    await userEvent.click(screen.getByRole("button", { name: "Ver painel da escola" }));

    expect(await screen.findByRole("heading", { name: "Escola Estadual Sol Nascente (fictícia)" })).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Média de/)).not.toBeInTheDocument();
    expect(screen.queryByText(/respostas na 1ª tentativa/)).not.toBeInTheDocument();
    expect(screen.getAllByText("menos de 5 respostas").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("menos de 3 estudantes").length).toBeGreaterThanOrEqual(3);
  });
});
