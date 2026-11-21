import type { FiltroPeriodoImpacto, PainelImpacto, PainelProfessor } from "@/types";
import { ErroApi } from "../erro";

// Códigos de 12 caracteres do alfabeto sem 0, O, 1 e I (D-002).
export const CODIGO_PROFESSOR_SIMULADO = "PRFS2LNASC24";
export const CODIGO_PROFESSOR_OCULTO_SIMULADO = "PRFRA2LUZ234";
export const CHAVE_IMPACTO_SIMULADA = "equatorial-impacto-simulado";

export const PAINEL_PROFESSOR_SIMULADO: PainelProfessor = {
  escola: {
    nome: "Escola Estadual Sol Nascente (fictícia)",
    bairro: "Anil",
    codigoEstudante: "TESTE2AB",
  },
  estudantes: 24,
  oculto: false,
  progresso: {
    licoesConcluidas: 212,
    mediaLicoesPorEstudante: 8.8,
    trilhas: [
      {
        slug: "energia-solar-em-sao-luis",
        titulo: "Energia solar em São Luís",
        totalLicoes: 4,
        estudantesQueComecaram: 20,
        estudantesQueConcluiram: 11,
      },
      {
        slug: "a-energia-do-maranhao",
        titulo: "A energia do Maranhão: sol, vento e marés",
        totalLicoes: 4,
        estudantesQueComecaram: 16,
        estudantesQueConcluiram: 9,
      },
      {
        slug: "ar-condicionado-sem-susto",
        titulo: "Ar-condicionado sem susto",
        totalLicoes: 3,
        estudantesQueComecaram: 14,
        estudantesQueConcluiram: 8,
      },
      {
        slug: "entendendo-a-sua-conta-de-luz",
        titulo: "Entendendo a sua conta de luz",
        totalLicoes: 4,
        estudantesQueComecaram: 10,
        estudantesQueConcluiram: 5,
      },
      {
        slug: "lixo-eletronico-onde-descartar",
        titulo: "Lixo eletrônico: onde descartar",
        totalLicoes: 3,
        estudantesQueComecaram: 4,
        estudantesQueConcluiram: null,
      },
    ],
  },
  quiz: {
    respostas: 301,
    percentualAcertos: 71.4,
    perguntasMaisErradas: [
      {
        perguntaId: "02000000-0000-4000-8000-000000000047",
        enunciado: "Para que serve o inversor em um sistema solar de casa?",
        licaoTitulo: "Como a placa solar funciona",
        respostas: 19,
        percentualAcertos: 36.8,
      },
      {
        perguntaId: "02000000-0000-4000-8000-000000000048",
        enunciado: "Em São Luís, uma placa de 550 W gera, em média, cerca de quanto por mês?",
        licaoTitulo: "Quantas placas para a minha casa?",
        respostas: 17,
        percentualAcertos: 47.1,
      },
      {
        perguntaId: "02000000-0000-4000-8000-000000000051",
        enunciado: "Como funciona, de forma simples, uma usina de marés com barragem?",
        licaoTitulo: "Marés: a força do mar de São Luís",
        respostas: 15,
        percentualAcertos: 53.3,
      },
    ],
  },
  missoes: [
    {
      slug: "ar-desligado-antes-de-dormir",
      titulo: "Ar desligado antes de dormir",
      estudantesQueComecaram: 9,
      estudantesQueConcluiram: 4,
      diasRegistrados: 21,
    },
    {
      slug: "descarte-de-lixo-eletronico",
      titulo: "Eletrônico no lugar certo",
      estudantesQueComecaram: 5,
      estudantesQueConcluiram: null,
      diasRegistrados: 5,
    },
  ],
  simulacoes: {
    estudantesQueSimularam: 17,
  },
  atualizadoEm: "2026-11-20T14:00:00.000Z",
  dadosAte: "2026-11-19",
};

export const PAINEL_PROFESSOR_OCULTO_SIMULADO: PainelProfessor = {
  escola: {
    nome: "Escola Municipal Raio de Luz (fictícia)",
    bairro: "Cidade Operária",
    codigoEstudante: "TESTE4EF",
  },
  estudantes: null,
  oculto: true,
  progresso: null,
  quiz: null,
  missoes: null,
  simulacoes: null,
  atualizadoEm: "2026-11-20T14:00:00.000Z",
  dadosAte: "2026-11-19",
};

export const IMPACTO_SIMULADO: PainelImpacto = {
  periodo: { de: "2026-10-23", ate: "2026-11-20" },
  estudantes: { comPerfil: 412, ativosNoPeriodo: 280, verificadosPorTurma: 301 },
  escolas: { comEstudantes: 9, comTurma: 6 },
  bairros: { comEstudantes: 31 },
  aprendizado: {
    licoesConcluidas: 3120,
    trilhasConcluidas: 402,
    respostasDoQuiz: 4410,
    percentualAcertos: 68.2,
  },
  missoes: { registros: 512, concluidas: 140 },
  simulacoes: { salvas: 388, estudantesQueSimularam: 301 },
  economiaEstimada: {
    potencialHabitos: { kwhMes: 4210.5, reaisMes: 3742.4, estudantes: 301 },
    comoCalculamos: {
      potencialHabitos:
        "Soma da economia mensal com mudança de hábitos da última simulação salva de cada estudante (kWh = reais ÷ tarifa daquela simulação). É o que as famílias poderiam economizar por mês seguindo as dicas; não é economia medida.",
    },
  },
  estimativa: true,
  atualizadoEm: "2026-11-20T14:00:00.000Z",
};

const FORMATO_DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const MAXIMO_DIAS_PERIODO = 366;
const MS_POR_DIA = 86_400_000;

export function validarPeriodoImpacto(
  periodo: FiltroPeriodoImpacto | undefined,
  padrao: { de: string; ate: string } = IMPACTO_SIMULADO.periodo,
): { de: string; ate: string } {
  const de = periodo?.de ?? padrao.de;
  const ate = periodo?.ate ?? padrao.ate;
  if (!FORMATO_DATA_ISO.test(de) || !FORMATO_DATA_ISO.test(ate)) {
    throw new ErroApi(400, "ENTRADA_INVALIDA", "Informe as datas no formato AAAA-MM-DD.");
  }
  const inicio = Date.parse(`${de}T00:00:00Z`);
  const fim = Date.parse(`${ate}T00:00:00Z`);
  if (Number.isNaN(inicio) || Number.isNaN(fim) || inicio > fim) {
    throw new ErroApi(400, "ENTRADA_INVALIDA", "A data inicial não pode ser maior que a data final.");
  }
  const dias = Math.floor((fim - inicio) / MS_POR_DIA) + 1;
  if (dias > MAXIMO_DIAS_PERIODO) {
    throw new ErroApi(400, "ENTRADA_INVALIDA", "O período deve ter no máximo 366 dias.");
  }
  return { de, ate };
}

export function escaparCelulaCsv(valor: string): string {
  // Protege também fórmulas precedidas de espaços/controles e tab/quebra inicial (igual ao back).
  const segura = /^(?:[\s\u0000-\u001f]*[=+\-@]|[\t\r\n])/u.test(valor) ? `'${valor}` : valor;
  return /[;"\r\n]/.test(segura) ? `"${segura.replace(/"/g, '""')}"` : segura;
}

type Celula = string | number | null;
function gerarCsv(linhas: readonly (readonly Celula[])[]): string {
  return (
    "\uFEFF" +
    linhas
      .map((linha) =>
        linha
          .map((valor) =>
            escaparCelulaCsv(
              valor === null ? "" : typeof valor === "number" ? String(valor).replace(".", ",") : valor,
            ),
          )
          .join(";"),
      )
      .join("\r\n") +
    "\r\n"
  );
}

type IndicadorCsv = { indicador: string; valor: number | null; unidade: string; observacao?: string };

export function gerarCsvImpacto(impacto: PainelImpacto): string {
  const i = impacto;
  const p = i.economiaEstimada.potencialHabitos;
  const calculo = i.economiaEstimada.comoCalculamos.potencialHabitos;
  const indicadores: IndicadorCsv[] = [
    { indicador: "Estudantes com perfil", valor: i.estudantes.comPerfil, unidade: "estudantes" },
    { indicador: "Estudantes ativos no período", valor: i.estudantes.ativosNoPeriodo, unidade: "estudantes" },
    { indicador: "Estudantes verificados por turma", valor: i.estudantes.verificadosPorTurma, unidade: "estudantes" },
    { indicador: "Escolas com estudantes", valor: i.escolas.comEstudantes, unidade: "escolas" },
    { indicador: "Escolas com turma", valor: i.escolas.comTurma, unidade: "escolas" },
    { indicador: "Bairros com estudantes", valor: i.bairros.comEstudantes, unidade: "bairros" },
    { indicador: "Lições concluídas", valor: i.aprendizado.licoesConcluidas, unidade: "lições" },
    { indicador: "Trilhas concluídas", valor: i.aprendizado.trilhasConcluidas, unidade: "trilhas" },
    { indicador: "Respostas do quiz", valor: i.aprendizado.respostasDoQuiz, unidade: "respostas" },
    { indicador: "Acertos do quiz", valor: i.aprendizado.percentualAcertos, unidade: "%" },
    {
      indicador: "Noites de missão registradas",
      valor: i.missoes.registros,
      unidade: "noites",
      observacao: "Autodeclaradas; contagem, sem estimativa de economia.",
    },
    { indicador: "Missões concluídas", valor: i.missoes.concluidas, unidade: "missões" },
    { indicador: "Simulações salvas", valor: i.simulacoes.salvas, unidade: "simulações" },
    { indicador: "Estudantes que simularam", valor: i.simulacoes.estudantesQueSimularam, unidade: "estudantes" },
    { indicador: "Potencial de hábitos em kWh por mês", valor: p.kwhMes, unidade: "kWh/mês", observacao: calculo },
    { indicador: "Potencial de hábitos em reais por mês", valor: p.reaisMes, unidade: "R$/mês", observacao: calculo },
    { indicador: "Estudantes no potencial de hábitos", valor: p.estudantes, unidade: "estudantes", observacao: calculo },
  ];
  return gerarCsv([
    ["indicador", "valor", "unidade", "periodo_de", "periodo_ate", "observacao"],
    ...indicadores.map((linha) => [
      linha.indicador,
      linha.valor,
      linha.unidade,
      i.periodo.de,
      i.periodo.ate,
      linha.valor === null
        ? "menos de 3 estudantes" + (linha.observacao ? `; ${linha.observacao}` : "")
        : (linha.observacao ?? ""),
    ]),
  ]);
}
