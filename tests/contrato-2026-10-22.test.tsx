import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProvedorCelebracao } from "@/components/app/Celebracao";
import { filtrarOpcoes, normalizarBusca, SeletorBusca } from "@/components/ui/SeletorBusca";
import { ErroApi } from "@/lib/api/erro";
import { guardarResultado } from "@/lib/resultado";
import { BlocosEconomia, fraseSolar, SEM_DICA_DE_HABITO } from "@/telas/BlocosEconomia";
import { VAZIO_RANKING } from "@/telas/TelaMapa";
import { TelaEntrar } from "@/telas/TelaEntrar";
import { TelaPedale } from "@/telas/TelaPedale";
import { ESPERA_PREVIA_MS, PainelPrevia } from "@/telas/PreviaSimulacao";
import { TelaResultado } from "@/telas/TelaResultado";
import { RESULTADO_ANTIGO, RESULTADO_REFERENCIA } from "./dados";

const api = vi.hoisted(() => ({
  previaSimulacao: vi.fn(),
  ultimaSimulacao: vi.fn(),
  obterTrilha: vi.fn(),
  obterLicao: vi.fn(),
  listarMissoes: vi.fn(),
  concluirPedale: vi.fn(),
  listarBairros: vi.fn(),
  listarEscolas: vi.fn(),
  obterPerfil: vi.fn(),
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

beforeEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
  sessao.token.mockResolvedValue("token");
});

describe("resultado em dois blocos", () => {
  it("separa hábitos e solar, e nunca junta a economia com hábitos ao retorno", () => {
    render(<BlocosEconomia resultado={RESULTADO_REFERENCIA} />);
    const blocoHabitos = screen.getByRole("heading", { name: "Mudando hábitos:" }).closest("section")!;
    const blocoSolar = screen.getByRole("heading", { name: "Com 6 placas solares:" }).closest("section")!;
    expect(within(blocoHabitos).getByText("R$ 31,20")).toBeInTheDocument();
    expect(within(blocoHabitos).getByText("por mês, sem gastar nada")).toBeInTheDocument();
    expect(blocoHabitos.textContent).not.toMatch(/anos|se paga/);
    expect(within(blocoSolar).getByText("R$ 312,00")).toBeInTheDocument();
    expect(within(blocoSolar).getByText("O sistema custa R$ 9.372,00 e se paga em 2,5 anos.")).toBeInTheDocument();
    expect(blocoSolar.textContent).not.toMatch(/31,20/);
  });

  it("cada bloco abre e fecha o seu Como calculamos?", async () => {
    render(<BlocosEconomia resultado={RESULTADO_REFERENCIA} />);
    const [botaoHabitos, botaoSolar] = screen.getAllByRole("button", { name: "Como calculamos?" });
    expect(botaoHabitos).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(botaoHabitos!);
    expect(botaoHabitos).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(RESULTADO_REFERENCIA.comoCalculamos.economiaHabitos)).toBeInTheDocument();
    expect(screen.queryByText(RESULTADO_REFERENCIA.comoCalculamos.retornoSolar)).not.toBeInTheDocument();
    await userEvent.click(botaoSolar!);
    expect(screen.getByText(RESULTADO_REFERENCIA.comoCalculamos.custoSistemaSolar)).toBeInTheDocument();
    expect(screen.getByText(/que as placas não zeram\.$/)).toBeInTheDocument();
    await userEvent.click(botaoHabitos!);
    expect(botaoHabitos).toHaveAttribute("aria-expanded", "false");
  });

  it("simulação antiga mostra só o que existe e convida a simular de novo", () => {
    render(<BlocosEconomia resultado={RESULTADO_ANTIGO} />);
    expect(screen.getByText("R$ 31,20")).toBeInTheDocument();
    expect(screen.getByText("O sistema se paga em cerca de 2,5 anos.")).toBeInTheDocument();
    expect(screen.getByText("Simule de novo para ver quanto as placas economizam.")).toBeInTheDocument();
    expect(screen.queryByText(/economia de/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Como calculamos?" })).not.toBeInTheDocument();
  });

  it("sem dica de hábito, mostra um texto no lugar de R$ 0,00", () => {
    render(<BlocosEconomia resultado={{ ...RESULTADO_REFERENCIA, economiaHabitosMensal: 0 }} />);
    const blocoHabitos = screen.getByRole("heading", { name: "Mudando hábitos:" }).closest("section")!;
    expect(within(blocoHabitos).getByText(SEM_DICA_DE_HABITO)).toBeInTheDocument();
    expect(blocoHabitos.textContent).not.toMatch(/R\$/);
  });

  it("monta a frase do custo e do retorno só com a economia solar", () => {
    expect(fraseSolar({ custoSistemaSolar: 9372, retornoSolarAnos: 2.5 })?.replace(/ /g, " ")).toBe("O sistema custa R$ 9.372,00 e se paga em 2,5 anos.");
    expect(fraseSolar({ custoSistemaSolar: null, retornoSolarAnos: null })).toBeNull();
  });

  it("a prévia e o Resultado mostram os mesmos números para a mesma entrada", async () => {
    // Relógio real: o relógio falso deixaria o laço de animação do Motion preso nos testes seguintes.
    api.previaSimulacao.mockResolvedValue(RESULTADO_REFERENCIA);
    const { unmount } = render(<PainelPrevia dados={{ modo: "conta", consumoKwh: 380, valorConta: 312 }} />);
    const valores = ["R$ 312,00", "R$ 31,20", "O sistema custa R$ 9.372,00 e se paga em 2,5 anos."];
    await screen.findAllByText(valores[0]!, {}, { timeout: ESPERA_PREVIA_MS * 5 });
    for (const v of valores) expect(screen.getAllByText(v).length).toBeGreaterThan(0);
    expect(screen.getByText("Valores estimados")).toBeInTheDocument();
    unmount();

    guardarResultado(RESULTADO_REFERENCIA);
    render(
      <ProvedorCelebracao>
        <TelaResultado />
      </ProvedorCelebracao>,
    );
    for (const v of valores) expect(screen.getAllByText(v).length).toBeGreaterThan(0);
    expect(screen.getByText("Valores estimados")).toBeInTheDocument();
  });
});

describe("Pedale", () => {
  const TRILHA = {
    slug: "energia-solar-em-sao-luis",
    titulo: "Energia solar em São Luís",
    totalLicoes: 4,
    licoes: [{ id: "lp", ordem: 3, titulo: "Pedale e veja", tipo: "pedale", concluida: false, liberada: true }],
  };
  const LICAO = {
    id: "lp",
    trilha: { slug: TRILHA.slug, titulo: TRILHA.titulo },
    ordem: 3,
    titulo: "Pedale e veja",
    tipo: "pedale",
    totalPerguntas: 0,
    concluida: false,
    liberada: true,
    licaoPendente: null,
    proximaLicaoId: "l4",
  };
  const REGISTRO = { licaoId: "lp", concluida: true, pontosGanhos: 15, conquistasNovas: [] };

  function renderizar() {
    api.obterTrilha.mockResolvedValue(TRILHA);
    api.obterLicao.mockResolvedValue(LICAO);
    api.listarMissoes.mockResolvedValue([]);
    render(
      <ProvedorCelebracao>
        <TelaPedale />
      </ProvedorCelebracao>,
    );
  }

  it("o botão registra a atividade antes de ir para a próxima lição", async () => {
    api.concluirPedale.mockResolvedValue(REGISTRO);
    renderizar();
    await userEvent.click(await screen.findByRole("button", { name: "Ir para a próxima lição" }));
    await waitFor(() => expect(roteador.push).toHaveBeenCalledWith("/trilhas/energia-solar-em-sao-luis/l4"));
    expect(api.concluirPedale).toHaveBeenCalledWith("lp");
    expect(api.concluirPedale.mock.invocationCallOrder[0]).toBeLessThan(roteador.push.mock.invocationCallOrder[0]!);
  });

  it("acender a lâmpada registra uma vez, e o botão reaproveita esse registro", async () => {
    api.concluirPedale.mockResolvedValue(REGISTRO);
    renderizar();
    await screen.findByRole("button", { name: "Ir para a próxima lição" });
    const pedal = screen.getByRole("button", { name: "Pedalar" });
    pedal.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(api.concluirPedale).toHaveBeenCalledTimes(1));
    await userEvent.keyboard("{Enter}{Enter}");
    await userEvent.click(screen.getByRole("button", { name: "Ir para a próxima lição" }));
    await waitFor(() => expect(roteador.push).toHaveBeenCalled());
    expect(api.concluirPedale).toHaveBeenCalledTimes(1);
  });

  it("se o registro falhar, mostra o erro e não navega", async () => {
    api.concluirPedale.mockRejectedValue(new ErroApi(429, "LIMITE_DE_REQUISICOES", "Muitas ações seguidas. Espere um pouco e tente de novo."));
    renderizar();
    await userEvent.click(await screen.findByRole("button", { name: "Ir para a próxima lição" }));
    expect(await screen.findByText("Muitas ações seguidas. Espere um pouco e tente de novo.")).toBeInTheDocument();
    expect(roteador.push).not.toHaveBeenCalled();
    expect(api.concluirPedale).toHaveBeenCalledTimes(1);
  });
});

describe("busca de bairros e escolas", () => {
  const BAIRROS = [
    { valor: "1", rotulo: "Cidade Olimpica" },
    { valor: "2", rotulo: "Sao Cristovao" },
    { valor: "3", rotulo: "São Francisco" },
    { valor: "4", rotulo: "Anil" },
  ];

  it("ignora acento e maiúsculas, sem mudar os nomes", () => {
    expect(normalizarBusca("  São  Cristóvão ")).toBe("sao cristovao");
    expect(filtrarOpcoes(BAIRROS, "são").map((o) => o.rotulo)).toEqual(["Sao Cristovao", "São Francisco"]);
    expect(filtrarOpcoes(BAIRROS, "olímpica").map((o) => o.rotulo)).toEqual(["Cidade Olimpica"]);
    expect(filtrarOpcoes(BAIRROS, "")).toHaveLength(4);
  });

  function Campo() {
    const [valor, setValor] = useState("");
    return <SeletorBusca rotulo="Seu bairro" nomeDosItens="bairros" opcoes={BAIRROS} valor={valor} onEscolher={setValor} />;
  }

  it("filtra enquanto digita e escolhe pelo teclado", async () => {
    render(<Campo />);
    const campo = screen.getByRole("combobox", { name: "Seu bairro" });
    await userEvent.type(campo, "sao");
    expect(campo).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Sao Cristovao", "São Francisco"]);
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(campo).toHaveValue("São Francisco");
    expect(campo).toHaveAttribute("aria-expanded", "false");
  });

  it("escolhe com o toque", async () => {
    render(<Campo />);
    const campo = screen.getByRole("combobox", { name: "Seu bairro" });
    await userEvent.click(campo);
    await userEvent.click(screen.getByRole("option", { name: "Anil" }));
    expect(campo).toHaveValue("Anil");
  });
});

describe("perfil: escola desativada", () => {
  const BAIRRO = "0b000000-0000-4000-8000-000000000001";
  const ESCOLA = "0e000000-0000-4000-8000-000000000002";
  const OUTRA = "0e000000-0000-4000-8000-000000000003";

  it("no 409 ESCOLA_INATIVA, recarrega as escolas do bairro e pede outra", async () => {
    api.listarBairros.mockResolvedValue([{ id: BAIRRO, nome: "Anil" }]);
    api.listarEscolas.mockResolvedValue([
      { id: ESCOLA, nome: "Escola Antiga", bairro_id: BAIRRO },
      { id: OUTRA, nome: "Escola Nova", bairro_id: BAIRRO },
    ]);
    api.obterPerfil.mockResolvedValue({
      id: "p",
      primeiro_nome: "Ana",
      bairro_id: BAIRRO,
      escola_id: ESCOLA,
      escola_verificada: false,
      criado_em: "2026-10-01T00:00:00Z",
      tem_perfil: true,
      limite_trocas: 3,
      trocas_restantes: 3,
      proxima_troca_em: null,
    });
    api.atualizarPerfil.mockRejectedValue(new ErroApi(409, "ESCOLA_INATIVA", "Essa escola não está mais disponível. Escolha outra."));
    render(<TelaEntrar />);
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Escola" })).toHaveValue("Escola Antiga"));
    expect(api.listarEscolas).toHaveBeenCalledWith(BAIRRO);
    const chamadasAntes = api.listarEscolas.mock.calls.length;

    await userEvent.click(screen.getByRole("button", { name: "Salvar mudanças" }));
    expect(await screen.findByText("Essa escola não está mais disponível. Escolha outra.")).toBeInTheDocument();
    await waitFor(() => expect(api.listarEscolas.mock.calls.length).toBeGreaterThan(chamadasAntes));
    expect(screen.getByRole("combobox", { name: "Escola" })).toHaveValue("");
    expect(roteador.push).not.toHaveBeenCalled();
  });

  it("código de turma inexistente vira erro no campo", async () => {
    api.listarBairros.mockResolvedValue([{ id: BAIRRO, nome: "Anil" }]);
    sessao.token.mockResolvedValue(null);
    api.atualizarPerfil.mockRejectedValue(new ErroApi(404, "TURMA_NAO_ENCONTRADA", "Código de turma não encontrado."));
    render(<TelaEntrar />);
    await userEvent.type(screen.getByRole("textbox", { name: "Seu primeiro nome" }), "Ana");
    await userEvent.click(screen.getByRole("combobox", { name: "Seu bairro" }));
    await userEvent.click(await screen.findByRole("option", { name: "Anil" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Código da turma" }), "k7m2q9xa");
    await userEvent.click(screen.getByRole("button", { name: "Criar meu perfil" }));
    expect(await screen.findByText("Não encontramos uma turma com esse código. Confira com o seu professor.")).toBeInTheDocument();
    expect(api.atualizarPerfil).toHaveBeenCalledWith({ primeiro_nome: "Ana", bairro_id: BAIRRO, codigo_turma: "K7M2Q9XA" });
  });
});

describe("rankings vazios", () => {
  it("explica quando o ranking aparece, e na aba de escolas lembra do código da turma", () => {
    expect(VAZIO_RANKING.bairros.texto).toBe("O ranking aparece quando 3 estudantes do bairro tiverem pontos. Chame os colegas!");
    expect(VAZIO_RANKING.escolas.texto).toMatch(/Só contam os pontos de quem entrou pelo código da turma/);
  });
});
