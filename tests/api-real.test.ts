import { describe, expect, it, vi } from "vitest";
import type { Pedido, Requisitar } from "@/lib/api/http";
import { criarClienteReal } from "@/lib/api/real";

function montar() {
  const requisitar = vi.fn<(caminho: string, pedido: Pedido) => Promise<unknown>>(async () => ({}));
  return { requisitar, api: criarClienteReal(requisitar as unknown as Requisitar) };
}

describe("cliente real segue o contrato", () => {
  it.each([
    ["listarBairros", [], "/api/bairros", "GET", "nenhuma"],
    ["listarEscolas", ["b1"], "/api/escolas?bairro=b1", "GET", "nenhuma"],
    ["listarAparelhos", [], "/api/aparelhos", "GET", "nenhuma"],
    ["obterPerfil", [], "/api/perfil", "GET", "exigida"],
    ["obterResumo", [], "/api/perfil/resumo", "GET", "exigida"],
    ["ultimaSimulacao", [], "/api/simulacoes/ultima", "GET", "exigida"],
    ["solDeHoje", [], "/api/sol-de-hoje", "GET", "nenhuma"],
    ["listarTrilhas", [], "/api/trilhas", "GET", "opcional"],
    ["obterTrilha", ["energia-solar-em-sao-luis"], "/api/trilhas/energia-solar-em-sao-luis", "GET", "opcional"],
    ["obterLicao", ["l1"], "/api/licoes/l1", "GET", "opcional"],
    ["concluirLicao", ["l1"], "/api/licoes/l1/concluir", "POST", "exigida"],
    ["obterQuiz", ["l1"], "/api/licoes/l1/quiz", "GET", "opcional"],
    ["concluirPedale", ["l3"], "/api/pedale/concluir", "POST", "exigida"],
    ["listarMissoes", [], "/api/missoes", "GET", "opcional"],
    ["registrarMissao", ["m1"], "/api/missoes/m1/registrar", "POST", "exigida"],
    ["listarRanking", ["escolas"], "/api/rankings?tipo=escolas", "GET", "nenhuma"],
    ["listarPontosMapa", [], "/api/mapa/pontos", "GET", "nenhuma"],
    ["listarPontosMapa", ["coleta"], "/api/mapa/pontos?tipo=coleta", "GET", "nenhuma"],
  ] as const)("%s(%j) chama %s com %s", async (metodo, args, caminho, verbo, autenticacao) => {
    const { requisitar, api } = montar();
    await (api[metodo] as (...a: readonly unknown[]) => Promise<unknown>)(...args);
    const [chamado, pedido] = requisitar.mock.calls[0]!;
    expect(chamado).toBe(caminho);
    expect(pedido.metodo ?? "GET").toBe(verbo);
    expect(pedido.autenticacao).toBe(autenticacao);
  });

  it("simular salva com login e a prévia usa a rota que nunca salva, com token se houver", async () => {
    const { requisitar, api } = montar();
    const dados = { modo: "conta", consumoKwh: 380 } as const;
    await api.simular(dados);
    await api.previaSimulacao(dados);
    expect(requisitar.mock.calls[0]).toEqual(["/api/simulacoes", { metodo: "POST", corpo: dados, autenticacao: "opcional" }]);
    expect(requisitar.mock.calls[1]![0]).toBe("/api/simulacoes/previa");
    expect(requisitar.mock.calls[1]![1]).toMatchObject({ metodo: "POST", corpo: dados, autenticacao: "opcional" });
  });

  it("atualizar o perfil usa PUT com o corpo do schema", async () => {
    const { requisitar, api } = montar();
    const dados = { primeiro_nome: "Ana", bairro_id: "b1", codigo_turma: "TESTE2AB" };
    await api.atualizarPerfil(dados);
    expect(requisitar.mock.calls[0]).toEqual(["/api/perfil", { metodo: "PUT", corpo: dados, autenticacao: "exigida" }]);
  });

  it("concluir o Pedale manda só o licaoId", async () => {
    const { requisitar, api } = montar();
    await api.concluirPedale("l3");
    expect(requisitar.mock.calls[0]![1].corpo).toEqual({ licaoId: "l3" });
  });

  it("escapa ids na URL", async () => {
    const { requisitar, api } = montar();
    await api.obterLicao("a/b");
    expect(requisitar.mock.calls[0]![0]).toBe("/api/licoes/a%2Fb");
  });
});
