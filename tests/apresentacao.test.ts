import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";
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
