import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProvedorCelebracao } from "@/components/app/Celebracao";
import { ErroApi } from "@/lib/api/erro";
import { criarRequisicao } from "@/lib/api/http";
import { carregar, invalidar, lerEntrada, preCarregar, VALIDADE_MS } from "@/lib/cacheDados";
import { horaEmSaoLuis, saudacaoPara, useSaudacao } from "@/lib/saudacao";
import { useDados } from "@/lib/useDados";
import { TelaEntrar } from "@/telas/TelaEntrar";
import { TelaInicio, textosDoSol } from "@/telas/TelaInicio";
import { TelaLicao } from "@/telas/TelaLicao";
import { TelaMissao } from "@/telas/TelaMissao";
import { TelaSimuladorAparelhos } from "@/telas/TelaSimuladorAparelhos";
import { TelaSimuladorConta } from "@/telas/TelaSimuladorConta";
import { RESULTADO_REFERENCIA } from "./dados";

const api = vi.hoisted(() => ({
  obterPerfil: vi.fn(),
  solDeHoje: vi.fn(),
  listarTrilhas: vi.fn(),
  listarMissoes: vi.fn(),
  obterTrilha: vi.fn(),
  obterLicao: vi.fn(),
  obterQuiz: vi.fn(),
  concluirLicao: vi.fn(),
  registrarMissao: vi.fn(),
  simular: vi.fn(),
  previaSimulacao: vi.fn(),
  listarAparelhos: vi.fn(),
  listarBairros: vi.fn(),
  listarEscolas: vi.fn(),
  atualizarPerfil: vi.fn(),
}));

const sessao = vi.hoisted(() => ({
  token: vi.fn(async (): Promise<string | null> => "token"),
  entrarAnonimo: vi.fn(async () => "token"),
}));

const roteador = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }));

vi.mock("@/lib/api", async () => {
  const erro = await vi.importActual<typeof import("@/lib/api/erro")>("@/lib/api/erro");
  return { ...erro, api, sessao };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/inicio",
  useRouter: () => roteador,
}));

const LIMITE = new ErroApi(429, "LIMITE_DE_REQUISICOES", "Muitas ações seguidas. Espere um pouco e tente de novo.");

beforeEach(() => {
  vi.clearAllMocks();
  sessao.token.mockResolvedValue("token");
  api.previaSimulacao.mockResolvedValue(RESULTADO_REFERENCIA);
});

describe("saudação", () => {
  it("usa o horário de São Luís, qualquer que seja o fuso do aparelho", () => {
    // São Luís fica em UTC-3 o ano todo.
    expect(horaEmSaoLuis(new Date("2026-10-22T09:00:00Z"))).toBe(6);
    expect(saudacaoPara(new Date("2026-10-22T09:00:00Z"))).toBe("Bom dia");
    expect(saudacaoPara(new Date("2026-10-22T16:00:00Z"))).toBe("Boa tarde");
    expect(saudacaoPara(new Date("2026-10-22T23:00:00Z"))).toBe("Boa noite");
    expect(saudacaoPara(new Date("2026-10-22T05:00:00Z"))).toBe("Boa noite");
  });

  function Saudacao() {
    return <span>{useSaudacao()}</span>;
  }

  it("no servidor mostra um texto neutro; no navegador, a saudação da hora", () => {
    expect(renderToString(<Saudacao />)).toContain("Olá");
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      for (const [iso, esperado] of [
        ["2026-10-22T09:00:00Z", "Bom dia"],
        ["2026-10-22T16:00:00Z", "Boa tarde"],
        ["2026-10-22T23:00:00Z", "Boa noite"],
      ] as const) {
        vi.setSystemTime(new Date(iso));
        const { unmount } = render(<Saudacao />);
        expect(screen.getByText(esperado)).toBeInTheDocument();
        unmount();
      }
    } finally {
      vi.useRealTimers();
    }
  });

  it("a tela de início recarregada às 20h diz boa noite, sem aviso de hidratação", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-22T23:00:00Z"));
    const erros = vi.spyOn(console, "error").mockImplementation(() => {});
    api.obterPerfil.mockResolvedValue({ primeiro_nome: "Ana" });
    api.solDeHoje.mockReturnValue(new Promise(() => {}));
    api.listarTrilhas.mockResolvedValue([]);
    api.listarMissoes.mockResolvedValue([]);
    try {
      render(<TelaInicio />);
      expect(await screen.findByText("Boa noite, Ana!")).toBeInTheDocument();
      expect(erros.mock.calls.flat().join(" ")).not.toMatch(/hydrat/i);
    } finally {
      erros.mockRestore();
      vi.useRealTimers();
    }
  });
});

describe("sol mais recente", () => {
  it("só chama de hoje quando o dado é de hoje", () => {
    expect(textosDoSol({ data: "2026-10-22", diasDeAtraso: 0, fonte: "nasa" }).titulo).toBe("Sol de hoje em São Luís");
    expect(textosDoSol({ data: "2026-10-17", diasDeAtraso: 5, fonte: "cache" })).toEqual({
      titulo: "Sol mais recente em São Luís",
      quando: "Sol de 17/10, há 5 dias. Estimativa com dados de irradiação da NASA",
    });
    expect(textosDoSol({ data: "2026-10-21", diasDeAtraso: 1, fonte: "cache" }).quando).toMatch(/^Sol de 21\/10, há 1 dia\./);
  });

  it("com a média padrão, mostra a média de São Luís em vez de uma data", () => {
    const textos = textosDoSol({ data: null, diasDeAtraso: null, fonte: "padrao" });
    expect(textos.titulo).toBe("Sol em São Luís");
    expect(textos.quando).toMatch(/^Média de São Luís/);
    expect(textos.quando).toMatch(/estimativa/);
  });
});

describe("cache das leituras", () => {
  it("duas telas com a mesma chave dividem uma chamada só", async () => {
    const buscar = vi.fn(async () => ["missão"]);
    function Tela() {
      const dados = useDados("missoes", buscar);
      return <span>{dados.estado}</span>;
    }
    render(
      <>
        <Tela />
        <Tela />
      </>,
    );
    await waitFor(() => expect(screen.getAllByText("pronto")).toHaveLength(2));
    expect(buscar).toHaveBeenCalledTimes(1);
  });

  it("ao voltar para a tela, mostra os dados guardados sem buscar de novo", async () => {
    const buscar = vi.fn(async () => "trilha");
    function Tela() {
      const dados = useDados("trilha-solar", buscar);
      return <span>{dados.estado === "pronto" ? dados.dados : "carregando"}</span>;
    }
    const primeira = render(<Tela />);
    await screen.findByText("trilha");
    primeira.unmount();
    render(<Tela />);
    expect(screen.getByText("trilha")).toBeInTheDocument();
    expect(buscar).toHaveBeenCalledTimes(1);
  });

  it("depois de um erro, não busca de novo sozinho", async () => {
    const buscar = vi.fn(async () => {
      throw LIMITE;
    });
    function Tela() {
      const dados = useDados("perfil", buscar);
      return <span>{dados.estado}</span>;
    }
    render(<Tela />);
    await screen.findByText("erro");
    await act(() => new Promise((r) => setTimeout(r, 200)));
    expect(buscar).toHaveBeenCalledTimes(1);
  });

  it("invalidar faz a próxima tela buscar de novo, sem tirar os dados de quem já está na tela", async () => {
    await carregar("licao-1", async () => "lição");
    invalidar("licao-");
    expect(lerEntrada("licao-1")).toBeUndefined();

    const buscar = vi.fn(async () => "trilha nova");
    function Tela() {
      const dados = useDados("trilha-x", buscar);
      return <span>{dados.estado === "pronto" ? dados.dados : "carregando"}</span>;
    }
    await carregar("trilha-x", async () => "trilha antiga");
    render(<Tela />);
    expect(screen.getByText("trilha antiga")).toBeInTheDocument();
    act(() => invalidar("trilha-"));
    expect(screen.getByText("trilha antiga")).toBeInTheDocument();
    expect(lerEntrada("trilha-x")?.invalida).toBe(true);
  });

  it("pré-carregar não repete o que ainda vale", async () => {
    const buscar = vi.fn(async () => "lição 2");
    preCarregar("licao-2", buscar);
    preCarregar("licao-2", buscar);
    await waitFor(() => expect(lerEntrada("licao-2")?.dados).toBe("lição 2"));
    expect(buscar).toHaveBeenCalledTimes(1);
    expect(VALIDADE_MS).toBeGreaterThan(0);
  });

  it("a lição pelo continuar não repete trilha, lição e missões", async () => {
    const TRILHA = { slug: "solar", titulo: "Solar", tema: "solar", totalLicoes: 2, licoes: [{ id: "l1", ordem: 1, titulo: "Um", tipo: "texto", concluida: false, liberada: true }] };
    const LICAO = { id: "l1", trilha: { slug: "solar", titulo: "Solar" }, ordem: 1, titulo: "O sol de São Luís", conteudo: "Texto", tipo: "texto", totalPerguntas: 1, concluida: false, liberada: true, licaoPendente: null, proximaLicaoId: "l2" };
    api.obterTrilha.mockResolvedValue(TRILHA);
    api.obterLicao.mockResolvedValue(LICAO);
    api.obterQuiz.mockResolvedValue({ licaoId: "l1", licaoConcluida: false, perguntas: [] });
    api.listarMissoes.mockResolvedValue([]);
    const continuar = render(
      <ProvedorCelebracao>
        <TelaLicao slug="solar" licaoId="continuar" />
      </ProvedorCelebracao>,
    );
    await waitFor(() => expect(roteador.replace).toHaveBeenCalledWith("/trilhas/solar/l1", { scroll: false }));
    continuar.unmount();
    render(
      <ProvedorCelebracao>
        <TelaLicao slug="solar" licaoId="l1" />
      </ProvedorCelebracao>,
    );
    expect(await screen.findByRole("heading", { name: "O sol de São Luís" })).toBeInTheDocument();
    expect(api.obterTrilha).toHaveBeenCalledTimes(1);
    expect(api.obterLicao).toHaveBeenCalledWith("l1");
    expect(api.obterLicao.mock.calls.filter(([id]) => id === "l1")).toHaveLength(1);
    expect(api.listarMissoes).toHaveBeenCalledTimes(1);
    // A próxima lição e o quiz já foram pedidos enquanto a pessoa lê.
    await waitFor(() => expect(api.obterLicao).toHaveBeenCalledWith("l2"));
    expect(api.obterQuiz).toHaveBeenCalledWith("l1");
  });
});

describe("429: mostra a mensagem e não repete sozinho", () => {
  it("o cliente HTTP não repete a chamada", async () => {
    const buscar = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ erro: { codigo: "LIMITE_DE_REQUISICOES", mensagem: LIMITE.message } }), { status: 429 }),
    );
    const requisitar = criarRequisicao({ apiUrl: "http://api.teste", sessao: { token: async () => "t", renovar: async () => "t2" }, buscar });
    await expect(requisitar("/api/quiz/responder", { metodo: "POST", corpo: {}, autenticacao: "exigida" })).rejects.toMatchObject({
      status: 429,
      codigo: "LIMITE_DE_REQUISICOES",
    });
    expect(buscar).toHaveBeenCalledTimes(1);
  });

  async function esperarMensagem(chamada: ReturnType<typeof vi.fn>) {
    expect(await screen.findByText(LIMITE.message)).toBeInTheDocument();
    await act(() => new Promise((r) => setTimeout(r, 200)));
    expect(chamada).toHaveBeenCalledTimes(1);
    expect(roteador.push).not.toHaveBeenCalled();
  }

  it("lição", async () => {
    api.obterTrilha.mockResolvedValue({ slug: "solar", titulo: "Solar", tema: "solar", totalLicoes: 1, licoes: [] });
    api.obterLicao.mockResolvedValue({ id: "l1", trilha: { slug: "solar", titulo: "Solar" }, ordem: 1, titulo: "Lição", conteudo: "Texto", tipo: "texto", totalPerguntas: 0, concluida: false, liberada: true, licaoPendente: null, proximaLicaoId: "l2" });
    api.listarMissoes.mockResolvedValue([]);
    api.concluirLicao.mockRejectedValue(LIMITE);
    render(
      <ProvedorCelebracao>
        <TelaLicao slug="solar" licaoId="l1" />
      </ProvedorCelebracao>,
    );
    await userEvent.click(await screen.findByRole("button", { name: "Ir para a próxima lição" }));
    await esperarMensagem(api.concluirLicao);
  });

  it("missão", async () => {
    api.listarMissoes.mockResolvedValue([
      { id: "m1", slug: "descarte-de-lixo-eletronico", titulo: "Descarte certo", descricao: "Leve um eletrônico.", trilhaSlug: null, pontos: 30, diasNecessarios: 1, diasRegistrados: 0, diasMarcados: [], registradaHoje: false, concluida: false },
    ]);
    api.registrarMissao.mockRejectedValue(LIMITE);
    render(
      <ProvedorCelebracao>
        <TelaMissao missaoId="m1" />
      </ProvedorCelebracao>,
    );
    const botoes = await screen.findAllByRole("button");
    const marcar = botoes.find((b) => /marcar|registrar|fiz/i.test(b.textContent ?? ""))!;
    await userEvent.click(marcar);
    await esperarMensagem(api.registrarMissao);
  });

  it("simulação pela conta", async () => {
    api.simular.mockRejectedValue(LIMITE);
    render(<TelaSimuladorConta />);
    await userEvent.type(screen.getByRole("textbox", { name: /Consumo do mês/ }), "380");
    await userEvent.click(screen.getByRole("button", { name: "Ver meu resultado" }));
    await esperarMensagem(api.simular);
  });

  it("simulação pelos aparelhos", async () => {
    api.listarAparelhos.mockResolvedValue([{ id: "a1", codigo: "tv", nome: "TV", potencia_w: 100, horas_padrao: 5, icone: "tv" }]);
    api.simular.mockRejectedValue(LIMITE);
    render(<TelaSimuladorAparelhos />);
    await userEvent.click(await screen.findByRole("button", { name: "Aumentar TV" }));
    await userEvent.click(screen.getByRole("button", { name: "Ver meu resultado" }));
    await esperarMensagem(api.simular);
  });

  it("perfil", async () => {
    const BAIRRO = "0b000000-0000-4000-8000-000000000001";
    sessao.token.mockResolvedValue(null);
    api.listarBairros.mockResolvedValue([{ id: BAIRRO, nome: "Anil" }]);
    api.atualizarPerfil.mockRejectedValue(LIMITE);
    render(<TelaEntrar />);
    await userEvent.type(screen.getByRole("textbox", { name: "Seu primeiro nome" }), "Ana");
    await userEvent.click(screen.getByRole("combobox", { name: "Seu bairro" }));
    await userEvent.click(await screen.findByRole("option", { name: "Anil" }));
    await userEvent.click(screen.getByRole("button", { name: "Criar meu perfil" }));
    await esperarMensagem(api.atualizarPerfil);
  });
});
