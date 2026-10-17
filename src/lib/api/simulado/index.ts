import { ZodError, type ZodType } from "zod";
import type {
  AtualizarPerfil,
  ConquistaNova,
  CriarSimulacao,
  ItemRanking,
  LicaoDetalhada,
  LicaoPendente,
  Missao,
  Perfil,
  PosicaoRanking,
  ResultadoEvento,
  ResumoTrilha,
  SimulacaoSalva,

  TipoRanking,
} from "@/types";
import { idSchema, mapaSchema, pedaleSchema, rankingSchema, responderSchema, slugSchema } from "@/lib/validacao/conteudo";
import { atualizarPerfilSchema, filtroEscolasSchema } from "@/lib/validacao/perfil";
import { criarSimulacaoSchema } from "@/lib/validacao/simulacao";
import { tutorSchema } from "@/lib/validacao/tutor";
import { ErroApi } from "../erro";
import type { FonteSessao } from "../sessao";
import type { ClienteApi } from "../tipos";
import { ErroCalculo, simular, type EntradaSimulacao } from "./calculo";
import { APARELHOS, BAIRROS, CONQUISTAS, ESCOLAS, LICOES, MISSOES, PERGUNTAS, PONTOS_MAPA, TRILHAS } from "./conteudo";
import { responderTutorSimulado } from "./tutor";
import {
  avaliarTentativa,
  conquistasMerecidas,
  diaEHora,
  diaEmSaoLuis,
  PONTOS_POR_ORIGEM,
  type RespostaAnterior,
} from "./regras";

export const PONTOS_ILUSTRATIVOS = {
  bairros: { Anil: [310, 9], Centro: [240, 7], "Cidade Operária": [180, 6], Cohama: [150, 4], Renascença: [90, 3], Turu: [45, 2] },
  escolas: {
    "Escola Estadual Sol Nascente (fictícia)": [120, 4],
    "Centro de Ensino Vento Norte (fictícia)": [95, 3],
    "Escola Municipal Raio de Luz (fictícia)": [60, 2],
  },
} as const satisfies Record<TipoRanking, Record<string, readonly [number, number]>>;

export const SOL_DE_HOJE_SIMULADO = {
  data: "2026-10-09",
  irradiacao: 6.22,
  kwhPorPlaca: 2.74,
  horasArCondicionado: 2.7,
  co2EvitadoKg: 0.105,
  estimativa: true,
  fonte: "nasa-power",
} as const;

const LIMITE_TROCAS = 3;
const JANELA_TROCAS_MS = 30 * 24 * 3_600_000;
const LIMITE_TUTOR_POR_HORA = 20;
const HORA_MS = 3_600_000;
const TOKEN_SIMULADO = "token-do-modo-simulado";
// Guarda só o sinal de que entrou, para o modo simulado sobreviver a um recarregar. Nenhum dado pessoal.
const CHAVE_LOGADO = "ce-simulado-logado";

function lerLogado(): boolean {
  try {
    return typeof window !== "undefined" && window.sessionStorage.getItem(CHAVE_LOGADO) === "1";
  } catch {
    return false;
  }
}

function guardarLogado() {
  try {
    window.sessionStorage.setItem(CHAVE_LOGADO, "1");
  } catch {}
}

type Evento = { origem: string; referencia: string; pontos: number };

type Estado = {
  logado: boolean;
  perfil: { id: string; primeiro_nome: string | null; bairro_id: string | null; escola_id: string | null; escola_verificada: boolean; criado_em: string };
  trocas: number[];
  eventos: Evento[];
  conquistas: Map<string, string>;
  licoesConcluidas: Set<string>;
  respostas: Map<string, { correta: boolean; tentativaEm: Date }>;
  registros: Map<string, Set<string>>;
  simulacoes: SimulacaoSalva[];
  usosTutor: number[];
};

function estadoInicial(agora: Date, logado = false): Estado {
  return {
    logado,
    perfil: {
      id: "0f000000-0000-4000-8000-000000000001",
      primeiro_nome: null,
      bairro_id: null,
      escola_id: null,
      escola_verificada: false,
      criado_em: agora.toISOString(),
    },
    trocas: [],
    eventos: [],
    conquistas: new Map(),
    licoesConcluidas: new Set(),
    respostas: new Map(),
    registros: new Map(),
    simulacoes: [],
    usosTutor: [],
  };
}

function validar<T>(schema: ZodType<T>, dados: unknown): T {
  try {
    return schema.parse(dados);
  } catch (e) {
    if (e instanceof ZodError) {
      const primeiro = e.issues[0];
      const campo = primeiro?.path.join(".");
      throw new ErroApi(400, "ENTRADA_INVALIDA", primeiro ? (campo ? `${campo}: ${primeiro.message}` : primeiro.message) : "Dados inválidos.");
    }
    throw e;
  }
}

const naoEncontrado = (codigo: string, mensagem: string) => new ErroApi(404, codigo, mensagem);
const copia = <T>(valor: T): T => structuredClone(valor);

type Opcoes = { atrasoMs?: number; agora?: () => Date; aleatorio?: () => number; lembrarLogin?: boolean };

export function criarSimulado({ atrasoMs = 450, agora = () => new Date(), aleatorio = Math.random, lembrarLogin = false }: Opcoes = {}) {
  let estado = estadoInicial(agora(), lembrarLogin && lerLogado());

  const esperar = () =>
    atrasoMs > 0 ? new Promise<void>((r) => setTimeout(r, atrasoMs * (0.6 + aleatorio() * 0.8))) : Promise.resolve();

  function exigirLogin() {
    if (!estado.logado) throw new ErroApi(401, "NAO_AUTENTICADO", "Faça login para acessar este recurso.");
  }

  const pontosDoUsuario = () => estado.eventos.reduce((soma, e) => soma + e.pontos, 0);

  function ranking(tipo: TipoRanking): ItemRanking[] {
    const meus = pontosDoUsuario();
    const linhas =
      tipo === "bairros"
        ? BAIRROS.map((b) => {
            const base = PONTOS_ILUSTRATIVOS.bairros[b.nome as keyof typeof PONTOS_ILUSTRATIVOS.bairros] ?? [0, 0];
            const meu = estado.perfil.bairro_id === b.id && meus > 0;
            return { id: b.id, nome: b.nome, pontos: base[0] + (meu ? meus : 0), participantes: base[1] + (meu ? 1 : 0) };
          })
        : ESCOLAS.map((e) => {
            const base = PONTOS_ILUSTRATIVOS.escolas[e.nome as keyof typeof PONTOS_ILUSTRATIVOS.escolas] ?? [0, 0];
            const meu = estado.perfil.escola_id === e.id && estado.perfil.escola_verificada && meus > 0;
            return { id: e.id, nome: e.nome, bairroId: e.bairro_id, pontos: base[0] + (meu ? meus : 0), participantes: base[1] + (meu ? 1 : 0) };
          });
    const comPontos = linhas.filter((l) => l.pontos > 0).sort((a, b) => b.pontos - a.pontos || a.nome.localeCompare(b.nome));
    return comPontos.map((l) => ({ ...l, posicao: comPontos.findIndex((o) => o.pontos === l.pontos) + 1 }));
  }

  function posicao(tipo: TipoRanking, id: string | null): PosicaoRanking | null {
    if (!id) return null;
    const item = ranking(tipo).find((l) => l.id === id);
    return item ? { posicao: item.posicao, pontos: item.pontos } : { posicao: null, pontos: 0 };
  }

  function trilhasConcluidas(): string[] {
    return TRILHAS.filter((t) => {
      const licoes = LICOES.filter((l) => l.trilhaSlug === t.slug);
      return licoes.length > 0 && licoes.every((l) => estado.licoesConcluidas.has(l.id));
    }).map((t) => t.slug);
  }

  const missoesConcluidas = () =>
    MISSOES.filter((m) => (estado.registros.get(m.id)?.size ?? 0) >= m.diasNecessarios).map((m) => m.slug);

  function avaliarConquistas(): ConquistaNova[] {
    const merecidas = conquistasMerecidas({
      temSimulacao: estado.simulacoes.length > 0,
      trilhasConcluidas: trilhasConcluidas(),
      missoesConcluidas: missoesConcluidas(),
      pontosBairro: posicao("bairros", estado.perfil.bairro_id)?.pontos ?? 0,
    });
    const novas: ConquistaNova[] = [];
    for (const slug of merecidas) {
      if (estado.conquistas.has(slug)) continue;
      estado.conquistas.set(slug, agora().toISOString());
      const conquista = CONQUISTAS.find((c) => c.slug === slug);
      if (conquista) novas.push({ slug, nome: conquista.nome });
    }
    return novas;
  }

  function registrarEvento(origem: string, referencia: string, pontos: number): ResultadoEvento {
    const repetido = estado.eventos.some((e) => e.origem === origem && e.referencia === referencia);
    if (!repetido) estado.eventos.push({ origem, referencia, pontos });
    return { pontosGanhos: repetido ? 0 : pontos, conquistasNovas: avaliarConquistas() };
  }

  function situacaoTrocas() {
    const recentes = estado.trocas.filter((t) => agora().getTime() - t < JANELA_TROCAS_MS);
    const restantes = Math.max(0, LIMITE_TROCAS - recentes.length);
    const maisAntiga = Math.min(...recentes);
    return {
      limite_trocas: LIMITE_TROCAS,
      trocas_restantes: restantes,
      proxima_troca_em: restantes > 0 ? null : new Date(maisAntiga + JANELA_TROCAS_MS).toISOString(),
    };
  }

  const perfilAtual = (): Perfil => ({ ...estado.perfil, ...situacaoTrocas(), tem_perfil: estado.perfil.primeiro_nome !== null });

  function resumoTrilha(t: (typeof TRILHAS)[number]): ResumoTrilha {
    const licoes = LICOES.filter((l) => l.trilhaSlug === t.slug);
    const feitas = estado.logado ? licoes.filter((l) => estado.licoesConcluidas.has(l.id)).length : 0;
    return {
      id: t.id,
      slug: t.slug,
      titulo: t.titulo,
      descricao: t.descricao,
      tema: t.tema,
      minutos: t.minutos,
      totalLicoes: licoes.length,
      licoesConcluidas: feitas,
      concluida: licoes.length > 0 && feitas === licoes.length,
    };
  }

  function acharLicao(id: string) {
    const licao = LICOES.find((l) => l.id === validar(idSchema, id));
    if (!licao) throw naoEncontrado("LICAO_NAO_ENCONTRADA", "Lição não encontrada.");
    return licao;
  }

  const concluiu = (licaoId: string) => estado.logado && estado.licoesConcluidas.has(licaoId);

  // Como no back: a lição só é concluída depois das anteriores da mesma trilha.
  function licaoPendente(licao: (typeof LICOES)[number]): LicaoPendente | null {
    if (concluiu(licao.id)) return null;
    const pendente = LICOES.filter((l) => l.trilhaSlug === licao.trilhaSlug && l.ordem < licao.ordem && !concluiu(l.id)).sort(
      (a, b) => a.ordem - b.ordem,
    )[0];
    return pendente ? { id: pendente.id, titulo: pendente.titulo } : null;
  }

  function concluir(licaoId: string, tipo: "texto" | "pedale") {
    exigirLogin();
    const licao = acharLicao(licaoId);
    if (licao.tipo !== tipo) {
      throw tipo === "texto"
        ? new ErroApi(400, "LICAO_E_PEDALE", "Esta lição é do Pedale e veja: conclua pelo POST /api/pedale/concluir.")
        : new ErroApi(400, "LICAO_NAO_E_PEDALE", "Esta lição não é do Pedale e veja.");
    }
    const pendente = licaoPendente(licao);
    if (pendente) throw new ErroApi(409, "LICAO_BLOQUEADA", `Conclua antes a lição "${pendente.titulo}".`);
    estado.licoesConcluidas.add(licao.id);
    const evento =
      tipo === "texto"
        ? registrarEvento("licao_concluida", licao.id, PONTOS_POR_ORIGEM.licao_concluida)
        : registrarEvento("pedale_concluido", licao.id, PONTOS_POR_ORIGEM.pedale_concluido);
    return { licaoId: licao.id, concluida: true as const, ...evento };
  }

  function montarEntrada(dados: CriarSimulacao): EntradaSimulacao {
    if (dados.modo === "conta") return dados;
    return {
      modo: "aparelhos",
      itens: dados.itens.map((item) => {
        const aparelho = APARELHOS.find((a) => a.id === item.aparelhoId);
        if (!aparelho) throw naoEncontrado("APARELHO_NAO_ENCONTRADO", `Aparelho ${item.aparelhoId} não existe.`);
        return { codigo: aparelho.codigo, nome: aparelho.nome, potenciaW: aparelho.potencia_w, quantidade: item.quantidade, horasDia: item.horasDia };
      }),
    };
  }

  function calcular(dados: unknown) {
    const corpo = validar(criarSimulacaoSchema, dados);
    try {
      return { corpo, resultado: simular(montarEntrada(corpo)) };
    } catch (e) {
      if (e instanceof ErroCalculo) throw new ErroApi(400, "ENTRADA_INVALIDA", e.message);
      throw e;
    }
  }

  const missao = (m: (typeof MISSOES)[number]): Missao => {
    const dias = estado.logado ? (estado.registros.get(m.id) ?? new Set<string>()) : new Set<string>();
    return {
      id: m.id,
      slug: m.slug,
      titulo: m.titulo,
      descricao: m.descricao,
      trilhaSlug: m.trilhaSlug,
      pontos: m.pontos,
      diasNecessarios: m.diasNecessarios,
      diasRegistrados: dias.size,
      diasMarcados: [...dias].sort(),
      registradaHoje: dias.has(diaEmSaoLuis(agora())),
      concluida: dias.size >= m.diasNecessarios,
    };
  };

  const api: ClienteApi = {
    async listarBairros() {
      await esperar();
      return copia(BAIRROS);
    },
    async listarEscolas(bairroId) {
      await esperar();
      const { bairro } = validar(filtroEscolasSchema, { bairro: bairroId });
      return ESCOLAS.filter((e) => !bairro || e.bairro_id === bairro).map(({ id, nome, bairro_id }) => ({ id, nome, bairro_id }));
    },
    async listarAparelhos() {
      await esperar();
      return copia(APARELHOS);
    },
    async obterPerfil() {
      await esperar();
      exigirLogin();
      return perfilAtual();
    },
    async atualizarPerfil(dados: AtualizarPerfil) {
      await esperar();
      exigirLogin();
      const corpo = validar(atualizarPerfilSchema, dados);
      if (!BAIRROS.some((b) => b.id === corpo.bairro_id)) {
        throw naoEncontrado("BAIRRO_OU_ESCOLA_NAO_ENCONTRADO", "Bairro ou escola não encontrado.");
      }
      let escolaId: string | null = corpo.escola_id ?? null;
      if (corpo.codigo_turma) {
        const escola = ESCOLAS.find((e) => e.codigo_turma === corpo.codigo_turma);
        if (!escola) throw naoEncontrado("TURMA_NAO_ENCONTRADA", "Não encontramos uma turma com esse código.");
        escolaId = escola.id;
      } else if (escolaId && !ESCOLAS.some((e) => e.id === escolaId)) {
        throw naoEncontrado("BAIRRO_OU_ESCOLA_NAO_ENCONTRADO", "Bairro ou escola não encontrado.");
      }

      const anterior = estado.perfil;
      const trocouBairro = anterior.bairro_id !== null && anterior.bairro_id !== corpo.bairro_id;
      const trocouEscola = anterior.escola_id !== null && anterior.escola_id !== escolaId;
      if (trocouBairro || trocouEscola) {
        const situacao = situacaoTrocas();
        if (situacao.trocas_restantes === 0) {
          const { dia, hora } = diaEHora(new Date(situacao.proxima_troca_em!));
          throw new ErroApi(
            429,
            "LIMITE_DE_TROCAS",
            `Você atingiu o limite de trocas de bairro ou escola. Você poderá trocar de novo a partir de ${dia} às ${hora}.`,
          );
        }
        estado.trocas.push(agora().getTime());
      }

      const verificada = corpo.codigo_turma ? true : anterior.escola_id === escolaId ? anterior.escola_verificada : false;
      estado.perfil = { ...anterior, primeiro_nome: corpo.primeiro_nome, bairro_id: corpo.bairro_id, escola_id: escolaId, escola_verificada: verificada };
      return perfilAtual();
    },
    async obterResumo() {
      await esperar();
      exigirLogin();
      return {
        pontos: pontosDoUsuario(),
        licoesConcluidas: estado.licoesConcluidas.size,
        trilhasConcluidas: trilhasConcluidas().length,
        missoesConcluidas: missoesConcluidas().length,
        conquistas: [...CONQUISTAS]
          .sort((a, b) => a.ordem - b.ordem)
          .map((c) => ({
            slug: c.slug,
            nome: c.nome,
            criterio: c.criterio,
            obtida: estado.conquistas.has(c.slug),
            obtidaEm: estado.conquistas.get(c.slug) ?? null,
          })),
        escola: posicao("escolas", estado.perfil.escola_id),
        bairro: posicao("bairros", estado.perfil.bairro_id),
      };
    },
    async simular(dados) {
      await esperar();
      const { corpo, resultado } = calcular(dados);
      if (!estado.logado) return { ...resultado, simulacaoId: null, pontosGanhos: 0, conquistasNovas: [] };
      const salva: SimulacaoSalva = {
        id: `0f000000-0000-4000-9000-${String(estado.simulacoes.length + 1).padStart(12, "0")}`,
        modo: corpo.modo,
        consumoKwh: resultado.consumoKwh,
        valorConta: corpo.modo === "conta" ? (corpo.valorConta ?? null) : null,
        criadoEm: agora().toISOString(),
        resultado,
      };
      estado.simulacoes.push(salva);
      const evento = registrarEvento("primeira_simulacao", estado.perfil.id, PONTOS_POR_ORIGEM.primeira_simulacao);
      return { ...resultado, simulacaoId: salva.id, ...evento };
    },
    async previaSimulacao(dados, sinal) {
      await esperar();
      if (sinal?.aborted) throw new DOMException("cancelado", "AbortError");
      const { resultado } = calcular(dados);
      return { ...resultado, simulacaoId: null, pontosGanhos: 0, conquistasNovas: [] };
    },
    async ultimaSimulacao() {
      await esperar();
      exigirLogin();
      const ultima = estado.simulacoes.at(-1);
      if (!ultima) throw naoEncontrado("NENHUMA_SIMULACAO", "Você ainda não fez nenhuma simulação.");
      return copia(ultima);
    },
    async solDeHoje() {
      await esperar();
      return { ...SOL_DE_HOJE_SIMULADO };
    },
    async perguntarAoTutor(dados) {
      await esperar();
      await esperar();
      exigirLogin();
      const corpo = validar(tutorSchema, dados);
      const agoraMs = agora().getTime();
      estado.usosTutor = estado.usosTutor.filter((t) => agoraMs - t < HORA_MS);
      if (estado.usosTutor.length >= LIMITE_TUTOR_POR_HORA) {
        const { hora } = diaEHora(new Date(estado.usosTutor[0]! + HORA_MS));
        throw new ErroApi(
          429,
          "LIMITE_TUTOR",
          `Você já mandou ${LIMITE_TUTOR_POR_HORA} mensagens na última hora. Tente de novo a partir das ${hora}.`,
        );
      }
      estado.usosTutor.push(agoraMs);
      return responderTutorSimulado(corpo.mensagem);
    },
    async listarTrilhas() {
      await esperar();
      return [...TRILHAS].sort((a, b) => a.ordem - b.ordem).map(resumoTrilha);
    },
    async obterTrilha(slug) {
      await esperar();
      const trilha = TRILHAS.find((t) => t.slug === validar(slugSchema, slug));
      if (!trilha) throw naoEncontrado("TRILHA_NAO_ENCONTRADA", "Trilha não encontrada.");
      return {
        ...resumoTrilha(trilha),
        licoes: LICOES.filter((l) => l.trilhaSlug === trilha.slug)
          .sort((a, b) => a.ordem - b.ordem)
          .map((l) => ({ id: l.id, ordem: l.ordem, titulo: l.titulo, tipo: l.tipo, concluida: concluiu(l.id), liberada: licaoPendente(l) === null })),
      };
    },
    async obterLicao(id): Promise<LicaoDetalhada> {
      await esperar();
      const licao = acharLicao(id);
      const trilha = TRILHAS.find((t) => t.slug === licao.trilhaSlug)!;
      const proxima = LICOES.find((l) => l.trilhaSlug === licao.trilhaSlug && l.ordem === licao.ordem + 1);
      const pendente = licaoPendente(licao);
      return {
        id: licao.id,
        trilha: { slug: trilha.slug, titulo: trilha.titulo },
        ordem: licao.ordem,
        titulo: licao.titulo,
        conteudo: licao.conteudo,
        tipo: licao.tipo,
        totalPerguntas: PERGUNTAS.filter((p) => p.licaoId === licao.id).length,
        concluida: concluiu(licao.id),
        liberada: pendente === null,
        licaoPendente: pendente,
        proximaLicaoId: proxima?.id ?? null,
      };
    },
    async concluirLicao(id) {
      await esperar();
      return concluir(id, "texto");
    },
    async obterQuiz(licaoId) {
      await esperar();
      const licao = acharLicao(licaoId);
      const licaoConcluida = concluiu(licao.id);
      return {
        licaoId: licao.id,
        licaoConcluida,
        perguntas: PERGUNTAS.filter((p) => p.licaoId === licao.id)
          .sort((a, b) => a.ordem - b.ordem)
          .map((p) => {
            const resposta = estado.logado ? (estado.respostas.get(p.id) ?? null) : null;
            const decisao = avaliarTentativa(resposta, agora());
            return {
              id: p.id,
              ordem: p.ordem,
              enunciado: p.enunciado,
              opcoes: [...p.opcoes],
              jaRespondida: Boolean(resposta),
              acertou: resposta ? resposta.correta : null,
              podePontuar: licaoConcluida && decisao.pontuavel,
              proximaTentativaEm: decisao.proximaTentativaEm?.toISOString() ?? null,
            };
          }),
      };
    },
    async responderQuiz(dados) {
      await esperar();
      exigirLogin();
      const { perguntaId, opcao } = validar(responderSchema, dados);
      const pergunta = PERGUNTAS.find((p) => p.id === perguntaId);
      if (!pergunta) throw naoEncontrado("PERGUNTA_NAO_ENCONTRADA", "Pergunta não encontrada.");
      if (opcao >= pergunta.opcoes.length) throw new ErroApi(400, "ENTRADA_INVALIDA", "opcao: Escolha uma das opções da pergunta.");
      if (!concluiu(pergunta.licaoId)) throw new ErroApi(409, "LICAO_NAO_CONCLUIDA", "Leia a lição antes de responder o quiz.");

      const correta = opcao === pergunta.indiceCorreto;
      const anterior: RespostaAnterior = estado.respostas.get(perguntaId) ?? null;
      const decisao = avaliarTentativa(anterior, agora());
      if (!decisao.pontuavel && !anterior?.correta) {
        const { dia, hora } = diaEHora(decisao.proximaTentativaEm!);
        throw new ErroApi(429, "AGUARDE_NOVA_TENTATIVA", `Você poderá responder esta pergunta de novo a partir de ${dia} às ${hora}.`);
      }
      if (decisao.pontuavel) estado.respostas.set(perguntaId, { correta, tentativaEm: agora() });
      const final = estado.respostas.get(perguntaId) ?? null;
      const evento = final?.correta
        ? registrarEvento("resposta_correta", perguntaId, PONTOS_POR_ORIGEM.resposta_correta)
        : { pontosGanhos: 0, conquistasNovas: [] };
      return {
        correta,
        explicacao: correta ? pergunta.explicacao : null,
        tentativaPontuavel: decisao.pontuavel,
        proximaTentativaEm: avaliarTentativa(final, agora()).proximaTentativaEm?.toISOString() ?? null,
        ...evento,
      };
    },
    async concluirPedale(licaoId) {
      await esperar();
      exigirLogin();
      return concluir(validar(pedaleSchema, { licaoId }).licaoId, "pedale");
    },
    async listarMissoes() {
      await esperar();
      return [...MISSOES].sort((a, b) => a.ordem - b.ordem).map(missao);
    },
    async registrarMissao(id) {
      await esperar();
      exigirLogin();
      const m = MISSOES.find((x) => x.id === validar(idSchema, id));
      if (!m) throw naoEncontrado("MISSAO_NAO_ENCONTRADA", "Missão não encontrada.");
      const dia = diaEmSaoLuis(agora());
      const dias = estado.registros.get(m.id) ?? new Set<string>();
      const novoRegistro = !dias.has(dia);
      dias.add(dia);
      estado.registros.set(m.id, dias);
      const concluida = dias.size >= m.diasNecessarios;
      const evento = concluida ? registrarEvento("missao_concluida", m.id, m.pontos) : { pontosGanhos: 0, conquistasNovas: [] };
      return {
        missaoId: m.id,
        dia,
        novoRegistro,
        diasRegistrados: dias.size,
        diasMarcados: [...dias].sort(),
        diasNecessarios: m.diasNecessarios,
        concluida,
        ...evento,
      };
    },
    async listarRanking(tipo) {
      await esperar();
      return ranking(validar(rankingSchema, { tipo }).tipo);
    },
    async listarPontosMapa(tipo) {
      await esperar();
      const filtro = validar(mapaSchema, { tipo }).tipo;
      return copia(PONTOS_MAPA.filter((p) => !filtro || p.tipo === filtro));
    },
  };

  const sessao: FonteSessao = {
    async token() {
      return estado.logado ? TOKEN_SIMULADO : null;
    },
    async renovar() {
      return estado.logado ? TOKEN_SIMULADO : null;
    },
    async entrarAnonimo() {
      estado.logado = true;
      if (lembrarLogin) guardarLogado();
      return TOKEN_SIMULADO;
    },
  };

  return {
    api,
    sessao,
    reiniciar: () => {
      estado = estadoInicial(agora());
    },
  };
}

