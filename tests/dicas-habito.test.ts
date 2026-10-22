import { describe, expect, it } from "vitest";
import { economiaKwhPorRegras, PARAMETROS_PADRAO, simular, type ItemAparelho } from "@/lib/api/simulado/calculo";

// Mesmos números de tests/simulador.test.ts do back, que ganhou as dicas de geladeira, TV, lâmpada e ventilador.
const P = { ...PARAMETROS_PADRAO, tarifaPadrao: 0.82, custoPorKwp: 4000, irradiacao: 5.4 };

const item = (codigo: string, nome: string, potenciaW: number, horasDia: number, quantidade = 1): ItemAparelho => ({
  codigo,
  nome,
  potenciaW,
  horasDia,
  quantidade,
});

const casaTipica: ItemAparelho[] = [
  item("ar_condicionado", "Ar-condicionado", 1000, 8),
  item("chuveiro", "Chuveiro elétrico", 5500, 0.5),
  item("geladeira", "Geladeira", 60, 24),
  item("tv", "TV", 100, 5),
  item("lampada_led", "Lâmpada LED", 9, 6, 5),
  item("ventilador", "Ventilador", 60, 8),
];

describe("dicas de hábito para todos os aparelhos", () => {
  it("1 h de ar, TV, lâmpada e ventilador, 10 min de banho e 10% da geladeira", () => {
    expect(economiaKwhPorRegras(casaTipica, P.regrasEconomia)).toBeCloseTo(30 + 27.5 + 4.32 + 3 + 1.35 + 1.8, 10);
    expect(economiaKwhPorRegras([item("tv", "TV", 100, 0.5)], P.regrasEconomia)).toBeCloseTo(1.5, 10);
    expect(economiaKwhPorRegras([item("geladeira", "Geladeira", 60, 24, 2)], P.regrasEconomia)).toBeCloseTo(8.64, 10);
    expect(economiaKwhPorRegras([item("micro_ondas", "Micro-ondas", 1200, 0.2)], P.regrasEconomia)).toBe(0);
  });

  it("a casa típica economiza 67,97 kWh × R$ 0,82 e o texto junta as dicas com vírgulas", () => {
    const r = simular({ modo: "aparelhos", itens: casaTipica }, P);
    expect(r.economiaHabitosMensal).toBe(55.74);
    expect(r.comoCalculamos.economiaHabitos).toBe(
      "Mudança de hábitos, sem investimento: usar o ar-condicionado 1 hora a menos por dia, tomar banhos 10 minutos mais curtos por dia," +
        " abrir a geladeira só quando precisar, sem guardar comida quente, desligar a TV quando ninguém estiver assistindo," +
        " apagar as luzes de cômodos vazios e desligar o ventilador ao sair do cômodo. São 68 kWh a menos por mês × R$ 0,82 por kWh.",
    );
  });

  it("duas dicas ficam ligadas por \"e\"", () => {
    const s = simular({ modo: "aparelhos", itens: [item("tv", "TV", 100, 5), item("ventilador", "Ventilador", 60, 8)] }, P);
    expect(s.economiaHabitosMensal).toBe(3.94);
    expect(s.comoCalculamos.economiaHabitos).toBe(
      "Mudança de hábitos, sem investimento: desligar a TV quando ninguém estiver assistindo e desligar o ventilador ao sair do cômodo." +
        " São 4,8 kWh a menos por mês × R$ 0,82 por kWh.",
    );
  });

  it("a casa de exemplo sem chuveiro já não dá zero", () => {
    const semChuveiro = [item("geladeira", "Geladeira", 60, 24), item("lampada_led", "Lâmpada LED", 9, 6, 4), item("tv", "TV", 100, 5)];
    expect(simular({ modo: "aparelhos", itens: semChuveiro }).economiaHabitosMensal).toBe(7.47);
  });
});
