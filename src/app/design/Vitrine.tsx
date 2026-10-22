"use client";

import { useState, type ReactNode } from "react";
import { BarraProgresso } from "@/components/ui/BarraProgresso";
import { Botao, BotaoIcone, BotaoLink } from "@/components/ui/Botao";
import { BrotoPontos, type GanhoPontos } from "@/components/ui/BrotoPontos";
import { CampoTexto } from "@/components/ui/CampoTexto";
import { Card, CardBotao, CardLink } from "@/components/ui/Card";
import { CardNumero } from "@/components/ui/CardNumero";
import { Chip, ChipBotao } from "@/components/ui/Chip";
import { Icone } from "@/components/ui/Icone";
import { IndicadorDigitando } from "@/components/ui/IndicadorDigitando";
import { Navegacao } from "@/components/ui/Navegacao";
import { PadraoAzulejo } from "@/components/ui/PadraoAzulejo";
import { Seletor } from "@/components/ui/Seletor";
import { SeletorDuplo } from "@/components/ui/SeletorDuplo";
import { Topo } from "@/components/ui/Topo";
import { usePoucoMovimento } from "@/lib/movimento";

const CORES = [
  ["fundo", "#F5F8FC", "bg-fundo"],
  ["superficie", "#FFFFFF", "bg-superficie"],
  ["tinta", "#0F2240", "bg-tinta"],
  ["apoio", "#4B5A72", "bg-apoio"],
  ["primaria", "#1E4B9C", "bg-primaria"],
  ["primaria-suave", "#DDE6F6", "bg-primaria-suave"],
  ["destaque", "#F2B705", "bg-destaque"],
  ["sucesso", "#1C7448", "bg-sucesso"],
  ["sucesso-suave", "#DDF0E4", "bg-sucesso-suave"],
  ["erro", "#B0322A", "bg-erro"],
  ["erro-suave", "#FAE3DF", "bg-erro-suave"],
] as const;

const BAIRROS = [
  { valor: "anil", rotulo: "Anil" },
  { valor: "centro", rotulo: "Centro" },
  { valor: "cohama", rotulo: "Cohama" },
];

const brl = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function Secao({ titulo, descricao, children }: { titulo: string; descricao?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t-2 border-trilho pt-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-titulo-2">{titulo}</h2>
        {descricao && <p className="text-apoio">{descricao}</p>}
      </div>
      {children}
    </section>
  );
}

function Estado({ nome, children }: { nome: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-pequeno text-apoio">{nome}</span>
      {children}
    </div>
  );
}

export function Vitrine() {
  const poucoMovimento = usePoucoMovimento();
  const [contagem, setContagem] = useState(0);
  const [parte, setParte] = useState(2);
  const [assentar, setAssentar] = useState(0);
  const [nome, setNome] = useState("");
  const [erroNome, setErroNome] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const [bairro, setBairro] = useState("");
  const [modo, setModo] = useState<"conta" | "aparelhos">("conta");
  const [ranking, setRanking] = useState<"bairros" | "escolas">("bairros");
  const [filtros, setFiltros] = useState({ solar: true, coleta: false, acao: false });
  const [ganho, setGanho] = useState<GanhoPontos | null>(null);
  const [carregando, setCarregando] = useState(false);

  function validarNome() {
    setTentativa((t) => t + 1);
    const limpo = nome.trim();
    if (limpo.length < 2) return setErroNome("Escreva seu primeiro nome, com pelo menos 2 letras.");
    if (!/^\p{L}+(?:['-]\p{L}+)*$/u.test(limpo)) return setErroNome("Use só o primeiro nome, sem espaços ou números.");
    setErroNome(null);
  }

  function simularCarregamento() {
    setCarregando(true);
    window.setTimeout(() => setCarregando(false), 1500);
  }

  return (
    <div className="pb-32 lg:pb-12 lg:pl-24">
      <main className="mx-auto flex max-w-[1120px] flex-col gap-10 px-4 pt-8 sm:px-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-titulo-1">Componentes do Cidade Energia</h1>
          <p className="max-w-prose text-apoio">
            Direção A, Azulejo. Cada componente aparece com os seus estados. Os botões abaixo de cada um disparam as animações.
          </p>
          <p className="text-pequeno text-apoio">
            Movimento reduzido no sistema: <strong className="text-tinta">{poucoMovimento ? "ligado" : "desligado"}</strong>
          </p>
        </header>

        <Secao titulo="Cores" descricao="Tinta sobre fundo, superfície e tons suaves passam no contraste AA.">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {CORES.map(([nomeCor, hex, classe]) => (
              <li key={nomeCor} className="flex flex-col gap-1.5">
                <span className={`h-14 rounded-cartao border-2 border-tinta ${classe}`} />
                <span className="text-sm font-bold">{nomeCor}</span>
                <span className="text-pequeno text-apoio">{hex}</span>
              </li>
            ))}
          </ul>
        </Secao>

        <Secao titulo="Tipografia" descricao="Bricolage Grotesque nos títulos e Figtree no texto. Os tamanhos se ajustam à largura da tela.">
          <div className="flex flex-col gap-3">
            <p className="font-titulo text-titulo-1 font-extrabold">Sua conta de luz é a sua primeira aula</p>
            <p className="font-titulo text-titulo-2 font-extrabold">Quanto da sua conta dá para economizar?</p>
            <p className="font-titulo text-titulo-3 font-extrabold">Continue aprendendo</p>
            <p className="font-titulo text-numero font-extrabold">R$ 312</p>
            <p>Use os dados da sua última conta. O texto corrido usa Figtree com 15 a 16 px.</p>
            <p className="text-pequeno text-apoio">Texto de apoio, com 13 px, para legendas e complementos.</p>
          </div>
        </Secao>

        <Secao titulo="Botões" descricao="Ao pressionar, o botão afunda. O primário perde a sombra; os outros descem 2 px.">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Estado nome="Primário">
              <Botao>Ver meu resultado</Botao>
              <Botao disabled>Ver meu resultado</Botao>
              <Botao carregando={carregando} onClick={simularCarregamento}>
                {carregando ? "Calculando..." : "Calcular de novo"}
              </Botao>
            </Estado>
            <Estado nome="Secundário">
              <Botao variante="secundario">Continuar sem perfil</Botao>
              <Botao variante="secundario" disabled>
                Continuar sem perfil
              </Botao>
              <BotaoLink variante="secundario" href="/design">
                Refazer minha simulação
              </BotaoLink>
            </Estado>
            <Estado nome="Escuro">
              <Botao variante="escuro">Próxima pergunta</Botao>
              <Botao variante="escuro" disabled>
                Próxima pergunta
              </Botao>
              <Botao variante="escuro" largo>
                Largura total
              </Botao>
            </Estado>
          </div>
          <Estado nome="Botões de ícone (44 px, com rótulo para leitores de tela)">
            <div className="flex gap-3">
              <BotaoIcone rotulo="Diminuir">
                <Icone nome="menos" tamanho={18} />
              </BotaoIcone>
              <BotaoIcone rotulo="Aumentar">
                <Icone nome="mais" tamanho={18} />
              </BotaoIcone>
              <BotaoIcone rotulo="Aumentar" disabled>
                <Icone nome="mais" tamanho={18} />
              </BotaoIcone>
            </div>
          </Estado>
        </Secao>

        <Secao titulo="Cards" descricao="Com sombra quando pode ser tocado. Sem sombra para agrupar informação.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Estado nome="Com sombra">
              <Card>
                <p className="font-bold">Sol de hoje em São Luís</p>
                <p className="text-pequeno text-apoio">Uma placa solar geraria cerca de 2,4 kWh.</p>
              </Card>
            </Estado>
            <Estado nome="Sem sombra, tom sucesso">
              <Card tom="sucesso" sombra={false}>
                <p className="font-bold text-sucesso">Isso mesmo!</p>
                <p className="text-sm">No segundo semestre chove menos, e as placas produzem mais.</p>
              </Card>
            </Estado>
            <Estado nome="Link pressionável">
              <CardLink href="/design" className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-pequeno bg-primaria-suave text-primaria">
                  <Icone nome="sol" tamanho={22} />
                </span>
                <span className="flex flex-1 flex-col gap-1.5">
                  <span className="font-bold">Energia solar em São Luís</span>
                  <span className="text-pequeno text-apoio">Parte {parte} de 4</span>
                  <BarraProgresso valor={parte} total={4} rotulo="Progresso da trilha" />
                </span>
              </CardLink>
            </Estado>
            <Estado nome="Botão pressionável">
              <CardBotao className="min-h-14 font-bold">De julho a dezembro</CardBotao>
            </Estado>
          </div>
        </Secao>

        <Secao titulo="Chips">
          <div className="flex flex-wrap gap-2">
            <Chip tom="destaque">Energia solar</Chip>
            <Chip tom="sucesso">Coleta e reciclagem</Chip>
            <Chip tom="primaria">Ações no bairro</Chip>
            <Chip tom="neutro">Estimativa</Chip>
          </div>
          <Estado nome="Filtros (toque para ligar e desligar)">
            <div className="flex flex-wrap gap-2">
              <ChipBotao tom="destaque" ativo={filtros.solar} onClick={() => setFiltros((f) => ({ ...f, solar: !f.solar }))}>
                Energia solar
              </ChipBotao>
              <ChipBotao tom="sucesso" ativo={filtros.coleta} onClick={() => setFiltros((f) => ({ ...f, coleta: !f.coleta }))}>
                Coleta e reciclagem
              </ChipBotao>
              <ChipBotao tom="primaria" ativo={filtros.acao} onClick={() => setFiltros((f) => ({ ...f, acao: !f.acao }))}>
                Ações no bairro
              </ChipBotao>
            </div>
          </Estado>
        </Secao>

        <Secao titulo="Números" descricao="Contam de zero até o valor em 600 ms.">
          <div key={contagem} className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <CardNumero rotulo="Gasto por mês" valor={312} formatar={brl} complemento="≈ 380 kWh" />
            <CardNumero rotulo="Dá para economizar" valor={31.2} formatar={brl} complemento="por mês" tom="sucesso" />
            <CardNumero rotulo="Placas solares" valor={6} formatar={(v) => `${Math.round(v)} placas`} complemento="para o seu consumo" />
            <CardNumero
              rotulo="Retorno"
              valor={2.5}
              formatar={(v) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} anos`}
              complemento="para se pagar"
            />
          </div>
          <div>
            <Botao variante="secundario" onClick={() => setContagem((c) => c + 1)}>
              Contar de novo
            </Botao>
          </div>
        </Secao>

        <Secao titulo="Barra de progresso" descricao="Avança com mola ao trocar de parte.">
          <BarraProgresso valor={parte} total={4} rotulo={`Parte ${parte} de 4`} mostrarRotulo />
          <div className="flex flex-wrap gap-3">
            <Botao variante="secundario" onClick={() => setParte((p) => Math.max(1, p - 1))} disabled={parte === 1}>
              Parte anterior
            </Botao>
            <Botao variante="escuro" onClick={() => setParte((p) => Math.min(4, p + 1))} disabled={parte === 4}>
              Próxima parte
            </Botao>
          </div>
          <Estado nome="Barras em sequência, 60 ms entre elas">
            <div key={contagem} className="flex flex-col gap-3">
              {[47, 22, 18, 13].map((percentual, indice) => (
                <BarraProgresso
                  key={percentual}
                  valor={percentual}
                  total={100}
                  rotulo={`Aparelho ${indice + 1}: ${percentual}%`}
                  mostrarRotulo
                  tom={indice === 0 ? "destaque" : "primaria"}
                  atrasoMs={indice * 60}
                />
              ))}
            </div>
          </Estado>
        </Secao>

        <Secao titulo="Azulejo" descricao="A única coisa memorável. Na primeira visita, as peças se assentam em onda diagonal em menos de 1,2 s.">
          <Estado nome="Estático">
            <PadraoAzulejo altura={104} className="rounded-cartao border-2 border-tinta" />
          </Estado>
          <Estado nome="Assentando">
            <PadraoAzulejo key={assentar} altura={208} assentar className="rounded-cartao border-2 border-tinta" />
          </Estado>
          <div>
            <Botao variante="secundario" onClick={() => setAssentar((a) => a + 1)}>
              Assentar de novo
            </Botao>
          </div>
        </Secao>

        <Secao titulo="Topo e navegação" descricao="A navegação fica embaixo no celular e no tablet e vira trilho lateral a partir de 1024 px.">
          <Card sombra={false}>
            <Topo titulo="Simulador" voltarPara="/design" />
          </Card>
          <p className="text-pequeno text-apoio">A navegação desta página está fixa na tela, como no app.</p>
        </Secao>

        <Secao titulo="Campos" descricao="Campo inválido treme 4 px uma vez e mostra a mensagem logo abaixo.">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <form
              noValidate
              className="flex flex-col gap-4"
              onSubmit={(evento) => {
                evento.preventDefault();
                validarNome();
              }}
            >
              <CampoTexto
                rotulo="Seu nome"
                placeholder="Digite seu primeiro nome"
                autoComplete="given-name"
                value={nome}
                onChange={(evento) => setNome(evento.target.value)}
                erro={erroNome}
                tentativa={tentativa}
                dica="Só o primeiro nome. Não pedimos sobrenome."
              />
              <Seletor
                rotulo="Seu bairro"
                textoVazio="Escolha seu bairro"
                opcoes={BAIRROS}
                value={bairro}
                onChange={(evento) => setBairro(evento.target.value)}
                erro={tentativa > 0 && !bairro ? "Escolha o seu bairro na lista." : null}
                tentativa={tentativa}
              />
              <Botao type="submit">Criar meu perfil</Botao>
            </form>
            <div className="flex flex-col gap-4">
              <CampoTexto rotulo="Consumo do mês" grande sufixo="kWh por mês" inputMode="decimal" defaultValue="380" />
              <CampoTexto rotulo="Valor da conta (opcional)" inputMode="decimal" placeholder="R$ 0,00" />
              <CampoTexto rotulo="Código da turma" disabled value="TESTE2AB" readOnly />
            </div>
          </div>
        </Secao>

        <Secao titulo="Seletor de duas opções" descricao="O fundo desliza até a opção escolhida. Funciona com as setas do teclado.">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Estado nome="Simulador">
              <SeletorDuplo
                rotulo="Como você quer simular"
                valor={modo}
                onTrocar={setModo}
                opcoes={[
                  { valor: "conta", rotulo: "Pela conta" },
                  { valor: "aparelhos", rotulo: "Pelos aparelhos" },
                ]}
              />
            </Estado>
            <Estado nome="Ranking">
              <SeletorDuplo
                rotulo="Tipo de ranking"
                valor={ranking}
                onTrocar={setRanking}
                opcoes={[
                  { valor: "bairros", rotulo: "Bairros" },
                  { valor: "escolas", rotulo: "Escolas" },
                ]}
              />
            </Estado>
          </div>
        </Secao>

        <Secao titulo="Tutor e pontos">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Estado nome="Indicador de digitação">
              <IndicadorDigitando className="self-start" />
            </Estado>
            <Estado nome="Pontos ganhos">
              <div className="relative inline-flex w-fit">
                <BrotoPontos ganho={ganho} className="-top-2 left-1/2" />
                <Botao onClick={() => setGanho((g) => ({ id: (g?.id ?? 0) + 1, pontos: 10 }))}>Marcar esta noite</Botao>
              </div>
            </Estado>
          </div>
        </Secao>
      </main>
      <Navegacao ativo="/inicio" />
    </div>
  );
}
