"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Turnstile, turnstileLigado } from "@/components/app/Turnstile";
import { Botao } from "@/components/ui/Botao";
import { MensagemErro } from "@/components/ui/Campo";
import { CampoTexto } from "@/components/ui/CampoTexto";
import { SeletorBusca } from "@/components/ui/SeletorBusca";
import { SeletorDuplo } from "@/components/ui/SeletorDuplo";
import { Topo } from "@/components/ui/Topo";
import { api, campoDoErro, ErroApi, mensagemParaPessoa, sessao } from "@/lib/api";
import { diaEHora } from "@/lib/conteudo";
import { invalidar, limparCache } from "@/lib/cacheDados";
import { useDados } from "@/lib/useDados";
import { atualizarPerfilSchema } from "@/lib/validacao/perfil";
import type { AtualizarPerfil, Perfil } from "@/types";

type ModoEscola = "codigo" | "lista";
type Campo = "nome" | "bairro" | "codigo" | "escola" | "geral";
type Erros = Partial<Record<Campo, string>>;

const CAMPO_DO_SERVIDOR: Record<string, Campo> = {
  primeiro_nome: "nome",
  bairro_id: "bairro",
  codigo_turma: "codigo",
  escola_id: "escola",
};

// Os códigos de turma têm 8 letras e números, sem 0, O, 1 e I (para não confundir na hora de digitar).
export const FORMATO_CODIGO_TURMA = /^[A-HJ-NP-Z2-9]{8}$/;
export const MENSAGEM_CODIGO_TURMA = "O código tem 8 letras e números, sem 0, O, 1 e I. Confira com o seu professor.";
export const normalizarCodigo = (codigo: string) => codigo.replace(/[\s-]/g, "").toUpperCase();

export function validarPerfil(entrada: { nome: string; bairro: string; modo: ModoEscola; codigo: string; escola: string }, manterEscola: string | null) {
  const erros: Erros = {};
  if (!entrada.nome.trim()) erros.nome = "Escreva o seu primeiro nome.";
  if (!entrada.bairro) erros.bairro = "Escolha o seu bairro.";

  const dados: AtualizarPerfil = { primeiro_nome: entrada.nome.trim(), bairro_id: entrada.bairro };
  const codigo = normalizarCodigo(entrada.codigo);
  if (entrada.modo === "codigo" && codigo && !FORMATO_CODIGO_TURMA.test(codigo)) erros.codigo = MENSAGEM_CODIGO_TURMA;
  if (entrada.modo === "codigo" && codigo) dados.codigo_turma = codigo;
  else if (entrada.modo === "lista" && entrada.escola) dados.escola_id = entrada.escola;
  else if (entrada.modo === "codigo" && manterEscola) dados.escola_id = manterEscola;

  const resultado = atualizarPerfilSchema.safeParse(dados);
  if (!resultado.success) {
    for (const problema of resultado.error.issues) {
      const campo = CAMPO_DO_SERVIDOR[String(problema.path[0])] ?? "geral";
      if (erros[campo]) continue;
      erros[campo] = campo === "codigo" ? MENSAGEM_CODIGO_TURMA : problema.message;
    }
  }
  return { erros, dados: Object.keys(erros).length ? null : (resultado.data ?? null) };
}

export function TelaEntrar() {
  const router = useRouter();
  const bairros = useDados("bairros", () => api.listarBairros());
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [temSessao, setTemSessao] = useState(false);

  const [nome, setNome] = useState("");
  const [bairro, setBairro] = useState("");
  const [modo, setModo] = useState<ModoEscola>("codigo");
  const [codigo, setCodigo] = useState("");
  const [escola, setEscola] = useState("");
  const escolas = useDados(modo === "lista" && bairro ? `escolas-${bairro}` : null, () => api.listarEscolas(bairro));

  const [erros, setErros] = useState<Erros>({});
  const [tentativa, setTentativa] = useState(0);
  const [enviando, setEnviando] = useState<"perfil" | "anonimo" | null>(null);
  const [captcha, setCaptcha] = useState<string | undefined>(undefined);
  const [chaveCaptcha, setChaveCaptcha] = useState(0);
  const [captchaFalhou, setCaptchaFalhou] = useState(false);

  useEffect(() => {
    let ativo = true;
    sessao
      .token()
      .then((token) => {
        if (!ativo || !token) return null;
        setTemSessao(true);
        return api.obterPerfil();
      })
      .then((atual) => {
        if (!ativo || !atual) return;
        setPerfil(atual);
        if (!atual.tem_perfil) return;
        setNome(atual.primeiro_nome ?? "");
        setBairro(atual.bairro_id ?? "");
        if (atual.escola_id && !atual.escola_verificada) {
          setModo("lista");
          setEscola(atual.escola_id);
        }
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  const editando = Boolean(perfil?.tem_perfil);
  const escolaVerificada = perfil?.escola_verificada && perfil.escola_id ? perfil.escola_id : null;
  const precisaCaptcha = turnstileLigado && !temSessao;
  const bloqueado = enviando !== null || (precisaCaptcha && !captcha);

  async function entrar(): Promise<boolean> {
    try {
      await sessao.entrarAnonimo(captcha);
      // Sessão nova: o que foi lido antes, sem login, veio com o progresso zerado.
      if (!temSessao) limparCache();
      setTemSessao(true);
      return true;
    } catch (e) {
      setErros({ geral: mensagemParaPessoa(e) });
      setCaptcha(undefined);
      setChaveCaptcha((k) => k + 1);
      return false;
    }
  }

  async function criarPerfil(evento: FormEvent) {
    evento.preventDefault();
    setTentativa((t) => t + 1);
    const { erros: novos, dados } = validarPerfil({ nome, bairro, modo, codigo, escola }, escolaVerificada);
    setErros(novos);
    if (!dados) return;

    setEnviando("perfil");
    if (!(await entrar())) return setEnviando(null);
    try {
      await api.atualizarPerfil(dados);
      invalidar("perfil", "resumo", "ranking-");
      router.push(editando ? "/perfil" : "/inicio");
    } catch (e) {
      if (e instanceof ErroApi && e.codigo === "ESCOLA_INATIVA") {
        // A escola saiu da lista: busca as escolas do bairro de novo e pede outra.
        setModo("lista");
        setEscola("");
        escolas.recarregar();
        setErros({ escola: mensagemParaPessoa(e) });
        setTentativa((t) => t + 1);
        return setEnviando(null);
      }
      const campo = e instanceof ErroApi && e.codigo === "TURMA_NAO_ENCONTRADA" ? "codigo" : (CAMPO_DO_SERVIDOR[campoDoErro(e) ?? ""] ?? "geral");
      const mensagem = campo === "codigo" && e instanceof ErroApi && e.codigo === "TURMA_NAO_ENCONTRADA" ? "Não encontramos uma turma com esse código. Confira com o seu professor." : mensagemParaPessoa(e);
      setErros({ [campo]: mensagem });
      setTentativa((t) => t + 1);
      setEnviando(null);
    }
  }

  async function continuarSemPerfil() {
    setErros({});
    setEnviando("anonimo");
    if (await entrar()) router.push("/inicio");
    else setEnviando(null);
  }

  const opcoesBairro = bairros.estado === "pronto" ? bairros.dados.map((b) => ({ valor: b.id, rotulo: b.nome })) : [];
  const opcoesEscola = escolas.estado === "pronto" ? escolas.dados.map((e) => ({ valor: e.id, rotulo: e.nome })) : [];
  const semTrocas = editando && perfil && perfil.trocas_restantes === 0;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-4 px-[max(1.5rem,env(safe-area-inset-left),env(safe-area-inset-right))] pt-[max(2rem,env(safe-area-inset-top))] lg:min-h-0 lg:py-16 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <Topo titulo={editando ? "Editar perfil" : "Entrar"} voltarPara={editando ? "/perfil" : "/"} />
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">{editando ? "Atualize o seu perfil" : "Como podemos te chamar?"}</h1>
        <p className="text-apoio">Seu progresso e seus pontos ficam salvos no seu perfil.</p>
      </div>

      <form noValidate onSubmit={criarPerfil} className="flex flex-1 flex-col gap-4">
        <CampoTexto
          rotulo="Seu primeiro nome"
          placeholder="Digite seu nome"
          autoComplete="given-name"
          maxLength={30}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          erro={erros.nome}
          tentativa={tentativa}
        />
        <SeletorBusca
          rotulo="Seu bairro"
          nomeDosItens="bairros"
          placeholder={bairros.estado === "carregando" ? "Carregando os bairros..." : "Digite para buscar o seu bairro"}
          opcoes={opcoesBairro}
          valor={bairro}
          onEscolher={(novo) => {
            if (novo !== bairro) setEscola("");
            setBairro(novo);
          }}
          erro={erros.bairro ?? (bairros.estado === "erro" ? "Não deu para carregar os bairros. Recarregue a página." : undefined)}
          tentativa={tentativa}
        />

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1.5 text-sm font-bold">Sua escola (opcional)</legend>
          <SeletorDuplo
            rotulo="Como informar a escola"
            valor={modo}
            onTrocar={(novo) => {
              setModo(novo);
              setErros((atual) => ({ ...atual, codigo: undefined, escola: undefined }));
            }}
            opcoes={[
              { valor: "codigo", rotulo: "Código da turma" },
              { valor: "lista", rotulo: "Escolher da lista" },
            ]}
          />
          {modo === "codigo" ? (
            <CampoTexto
              rotulo="Código da turma"
              placeholder="8 letras e números"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              maxLength={12}
              value={codigo}
              onChange={(e) => setCodigo(normalizarCodigo(e.target.value))}
              dica={
                escolaVerificada && !codigo
                  ? "Sua escola já está confirmada. Deixe em branco para manter."
                  : "Peça ao seu professor. Com o código, seus pontos contam para a sua escola."
              }
              erro={erros.codigo}
              tentativa={tentativa}
            />
          ) : (
            <SeletorBusca
              rotulo="Escola"
              nomeDosItens="escolas"
              placeholder={!bairro ? "Escolha o bairro primeiro" : escolas.estado === "carregando" ? "Carregando as escolas..." : "Digite para buscar a sua escola"}
              opcoes={opcoesEscola}
              disabled={!bairro}
              valor={escola}
              onEscolher={setEscola}
              dica={
                escolas.estado === "pronto" && escolas.dados.length === 0
                  ? "Ainda não há escolas deste bairro na lista. Use o código da turma."
                  : "Escolhendo da lista, seus pontos contam para o bairro, mas não para a escola. Para somar para a escola, use o código da turma."
              }
              erro={erros.escola}
              tentativa={tentativa}
            />
          )}
        </fieldset>

        <p className="text-pequeno text-apoio">O bairro e a escola servem só para os rankings. Os dados da sua conta de luz ficam com você.</p>
        {editando && perfil && (
          <p className="text-pequeno text-apoio">
            {semTrocas && perfil.proxima_troca_em
              ? `Você já trocou de bairro ou escola ${perfil.limite_trocas} vezes. Poderá trocar de novo a partir de ${diaEHora(perfil.proxima_troca_em)}.`
              : `Você pode trocar de bairro ou escola mais ${perfil.trocas_restantes} ${perfil.trocas_restantes === 1 ? "vez" : "vezes"} nos próximos 30 dias.`}
          </p>
        )}

        {precisaCaptcha && (
          <div className="flex flex-col gap-1.5">
            <Turnstile
              key={chaveCaptcha}
              onToken={(token) => {
                setCaptcha(token);
                setCaptchaFalhou(false);
              }}
              onFalha={() => setCaptchaFalhou(true)}
            />
            {!captcha && (
              <p className="text-pequeno text-apoio">
                {captchaFalhou ? "A verificação não carregou. Confira a internet e recarregue a página." : "Confirme a verificação acima para continuar."}
              </p>
            )}
          </div>
        )}
        <MensagemErro id="erro-entrar" erro={erros.geral} />

        <div className="mt-auto flex flex-col gap-3 pt-2 lg:mt-2">
          <Botao type="submit" carregando={enviando === "perfil"} disabled={bloqueado}>
            {enviando === "perfil" ? "Salvando..." : editando ? "Salvar mudanças" : "Criar meu perfil"}
          </Botao>
          {!editando && (
            <Botao variante="secundario" onClick={continuarSemPerfil} carregando={enviando === "anonimo"} disabled={bloqueado}>
              {enviando === "anonimo" ? "Entrando..." : "Continuar sem perfil"}
            </Botao>
          )}
        </div>
      </form>
    </main>
  );
}
