import { describe, expect, it, vi } from "vitest";
import { ErroApi } from "@/lib/api/erro";
import { criarRequisicao } from "@/lib/api/http";

function respostaJson(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });
}

function montar({ token = "tok-1" as string | null, renovado = "tok-2" as string | null } = {}) {
  const buscar = vi.fn<typeof fetch>();
  const sessao = { token: vi.fn(async () => token), renovar: vi.fn(async () => renovado) };
  const requisitar = criarRequisicao({ apiUrl: "http://api.teste", sessao, buscar });
  return { buscar, sessao, requisitar };
}

const cabecalhos = (chamada: unknown[]) => (chamada[1] as RequestInit).headers as Record<string, string>;

describe("criarRequisicao", () => {
  it("manda o token como Bearer nas rotas que exigem login", async () => {
    const { buscar, requisitar } = montar();
    buscar.mockResolvedValue(respostaJson({ ok: true }));

    await requisitar("/api/perfil", { autenticacao: "exigida" });

    expect(buscar).toHaveBeenCalledWith("http://api.teste/api/perfil", expect.objectContaining({ method: "GET" }));
    expect(cabecalhos(buscar.mock.calls[0]!).Authorization).toBe("Bearer tok-1");
  });

  it("não manda token nas rotas públicas nem na prévia", async () => {
    const { buscar, sessao, requisitar } = montar();
    buscar.mockResolvedValue(respostaJson([]));

    await requisitar("/api/bairros", { autenticacao: "nenhuma" });

    expect(cabecalhos(buscar.mock.calls[0]!).Authorization).toBeUndefined();
    expect(sessao.token).not.toHaveBeenCalled();
  });

  it("serializa o corpo em JSON com Content-Type", async () => {
    const { buscar, requisitar } = montar();
    buscar.mockResolvedValue(respostaJson({}));

    await requisitar("/api/simulacoes", { metodo: "POST", corpo: { modo: "conta", consumoKwh: 380 }, autenticacao: "opcional" });

    const init = buscar.mock.calls[0]![1] as RequestInit;
    expect(init.body).toBe('{"modo":"conta","consumoKwh":380}');
    expect(cabecalhos(buscar.mock.calls[0]!)["Content-Type"]).toBe("application/json");
  });

  it("na rota opcional sem sessão, chama sem token", async () => {
    const { buscar, requisitar } = montar({ token: null });
    buscar.mockResolvedValue(respostaJson([]));

    await requisitar("/api/trilhas", { autenticacao: "opcional" });

    expect(cabecalhos(buscar.mock.calls[0]!).Authorization).toBeUndefined();
  });

  it("na rota que exige login sem sessão, falha sem chamar o back", async () => {
    const { buscar, requisitar } = montar({ token: null });

    await expect(requisitar("/api/perfil", { autenticacao: "exigida" })).rejects.toMatchObject({
      status: 401,
      codigo: "NAO_AUTENTICADO",
    });
    expect(buscar).not.toHaveBeenCalled();
  });

  it("no 401, renova a sessão uma vez e repete com o token novo", async () => {
    const { buscar, sessao, requisitar } = montar();
    buscar
      .mockResolvedValueOnce(respostaJson({ erro: { codigo: "NAO_AUTENTICADO", mensagem: "x" } }, 401))
      .mockResolvedValueOnce(respostaJson({ pontos: 10 }));

    await expect(requisitar("/api/perfil/resumo", { autenticacao: "exigida" })).resolves.toEqual({ pontos: 10 });

    expect(sessao.renovar).toHaveBeenCalledTimes(1);
    expect(cabecalhos(buscar.mock.calls[1]!).Authorization).toBe("Bearer tok-2");
  });

  it("se a renovação falhar, devolve o 401 do back", async () => {
    const { buscar, requisitar } = montar({ renovado: null });
    buscar.mockResolvedValue(respostaJson({ erro: { codigo: "NAO_AUTENTICADO", mensagem: "Faça login." } }, 401));

    await expect(requisitar("/api/perfil", { autenticacao: "exigida" })).rejects.toMatchObject({ codigo: "NAO_AUTENTICADO" });
    expect(buscar).toHaveBeenCalledTimes(1);
  });

  it("transforma o corpo de erro do back em ErroApi", async () => {
    const { buscar, requisitar } = montar();
    buscar.mockResolvedValue(respostaJson({ erro: { codigo: "LIMITE_TUTOR", mensagem: "Tente de novo às 15:00." } }, 429));

    const erro = await requisitar("/api/tutor", { metodo: "POST", corpo: { mensagem: "oi" }, autenticacao: "exigida" }).catch(
      (e: unknown) => e,
    );

    expect(erro).toBeInstanceOf(ErroApi);
    expect(erro).toMatchObject({ status: 429, codigo: "LIMITE_TUTOR", message: "Tente de novo às 15:00." });
  });

  it("falha de rede vira SEM_CONEXAO", async () => {
    const { buscar, requisitar } = montar();
    buscar.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(requisitar("/api/bairros", { autenticacao: "nenhuma" })).rejects.toMatchObject({ codigo: "SEM_CONEXAO" });
  });

  it("resposta sem JSON vira RESPOSTA_INVALIDA", async () => {
    const { buscar, requisitar } = montar();
    buscar.mockResolvedValue(new Response("<html>", { status: 502 }));

    await expect(requisitar("/api/bairros", { autenticacao: "nenhuma" })).rejects.toMatchObject({
      status: 502,
      codigo: "RESPOSTA_INVALIDA",
    });
  });

  it("deixa passar o cancelamento da prévia", async () => {
    const { buscar, requisitar } = montar();
    buscar.mockRejectedValue(new DOMException("cancelado", "AbortError"));

    await expect(requisitar("/api/simulacoes", { metodo: "POST", corpo: {}, autenticacao: "nenhuma" })).rejects.toMatchObject({
      name: "AbortError",
    });
  });
});
