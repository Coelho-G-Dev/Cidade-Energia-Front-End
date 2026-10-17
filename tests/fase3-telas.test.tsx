import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProvedorCelebracao, useCelebrar } from "@/components/app/Celebracao";
import { NumeroRolante } from "@/components/ui/NumeroRolante";
import { ErroApi } from "@/lib/api/erro";
import { TelaMissao } from "@/telas/TelaMissao";
import { TelaQuiz } from "@/telas/TelaQuiz";

const api = vi.hoisted(() => ({
  obterQuiz: vi.fn(),
  obterLicao: vi.fn(),
  listarMissoes: vi.fn(),
  responderQuiz: vi.fn(),
  registrarMissao: vi.fn(),
}));

const sessao = vi.hoisted(() => ({ token: vi.fn(async (): Promise<string | null> => "token") }));

vi.mock("@/lib/api", async () => {
  const erro = await vi.importActual<typeof import("@/lib/api/erro")>("@/lib/api/erro");
  return { ...erro, api, sessao };
});

const PERGUNTA = { id: "p1", ordem: 1, enunciado: "O que a placa precisa?", opcoes: ["Calor", "Luz do sol"], jaRespondida: false, acertou: null, podePontuar: true, proximaTentativaEm: null };

beforeEach(() => {
  sessao.token.mockResolvedValue("token");
  api.obterQuiz.mockResolvedValue({ licaoId: "l1", licaoConcluida: true, perguntas: [PERGUNTA] });
  api.obterLicao.mockResolvedValue({ id: "l1", trilha: { slug: "solar", titulo: "Energia solar" }, proximaLicaoId: "l2", totalPerguntas: 1 });
  api.listarMissoes.mockResolvedValue([]);
});

describe("quiz", () => {
  it("resposta errada avisa quando tentar de novo e não revela a certa", async () => {
    api.responderQuiz.mockResolvedValue({ correta: false, explicacao: null, tentativaPontuavel: true, proximaTentativaEm: "2026-10-18T15:30:00Z", pontosGanhos: 0, conquistasNovas: [] });
    render(
      <ProvedorCelebracao>
        <TelaQuiz licaoId="l1" />
      </ProvedorCelebracao>,
    );
    await userEvent.click(await screen.findByRole("button", { name: "Calor" }));
    expect(await screen.findByText("Não foi dessa vez.")).toBeInTheDocument();
    expect(screen.getByText(/a partir de 18\/10 às 12:30/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Calors*Resposta errada/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Luz do sol" })).toBeDisabled();
    expect(screen.queryByText(/Resposta certa/)).not.toBeInTheDocument();
  });

  it("resposta certa mostra a explicação e anuncia os pontos", async () => {
    api.responderQuiz.mockResolvedValue({ correta: true, explicacao: "A placa usa a luz.", tentativaPontuavel: true, proximaTentativaEm: null, pontosGanhos: 5, conquistasNovas: [] });
    render(
      <ProvedorCelebracao>
        <TelaQuiz licaoId="l1" />
      </ProvedorCelebracao>,
    );
    await userEvent.click(await screen.findByRole("button", { name: "Luz do sol" }));
    expect(await screen.findByText("A placa usa a luz.")).toBeInTheDocument();
    expect(screen.getByText("Você ganhou 5 pontos.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Ver como fui" }));
    expect(screen.getByText("Você acertou 1 de 1 pergunta.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir para a próxima lição" })).toHaveAttribute("href", "/trilhas/solar/l2");
  });

  it("antes das 24 horas mostra a mensagem do servidor", async () => {
    api.responderQuiz.mockRejectedValue(new ErroApi(429, "AGUARDE_NOVA_TENTATIVA", "Você poderá responder esta pergunta de novo a partir de 18/10 às 12:30."));
    render(
      <ProvedorCelebracao>
        <TelaQuiz licaoId="l1" />
      </ProvedorCelebracao>,
    );
    await userEvent.click(await screen.findByRole("button", { name: "Calor" }));
    expect(await screen.findByText(/responder esta pergunta de novo a partir de 18\/10/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Calor" })).toBeDisabled();
  });

  function renderizarQuiz() {
    render(
      <ProvedorCelebracao>
        <TelaQuiz licaoId="l1" />
      </ProvedorCelebracao>,
    );
  }

  it("com login e a lição sem concluir, convida a ler a lição antes", async () => {
    api.obterQuiz.mockResolvedValue({ licaoId: "l1", licaoConcluida: false, perguntas: [{ ...PERGUNTA, podePontuar: false }] });
    renderizarQuiz();
    expect(await screen.findByText("Leia a lição antes do quiz")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ler a lição" })).toHaveAttribute("href", "/trilhas/solar/l1");
    expect(screen.queryByRole("button", { name: "Calor" })).not.toBeInTheDocument();
  });

  it("sem login nada é salvo, então o quiz segue aberto", async () => {
    sessao.token.mockResolvedValue(null);
    api.obterQuiz.mockResolvedValue({ licaoId: "l1", licaoConcluida: false, perguntas: [{ ...PERGUNTA, podePontuar: false }] });
    renderizarQuiz();
    expect(await screen.findByRole("button", { name: "Calor" })).toBeInTheDocument();
    expect(screen.queryByText("Leia a lição antes do quiz")).not.toBeInTheDocument();
  });

  it("se o servidor recusar porque a lição não foi concluída, mostra o convite para ler", async () => {
    api.obterQuiz
      .mockResolvedValueOnce({ licaoId: "l1", licaoConcluida: true, perguntas: [PERGUNTA] })
      .mockResolvedValue({ licaoId: "l1", licaoConcluida: false, perguntas: [{ ...PERGUNTA, podePontuar: false }] });
    api.responderQuiz.mockRejectedValue(new ErroApi(409, "LICAO_NAO_CONCLUIDA", "Leia a lição antes de responder o quiz."));
    renderizarQuiz();
    await userEvent.click(await screen.findByRole("button", { name: "Calor" }));
    expect(await screen.findByText("Leia a lição antes do quiz")).toBeInTheDocument();
  });
});

describe("missão", () => {
  const MISSAO = {
    id: "m1",
    slug: "ar-desligado-antes-de-dormir",
    titulo: "Ar desligado antes de dormir",
    descricao: "Desligue o ar 30 minutos antes de dormir.",
    trilhaSlug: "ar-condicionado-sem-susto",
    pontos: 30,
    diasNecessarios: 3,
    diasRegistrados: 1,
    diasMarcados: ["2026-10-16"],
    registradaHoje: false,
    concluida: false,
  };

  it("mostra a data de cada noite marcada e atualiza com a resposta do registro", async () => {
    api.listarMissoes.mockResolvedValue([MISSAO]);
    api.registrarMissao.mockResolvedValue({
      missaoId: "m1",
      dia: "2026-10-17",
      novoRegistro: true,
      diasRegistrados: 2,
      diasMarcados: ["2026-10-16", "2026-10-17"],
      diasNecessarios: 3,
      concluida: false,
      pontosGanhos: 0,
      conquistasNovas: [],
    });
    render(
      <ProvedorCelebracao>
        <TelaMissao missaoId="m1" />
      </ProvedorCelebracao>,
    );
    expect(await screen.findByText("Noite 1 feita em 16/10")).toBeInTheDocument();
    expect(screen.getByText("Noite 2")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Marcar noite 2 como feita" }));
    expect(await screen.findByText("Noite 2 feita em 17/10")).toBeInTheDocument();
    expect(screen.getByText("Hoje já está marcado. Volte amanhã para marcar a noite 3.")).toBeInTheDocument();
    expect(api.listarMissoes).toHaveBeenCalledTimes(1);
  });
});

describe("celebração", () => {
  function Disparar() {
    const celebrar = useCelebrar();
    return (
      <button type="button" onClick={(e) => celebrar({ pontosGanhos: 10, conquistasNovas: [{ slug: "amigo_do_sol", nome: "Amigo do sol" }] }, e.currentTarget)}>
        Concluir
      </button>
    );
  }

  it("mostra os pontos e a conquista nova, que dá para fechar", async () => {
    render(
      <ProvedorCelebracao>
        <Disparar />
      </ProvedorCelebracao>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Concluir" }));
    expect(screen.getByText("+10")).toBeInTheDocument();
    expect(screen.getByText("Você ganhou 10 pontos. Conquista nova: Amigo do sol.")).toBeInTheDocument();
    expect(screen.getByText("Amigo do sol")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Fechar aviso de conquista" }));
    await act(async () => new Promise((r) => setTimeout(r, 400)));
    expect(screen.queryByText("Ver no meu perfil")).not.toBeInTheDocument();
  });
});

describe("número que rola", () => {
  it("mostra o valor novo", async () => {
    const { rerender } = render(<NumeroRolante valor={1} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    rerender(<NumeroRolante valor={2} />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
