export type Direcao = "avancar" | "voltar" | "aba" | "expandir";

const DIRECOES: readonly Direcao[] = ["avancar", "voltar", "aba", "expandir"];

let direcao: Direcao = "avancar";
let navegou = false;

export function marcarDirecao(nova: Direcao) {
  direcao = nova;
  navegou = true;
}

export function lerDirecao(): { direcao: Direcao; primeiraCarga: boolean } {
  return { direcao, primeiraCarga: !navegou };
}

function aoClicar(evento: MouseEvent) {
  if (evento.defaultPrevented || evento.button !== 0 || evento.metaKey || evento.ctrlKey || evento.shiftKey) return;
  const link = (evento.target as Element | null)?.closest?.("a[href]");
  if (!link || link.getAttribute("target") === "_blank") return;
  const pedida = link.getAttribute("data-direcao") as Direcao | null;
  marcarDirecao(pedida && DIRECOES.includes(pedida) ? pedida : "avancar");
}

function aoVoltarDoNavegador() {
  marcarDirecao("voltar");
}

export function observarDirecao(): () => void {
  document.addEventListener("click", aoClicar, true);
  window.addEventListener("popstate", aoVoltarDoNavegador);
  return () => {
    document.removeEventListener("click", aoClicar, true);
    window.removeEventListener("popstate", aoVoltarDoNavegador);
  };
}
