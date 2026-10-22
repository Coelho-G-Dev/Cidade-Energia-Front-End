import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { limparCache } from "@/lib/cacheDados";

export function definirMovimentoReduzido(reduzido: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((consulta: string) => ({
      matches: reduzido && consulta.includes("prefers-reduced-motion"),
      media: consulta,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

definirMovimentoReduzido(false);

class ObservadorFalso {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver ??= ObservadorFalso as unknown as typeof ResizeObserver;
globalThis.IntersectionObserver ??= ObservadorFalso as unknown as typeof IntersectionObserver;

vi.mock("next/navigation", () => ({
  usePathname: () => "/inicio",
  useRouter: () => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

afterEach(() => {
  cleanup();
  // O cache das leituras vive no módulo: cada teste começa sem dados guardados.
  limparCache();
  definirMovimentoReduzido(false);
});
