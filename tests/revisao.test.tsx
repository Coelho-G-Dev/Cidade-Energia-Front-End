import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Erro from "@/app/error";
import NaoEncontrada from "@/app/not-found";
import { ProvedorCelebracao, useCelebrar } from "@/components/app/Celebracao";
import { anos, placas } from "@/lib/conteudo";

describe("plural dos números do resultado", () => {
  it("usa o singular só para 1", () => {
    expect(placas(1)).toBe("1 placa");
    expect(placas(3)).toBe("3 placas");
    expect(placas(0.4)).toBe("0 placas");
    expect(anos(1)).toBe("1 ano");
    expect(anos(6.5)).toBe("6,5 anos");
  });
});

describe("telas de aviso", () => {
  it("a página que não existe fala português e leva ao início", () => {
    render(<NaoEncontrada />);
    expect(screen.getByRole("heading", { level: 1, name: "Esta página não existe" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir para o início" })).toHaveAttribute("href", "/inicio");
  });

  it("o erro de uma tela deixa tentar de novo", () => {
    const retry = vi.fn();
    render(<Erro error={new Error("falhou")} retry={retry} />);
    fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});

describe("aviso de conquista", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const RELOGIO_DO_AVISO = ["setTimeout", "clearTimeout"] as const;

  // Dá tempo para uma saída que tenha começado terminar (o aviso sai em 220 ms).
  async function esperarDeVerdade(ms: number) {
    vi.useRealTimers();
    await act(async () => new Promise((r) => setTimeout(r, ms)));
    vi.useFakeTimers({ toFake: [...RELOGIO_DO_AVISO] });
  }

  function Disparar() {
    const celebrar = useCelebrar();
    return (
      <button type="button" onClick={(e) => celebrar({ pontosGanhos: 0, conquistasNovas: [{ slug: "amigo_do_sol", nome: "Amigo do sol" }] }, e.currentTarget)}>
        Concluir
      </button>
    );
  }

  it("não some enquanto o foco está nele e some depois que o foco sai", async () => {
    // Só o relógio do aviso é falso; a animação de saída usa os quadros e o relógio de verdade.
    vi.useFakeTimers({ toFake: [...RELOGIO_DO_AVISO] });
    render(
      <ProvedorCelebracao>
        <Disparar />
      </ProvedorCelebracao>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Concluir" }));
    const link = screen.getByRole("link", { name: "Ver no meu perfil" });
    act(() => link.focus());
    act(() => vi.advanceTimersByTime(10_000));
    await esperarDeVerdade(400);
    expect(screen.getByRole("link", { name: "Ver no meu perfil" })).toBeInTheDocument();

    act(() => link.blur());
    act(() => vi.advanceTimersByTime(6_500));
    vi.useRealTimers();
    await waitFor(() => expect(screen.queryByRole("link", { name: "Ver no meu perfil" })).not.toBeInTheDocument());
  });
});
