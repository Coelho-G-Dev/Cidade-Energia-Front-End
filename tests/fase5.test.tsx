import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TelaMapa } from "@/telas/TelaMapa";
import type { PontoMapa } from "@/types";

const api = vi.hoisted(() => ({
  listarPontosMapa: vi.fn(),
  obterPerfil: vi.fn(),
  listarRanking: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const erro = await vi.importActual<typeof import("@/lib/api/erro")>("@/lib/api/erro");
  return { ...erro, api };
});

// O Leaflet não roda no jsdom: no lugar do mapa, um botão por pino com a mesma interface.
vi.mock("next/dynamic", () => ({
  default: () =>
    function MapaFalso({ pontos, onSelecionar }: { pontos: readonly PontoMapa[]; onSelecionar: (id: string) => void }) {
      return (
        <div>
          {pontos.map((p) => (
            <button key={p.id} type="button" onClick={() => onSelecionar(p.id)}>
              {p.nome}
            </button>
          ))}
        </div>
      );
    },
}));

const PONTO: PontoMapa = { id: "p1", nome: "Telhado solar de escola", tipo: "solar", latitude: -2.53, longitude: -44.25, descricao: "Placas no telhado." };

describe("mapa pelo teclado", () => {
  it("o cartão recebe o foco ao abrir e devolve ao pino ao fechar", async () => {
    api.listarPontosMapa.mockResolvedValue([PONTO]);
    api.obterPerfil.mockResolvedValue({ bairro_id: null, escola_id: null, escola_verificada: false });
    api.listarRanking.mockResolvedValue([]);
    const pessoa = userEvent.setup();
    render(<TelaMapa />);

    const pino = await screen.findByRole("button", { name: PONTO.nome });
    pino.focus();
    await pessoa.keyboard("{Enter}");
    expect(screen.getByRole("dialog", { name: PONTO.nome })).toHaveFocus();

    await pessoa.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(pino).toHaveFocus();

    await pessoa.click(pino);
    await pessoa.click(screen.getByRole("button", { name: "Fechar detalhes do ponto" }));
    expect(pino).toHaveFocus();
  });
});
