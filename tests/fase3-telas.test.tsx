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

const PERGUNTA = { id: "p1", ordem: 1, enunciado: "O que a placa precisa?", opcoes: ["Calor", "Luz do sol"], jaRespondida: false, acertou: null, podePontuar: true };

beforeEach(() => {
  vi.clearAllMocks();
  sessao.token.mockResolvedValue("token");
  api.obterQuiz.mockResolvedValue({ licaoId: "l1", licaoConcluida: true, perguntas: [PERGUNTA] });
  api.obterLicao.mockResolvedValue({ id: "l1", trilha: { slug: "solar", titulo: "Energia solar" }, proximaLicaoId: "l2", totalPerguntas: 1 });
  api.listarMissoes.mockResolvedValue([]);
});

describe("quiz", () => {
  it("resposta errada destaca a opção certa e abre a explicação", async () => {
    api.responderQuiz.mockResolvedValue({ correta: false, opcaoCorreta: 1, explicacao: "A placa usa a luz.", tentativaPontuavel: true, pontosGanhos: 0, conquistasNovas: [] });
    render(
      <ProvedorCelebracao>
        <TelaQuiz licaoId="l1" />
      </ProvedorCelebracao>,
    );
    expect(await screen.findByText("Vale pontos")).toBeInTheDocument();
    await userEvent.click(await screen.findByRole("button", { name: "Calor" }));
    expect(await screen.findByText("Não foi dessa vez. A resposta certa é: Luz do sol.")).toBeInTheDocument();
    expect(screen.getByText("A placa usa a luz.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Calor\s*Resposta errada/ })).toHaveAttribute("aria-pressed", "true");
    const certa = screen.getByRole("button", { name: /Luz do sol\s*Resposta certa/ });
    expect(certa).toHaveAttribute("aria-pressed", "false");
    expect(certa).toBeDisabled();
    expect(screen.queryByText(/24 horas|tentar de novo a partir/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Treino/)).not.toBeInTheDocument();
  });

  it("resposta certa mostra a explicação e anuncia os pontos", async () => {
    api.responderQuiz.mockResolvedValue({ correta: true, opcaoCorreta: 1, explicacao: "A placa usa a luz.", tentativaPontuavel: true, pontosGanhos: 5, conquistasNovas: [] });
    render(
      <ProvedorCelebracao>
        <TelaQuiz licaoId="l1" />
      </ProvedorCelebracao>,
    );
    await userEvent.click(await screen.findByRole("button", { name: "Luz do sol" }));
    expect(await screen.findByText("A placa usa a luz.")).toBeInTheDocument();
    expect(screen.getByText("Isso mesmo!")).toBeInTheDocument();
    expect(screen.getByText("Você ganhou 5 pontos.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Ver como fui" }));
    expect(screen.getByText(/Você acertou 1 de 1 pergunta\./)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir para a próxima lição" })).toHaveAttribute("href", "/trilhas/solar/l2");
  });

  it("responder de novo é treino e a tela diz que não vale pontos", async () => {
    api.responderQuiz
      .mockResolvedValueOnce({ correta: false, opcaoCorreta: 1, explicacao: "A placa usa a luz.", tentativaPontuavel: true, pontosGanhos: 0, conquistasNovas: [] })
      .mockResolvedValueOnce({ correta: true, opcaoCorreta: 1, explicacao: "A placa usa a luz.", tentativaPontuavel: false, pontosGanhos: 0, conquistasNovas: [] });
    render(
      <ProvedorCelebracao>
        <TelaQuiz licaoId="l1" />
      </ProvedorCelebracao>,
    );
    await userEvent.click(await screen.findByRole("button", { name: "Calor" }));
    await userEvent.click(await screen.findByRole("button", { name: "Responder de novo como treino" }));
    expect(screen.getByText("Já respondida")).toBeInTheDocument();
    expect(screen.getByText("Responder de novo é treino: não vale pontos.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Luz do sol" }));
    expect(await screen.findByText("Treino: esta resposta não vale pontos")).toBeInTheDocument();
    expect(api.responderQuiz).toHaveBeenCalledTimes(2);
  });

  it("o resumo conta a primeira resposta, não o acerto no treino", async () => {
    api.responderQuiz
      .mockResolvedValueOnce({ correta: false, opcaoCorreta: 1, explicacao: "A placa usa a luz.", tentativaPontuavel: true, pontosGanhos: 0, conquistasNovas: [] })
      .mockResolvedValueOnce({ correta: true, opcaoCorreta: 1, explicacao: "A placa usa a luz.", tentativaPontuavel: false, pontosGanhos: 0, conquistasNovas: [] });
    render(
      <ProvedorCelebracao>
        <TelaQuiz licaoId="l1" />
      </ProvedorCelebracao>,
    );
    await userEvent.click(await screen.findByRole("button", { name: "Calor" }));
    await userEvent.click(await screen.findByRole("button", { name: "Responder de novo como treino" }));
    await userEvent.click(screen.getByRole("button", { name: "Luz do sol" }));
    await userEvent.click(await screen.findByRole("button", { name: "Ver como fui" }));
    expect(screen.getByRole("heading", { name: "Quiz terminado" })).toBeInTheDocument();
    expect(screen.getByText(/Você acertou 0 de 1 pergunta\./)).toBeInTheDocument();
  });

  it("pergunta já respondida antes aparece como treino", async () => {
    api.obterQuiz.mockResolvedValue({ licaoId: "l1", licaoConcluida: true, perguntas: [{ ...PERGUNTA, jaRespondida: true, acertou: false, podePontuar: false }] });
    render(
      <ProvedorCelebracao>
        <TelaQuiz licaoId="l1" />
      </ProvedorCelebracao>,
    );
    expect(await screen.findByText("Já respondida")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Calor" })).toBeEnabled();
  });

  it("com muitas ações seguidas mostra a mensagem e não repete sozinho", async () => {
    api.responderQuiz.mockRejectedValue(new ErroApi(429, "LIMITE_DE_REQUISICOES", "Muitas ações seguidas. Espere um pouco e tente de novo."));
    render(
      <ProvedorCelebracao>
        <TelaQuiz licaoId="l1" />
      </ProvedorCelebracao>,
    );
    await userEvent.click(await screen.findByRole("button", { name: "Calor" }));
    expect(await screen.findByText("Muitas ações seguidas. Espere um pouco e tente de novo.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Calor" })).toBeEnabled();
    expect(api.responderQuiz).toHaveBeenCalledTimes(1);
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
