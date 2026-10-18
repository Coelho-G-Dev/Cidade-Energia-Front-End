import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";
import { limitesDosPontos, MARGEM_ENQUADRAMENTO } from "@/components/app/MapaLeaflet";
import { vitrineLiberada } from "@/lib/vitrine";

// Largura e altura gravadas no cabeçalho do PNG.
function medidaPng(caminho: string): [number, number] {
  const cabecalho = readFileSync(caminho);
  return [cabecalho.readUInt32BE(16), cabecalho.readUInt32BE(20)];
}

describe("vitrine /design", () => {
  it("aparece no desenvolvimento e some em produção, a não ser que a chave esteja ligada", () => {
    expect(vitrineLiberada("development", undefined)).toBe(true);
    expect(vitrineLiberada("production", undefined)).toBe(false);
    expect(vitrineLiberada("production", "false")).toBe(false);
    expect(vitrineLiberada("production", "true")).toBe(true);
  });
});

describe("enquadramento do mapa", () => {
  it("cobre todos os pontos, do mais a oeste ao mais a leste", () => {
    const limites = limitesDosPontos([
      { latitude: -2.562046, longitude: -44.317393 },
      { latitude: -2.489828, longitude: -44.269783 },
      { latitude: -2.564431, longitude: -44.199903 },
    ])!;
    expect(limites.getWest()).toBeCloseTo(-44.317393);
    expect(limites.getEast()).toBeCloseTo(-44.199903);
    expect(limites.getNorth()).toBeCloseTo(-2.489828);
    expect(limites.getSouth()).toBeCloseTo(-2.564431);
  });

  it("sem pontos não enquadra", () => {
    expect(limitesDosPontos([])).toBeNull();
  });

  it("deixa folga para o meio pino (22 px), os botões de zoom (até 58 px) e a atribuição (17 px)", () => {
    const [esquerda, topo] = MARGEM_ENQUADRAMENTO.superiorEsquerda;
    const [direita, base] = MARGEM_ENQUADRAMENTO.inferiorDireita;
    expect(Math.min(topo, direita)).toBeGreaterThanOrEqual(22);
    expect(esquerda).toBeGreaterThanOrEqual(58 + 22);
    expect(base).toBeGreaterThanOrEqual(17 + 22);
  });
});

describe("ícones para instalar o app", () => {
  it("o manifest tem PNG de 192 e 512 px, comuns e recortáveis, com o tamanho certo", () => {
    const icones = manifest().icons ?? [];
    for (const proposito of ["any", "maskable"] as const) {
      for (const lado of [192, 512]) {
        const icone = icones.find((i) => i.purpose === proposito && i.sizes === `${lado}x${lado}` && i.type === "image/png");
        expect(icone, `${proposito} ${lado}`).toBeDefined();
        expect(medidaPng(join("public", icone!.src))).toEqual([lado, lado]);
      }
    }
  });

  it("o iPhone tem o ícone de 180 px", () => {
    const caminho = join("src", "app", "apple-icon.png");
    expect(existsSync(caminho)).toBe(true);
    expect(medidaPng(caminho)).toEqual([180, 180]);
  });
});
