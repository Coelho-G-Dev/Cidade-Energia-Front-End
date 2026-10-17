import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProvedorCelebracao } from "@/components/app/Celebracao";
import { ConversaTutor } from "@/components/app/ConversaTutor";
import { DESKTOP } from "@/lib/useMidia";
import { dadosDaPrevia, ESPERA_PREVIA_MS, PainelPrevia } from "@/telas/PreviaSimulacao";
import { TelaLicao } from "@/telas/TelaLicao";
import type { LicaoDetalhada, TrilhaDetalhada } from "@/types";
import { definirMovimentoReduzido } from "./setup";

const api = vi.hoisted(() => ({
  previaSimulacao: vi.fn(),
  obterTrilha: vi.fn(),
  obterLicao: vi.fn(),
  listarMissoes: vi.fn(),
}));

const sessao = vi.hoisted(() => ({ token: vi.fn(async (): Promise<string | null> => "token") }));

vi.mock("@/lib/api", async () => {
  const erro = await vi.importActual<typeof import("@/lib/api/erro")>("@/lib/api/erro");
  return { ...erro, api, sessao };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/trilhas/ar-condicionado-sem-susto/l1",
}));

function definirTela(desktop: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((consulta: string) => ({
      matches: desktop && consulta === DESKTOP,
      media: consulta,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
}

afterEach(() => {
  vi.useRealTimers();
  definirMovimentoReduzido(false);
});

const RESULTADO = { consumoKwh: 380, gastoMensal: 338, economiaMensal: 34, placas: 6, retornoAnos: 2.3, co2EvitadoKgAno: 191, pesos: [] };

describe("prévia do simulador", () => {
  beforeEach(() => {
    api.previaSimulacao.mockReset();
    api.previaSimulacao.mockResolvedValue({ ...RESULTADO, simulacaoId: null, pontosGanhos: 0, conquistasNovas: [] });
  });

  it("só manda o que o back aceitaria", () => {
    expect(dadosDaPrevia({ modo: "conta", consumoKwh: null })).toBeNull();
    expect(dadosDaPrevia({ modo: "conta", consumoKwh: 380 })).toEqual({ modo: "conta", consumoKwh: 380 });
    expect(dadosDaPrevia({ modo: "aparelhos", itens: [] })).toBeNull();
  });

  it("espera a pessoa parar de digitar e pede só a última prévia", async () => {
    vi.useFakeTimers();
    const { rerender } = render(<PainelPrevia dados={{ modo: "conta", consumoKwh: 38 }} />);
    expect(screen.getByText("Calculando a prévia...")).toBeInTheDocument();

    await act(() => vi.advanceTimersByTimeAsync(ESPERA_PREVIA_MS / 2));
    rerender(<PainelPrevia dados={{ modo: "conta", consumoKwh: 380 }} />);
    await act(() => vi.advanceTimersByTimeAsync(ESPERA_PREVIA_MS));

    expect(api.previaSimulacao).toHaveBeenCalledTimes(1);
    expect(api.previaSimulacao.mock.calls[0]?.[0]).toEqual({ modo: "conta", consumoKwh: 380 });
    expect(screen.getByText("Valores estimados")).toBeInTheDocument();
    expect(screen.getByText("Prévia: gasto de cerca de R$ 338 por mês.")).toBeInTheDocument();
  });

  it("sem dados não chama o back", async () => {
    vi.useFakeTimers();
    render(<PainelPrevia dados={null} />);
    await act(() => vi.advanceTimersByTimeAsync(ESPERA_PREVIA_MS * 2));
    expect(api.previaSimulacao).not.toHaveBeenCalled();
    expect(screen.getByText(/A prévia aparece aqui enquanto você digita/)).toBeInTheDocument();
  });
});

describe("tutor", () => {
  it("na página é o título principal; ao lado da lição, uma seção", () => {
    const { unmount } = render(<ConversaTutor />);
    expect(screen.getByRole("heading", { level: 1, name: "Energinho" })).toBeInTheDocument();
    unmount();
    render(<ConversaTutor lateral />);
    expect(screen.getByRole("heading", { level: 2, name: "Tire uma dúvida" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Sugestões de pergunta" })).toBeInTheDocument();
  });
});

describe("lição", () => {
  const trilha = { slug: "ar-condicionado-sem-susto", titulo: "Ar-condicionado sem susto", tema: "eficiencia", totalLicoes: 3, licoes: [] } as unknown as TrilhaDetalhada;
  const licao: LicaoDetalhada = {
    id: "l1",
    trilha: { slug: trilha.slug, titulo: trilha.titulo },
    ordem: 1,
    titulo: "Por que o ar pesa na conta",
    conteudo: "Texto da lição.",
    tipo: "texto",
    totalPerguntas: 2,
    concluida: false,
    liberada: true,
    licaoPendente: null,
    proximaLicaoId: "l2",
  };

  beforeEach(() => {
    api.obterTrilha.mockResolvedValue(trilha);
    api.obterLicao.mockResolvedValue(licao);
    api.listarMissoes.mockResolvedValue([]);
  });

  function renderizar() {
    return render(
      <ProvedorCelebracao>
        <TelaLicao slug={trilha.slug} licaoId="l1" />
      </ProvedorCelebracao>,
    );
  }

  it("no desktop o tutor fica ao lado e o botão de dúvida sai", async () => {
    definirTela(true);
    renderizar();
    expect(await screen.findByRole("heading", { level: 1, name: licao.titulo })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Tutor Energinho" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Tirar dúvida" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Responder o quiz" })).toBeInTheDocument();
  });

  it("no celular o botão leva ao tutor", async () => {
    definirTela(false);
    renderizar();
    expect(await screen.findByRole("link", { name: "Tirar dúvida" })).toHaveAttribute("href", "/tutor");
    expect(screen.queryByRole("complementary", { name: "Tutor Energinho" })).not.toBeInTheDocument();
  });

  describe("lição travada (falta concluir uma anterior)", () => {
    const pendente = { id: "l0", titulo: "Por que a conta sobe" };

    beforeEach(() => {
      definirTela(false);
      api.obterLicao.mockResolvedValue({ ...licao, liberada: false, licaoPendente: pendente });
    });

    afterEach(() => {
      sessao.token.mockResolvedValue("token");
    });

    it("com login, deixa ler, troca o botão de concluir pelo aviso e leva à lição que falta", async () => {
      sessao.token.mockResolvedValue("token");
      renderizar();
      expect(await screen.findByText(`Você pode ler esta lição, mas só conclui depois de "${pendente.titulo}".`)).toBeInTheDocument();
      expect(screen.getByText("Texto da lição.")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Ir para a lição que falta" })).toHaveAttribute("href", `/trilhas/${trilha.slug}/l0`);
      expect(screen.queryByRole("button", { name: "Responder o quiz" })).not.toBeInTheDocument();
    });

    it("sem login nada é salvo, então não mostra a trava", async () => {
      sessao.token.mockResolvedValue(null);
      renderizar();
      expect(await screen.findByRole("button", { name: "Responder o quiz" })).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Ir para a lição que falta" })).not.toBeInTheDocument();
    });
  });
});
