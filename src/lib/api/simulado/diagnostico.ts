import type { PerguntaDiagnostico } from "@/types";

export type PerguntaDiagnosticoCompleta = PerguntaDiagnostico & {
  trilhaSlug: string;
  indiceCorreto: number;
  explicacao: string;
};

// 4 perguntas por trilha (20 no total), aprovadas em docs/qa/fase3-perguntas-diagnostico.md (D-013, seção 1).
export const PERGUNTAS_DIAGNOSTICO: readonly PerguntaDiagnosticoCompleta[] = [
  // Trilha 1: energia-solar-em-sao-luis
  {
    id: "05000000-0000-4000-8000-000000000101",
    trilhaSlug: "energia-solar-em-sao-luis",
    ordem: 1,
    enunciado: "O que acontece com a energia do sol que chega em São Luís durante o período chuvoso, mais ou menos de janeiro a junho?",
    opcoes: [
      "A geração cai quase a zero até o fim do período de chuvas",
      "As nuvens diminuem um pouco essa energia, mas ela continua alta",
      "Os raios passam a gerar o dobro por causa do brilho da água",
      "Os dias ficam muito mais curtos e com poucas horas de claridade",
    ],
    indiceCorreto: 1,
    explicacao:
      "Mesmo com mais nuvens entre janeiro e junho, São Luís fica perto do Equador e continua recebendo bastante sol. Por isso a energia cai um pouco, sem deixar de ser alta.",
  },
  {
    id: "05000000-0000-4000-8000-000000000102",
    trilhaSlug: "energia-solar-em-sao-luis",
    ordem: 2,
    enunciado: "Em uma casa com placas solares ligadas à rede elétrica, o que acontece com a energia gerada que sobra durante o dia?",
    opcoes: [
      "Fica armazenada dentro do inversor para uso durante a noite",
      "Se perde nos cabos do telhado em forma de calor desperdiçado",
      "Segue para a rede da rua sem gerar benefício na conta da casa",
      "Vai para a rede da distribuidora e vira créditos na conta",
    ],
    indiceCorreto: 3,
    explicacao:
      "Nos sistemas ligados à rede, a energia excedente segue para a distribuidora e gera créditos. Esses créditos ajudam a abater parte da conta de luz da casa.",
  },
  {
    id: "05000000-0000-4000-8000-000000000103",
    trilhaSlug: "energia-solar-em-sao-luis",
    ordem: 3,
    enunciado:
      "Comparando a geração humana com aparelhos da casa, quantas pessoas pedalando ao mesmo tempo seriam necessárias para manter um chuveiro elétrico de 5.500 W funcionando?",
    opcoes: [
      "Dezenas de pessoas pedalando ao mesmo tempo",
      "Cerca de oito pessoas pedalando sem parar",
      "Duas ou três pessoas em ritmo moderado",
      "Apenas uma pessoa pedalando com força",
    ],
    indiceCorreto: 0,
    explicacao:
      "Uma pessoa pedalando com esforço moderado gera entre 50 e 150 W por alguns minutos. Para chegar perto de 5.500 W de um chuveiro, seriam dezenas de pessoas pedalando juntas.",
  },
  {
    id: "05000000-0000-4000-8000-000000000104",
    trilhaSlug: "energia-solar-em-sao-luis",
    ordem: 4,
    enunciado:
      "Ao estimar quantas placas solares uma casa precisa, por que a lição arredonda para cima o resultado da divisão do consumo pela geração de uma placa?",
    opcoes: [
      "Para compensar o consumo que as placas têm durante a noite",
      "Porque os inversores só funcionam com números pares de placas",
      "Porque não existe meia placa e precisa atender ao consumo",
      "Para garantir que todas as placas trabalhem com metade da força",
    ],
    indiceCorreto: 2,
    explicacao:
      "Como não dá para instalar uma fração de placa no telhado, o resultado da divisão é arredondado para o próximo número inteiro. Assim a estimativa cobre todo o consumo considerado.",
  },

  // Trilha 2: a-energia-do-maranhao
  {
    id: "05000000-0000-4000-8000-000000000105",
    trilhaSlug: "a-energia-do-maranhao",
    ordem: 1,
    enunciado: "Qual é a diferença entre usar placas fotovoltaicas e usar aquecedores solares?",
    opcoes: [
      "Placas fotovoltaicas geram eletricidade; aquecedores esquentam água",
      "Placas fotovoltaicas esquentam água; aquecedores geram eletricidade",
      "Os dois equipamentos transformam a luz solar apenas em calor",
      "Aquecedores solares produzem créditos de luz na rede elétrica",
    ],
    indiceCorreto: 0,
    explicacao:
      "A energia do sol pode ser aproveitada de duas formas diferentes. A placa fotovoltaica gera eletricidade a partir da luz, enquanto o aquecedor solar usa o calor para aquecer água.",
  },
  {
    id: "05000000-0000-4000-8000-000000000106",
    trilhaSlug: "a-energia-do-maranhao",
    ordem: 2,
    enunciado: "Em que época do ano os ventos costumam ser mais fortes no Nordeste, ajudando a completar a energia das hidrelétricas?",
    opcoes: [
      "No primeiro semestre, junto com os meses mais chuvosos",
      "O ano inteiro com a mesma força, sem variação por estação",
      "No segundo semestre, justamente na época em que chove menos",
      "Apenas durante a madrugada, quando o mar está mais agitado",
    ],
    indiceCorreto: 2,
    explicacao:
      "No segundo semestre chove menos no Nordeste, mas os ventos ficam mais fortes. Assim os parques eólicos ajudam a complementar outras fontes, como as hidrelétricas.",
  },
  {
    id: "05000000-0000-4000-8000-000000000107",
    trilhaSlug: "a-energia-do-maranhao",
    ordem: 3,
    enunciado: "Por que a usina de marés cogitada para a Barragem do Bacanga, em São Luís, nunca chegou a ter suas turbinas instaladas?",
    opcoes: [
      "Diferença pequena entre a maré alta e a maré baixa no local",
      "Falta de tecnologia para construir barragens em água salgada",
      "Proibição de usar turbinas próximas a áreas de manguezal",
      "Risco de alagar bairros ao redor e menor custo de outras fontes",
    ],
    indiceCorreto: 3,
    explicacao:
      "A ocupação urbana em volta do reservatório impediu grandes variações do nível da água sem causar alagamentos. Além disso, na época dos estudos, outras fontes de energia eram mais baratas.",
  },
  {
    id: "05000000-0000-4000-8000-000000000108",
    trilhaSlug: "a-energia-do-maranhao",
    ordem: 4,
    enunciado: "Por que cada kWh de eletricidade gerado no Brasil solta relativamente pouco gás carbônico (cerca de 46,1 kg de CO₂ por MWh em 2025)?",
    opcoes: [
      "Porque quase toda a energia do país vem de usinas nucleares",
      "Porque boa parte vem de fontes renováveis, como água, vento e sol",
      "Porque os filtros das linhas de transmissão retêm todo o CO₂",
      "Porque as usinas termelétricas no Brasil não liberam gases",
    ],
    indiceCorreto: 1,
    explicacao:
      "Hidrelétricas, parques eólicos e usinas solares compõem grande parte do sistema elétrico brasileiro. Como são fontes renováveis, a emissão média de CO₂ por energia gerada é baixa.",
  },

  // Trilha 3: ar-condicionado-sem-susto
  {
    id: "05000000-0000-4000-8000-000000000109",
    trilhaSlug: "ar-condicionado-sem-susto",
    ordem: 1,
    enunciado: "De acordo com o cálculo apresentado na trilha, de quais dois fatores depende principalmente o consumo mensal em kWh de um aparelho?",
    opcoes: [
      "Apenas da potência em watts escrita na etiqueta",
      "Do tamanho do cômodo e da voltagem da tomada",
      "Da potência do aparelho e do preço da tarifa",
      "Da potência em watts e do tempo diário de uso",
    ],
    indiceCorreto: 3,
    explicacao:
      "Para estimar o consumo mensal em kWh, multiplica-se a potência pelo tempo de uso por dia e por 30 dias, dividindo por 1.000. Assim, potência e horas de uso caminham juntas no resultado.",
  },
  {
    id: "05000000-0000-4000-8000-000000000110",
    trilhaSlug: "ar-condicionado-sem-susto",
    ordem: 2,
    enunciado: "Ao ajustar o controle do ar-condicionado para a temperatura mínima (como 16 °C) em vez de perto de 23 °C, o que acontece com o consumo de energia?",
    opcoes: [
      "Aumenta, pois cada grau a menos exige mais do aparelho",
      "Fica igual, porque o aparelho tem potência fixa na placa",
      "Diminui, porque o quarto esfria rápido e ele desliga antes",
      "Muda apenas se a porta ou a janela estiverem abertas",
    ],
    indiceCorreto: 0,
    explicacao:
      "Quanto mais fria a temperatura escolhida, mais esforço e energia o aparelho gasta para manter o ambiente. Uma temperatura perto de 23 °C costuma equilibrar conforto e economia.",
  },
  {
    id: "05000000-0000-4000-8000-000000000111",
    trilhaSlug: "ar-condicionado-sem-susto",
    ordem: 3,
    enunciado: "Além do selo Procel com classificação A, qual característica citada nas lições costuma fazer um ar-condicionado novo gastar menos energia?",
    opcoes: [
      "Funcionar em tomada de 220 V em vez de 127 V",
      "Contar com a tecnologia inverter no aparelho",
      "Vir com função turbo para resfriar em minutos",
      "Ter saída de ar direcionada para a parede fria",
    ],
    indiceCorreto: 1,
    explicacao:
      "Na hora da compra, além do selo Procel classificação A, a tecnologia inverter ajuda o aparelho a trabalhar de forma mais econômica.",
  },
  {
    id: "05000000-0000-4000-8000-000000000112",
    trilhaSlug: "ar-condicionado-sem-susto",
    ordem: 4,
    enunciado: "Por que desligar o ar-condicionado 30 minutos antes de dormir ou usar o timer ajuda a economizar sem perder o conforto?",
    opcoes: [
      "Porque a tarifa de energia fica menor durante a madrugada",
      "Porque o motor consome o dobro de watts depois da meia-noite",
      "Porque o quarto continua fresco por um tempo após desligar",
      "Porque desligar antes evita que o filtro acumule poeira no ar",
    ],
    indiceCorreto: 2,
    explicacao:
      "Mesmo após desligar o aparelho, o ambiente mantém a temperatura fresca por algum tempo. Se precisar de ventilação no fim da noite, um ventilador gasta muito menos energia.",
  },

  // Trilha 4: entendendo-a-sua-conta-de-luz
  {
    id: "05000000-0000-4000-8000-000000000113",
    trilhaSlug: "entendendo-a-sua-conta-de-luz",
    ordem: 1,
    enunciado: "Qual é a diferença entre watt (W) e quilowatt-hora (kWh) na leitura de aparelhos e da conta de luz?",
    opcoes: [
      "Watt é a energia do mês inteiro; kWh é a potência de cada hora",
      "Watt mede o valor em reais; kWh mede apenas a tensão elétrica",
      "Watt é a potência no instante; kWh é a energia ao longo do tempo",
      "Os dois medem exatamente a mesma grandeza em escalas diferentes",
    ],
    indiceCorreto: 2,
    explicacao:
      "A potência em watts indica quanta energia o aparelho pede naquele momento. Já o kWh mostra a energia total usada quando essa potência fica ligada por um tempo.",
  },
  {
    id: "05000000-0000-4000-8000-000000000114",
    trilhaSlug: "entendendo-a-sua-conta-de-luz",
    ordem: 2,
    enunciado: "Para que serve o gráfico de histórico de consumo que aparece na conta de luz?",
    opcoes: [
      "Para mostrar a previsão de gasto da casa nos meses seguintes",
      "Para acompanhar se a casa gastou mais ou menos nos últimos meses",
      "Para listar a potência em watts de cada aparelho da residência",
      "Para informar os horários do dia em que a tarifa fica mais cara",
    ],
    indiceCorreto: 1,
    explicacao:
      "O histórico reúne o consumo em kWh dos meses anteriores em um gráfico. Olhar essa comparação ajuda a perceber mudanças nos gastos da família.",
  },
  {
    id: "05000000-0000-4000-8000-000000000115",
    trilhaSlug: "entendendo-a-sua-conta-de-luz",
    ordem: 3,
    enunciado: "Na conta de luz, quem define os valores extras cobrados em cada bandeira tarifária (verde, amarela e vermelha)?",
    opcoes: [
      "A prefeitura do município, junto à taxa da rua",
      "A distribuidora local, conforme o bairro",
      "O governo estadual, na mesma regra do ICMS",
      "A ANEEL, para as bandeiras em todo o país",
    ],
    indiceCorreto: 3,
    explicacao:
      "Os valores de cada bandeira tarifária são definidos pela ANEEL, e não pela prefeitura ou pela distribuidora local. As bandeiras avisam quando o custo de gerar energia no país sobe.",
  },
  {
    id: "05000000-0000-4000-8000-000000000116",
    trilhaSlug: "entendendo-a-sua-conta-de-luz",
    ordem: 4,
    enunciado: "Para que serve a Contribuição de Iluminação Pública que aparece discriminada na conta de luz?",
    opcoes: [
      "É cobrada pelo município para manter a iluminação das ruas",
      "É cobrada pela distribuidora pelas lâmpadas de dentro da casa",
      "É um tributo federal para construir novas usinas no país",
      "É uma taxa extra aplicada quando o consumo passa do limite",
    ],
    indiceCorreto: 0,
    explicacao:
      "A Contribuição de Iluminação Pública é municipal e financia as luminárias de ruas e espaços públicos. Ela entra na fatura junto com tributos estaduais e federais, além da tarifa da energia.",
  },

  // Trilha 5: lixo-eletronico-onde-descartar
  {
    id: "05000000-0000-4000-8000-000000000117",
    trilhaSlug: "lixo-eletronico-onde-descartar",
    ordem: 1,
    enunciado: "Além de evitar a contaminação por metais pesados, qual é a outra vantagem de enviar equipamentos eletrônicos usados para reciclagem?",
    opcoes: [
      "Reaproveitar materiais como cobre, alumínio e ouro",
      "Extrair eletricidade que sobrou em peças velhas",
      "Recuperar a carga original de baterias já gastas",
      "Abater parte dos impostos cobrados na conta de luz",
    ],
    indiceCorreto: 0,
    explicacao:
      "Os eletrônicos têm metais valiosos que podem ser recuperados pela reciclagem. Jogar tudo no lixo comum desperdiça esses recursos e coloca a saúde de quem trabalha com o lixo em risco.",
  },
  {
    id: "05000000-0000-4000-8000-000000000118",
    trilhaSlug: "lixo-eletronico-onde-descartar",
    ordem: 2,
    enunciado: "Ao procurar um ecoponto ou ponto de coleta para descartar pilhas e baterias em São Luís, o que vale conferir antes de ir?",
    opcoes: [
      "Se a coleta seletiva comum da rua aceita todo tipo de pilha",
      "Se o ponto paga em dinheiro pelo peso de cada bateria levada",
      "Se é preciso desmontar e separar os fios internos antes de sair",
      "Se o ponto recebe pilhas e baterias e seu horário de abertura",
    ],
    indiceCorreto: 3,
    explicacao:
      "Nem todo ponto de coleta recebe todos os tipos de resíduos eletrônicos, e cada local tem horário próprio. Conferir a descrição e o horário evita viagem perdida.",
  },
  {
    id: "05000000-0000-4000-8000-000000000119",
    trilhaSlug: "lixo-eletronico-onde-descartar",
    ordem: 3,
    enunciado: "Antes de levar um celular ou outro aparelho antigo para um ponto de coleta, o que vale verificar primeiro?",
    opcoes: [
      "Se as peças plásticas podem ir para o lixo comum",
      "Se é obrigatório entregar na loja onde foi comprado",
      "Se ainda dá para consertar o defeito ou doar a alguém",
      "Se o aparelho precisa ser aberto e desmontado em casa",
    ],
    indiceCorreto: 2,
    explicacao:
      "Muitas vezes o defeito é simples de consertar ou o aparelho ainda serve para outra pessoa. Só quando não tem mais uso é que ele segue para o ponto de coleta, sempre após apagar os dados pessoais.",
  },
  {
    id: "05000000-0000-4000-8000-000000000120",
    trilhaSlug: "lixo-eletronico-onde-descartar",
    ordem: 4,
    enunciado: "Qual cuidado de segurança é recomendado ao guardar lâmpadas fluorescentes e baterias inchadas até o momento de levar ao ponto de coleta?",
    opcoes: [
      "Quebrar as lâmpadas para caberem melhor em garrafas",
      "Manter lâmpadas inteiras e baterias longe do calor",
      "Furar a bateria inchada para aliviar o gás interno",
      "Guardar as baterias perto de aparelhos que esquentam",
    ],
    indiceCorreto: 1,
    explicacao:
      "Lâmpadas fluorescentes podem conter mercúrio, por isso não devem ser quebradas. Já baterias inchadas oferecem risco e precisam ficar longe de fontes de calor até o descarte seguro.",
  },
];

export function perguntasDiagnosticoSemGabarito(trilhaSlug: string): PerguntaDiagnostico[] {
  return PERGUNTAS_DIAGNOSTICO.filter((p) => p.trilhaSlug === trilhaSlug)
    .sort((a, b) => a.ordem - b.ordem)
    .map(({ id, ordem, enunciado, opcoes }) => ({
      id,
      ordem,
      enunciado,
      opcoes: [...opcoes],
    }));
}
