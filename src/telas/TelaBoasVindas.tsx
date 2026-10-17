"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { BotaoLink } from "@/components/ui/Botao";
import { Icone, type NomeIcone } from "@/components/ui/Icone";
import { PadraoAzulejo } from "@/components/ui/PadraoAzulejo";
import { sessao } from "@/lib/api";

const PROMESSAS: { icone: NomeIcone; texto: string }[] = [
  { icone: "simulador", texto: "Simule sua conta em 1 minuto" },
  { icone: "trilhas", texto: "Aprenda em lições de 3 minutos" },
  { icone: "grupo", texto: "Some pontos para o seu bairro" },
];

// Só um sinal de "já viu a abertura"; nenhum dado pessoal.
const CHAVE_ABERTURA = "ce-abertura-vista";

function jaViuAbertura(): boolean {
  try {
    return window.localStorage.getItem(CHAVE_ABERTURA) === "1";
  } catch {
    return true;
  }
}

function marcarAberturaVista() {
  try {
    window.localStorage.setItem(CHAVE_ABERTURA, "1");
  } catch {}
}

const semAssinatura = () => () => {};

export function TelaBoasVindas() {
  // No servidor ainda não sabemos se é a primeira visita: o azulejo espera vazio até a hidratação.
  const hidratado = useSyncExternalStore(semAssinatura, () => true, () => false);
  const [assentar] = useState(() => (typeof window === "undefined" ? false : !jaViuAbertura()));
  const [temSessao, setTemSessao] = useState(false);

  useEffect(() => {
    if (assentar) marcarAberturaVista();
  }, [assentar]);

  useEffect(() => {
    let ativo = true;
    sessao.token().then((token) => ativo && setTemSessao(Boolean(token)), () => {});
    return () => {
      ativo = false;
    };
  }, []);

  return (
    <main className="flex min-h-dvh flex-col lg:flex-row deitado:flex-row">
      {/* No celular o azulejo é uma faixa no alto; no desktop e deitado, um painel da altura da tela. */}
      <div className="h-[250px] shrink-0 lg:sticky lg:top-0 lg:h-dvh lg:w-5/12 deitado:sticky deitado:top-0 deitado:h-dvh deitado:w-2/5">
        {hidratado && <PadraoAzulejo assentar={assentar} />}
      </div>
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-6 pt-7 pb-[max(2rem,env(safe-area-inset-bottom))] lg:justify-center lg:px-12 lg:py-16 deitado:pt-6 deitado:pr-[max(1.5rem,env(safe-area-inset-right))]">
        <h1 className="text-titulo-1">Sua conta de luz é a sua primeira aula de energia</h1>
        <p className="text-apoio">
          Descubra quanto você gasta, onde dá para economizar e como o sol de São Luís pode abastecer a sua casa.
        </p>
        <ul className="flex flex-col gap-2.5">
          {PROMESSAS.map(({ icone, texto }) => (
            <li key={texto} className="flex items-center gap-3 font-semibold">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-pequeno bg-primaria-suave text-primaria">
                <Icone nome={icone} tamanho={18} />
              </span>
              {texto}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex flex-col gap-1 lg:mt-4">
          {temSessao ? (
            <BotaoLink href="/inicio">Continuar de onde parei</BotaoLink>
          ) : (
            <>
              <BotaoLink href="/entrar">Começar</BotaoLink>
              <Link href="/entrar" className="flex min-h-11 items-center justify-center font-bold text-primaria no-underline">
                Já tenho perfil
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
