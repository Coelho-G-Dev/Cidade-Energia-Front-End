import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProvedorCelebracao, useCelebrar } from "@/components/app/Celebracao";
import { ConversaTutor } from "@/components/app/ConversaTutor";
import { conquistasParaAvisar } from "@/lib/conquistasVistas";
import { TelaPerfil } from "@/telas/TelaPerfil";
import { casaDeExemplo, TelaSimuladorAparelhos } from "@/telas/TelaSimuladorAparelhos";
import { mascararReais, TelaSimuladorConta, textoReais } from "@/telas/TelaSimuladorConta";
import type { ConquistaDoResumo } from "@/types";
import { RESULTADO_REFERENCIA } from "./dados";

const api = vi.hoisted(() => ({
  obterPerfil: vi.fn(),
  obterResumo: vi.fn(),
  listarBairros: vi.fn(),
  listarEscolas: vi.fn(),
  simular: vi.fn(),
  previaSimulacao: vi.fn(),
  listarAparelhos: vi.fn(),
  perguntarAoTutor: vi.fn(),
}));

const sessao = vi.hoisted(() => ({ token: vi.fn(async (): Promise<string | null> => "token") }));
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
  window.localStorage.clear();
  api.previaSimulacao.mockResolvedValue(RESULTADO_REFERENCIA);
});

describe("tutor", () => {
  it("avisa que usa o bairro e a última simulação", () => {
    render(<ConversaTutor />);
    expect(screen.getByText(/O Energinho usa seu bairro e sua última simulação para dar exemplos\./)).toBeInTheDocument();
  });
});

describe("conquistas que chegaram sem aviso", () => {
  const conquista = (slug: string, obtida: boolean): ConquistaDoResumo => ({ slug, nome: slug === "bairro_unido" ? "Bairro unido" : slug, criterio: "", obtida, obtidaEm: null });

  it("na primeira vez só guarda a lista; depois avisa só as novas, uma vez", () => {
    expect(conquistasParaAvisar([conquista("primeira_simulacao", true), conquista("bairro_unido", false)])).toEqual([]);
    expect(conquistasParaAvisar([conquista("primeira_simulacao", true), conquista("bairro_unido", true)])).toEqual([{ slug: "bairro_unido", nome: "Bairro unido" }]);
    expect(conquistasParaAvisar([conquista("primeira_simulacao", true), conquista("bairro_unido", true)])).toEqual([]);
    expect(JSON.parse(window.localStorage.getItem("ce-conquistas-vistas")!)).toEqual(["bairro_unido", "primeira_simulacao"]);
  });

  it("o que já apareceu em conquistasNovas não aparece de novo", () => {
    conquistasParaAvisar([]);
    function Disparar() {
      const celebrar = useCelebrar();
      return <button onClick={() => celebrar({ pontosGanhos: 0, conquistasNovas: [{ slug: "noites_frescas", nome: "Noites frescas" }] })}>disparar</button>;
    }
    render(
      <ProvedorCelebracao>
        <Disparar />
      </ProvedorCelebracao>,
    );
    fireEvent.click(screen.getByText("disparar"));
    expect(conquistasParaAvisar([conquista("noites_frescas", true)])).toEqual([]);
  });

  it("o perfil mostra o Bairro unido ganho sem ter feito a ação", async () => {
    window.localStorage.setItem("ce-conquistas-vistas", JSON.stringify(["primeira_simulacao"]));
    api.obterPerfil.mockResolvedValue({ id: "p", primeiro_nome: "Ana", bairro_id: "b1", escola_id: null, escola_verificada: false, criado_em: "", tem_perfil: true, limite_trocas: 3, trocas_restantes: 3, proxima_troca_em: null });
    api.obterResumo.mockResolvedValue({
      pontos: 40,
      licoesConcluidas: 1,
      trilhasConcluidas: 0,
      missoesConcluidas: 0,
      conquistas: [conquista("primeira_simulacao", true), conquista("bairro_unido", true)],
      escola: null,
      bairro: { posicao: 1, pontos: 520 },
    });
    api.listarBairros.mockResolvedValue([{ id: "b1", nome: "Anil" }]);
    render(
      <ProvedorCelebracao>
        <TelaPerfil />
      </ProvedorCelebracao>,
    );
    expect(await screen.findByText("Conquista nova: Bairro unido.")).toBeInTheDocument();
  });
});

describe("valor da conta com máscara de moeda", () => {
  const sem = (t: string) => t.replace(/ /g, " ");

  it("os dígitos viram centavos", () => {
    expect(mascararReais("0")).toBeNull();
    expect(sem(textoReais(mascararReais("5")))).toBe("R$ 0,05");
    expect(sem(textoReais(mascararReais("31200")))).toBe("R$ 312,00");
    expect(sem(textoReais(mascararReais("1234567")))).toBe("R$ 12.345,67");
    expect(sem(textoReais(mascararReais("R$ 312,00")))).toBe("R$ 312,00");
    expect(mascararReais("1000000000", 31200)).toBe(31200);
    expect(textoReais(null)).toBe("");
  });

  it("mostra a máscara enquanto digita e envia o número", async () => {
    api.simular.mockResolvedValue(RESULTADO_REFERENCIA);
    render(<TelaSimuladorConta />);
    const valor = screen.getByRole("textbox", { name: /Valor da conta/ });
    expect(valor).toHaveAttribute("inputmode", "decimal");
    await userEvent.type(valor, "31200");
    expect(sem((valor as HTMLInputElement).value)).toBe("R$ 312,00");
    await userEvent.clear(valor);
    await userEvent.click(valor);
    await userEvent.paste("R$ 312,00");
    expect(sem((valor as HTMLInputElement).value)).toBe("R$ 312,00");
    await userEvent.type(screen.getByRole("textbox", { name: /Consumo do mês/ }), "380");
    await userEvent.click(screen.getByRole("button", { name: "Ver meu resultado" }));
    await waitFor(() => expect(api.simular).toHaveBeenCalledWith({ modo: "conta", consumoKwh: 380, valorConta: 312 }));
  });

  it("zero deixa o campo vazio e não manda o valor", async () => {
    api.simular.mockResolvedValue(RESULTADO_REFERENCIA);
    render(<TelaSimuladorConta />);
    const valor = screen.getByRole("textbox", { name: /Valor da conta/ });
    await userEvent.type(valor, "0");
    expect(valor).toHaveValue("");
    await userEvent.type(screen.getByRole("textbox", { name: /Consumo do mês/ }), "380");
    await userEvent.click(screen.getByRole("button", { name: "Ver meu resultado" }));
    await waitFor(() => expect(api.simular).toHaveBeenCalledWith({ modo: "conta", consumoKwh: 380 }));
  });
});

describe("simulador pelos aparelhos", () => {
  const APARELHOS = [
    { id: "a1", codigo: "geladeira", nome: "Geladeira", potencia_w: 60, horas_padrao: 24, icone: "geladeira" },
    { id: "a2", codigo: "lampada_led", nome: "Lâmpada LED", potencia_w: 9, horas_padrao: 6, icone: "lampada" },
    { id: "a3", codigo: "tv", nome: "TV", potencia_w: 100, horas_padrao: 5, icone: "tv" },
    { id: "a4", codigo: "chuveiro", nome: "Chuveiro elétrico", potencia_w: 5500, horas_padrao: 0.5, icone: "chuveiro" },
  ];

  it("começa com 1 geladeira, 4 lâmpadas, 1 TV e 1 chuveiro", () => {
    expect(casaDeExemplo(APARELHOS)).toEqual({ a1: 1, a2: 4, a3: 1, a4: 1 });
  });

  it("com tudo zerado, desativa o botão e pede um aparelho", async () => {
    api.listarAparelhos.mockResolvedValue(APARELHOS);
    render(<TelaSimuladorAparelhos />);
    expect(await screen.findByRole("status", { name: "4 Lâmpada LED" })).toBeInTheDocument();
    const botao = screen.getByRole("button", { name: "Ver meu resultado" });
    expect(botao).toBeEnabled();
    await userEvent.click(screen.getByRole("button", { name: "Diminuir Geladeira" }));
    for (let i = 0; i < 4; i++) await userEvent.click(screen.getByRole("button", { name: "Diminuir Lâmpada LED" }));
    await userEvent.click(screen.getByRole("button", { name: "Diminuir TV" }));
    await userEvent.click(screen.getByRole("button", { name: "Diminuir Chuveiro elétrico" }));
    expect(botao).toBeDisabled();
    expect(screen.getByText("Adicione pelo menos um aparelho.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Aumentar Chuveiro elétrico" }));
    expect(botao).toBeEnabled();
  });
});
