import { describe, expect, it } from "vitest";
import { campoDoErro, eCorpoErro, ErroApi, mensagemParaPessoa, semNomeDoCampo } from "@/lib/api/erro";

describe("mensagens de erro", () => {
  it("usa a mensagem do back sem o nome do campo nas entradas inválidas", () => {
    const erro = new ErroApi(400, "ENTRADA_INVALIDA", "consumoKwh: O consumo deve ser maior que zero.");
    expect(mensagemParaPessoa(erro)).toBe("O consumo deve ser maior que zero.");
    expect(campoDoErro(erro)).toBe("consumoKwh");
  });

  it("mantém a mensagem do back nos limites, que trazem o horário de liberação", () => {
    const erro = new ErroApi(429, "LIMITE_DE_TROCAS", "Você poderá trocar de novo em 14/11 às 15:30.");
    expect(mensagemParaPessoa(erro)).toBe("Você poderá trocar de novo em 14/11 às 15:30.");
  });

  it("troca mensagens técnicas por textos que dizem o que fazer", () => {
    expect(mensagemParaPessoa(new ErroApi(0, "SEM_CONEXAO", "x"))).toMatch(/Confira a internet/);
    expect(mensagemParaPessoa(new ErroApi(500, "ERRO_INTERNO", "stack"))).toBe("Algo deu errado do nosso lado. Tente de novo.");
    expect(mensagemParaPessoa(new ErroApi(503, "TUTOR_INDISPONIVEL", "x"))).toMatch(/Energinho/);
    expect(mensagemParaPessoa(new Error("qualquer"))).toBe("Algo deu errado do nosso lado. Tente de novo.");
  });

  it("remove só o prefixo de campo", () => {
    expect(semNomeDoCampo("itens.0.horasDia: Um dia tem no máximo 24 horas.")).toBe("Um dia tem no máximo 24 horas.");
    expect(semNomeDoCampo("Envie escola_id ou codigo_turma, não os dois.")).toBe("Envie escola_id ou codigo_turma, não os dois.");
  });

  it("reconhece o formato de erro do back", () => {
    expect(eCorpoErro({ erro: { codigo: "X", mensagem: "y" } })).toBe(true);
    expect(eCorpoErro({ erro: "x" })).toBe(false);
    expect(eCorpoErro(null)).toBe(false);
  });
});
