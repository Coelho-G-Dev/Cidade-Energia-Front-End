// Gerado a partir de supabase/seed.sql e supabase/seeds/conteudo.sql do back. Dados ilustrativos.
import type { Aparelho, Bairro, Escola, PontoMapa, TipoLicao } from "@/types";

export const BAIRROS: Bairro[] = [
  {
    "id": "0b000000-0000-4000-8000-000000000001",
    "nome": "Anil"
  },
  {
    "id": "0b000000-0000-4000-8000-000000000002",
    "nome": "Bequimão"
  },
  {
    "id": "0b000000-0000-4000-8000-000000000003",
    "nome": "Calhau"
  },
  {
    "id": "0b000000-0000-4000-8000-000000000004",
    "nome": "Centro"
  },
  {
    "id": "0b000000-0000-4000-8000-000000000005",
    "nome": "Cidade Operária"
  },
  {
    "id": "0b000000-0000-4000-8000-000000000006",
    "nome": "Cohab Anil"
  },
  {
    "id": "0b000000-0000-4000-8000-000000000007",
    "nome": "Cohama"
  },
  {
    "id": "0b000000-0000-4000-8000-000000000008",
    "nome": "Ponta d'Areia"
  },
  {
    "id": "0b000000-0000-4000-8000-000000000009",
    "nome": "Renascença"
  },
  {
    "id": "0b000000-0000-4000-8000-000000000010",
    "nome": "São Francisco"
  },
  {
    "id": "0b000000-0000-4000-8000-000000000011",
    "nome": "Turu"
  },
  {
    "id": "0b000000-0000-4000-8000-000000000012",
    "nome": "Vinhais"
  }
];

export const ESCOLAS: (Escola & { codigo_turma: string })[] = [
  {
    "id": "0e000000-0000-4000-8000-000000000013",
    "nome": "Escola Estadual Sol Nascente (fictícia)",
    "bairro_id": "0b000000-0000-4000-8000-000000000001",
    "codigo_turma": "TESTE2AB"
  },
  {
    "id": "0e000000-0000-4000-8000-000000000014",
    "nome": "Centro de Ensino Vento Norte (fictícia)",
    "bairro_id": "0b000000-0000-4000-8000-000000000004",
    "codigo_turma": "TESTE3CD"
  },
  {
    "id": "0e000000-0000-4000-8000-000000000015",
    "nome": "Escola Municipal Raio de Luz (fictícia)",
    "bairro_id": "0b000000-0000-4000-8000-000000000005",
    "codigo_turma": "TESTE4EF"
  }
];

export const APARELHOS: Aparelho[] = [
  {
    "id": "0a000000-0000-4000-8000-000000000016",
    "codigo": "ar_condicionado",
    "nome": "Ar-condicionado",
    "potencia_w": 1000,
    "horas_padrao": 8,
    "icone": "ar-condicionado"
  },
  {
    "id": "0a000000-0000-4000-8000-000000000017",
    "codigo": "chuveiro",
    "nome": "Chuveiro elétrico",
    "potencia_w": 5500,
    "horas_padrao": 0.5,
    "icone": "chuveiro"
  },
  {
    "id": "0a000000-0000-4000-8000-000000000018",
    "codigo": "geladeira",
    "nome": "Geladeira",
    "potencia_w": 60,
    "horas_padrao": 24,
    "icone": "geladeira"
  },
  {
    "id": "0a000000-0000-4000-8000-000000000019",
    "codigo": "tv",
    "nome": "TV",
    "potencia_w": 100,
    "horas_padrao": 5,
    "icone": "tv"
  },
  {
    "id": "0a000000-0000-4000-8000-000000000020",
    "codigo": "lampada_led",
    "nome": "Lâmpada LED",
    "potencia_w": 9,
    "horas_padrao": 6,
    "icone": "lampada"
  },
  {
    "id": "0a000000-0000-4000-8000-000000000021",
    "codigo": "ventilador",
    "nome": "Ventilador",
    "potencia_w": 60,
    "horas_padrao": 8,
    "icone": "ventilador"
  }
];

export const TRILHAS: { id: string; slug: string; titulo: string; descricao: string; tema: string; minutos: number; ordem: number }[] = [
  {
    "id": "01000000-0000-4000-8000-000000000022",
    "slug": "energia-solar-em-sao-luis",
    "titulo": "Energia solar em São Luís",
    "descricao": "Por que o sol daqui é tão forte, como a placa solar transforma luz em energia e quantas placas uma casa precisa.",
    "tema": "solar",
    "minutos": 15,
    "ordem": 1
  },
  {
    "id": "01000000-0000-4000-8000-000000000023",
    "slug": "a-energia-do-maranhao",
    "titulo": "A energia do Maranhão: sol, vento e marés",
    "descricao": "O Maranhão tem sol forte, ventos no litoral e marés gigantes. Conheça cada uma dessas fontes de energia.",
    "tema": "renovaveis",
    "minutos": 15,
    "ordem": 2
  },
  {
    "id": "01000000-0000-4000-8000-000000000024",
    "slug": "ar-condicionado-sem-susto",
    "titulo": "Ar-condicionado sem susto",
    "descricao": "O ar-condicionado é um dos aparelhos que mais pesam na conta. Aprenda a usar sem levar susto no fim do mês.",
    "tema": "eficiencia",
    "minutos": 10,
    "ordem": 3
  },
  {
    "id": "01000000-0000-4000-8000-000000000025",
    "slug": "entendendo-a-sua-conta-de-luz",
    "titulo": "Entendendo a sua conta de luz",
    "descricao": "O que é kWh, como ler a conta, o que são as bandeiras tarifárias e por que aparecem impostos.",
    "tema": "conta",
    "minutos": 12,
    "ordem": 4
  },
  {
    "id": "01000000-0000-4000-8000-000000000026",
    "slug": "lixo-eletronico-onde-descartar",
    "titulo": "Lixo eletrônico: onde descartar",
    "descricao": "Pilhas, carregadores e celulares velhos não vão para o lixo comum. Saiba por que e onde levar.",
    "tema": "descarte",
    "minutos": 10,
    "ordem": 5
  }
];

export const LICOES: { id: string; trilhaSlug: string; ordem: number; titulo: string; tipo: TipoLicao; conteudo: string }[] = [
  {
    "id": "0c000000-0000-4000-8000-000000000027",
    "trilhaSlug": "energia-solar-em-sao-luis",
    "ordem": 1,
    "titulo": "O sol de São Luís",
    "tipo": "texto",
    "conteudo": "São Luís fica a cerca de **2,5 graus ao sul da linha do Equador**. Isso faz muita diferença:\n\n- o sol passa bem alto no céu o ano inteiro, então os raios chegam quase \"de frente\";\n- os dias têm perto de 12 horas de claridade em qualquer época do ano.\n\nPor isso a cidade recebe muita energia do sol. Em média, cada metro quadrado de chão recebe por volta de **5,2 kWh por dia**, segundo dados de satélite da NASA. É como se cada metro quadrado ganhasse, todo dia, a energia que uma lâmpada LED de 9 W gasta em cerca de 580 horas.\n\nNo período chuvoso, mais ou menos de janeiro a junho, as nuvens diminuem um pouco essa energia, mas ela continua alta.\n\n**Pense nisso:** o sol que esquenta a sua rua também pode ajudar a pagar a conta de luz."
  },
  {
    "id": "0c000000-0000-4000-8000-000000000028",
    "trilhaSlug": "energia-solar-em-sao-luis",
    "ordem": 2,
    "titulo": "Como a placa solar funciona",
    "tipo": "texto",
    "conteudo": "A placa solar é feita de **células de silício**. Quando a luz do sol bate nelas, ela empurra pequenas partículas (os elétrons) e cria uma corrente elétrica. Esse fenômeno se chama **efeito fotovoltaico**.\n\nAlguns pontos importantes:\n\n1. A placa precisa de **luz**, não de calor. Calor demais até faz a placa render um pouco menos.\n2. A placa gera **corrente contínua**. Em casa usamos **corrente alternada**, então um aparelho chamado **inversor** faz essa conversão.\n3. Nos sistemas ligados à rede, a energia que sobra durante o dia vai para a rede da distribuidora e vira **créditos** para abater na conta.\n\nÀ noite a placa não gera nada. É por isso que a casa continua ligada à rede elétrica."
  },
  {
    "id": "0c000000-0000-4000-8000-000000000029",
    "trilhaSlug": "energia-solar-em-sao-luis",
    "ordem": 3,
    "titulo": "Pedale e veja",
    "tipo": "pedale",
    "conteudo": "Hora de sentir na perna quanta energia é preciso para ligar um aparelho!\n\n**Como funciona a atividade:**\n\n1. Pedale na bicicleta geradora (ou no simulador do app).\n2. Veja no painel quantos **watts** você está gerando.\n3. Tente manter a lâmpada LED (9 W) acesa. Depois tente o ventilador (60 W).\n\nUma pessoa pedalando com esforço moderado gera algo entre 50 e 150 W por alguns minutos. Agora compare: um chuveiro elétrico usa cerca de **5.500 W**. Seriam dezenas de pessoas pedalando ao mesmo tempo só para um banho!\n\nUma placa solar de 550 W, no sol forte do meio-dia, entrega energia parecida com a de várias pessoas pedalando, sem cansar e sem fazer barulho.\n\nAo terminar, toque em **Concluir** para registrar a atividade."
  },
  {
    "id": "0c000000-0000-4000-8000-000000000030",
    "trilhaSlug": "energia-solar-em-sao-luis",
    "ordem": 4,
    "titulo": "Quantas placas para a minha casa?",
    "tipo": "texto",
    "conteudo": "Dá para fazer a conta com três números:\n\n- **potência da placa**: 0,55 kWp (uma placa comum de 550 W);\n- **sol de São Luís**: cerca de 5,2 kWh por metro quadrado por dia (média dos dados de satélite da NASA);\n- **perdas**: o sistema aproveita perto de 80% (calor, fios, sujeira).\n\nUma placa gera por dia: 0,55 × 5,2 × 0,8 ≈ **2,3 kWh**. Em um mês de 30 dias: ≈ **69 kWh**.\n\nSe a sua casa consome **150 kWh por mês**, divida: 150 ÷ 69 ≈ 2,2. Como não existe meia placa, arredondamos para cima: **3 placas**.\n\nEsses números são **estimativas** para aprender. Um projeto de verdade é feito por um profissional, que olha o telhado, a sombra e a conta da casa.\n\n**Experimente:** use o simulador do app com o consumo da sua conta."
  },
  {
    "id": "0c000000-0000-4000-8000-000000000031",
    "trilhaSlug": "a-energia-do-maranhao",
    "ordem": 1,
    "titulo": "Sol: a energia que chega todo dia",
    "tipo": "texto",
    "conteudo": "O Maranhão está entre os estados com bastante sol ao longo do ano. A energia solar pode ser aproveitada de dois jeitos:\n\n- **placas fotovoltaicas**, que transformam luz em eletricidade;\n- **aquecedores solares**, que usam o calor para esquentar água.\n\nA grande vantagem é que o sol não acaba e não solta fumaça para gerar energia. A limitação é que à noite não há geração, e em dias muito nublados ela cai.\n\nNas próximas lições você vai conhecer duas outras forças da natureza que o Maranhão tem de sobra: o **vento** e as **marés**."
  },
  {
    "id": "0c000000-0000-4000-8000-000000000032",
    "trilhaSlug": "a-energia-do-maranhao",
    "ordem": 2,
    "titulo": "Vento: os parques eólicos do litoral",
    "tipo": "texto",
    "conteudo": "No litoral do Maranhão, perto da região dos Lençóis Maranhenses, existem **parques eólicos**. São aquelas torres altas com hélices gigantes.\n\n**Como funciona:**\n\n1. O vento empurra as **pás** e faz o rotor girar.\n2. O rotor está ligado a um **gerador**, que transforma o giro em eletricidade.\n3. A energia segue por cabos até as linhas de transmissão.\n\nNo Nordeste, os ventos costumam ser mais fortes no segundo semestre, justamente quando chove menos. Por isso o vento ajuda a completar outras fontes, como as hidrelétricas.\n\nAssim como o sol, o vento é uma fonte **renovável**: ele não se esgota."
  },
  {
    "id": "0c000000-0000-4000-8000-000000000033",
    "trilhaSlug": "a-energia-do-maranhao",
    "ordem": 3,
    "titulo": "Marés: a força do mar de São Luís",
    "tipo": "texto",
    "conteudo": "Quem mora em São Luís conhece bem: a maré sobe e desce muito ao longo do dia. A diferença entre a maré alta e a maré baixa aqui está entre as **maiores do Brasil**, podendo passar de 6 metros.\n\nEssa água que sobe e desce carrega muita energia. Uma **usina de marés com barragem** funciona assim:\n\n1. Na maré alta, a água entra e fica guardada atrás de uma barragem.\n2. Na maré baixa, a água sai passando por **turbinas**, que giram geradores.\n\nNas décadas de 1970 e 1980 houve estudos para uma usina de marés na **Barragem do Bacanga**, em São Luís, mas a usina não chegou a funcionar.\n\nHoje a energia das marés ainda é pouco usada no mundo, mas é uma fonte renovável e previsível: sabemos com antecedência a hora de cada maré."
  },
  {
    "id": "0c000000-0000-4000-8000-000000000034",
    "trilhaSlug": "a-energia-do-maranhao",
    "ordem": 4,
    "titulo": "Juntando tudo: a energia do Brasil",
    "tipo": "texto",
    "conteudo": "A energia que chega à sua casa vem do **Sistema Interligado Nacional**: uma grande rede de linhas de transmissão que liga usinas de quase todo o país. A energia gerada pelo vento no Maranhão pode abastecer outra região, e vice-versa.\n\nBoa parte da eletricidade do Brasil vem de fontes renováveis, como água (hidrelétricas), vento e sol. Por isso cada kWh gerado aqui solta pouco gás carbônico (CO₂): em 2023, cerca de 38,5 kg de CO₂ por MWh.\n\nMesmo assim, economizar energia continua importante: menos consumo significa menos usinas e menos linhas para construir, e uma conta mais leve para a sua família."
  },
  {
    "id": "0c000000-0000-4000-8000-000000000035",
    "trilhaSlug": "ar-condicionado-sem-susto",
    "ordem": 1,
    "titulo": "Por que o ar pesa na conta",
    "tipo": "texto",
    "conteudo": "O consumo de um aparelho depende de **potência** e **tempo de uso**:\n\n> consumo (kWh/mês) = potência (W) × horas por dia × 30 ÷ 1000\n\nCompare dois aparelhos ligados **8 horas por dia**:\n\n| Aparelho | Potência | Consumo no mês |\n|---|---|---|\n| Ar-condicionado | 1.000 W | 240 kWh |\n| Ventilador | 60 W | 14,4 kWh |\n\nCom a tarifa residencial do Maranhão sem impostos, perto de R$ 0,89 por kWh, o ar custaria cerca de **R$ 213 por mês** e o ventilador cerca de **R$ 13**.\n\nOs valores são **estimativas**: a potência real muda de um aparelho para outro. Olhe a etiqueta do seu."
  },
  {
    "id": "0c000000-0000-4000-8000-000000000036",
    "trilhaSlug": "ar-condicionado-sem-susto",
    "ordem": 2,
    "titulo": "Temperatura certa e portas fechadas",
    "tipo": "texto",
    "conteudo": "Pequenos hábitos fazem o ar-condicionado trabalhar menos:\n\n- **Temperatura:** cada grau a menos aumenta o consumo. Uma temperatura perto de 23 °C costuma ser confortável.\n- **Portas e janelas fechadas:** se o ar frio escapa, o aparelho não para de trabalhar.\n- **Cortinas:** bloquear o sol direto deixa o quarto menos quente.\n- **Filtro limpo:** filtro sujo dificulta a passagem de ar. Limpe com a frequência indicada no manual.\n\n**Na hora de comprar:** procure o **selo Procel** com classificação A e, se possível, a tecnologia **inverter**, que costuma gastar menos."
  },
  {
    "id": "0c000000-0000-4000-8000-000000000037",
    "trilhaSlug": "ar-condicionado-sem-susto",
    "ordem": 3,
    "titulo": "Desligar antes de dormir",
    "tipo": "texto",
    "conteudo": "O quarto continua fresco por um tempo depois que o ar é desligado. Por isso vale:\n\n- desligar o ar **30 minutos antes de dormir** ou usar o **timer** (função \"sleep\");\n- deixar o ventilador ligado no lugar do ar no fim da noite.\n\n**Quanto economiza?** Um ar de 1.000 W usado **1 hora a menos por dia**:\n\n> 1 kW × 1 h × 30 dias = **30 kWh por mês**\n\nIsso dá algo perto de R$ 27 por mês sem impostos, mais de R$ 300 por ano.\n\n**Missão:** que tal testar por 3 noites? Registre na aba Missões e ganhe pontos."
  },
  {
    "id": "0c000000-0000-4000-8000-000000000038",
    "trilhaSlug": "entendendo-a-sua-conta-de-luz",
    "ordem": 1,
    "titulo": "O que é kWh",
    "tipo": "texto",
    "conteudo": "A conta de luz cobra pela **energia** que a casa usou, medida em **quilowatt-hora (kWh)**.\n\n- **Watt (W)** é a potência: quanta energia o aparelho usa a cada instante.\n- **kWh** é energia: potência ao longo do tempo.\n\n**1 kWh** é a energia de um aparelho de **1.000 W ligado por 1 hora**. Também é a energia de uma TV de 100 W ligada por 10 horas.\n\nO **medidor** (o \"relógio de luz\") vai somando os kWh. A distribuidora anota o número todo mês: a diferença entre a leitura atual e a anterior é o consumo do mês."
  },
  {
    "id": "0c000000-0000-4000-8000-000000000039",
    "trilhaSlug": "entendendo-a-sua-conta-de-luz",
    "ordem": 2,
    "titulo": "Lendo a conta",
    "tipo": "texto",
    "conteudo": "Na conta de luz, procure estas informações:\n\n- **Leitura anterior e leitura atual:** a diferença é o consumo do mês.\n- **Consumo (kWh):** quanta energia a casa usou.\n- **Histórico:** gráfico com o consumo dos últimos meses. Ótimo para ver se a casa está gastando mais ou menos.\n- **Tarifa:** o preço de cada kWh. No Maranhão, a tarifa residencial está perto de **R$ 0,89 por kWh sem impostos**.\n- **Valor total e vencimento.**\n\n**Dica:** use o consumo em kWh no simulador do app para descobrir quais aparelhos pesam mais."
  },
  {
    "id": "0c000000-0000-4000-8000-000000000040",
    "trilhaSlug": "entendendo-a-sua-conta-de-luz",
    "ordem": 3,
    "titulo": "Bandeiras tarifárias",
    "tipo": "texto",
    "conteudo": "As **bandeiras tarifárias** avisam se gerar energia está mais caro naquele mês:\n\n| Bandeira | O que significa |\n|---|---|\n| Verde | Condições boas. Sem acréscimo. |\n| Amarela | Geração um pouco mais cara. Pequeno acréscimo por kWh. |\n| Vermelha (patamar 1 e 2) | Geração bem mais cara. Acréscimo maior por kWh. |\n\nQuando chove pouco, os reservatórios das hidrelétricas baixam e é preciso ligar usinas mais caras. Aí a bandeira muda.\n\nOs valores de cada bandeira são definidos pela **ANEEL**. Em bandeira vermelha, economizar energia pesa ainda mais no bolso."
  },
  {
    "id": "0c000000-0000-4000-8000-000000000041",
    "trilhaSlug": "entendendo-a-sua-conta-de-luz",
    "ordem": 4,
    "titulo": "Impostos e taxas",
    "tipo": "texto",
    "conteudo": "Além da energia, a conta tem tributos:\n\n- **ICMS:** imposto estadual.\n- **PIS e COFINS:** tributos federais.\n- **Contribuição de Iluminação Pública:** cobrada pelo município para manter a iluminação das ruas.\n\nPor isso o valor final de cada kWh na conta fica **maior** do que a tarifa da distribuidora.\n\n**Resumo da trilha:** consumo (kWh) × tarifa + bandeira + tributos = valor da conta. Agora você sabe ler a sua!"
  },
  {
    "id": "0c000000-0000-4000-8000-000000000042",
    "trilhaSlug": "lixo-eletronico-onde-descartar",
    "ordem": 1,
    "titulo": "O que é lixo eletrônico",
    "tipo": "texto",
    "conteudo": "**Lixo eletrônico** é todo equipamento elétrico ou eletrônico que não serve mais: celulares, carregadores, fones, pilhas, baterias, lâmpadas, computadores e eletrodomésticos.\n\nPor que ele precisa de cuidado?\n\n- Alguns componentes têm **metais pesados**, como chumbo, mercúrio e cádmio, que podem contaminar o solo e a água.\n- Ao mesmo tempo, eles têm materiais valiosos, como cobre, alumínio e até um pouco de ouro, que podem ser **reciclados**.\n\nJogar no lixo comum é desperdiçar recursos e arriscar a saúde de quem trabalha com o lixo."
  },
  {
    "id": "0c000000-0000-4000-8000-000000000043",
    "trilhaSlug": "lixo-eletronico-onde-descartar",
    "ordem": 2,
    "titulo": "Onde descartar",
    "tipo": "texto",
    "conteudo": "O lugar certo é um **ponto de coleta de eletrônicos**. Eles costumam ficar em lojas de eletrônicos, assistências técnicas, supermercados e ecopontos.\n\nNo Brasil existe a **logística reversa**: fabricantes e lojas precisam receber de volta alguns produtos depois do uso, como pilhas, baterias, lâmpadas e eletroeletrônicos. Isso está na **Política Nacional de Resíduos Sólidos** (Lei 12.305/2010).\n\n**Use o mapa do app** para encontrar pontos de coleta em São Luís, como os ecopontos da Prefeitura. Alguns também recebem pilhas e baterias: a descrição de cada ponto avisa. Antes de ir, confira o horário de funcionamento.\n\n**Missão:** leve um eletrônico velho a um ponto de coleta e registre na aba Missões."
  },
  {
    "id": "0c000000-0000-4000-8000-000000000044",
    "trilhaSlug": "lixo-eletronico-onde-descartar",
    "ordem": 3,
    "titulo": "Antes de descartar",
    "tipo": "texto",
    "conteudo": "Antes de levar ao ponto de coleta, pense:\n\n1. **Dá para consertar?** Muitas vezes o problema é simples.\n2. **Dá para doar?** Um celular antigo pode servir para outra pessoa.\n3. **Apague seus dados:** antes de doar ou descartar um celular ou computador, faça backup e restaure as configurações de fábrica.\n4. **Cuidado com lâmpadas e baterias:** não quebre lâmpadas fluorescentes, que podem ter mercúrio, e guarde baterias inchadas longe do calor.\n\nSepare tudo em uma sacola e leve de uma vez só. Fica mais fácil e você ajuda o planeta."
  }
];

export const PERGUNTAS: { id: string; licaoId: string; ordem: number; enunciado: string; opcoes: string[]; indiceCorreto: number; explicacao: string }[] = [
  {
    "id": "02000000-0000-4000-8000-000000000045",
    "licaoId": "0c000000-0000-4000-8000-000000000027",
    "ordem": 1,
    "enunciado": "Por que São Luís recebe sol forte o ano todo?",
    "opcoes": [
      "Porque fica perto da linha do Equador",
      "Porque fica no litoral",
      "Porque tem poucas árvores",
      "Porque é uma capital"
    ],
    "indiceCorreto": 0,
    "explicacao": "Perto do Equador o sol passa alto no céu o ano inteiro e os dias quase não mudam de tamanho."
  },
  {
    "id": "02000000-0000-4000-8000-000000000046",
    "licaoId": "0c000000-0000-4000-8000-000000000028",
    "ordem": 1,
    "enunciado": "O que a placa solar precisa para gerar energia?",
    "opcoes": [
      "Calor",
      "Luz do sol",
      "Vento",
      "Chuva"
    ],
    "indiceCorreto": 1,
    "explicacao": "O efeito fotovoltaico usa a luz. Calor demais até faz a placa render um pouco menos."
  },
  {
    "id": "02000000-0000-4000-8000-000000000047",
    "licaoId": "0c000000-0000-4000-8000-000000000028",
    "ordem": 2,
    "enunciado": "Para que serve o inversor em um sistema solar de casa?",
    "opcoes": [
      "Guardar a energia para a noite",
      "Limpar as placas",
      "Transformar a corrente contínua da placa na corrente alternada usada em casa",
      "Medir a temperatura do telhado"
    ],
    "indiceCorreto": 2,
    "explicacao": "A placa gera corrente contínua; as tomadas da casa usam corrente alternada. O inversor faz a conversão."
  },
  {
    "id": "02000000-0000-4000-8000-000000000048",
    "licaoId": "0c000000-0000-4000-8000-000000000030",
    "ordem": 1,
    "enunciado": "Em São Luís, uma placa de 550 W gera, em média, cerca de quanto por mês?",
    "opcoes": [
      "7 kWh",
      "70 kWh",
      "700 kWh",
      "7.000 kWh"
    ],
    "indiceCorreto": 1,
    "explicacao": "0,55 × 5,2 × 0,8 × 30 dá cerca de 69 kWh por mês (estimativa)."
  },
  {
    "id": "02000000-0000-4000-8000-000000000049",
    "licaoId": "0c000000-0000-4000-8000-000000000032",
    "ordem": 1,
    "enunciado": "Em um parque eólico, o que faz o gerador girar?",
    "opcoes": [
      "O calor do sol",
      "A água da chuva",
      "O movimento das marés",
      "O vento nas pás"
    ],
    "indiceCorreto": 3,
    "explicacao": "O vento empurra as pás, o rotor gira e o gerador transforma o giro em eletricidade."
  },
  {
    "id": "02000000-0000-4000-8000-000000000050",
    "licaoId": "0c000000-0000-4000-8000-000000000033",
    "ordem": 1,
    "enunciado": "Por que São Luís é lembrada quando o assunto é energia das marés?",
    "opcoes": [
      "Porque o mar é mais quente",
      "Porque tem uma das maiores diferenças entre maré alta e maré baixa do Brasil",
      "Porque tem muitas praias",
      "Porque chove muito"
    ],
    "indiceCorreto": 1,
    "explicacao": "A maré em São Luís sobe e desce vários metros, e essa água em movimento carrega muita energia."
  },
  {
    "id": "02000000-0000-4000-8000-000000000051",
    "licaoId": "0c000000-0000-4000-8000-000000000033",
    "ordem": 2,
    "enunciado": "Como funciona, de forma simples, uma usina de marés com barragem?",
    "opcoes": [
      "Guarda a água na maré alta e a solta pelas turbinas na maré baixa",
      "Usa placas solares no fundo do mar",
      "Queima algas para gerar vapor",
      "Esquenta a água do mar"
    ],
    "indiceCorreto": 0,
    "explicacao": "A barragem segura a água da maré alta. Quando a maré baixa, a água sai pelas turbinas e gira os geradores."
  },
  {
    "id": "02000000-0000-4000-8000-000000000052",
    "licaoId": "0c000000-0000-4000-8000-000000000034",
    "ordem": 1,
    "enunciado": "O que significa dizer que o sistema elétrico brasileiro é interligado?",
    "opcoes": [
      "Cada cidade tem a sua própria usina",
      "Só funciona durante o dia",
      "A energia gerada em uma região pode abastecer outras",
      "Só usa energia do sol"
    ],
    "indiceCorreto": 2,
    "explicacao": "Linhas de transmissão ligam usinas de quase todo o país, então a energia circula entre as regiões."
  },
  {
    "id": "02000000-0000-4000-8000-000000000053",
    "licaoId": "0c000000-0000-4000-8000-000000000035",
    "ordem": 1,
    "enunciado": "Um ar-condicionado de 1.000 W ligado 8 horas por dia consome cerca de quanto por mês?",
    "opcoes": [
      "24 kWh",
      "240 kWh",
      "2.400 kWh",
      "8 kWh"
    ],
    "indiceCorreto": 1,
    "explicacao": "1.000 W × 8 h × 30 dias ÷ 1000 = 240 kWh por mês."
  },
  {
    "id": "02000000-0000-4000-8000-000000000054",
    "licaoId": "0c000000-0000-4000-8000-000000000036",
    "ordem": 1,
    "enunciado": "O que ajuda o ar-condicionado a gastar menos?",
    "opcoes": [
      "Deixar a janela aberta",
      "Manter portas e janelas fechadas e o filtro limpo",
      "Colocar na temperatura mínima",
      "Ligar e desligar várias vezes"
    ],
    "indiceCorreto": 1,
    "explicacao": "Com o ambiente fechado e o filtro limpo, o aparelho resfria mais rápido e trabalha menos."
  },
  {
    "id": "02000000-0000-4000-8000-000000000055",
    "licaoId": "0c000000-0000-4000-8000-000000000036",
    "ordem": 2,
    "enunciado": "Na hora de comprar, o que indica que um ar-condicionado é mais econômico?",
    "opcoes": [
      "A cor do aparelho",
      "O tamanho do controle remoto",
      "O selo Procel com classificação A",
      "O barulho que ele faz"
    ],
    "indiceCorreto": 2,
    "explicacao": "O selo Procel compara o consumo dos aparelhos. Classificação A indica os mais eficientes."
  },
  {
    "id": "02000000-0000-4000-8000-000000000056",
    "licaoId": "0c000000-0000-4000-8000-000000000037",
    "ordem": 1,
    "enunciado": "Usar um ar de 1.000 W 1 hora a menos por dia economiza cerca de quanto por mês?",
    "opcoes": [
      "3 kWh",
      "300 kWh",
      "Nada",
      "30 kWh"
    ],
    "indiceCorreto": 3,
    "explicacao": "1 kW × 1 h × 30 dias = 30 kWh por mês."
  },
  {
    "id": "02000000-0000-4000-8000-000000000057",
    "licaoId": "0c000000-0000-4000-8000-000000000038",
    "ordem": 1,
    "enunciado": "Uma TV de 100 W ligada por 10 horas consome quanto?",
    "opcoes": [
      "1 kWh",
      "10 kWh",
      "100 kWh",
      "0,1 kWh"
    ],
    "indiceCorreto": 0,
    "explicacao": "100 W × 10 h = 1.000 Wh, que é 1 kWh."
  },
  {
    "id": "02000000-0000-4000-8000-000000000058",
    "licaoId": "0c000000-0000-4000-8000-000000000039",
    "ordem": 1,
    "enunciado": "Como descobrir quanto a casa consumiu no mês?",
    "opcoes": [
      "Somando os impostos da conta",
      "Olhando a cor da bandeira",
      "Dividindo a conta pelo número de moradores",
      "Fazendo a leitura atual menos a leitura anterior do medidor"
    ],
    "indiceCorreto": 3,
    "explicacao": "O medidor soma os kWh. A diferença entre duas leituras é o consumo do período."
  },
  {
    "id": "02000000-0000-4000-8000-000000000059",
    "licaoId": "0c000000-0000-4000-8000-000000000040",
    "ordem": 1,
    "enunciado": "O que significa a bandeira vermelha na conta?",
    "opcoes": [
      "Que a conta está atrasada",
      "Que gerar energia está mais caro e há acréscimo por kWh",
      "Que a casa gastou demais",
      "Que a energia vai acabar"
    ],
    "indiceCorreto": 1,
    "explicacao": "A bandeira mostra o custo de geração no mês. Na vermelha, cada kWh fica mais caro para todo mundo."
  },
  {
    "id": "02000000-0000-4000-8000-000000000060",
    "licaoId": "0c000000-0000-4000-8000-000000000041",
    "ordem": 1,
    "enunciado": "Qual destes tributos aparece na conta de luz?",
    "opcoes": [
      "IPVA",
      "IPTU",
      "ICMS",
      "ISS"
    ],
    "indiceCorreto": 2,
    "explicacao": "O ICMS é um imposto estadual cobrado sobre a energia. PIS e COFINS também aparecem."
  },
  {
    "id": "02000000-0000-4000-8000-000000000061",
    "licaoId": "0c000000-0000-4000-8000-000000000042",
    "ordem": 1,
    "enunciado": "Por que pilhas e baterias não devem ir para o lixo comum?",
    "opcoes": [
      "Porque são muito leves",
      "Porque ocupam muito espaço",
      "Porque podem ter metais que contaminam o solo e a água",
      "Porque mudam de cor"
    ],
    "indiceCorreto": 2,
    "explicacao": "Metais como chumbo, mercúrio e cádmio podem vazar e contaminar o ambiente."
  },
  {
    "id": "02000000-0000-4000-8000-000000000062",
    "licaoId": "0c000000-0000-4000-8000-000000000043",
    "ordem": 1,
    "enunciado": "Qual é o lugar certo para descartar um celular velho?",
    "opcoes": [
      "Lixo comum",
      "Ponto de coleta de eletrônicos",
      "Rio ou canal",
      "Terreno baldio"
    ],
    "indiceCorreto": 1,
    "explicacao": "Nos pontos de coleta o aparelho segue para reciclagem ou descarte seguro."
  },
  {
    "id": "02000000-0000-4000-8000-000000000063",
    "licaoId": "0c000000-0000-4000-8000-000000000043",
    "ordem": 2,
    "enunciado": "O que é logística reversa?",
    "opcoes": [
      "O produto volta para o fabricante ou a loja para ser reciclado ou descartado corretamente",
      "Entregar compras em casa",
      "Vender produtos usados",
      "Jogar o lixo fora mais rápido"
    ],
    "indiceCorreto": 0,
    "explicacao": "Na logística reversa, quem fabrica e quem vende ajuda a dar o destino certo ao produto depois do uso."
  },
  {
    "id": "02000000-0000-4000-8000-000000000064",
    "licaoId": "0c000000-0000-4000-8000-000000000044",
    "ordem": 1,
    "enunciado": "Antes de doar ou descartar um celular, o que é importante fazer?",
    "opcoes": [
      "Pintar o aparelho",
      "Apagar os dados pessoais",
      "Quebrar a tela",
      "Molhar a bateria"
    ],
    "indiceCorreto": 1,
    "explicacao": "Faça backup e restaure as configurações de fábrica para proteger fotos, contas e senhas."
  }
];

export const MISSOES: { id: string; slug: string; titulo: string; descricao: string; pontos: number; diasNecessarios: number; ordem: number; trilhaSlug: string | null }[] = [
  {
    "id": "03000000-0000-4000-8000-000000000065",
    "slug": "ar-desligado-antes-de-dormir",
    "titulo": "Ar desligado antes de dormir",
    "descricao": "Desligue o ar-condicionado 30 minutos antes de dormir (ou use o timer) e registre aqui por 3 noites.",
    "pontos": 30,
    "diasNecessarios": 3,
    "ordem": 1,
    "trilhaSlug": "ar-condicionado-sem-susto"
  },
  {
    "id": "03000000-0000-4000-8000-000000000066",
    "slug": "descarte-de-lixo-eletronico",
    "titulo": "Eletrônico no lugar certo",
    "descricao": "Leve um lixo eletrônico (pilha, carregador, fone ou celular velho) a um ponto de coleta e registre aqui.",
    "pontos": 30,
    "diasNecessarios": 1,
    "ordem": 2,
    "trilhaSlug": "lixo-eletronico-onde-descartar"
  }
];

export const CONQUISTAS: { slug: string; nome: string; criterio: string; ordem: number }[] = [
  {
    "slug": "primeira_simulacao",
    "nome": "Primeira simulação",
    "criterio": "Salvar a primeira simulação da conta de luz.",
    "ordem": 1
  },
  {
    "slug": "amigo_do_sol",
    "nome": "Amigo do sol",
    "criterio": "Concluir todas as lições da trilha Energia solar em São Luís.",
    "ordem": 2
  },
  {
    "slug": "conta_decifrada",
    "nome": "Conta decifrada",
    "criterio": "Concluir todas as lições da trilha Entendendo a sua conta de luz.",
    "ordem": 3
  },
  {
    "slug": "noites_frescas",
    "nome": "Noites frescas",
    "criterio": "Completar a missão de desligar o ar-condicionado antes de dormir.",
    "ordem": 4
  },
  {
    "slug": "descarte_certo",
    "nome": "Descarte certo",
    "criterio": "Completar a missão de levar um lixo eletrônico a um ponto de coleta.",
    "ordem": 5
  },
  {
    "slug": "bairro_unido",
    "nome": "Bairro unido",
    "criterio": "Fazer parte de um bairro que somou 500 pontos ou mais.",
    "ordem": 6
  }
];

export const PONTOS_MAPA: PontoMapa[] = [
  {
    "id": "0d000000-0000-4000-8000-000000000067",
    "nome": "Telhado solar de escola - Anil (ilustrativo)",
    "tipo": "solar",
    "latitude": -2.548,
    "longitude": -44.243,
    "descricao": "Ponto ilustrativo para testar o mapa: escola com placas solares no telhado. Não corresponde a um local real."
  },
  {
    "id": "0d000000-0000-4000-8000-000000000068",
    "nome": "Praça com iluminação solar - Centro (ilustrativo)",
    "tipo": "solar",
    "latitude": -2.5307,
    "longitude": -44.3016,
    "descricao": "Ponto ilustrativo para testar o mapa: postes com placa solar. Não corresponde a um local real."
  },
  {
    "id": "0d000000-0000-4000-8000-000000000069",
    "nome": "Ecoponto Vila Isabel - Central de Logística Reversa",
    "tipo": "coleta",
    "latitude": -2.562046,
    "longitude": -44.317393,
    "descricao": "Central de Logística Reversa de Eletroeletrônicos da COOPRESL, ao lado do Ecoponto Vila Isabel, em parceria com a Prefeitura de São Luís. Recebe eletrônicos. Av. dos Portugueses, Vila Isabel."
  },
  {
    "id": "0d000000-0000-4000-8000-000000000070",
    "nome": "Ecoponto Calhau (Av. dos Holandeses)",
    "tipo": "coleta",
    "latitude": -2.489828,
    "longitude": -44.269783,
    "descricao": "Recebe notebooks, eletrodomésticos, teclados e outros eletrônicos. Av. dos Holandeses, s/nº, Calhau."
  },
  {
    "id": "0d000000-0000-4000-8000-000000000071",
    "nome": "Ecoponto Recanto do Vinhais",
    "tipo": "coleta",
    "latitude": -2.520757,
    "longitude": -44.260119,
    "descricao": "Recebe eletrônicos. Ecoponto da Prefeitura de São Luís. Funciona de segunda a sábado, das 7h às 19h."
  },
  {
    "id": "0d000000-0000-4000-8000-000000000072",
    "nome": "Ecoponto Jardim Renascença",
    "tipo": "coleta",
    "latitude": -2.494621,
    "longitude": -44.288415,
    "descricao": "Recebe eletrônicos, pilhas e baterias. Ecoponto da Prefeitura de São Luís. Rua Netuno, Jardim Renascença. Funciona de segunda a sábado, das 7h às 19h."
  },
  {
    "id": "0d000000-0000-4000-8000-000000000073",
    "nome": "Ecoponto Cidade Operária",
    "tipo": "coleta",
    "latitude": -2.564431,
    "longitude": -44.199903,
    "descricao": "Recebe eletrônicos. Ecoponto da Prefeitura de São Luís. Funciona de segunda a sábado, das 7h às 19h."
  },
  {
    "id": "0d000000-0000-4000-8000-000000000074",
    "nome": "Ecoponto Bequimão",
    "tipo": "coleta",
    "latitude": -2.528452,
    "longitude": -44.24834,
    "descricao": "Recebe eletrônicos. Ecoponto da Prefeitura de São Luís. Funciona de segunda a sábado, das 7h às 19h."
  },
  {
    "id": "0d000000-0000-4000-8000-000000000075",
    "nome": "Ecoponto Itapiracó",
    "tipo": "coleta",
    "latitude": -2.532347,
    "longitude": -44.202923,
    "descricao": "Recebe eletrônicos, pilhas e baterias. Ecoponto da Prefeitura de São Luís. Av. Joaquim Mochel, Itapiracó. Funciona de segunda a sábado, das 7h às 19h."
  },
  {
    "id": "0d000000-0000-4000-8000-000000000076",
    "nome": "UFMA - coleta de eletrônicos (CCET)",
    "tipo": "coleta",
    "latitude": -2.557943,
    "longitude": -44.309531,
    "descricao": "Ponto de coleta de resíduos eletrônicos na entrada do Centro de Ciências Exatas e Tecnologia (CCET), no campus da UFMA, Av. dos Portugueses."
  },
  {
    "id": "0d000000-0000-4000-8000-000000000077",
    "nome": "Ecoponto São Francisco",
    "tipo": "coleta",
    "latitude": -2.511555,
    "longitude": -44.309188,
    "descricao": "Recebe pilhas e baterias. Ecoponto da Prefeitura de São Luís. Av. Ferreira Gullar, ao lado da Estação Elevatória da Caema, São Francisco."
  },
  {
    "id": "0d000000-0000-4000-8000-000000000078",
    "nome": "Ecoponto Cohaserma",
    "tipo": "coleta",
    "latitude": -2.506966,
    "longitude": -44.24818,
    "descricao": "Recebe pilhas e baterias. Ecoponto da Prefeitura de São Luís. Rua Quatorze, s/nº, Parque Athenas, região do Cohaserma."
  },
  {
    "id": "0d000000-0000-4000-8000-000000000079",
    "nome": "Mutirão de troca de lâmpadas - Cidade Operária (ilustrativo)",
    "tipo": "acao",
    "latitude": -2.579,
    "longitude": -44.202,
    "descricao": "Ação ilustrativa para testar o mapa: troca de lâmpadas antigas por LED. Não corresponde a um evento real."
  },
  {
    "id": "0d000000-0000-4000-8000-000000000080",
    "nome": "Feira de eficiência energética - Renascença (ilustrativo)",
    "tipo": "acao",
    "latitude": -2.499,
    "longitude": -44.286,
    "descricao": "Ação ilustrativa para testar o mapa: oficinas sobre conta de luz e economia. Não corresponde a um evento real."
  }
];
