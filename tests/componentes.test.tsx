import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { BarraProgresso } from "@/components/ui/BarraProgresso";
import { Botao, BotaoIcone } from "@/components/ui/Botao";
import { BrotoPontos } from "@/components/ui/BrotoPontos";
import { CampoTexto } from "@/components/ui/CampoTexto";
import { CardNumero } from "@/components/ui/CardNumero";
import { ChipBotao } from "@/components/ui/Chip";
import { IndicadorDigitando } from "@/components/ui/IndicadorDigitando";
import { itemAtivo, Navegacao } from "@/components/ui/Navegacao";
import { Seletor } from "@/components/ui/Seletor";
import { SeletorDuplo } from "@/components/ui/SeletorDuplo";
import { Topo } from "@/components/ui/Topo";
import { usePoucoMovimento } from "@/lib/movimento";
import { definirMovimentoReduzido } from "./setup";

describe("usePoucoMovimento", () => {
  it("lê prefers-reduced-motion", () => {
    definirMovimentoReduzido(true);
    expect(renderHook(() => usePoucoMovimento()).result.current).toBe(true);
    definirMovimentoReduzido(false);
    expect(renderHook(() => usePoucoMovimento()).result.current).toBe(false);
  });
});

describe("Botao", () => {
  it("fica desativado e ocupado enquanto carrega", () => {
    render(<Botao carregando>Calculando...</Botao>);
    const botao = screen.getByRole("button", { name: "Calculando..." });
    expect(botao).toBeDisabled();
    expect(botao).toHaveAttribute("aria-busy", "true");
  });

  it("botão de ícone tem nome acessível e área de 44 px", () => {
    render(
      <BotaoIcone rotulo="Aumentar">
        <svg />
      </BotaoIcone>,
    );
    expect(screen.getByRole("button", { name: "Aumentar" })).toHaveClass("size-11");
  });
});

describe("CampoTexto", () => {
  it("liga rótulo, dica e erro ao campo", () => {
    render(<CampoTexto rotulo="Seu nome" dica="Só o primeiro nome." erro="Use pelo menos 2 letras." />);
    const campo = screen.getByLabelText("Seu nome");
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(campo).toHaveAccessibleDescription("Só o primeiro nome. Use pelo menos 2 letras.");
  });

  it("sem erro não marca o campo como inválido", () => {
    render(<CampoTexto rotulo="Seu nome" />);
    expect(screen.getByLabelText("Seu nome")).not.toHaveAttribute("aria-invalid");
  });
});

describe("Seletor", () => {
  it("mostra as opções com a opção vazia", () => {
    render(<Seletor rotulo="Seu bairro" textoVazio="Escolha seu bairro" opcoes={[{ valor: "a", rotulo: "Anil" }]} />);
    const seletor = screen.getByLabelText("Seu bairro");
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Escolha seu bairro", "Anil"]);
    expect(seletor).toHaveValue("");
  });
});

describe("SeletorDuplo", () => {
  function Controlado() {
    const [valor, setValor] = useState<"bairros" | "escolas">("bairros");
    return (
      <SeletorDuplo
        rotulo="Tipo de ranking"
        valor={valor}
        onTrocar={setValor}
        opcoes={[
          { valor: "bairros", rotulo: "Bairros" },
          { valor: "escolas", rotulo: "Escolas" },
        ]}
      />
    );
  }

  it("troca de opção pelo toque e pelas setas", async () => {
    const usuario = userEvent.setup();
    render(<Controlado />);
    expect(screen.getByRole("radiogroup", { name: "Tipo de ranking" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Bairros" })).toBeChecked();

    await usuario.click(screen.getByText("Escolas"));
    expect(screen.getByRole("radio", { name: "Escolas" })).toBeChecked();

    await usuario.keyboard("{ArrowLeft}");
    expect(screen.getByRole("radio", { name: "Bairros" })).toBeChecked();
  });

  it("com links, marca a página atual", () => {
    render(
      <SeletorDuplo
        rotulo="Como simular"
        valor="conta"
        opcoes={[
          { valor: "conta", rotulo: "Pela conta", href: "/simulador" },
          { valor: "aparelhos", rotulo: "Pelos aparelhos", href: "/simulador/aparelhos" },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: "Pela conta" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Pelos aparelhos" })).not.toHaveAttribute("aria-current");
  });
});

describe("Navegacao", () => {
  it("marca a aba da rota atual", () => {
    render(<Navegacao />);
    expect(screen.getByRole("navigation", { name: "Navegação principal" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Início" })).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByRole("link").map((l) => l.textContent)).toEqual(["Início", "Simulador", "Trilhas", "Tutor", "Mapa", "Perfil"]);
  });

  it("acha a aba das rotas filhas", () => {
    expect(itemAtivo("/simulador/aparelhos")).toBe("/simulador");
    expect(itemAtivo("/resultado")).toBe("/simulador");
    expect(itemAtivo("/trilhas/energia-solar-em-sao-luis/abc")).toBe("/trilhas");
    expect(itemAtivo("/quiz/abc")).toBe("/trilhas");
    expect(itemAtivo("/missoes/abc")).toBe("/trilhas");
    expect(itemAtivo("/perfil")).toBe("/perfil");
    expect(itemAtivo("/entrar")).toBeNull();
  });
});

describe("Topo", () => {
  it("tem botão de voltar com rótulo", () => {
    render(<Topo titulo="Simulador" voltarPara="/inicio" />);
    expect(screen.getByRole("link", { name: "Voltar" })).toHaveAttribute("href", "/inicio");
    expect(screen.getByText("Simulador")).toBeInTheDocument();
  });
});

describe("animações respeitam o valor final", () => {
  it("CardNumero anuncia o valor final para leitores de tela", () => {
    render(<CardNumero rotulo="Placas solares" valor={6} formatar={(v) => `${Math.round(v)} placas`} />);
    expect(screen.getByText("6 placas", { selector: ".sr-only" })).toBeInTheDocument();
  });

  it("com movimento reduzido, CardNumero mostra o valor sem contar", () => {
    definirMovimentoReduzido(true);
    render(<CardNumero rotulo="Gasto por mês" valor={312} formatar={(v) => `R$ ${Math.round(v)}`} />);
    expect(screen.getAllByText("R$ 312")).toHaveLength(2);
  });

  it("BarraProgresso expõe o progresso", () => {
    render(<BarraProgresso valor={2} total={4} rotulo="Parte 2 de 4" />);
    const barra = screen.getByRole("progressbar", { name: "Parte 2 de 4" });
    expect(barra).toHaveAttribute("aria-valuenow", "2");
    expect(barra).toHaveAttribute("aria-valuemax", "4");
  });

  it("BrotoPontos anuncia os pontos ganhos", () => {
    const { rerender } = render(<BrotoPontos ganho={null} />);
    expect(screen.queryByText("+10")).not.toBeInTheDocument();
    act(() => rerender(<BrotoPontos ganho={{ id: 1, pontos: 10 }} />));
    expect(screen.getByText("+10")).toBeInTheDocument();
    expect(screen.getByText("Você ganhou 10 pontos.")).toBeInTheDocument();
  });

  it("BrotoPontos não aparece quando não houve pontos", () => {
    render(<BrotoPontos ganho={{ id: 1, pontos: 0 }} />);
    expect(screen.queryByText("+0")).not.toBeInTheDocument();
  });

  it("IndicadorDigitando é um status com rótulo", () => {
    render(<IndicadorDigitando />);
    expect(screen.getByRole("status", { name: "O Energinho está escrevendo" })).toBeInTheDocument();
  });
});

describe("ChipBotao", () => {
  it("indica se o filtro está ligado", () => {
    render(<ChipBotao ativo>Energia solar</ChipBotao>);
    expect(screen.getByRole("button", { name: "Energia solar" })).toHaveAttribute("aria-pressed", "true");
  });
});
