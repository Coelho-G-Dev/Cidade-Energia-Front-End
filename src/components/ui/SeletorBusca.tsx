"use client";

import { useEffect, useId, useState, type KeyboardEvent } from "react";
import { juntar } from "@/lib/classes";
import { CLASSES_ENTRADA, MolduraCampo } from "./Campo";
import { Icone } from "./Icone";
import type { OpcaoSeletor } from "./Seletor";

const MAXIMO_VISIVEL = 60;

/** Busca sem acento e sem diferença de maiúsculas: "sao" acha "São" e "Sao". */
export function normalizarBusca(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function filtrarOpcoes(opcoes: readonly OpcaoSeletor[], busca: string): OpcaoSeletor[] {
  const termos = normalizarBusca(busca).split(" ").filter(Boolean);
  if (termos.length === 0) return [...opcoes];
  return opcoes.filter((o) => {
    const rotulo = normalizarBusca(o.rotulo);
    return termos.every((t) => rotulo.includes(t));
  });
}

type Props = {
  rotulo: string;
  opcoes: readonly OpcaoSeletor[];
  valor: string;
  onEscolher: (valor: string) => void;
  placeholder?: string;
  /** Texto curto para o contador lido pelo leitor de tela: "bairros", "escolas". */
  nomeDosItens: string;
  dica?: string;
  erro?: string | null;
  tentativa?: number;
  disabled?: boolean;
  className?: string;
};

// Campo com busca para listas longas (174 bairros, centenas de escolas). Segue o padrão de combobox do ARIA.
export function SeletorBusca({ rotulo, opcoes, valor, onEscolher, placeholder, nomeDosItens, dica, erro, tentativa, disabled, className }: Props) {
  const idLista = useId();
  const [busca, setBusca] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(0);

  const escolhido = opcoes.find((o) => o.valor === valor);
  const texto = busca ?? escolhido?.rotulo ?? "";
  const encontrados = filtrarOpcoes(opcoes, busca ?? "");
  const visiveis = encontrados.slice(0, MAXIMO_VISIVEL);
  const mostrarLista = aberto && !disabled;
  const idAtivo = mostrarLista && visiveis[ativo] ? `${idLista}-${ativo}` : undefined;

  useEffect(() => {
    if (!idAtivo) return;
    document.getElementById(idAtivo)?.scrollIntoView?.({ block: "nearest" });
  }, [idAtivo]);

  function abrir() {
    if (disabled) return;
    setAberto(true);
    setAtivo(Math.max(0, visiveis.findIndex((o) => o.valor === valor)));
  }

  function fechar() {
    setAberto(false);
    setBusca(null);
  }

  function escolher(opcao: OpcaoSeletor) {
    onEscolher(opcao.valor);
    fechar();
  }

  function teclar(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      if (!aberto) return abrir();
      setAtivo((i) => Math.min(visiveis.length - 1, i + 1));
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setAtivo((i) => Math.max(0, i - 1));
    } else if (evento.key === "Enter") {
      if (!mostrarLista) return;
      evento.preventDefault();
      const opcao = visiveis[ativo];
      if (opcao) escolher(opcao);
    } else if (evento.key === "Escape") {
      if (mostrarLista) evento.preventDefault();
      fechar();
    }
  }

  return (
    <MolduraCampo rotulo={rotulo} dica={dica} erro={erro} tentativa={tentativa} className={className}>
      {({ id, descricao, invalido }) => (
        <div className="relative">
          <input
            id={id}
            type="text"
            role="combobox"
            aria-expanded={mostrarLista}
            aria-controls={idLista}
            aria-autocomplete="list"
            aria-activedescendant={idAtivo}
            aria-invalid={invalido || undefined}
            aria-describedby={descricao}
            autoComplete="off"
            spellCheck={false}
            disabled={disabled}
            placeholder={placeholder}
            value={texto}
            onChange={(e) => {
              setBusca(e.target.value);
              setAberto(true);
              setAtivo(0);
            }}
            onClick={() => (mostrarLista ? undefined : abrir())}
            onKeyDown={teclar}
            onBlur={fechar}
            className={juntar(CLASSES_ENTRADA, "pr-12", invalido ? "border-erro" : "border-tinta")}
          />
          <Icone nome="chevronBaixo" className={juntar("pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 transition-transform duration-200", mostrarLista && "rotate-180")} />
          <ul
            id={idLista}
            role="listbox"
            aria-label={rotulo}
            hidden={!mostrarLista}
            className="absolute inset-x-0 top-full z-20 mt-1.5 max-h-72 overflow-y-auto rounded-pequeno border-2 border-tinta bg-superficie py-1 shadow-azulejo"
          >
            {visiveis.map((opcao, i) => (
              <li
                key={opcao.valor}
                id={`${idLista}-${i}`}
                role="option"
                aria-selected={opcao.valor === valor}
                // Escolhe no pressionar para o campo não perder o foco antes do clique.
                onMouseDown={(e) => {
                  e.preventDefault();
                  escolher(opcao);
                }}
                onMouseMove={() => setAtivo(i)}
                className={juntar(
                  "flex min-h-11 cursor-pointer items-center gap-2 px-4 py-2 text-base",
                  i === ativo && "bg-primaria-suave",
                  opcao.valor === valor && "font-bold",
                )}
              >
                <span className="flex-1">{opcao.rotulo}</span>
                {opcao.valor === valor && <Icone nome="check" tamanho={16} className="shrink-0 text-primaria" />}
              </li>
            ))}
            {encontrados.length === 0 && <li className="px-4 py-3 text-pequeno text-apoio">Nada encontrado. Confira o que você digitou.</li>}
            {encontrados.length > visiveis.length && (
              <li className="px-4 py-2 text-pequeno text-apoio">
                Mostrando {visiveis.length} de {encontrados.length}. Continue digitando para achar mais rápido.
              </li>
            )}
          </ul>
          <span className="sr-only" aria-live="polite">
            {mostrarLista ? `${encontrados.length} ${nomeDosItens} na lista.` : ""}
          </span>
        </div>
      )}
    </MolduraCampo>
  );
}
