import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Markdown } from "@/components/app/Markdown";
import { limparMarcadores } from "@/lib/conteudo";
import { lerDirecao, marcarDirecao, observarDirecao } from "@/lib/navegacao";
import { guardarResultado, lerResultado } from "@/lib/resultado";
import { useDados } from "@/lib/useDados";
import { descreverHoras } from "@/telas/TelaSimuladorAparelhos";
import { paraNumero } from "@/telas/TelaSimuladorConta";
import { RESULTADO_REFERENCIA } from "./dados";

describe("useDados", () => {
  it("passa de carregando para pronto", async () => {
    const { result } = renderHook(() => useDados("chave", async () => 42));
    expect(result.current.estado).toBe("carregando");
    await waitFor(() => expect(result.current.estado).toBe("pronto"));
    expect(result.current.dados).toBe(42);
  });

  it("guarda o erro e tenta de novo ao recarregar", async () => {
    const buscar = vi.fn().mockRejectedValueOnce(new Error("falhou")).mockResolvedValueOnce("ok");
    const { result } = renderHook(() => useDados("chave", buscar));
    await waitFor(() => expect(result.current.estado).toBe("erro"));
    act(() => result.current.recarregar());
    expect(result.current.estado).toBe("carregando");
    await waitFor(() => expect(result.current.dados).toBe("ok"));
    expect(buscar).toHaveBeenCalledTimes(2);
  });

  it("não busca com chave nula", () => {
    const buscar = vi.fn(async () => 1);
    const { result } = renderHook(() => useDados(null, buscar));
    expect(result.current.estado).toBe("carregando");
    expect(buscar).not.toHaveBeenCalled();
  });

  it("ignora a resposta de uma chave antiga", async () => {
    let resolverA: (v: string) => void = () => {};
    const { result, rerender } = renderHook(({ chave }) => useDados(chave, () => (chave === "a" ? new Promise<string>((r) => (resolverA = r)) : Promise.resolve("b"))), {
      initialProps: { chave: "a" },
    });
    rerender({ chave: "b" });
    await waitFor(() => expect(result.current.dados).toBe("b"));
    await act(async () => resolverA("a"));
    expect(result.current.dados).toBe("b");
  });
});

describe("direção da navegação", () => {
  let parar: () => void;
  beforeEach(() => {
    parar = observarDirecao();
  });
  afterEach(() => parar());

  function clicar(atributos: string) {
    document.body.innerHTML = `<a href="/x" ${atributos}>ir</a>`;
    const link = document.querySelector("a")!;
    link.addEventListener("click", (e) => e.preventDefault());
    link.click();
  }

  it("link comum avança, aba faz crossfade e voltar inverte", () => {
    clicar("");
    expect(lerDirecao()).toEqual({ direcao: "avancar", primeiraCarga: false });
    clicar('data-direcao="aba"');
    expect(lerDirecao().direcao).toBe("aba");
    clicar('data-direcao="voltar"');
    expect(lerDirecao().direcao).toBe("voltar");
    clicar('data-direcao="expandir"');
    expect(lerDirecao().direcao).toBe("expandir");
  });

  it("o voltar do navegador conta como voltar", () => {
    marcarDirecao("avancar");
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(lerDirecao().direcao).toBe("voltar");
  });
});

describe("conteúdo das lições", () => {
  it("esconde os marcadores de rascunho e mantém o texto", () => {
    expect(limparMarcadores("> [REVISAR]\n\nO sol forte [CONFERIR FONTE] de São Luís.")).toBe("O sol forte de São Luís.");
    expect(limparMarcadores("[REVISAR] Por que São Luís recebe sol?")).toBe("Por que São Luís recebe sol?");
  });

  it("renderiza Markdown com tabela e sem marcadores", () => {
    render(<Markdown texto={"> [REVISAR]\n\n## Título\n\n| Aparelho | Consumo |\n|---|---|\n| Ar | 240 kWh |\n\nTexto **forte** [CONFERIR FONTE]."} />);
    expect(screen.getByRole("heading", { name: "Título" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByText(/REVISAR|CONFERIR/)).not.toBeInTheDocument();
  });
});

describe("apoio das telas", () => {
  it("descreve as horas de uso como no canvas", () => {
    expect(descreverHoras(24)).toBe("ligado o dia todo");
    expect(descreverHoras(0.5)).toBe("30 min por dia");
    expect(descreverHoras(8)).toBe("8 h por dia");
  });

  it("lê números em reais e kWh", () => {
    expect(paraNumero("R$ 312,00")).toBe(312);
    expect(paraNumero("1.250,5")).toBe(1250.5);
    expect(paraNumero("380")).toBe(380);
    expect(paraNumero("abc")).toBeNull();
  });

  it("guarda o resultado só na memória", () => {
    const resultado = { ...RESULTADO_REFERENCIA };
    guardarResultado(resultado);
    expect(lerResultado()).toBe(resultado);
    expect(window.localStorage.length).toBe(0);
  });
});
