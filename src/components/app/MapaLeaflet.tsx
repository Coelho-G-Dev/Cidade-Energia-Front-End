"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { animate } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, TileLayer, useMap, ZoomControl } from "react-leaflet";
import { usePoucoMovimento } from "@/lib/movimento";
import type { PontoMapa, TipoPontoMapa } from "@/types";

const CENTRO_SAO_LUIS: L.LatLngTuple = [-2.535, -44.255];

// O provedor dos blocos vem do ambiente: trocar de provedor é mudar as variáveis e publicar de novo.
// Sem elas, usa o OpenStreetMap, que só permite uso leve.
export const BLOCOS_URL = process.env.NEXT_PUBLIC_MAPA_BLOCOS_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const BLOCOS_ATRIBUICAO =
  process.env.NEXT_PUBLIC_MAPA_ATRIBUICAO || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// Traços dos ícones de src/components/ui/Icone, em texto porque o Leaflet desenha o pino fora do React.
const TRACO: Record<TipoPontoMapa, string> = {
  solar: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  coleta:
    '<path d="M7 19H4.5a1.5 1.5 0 0 1-1.3-2.3L5.5 13"/><path d="M11 19h8.5a1.5 1.5 0 0 0 1.3-2.3L19 14"/><path d="M14 6.5l-1.2-2a1.5 1.5 0 0 0-2.6 0L8 8.5"/><path d="M9 16l2 3-2 3M3.5 10.5l2 2.5 3-1M16.5 4.5l-2.5 2 1 3"/>',
  acao: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 13.5a7 7 0 0 1 4 6.5"/>',
};

const COR: Record<TipoPontoMapa, string> = {
  solar: "bg-destaque text-destaque-tinta",
  coleta: "bg-sucesso text-superficie",
  acao: "bg-primaria text-primaria-tinta",
};

function icone(tipo: TipoPontoMapa, selecionado: boolean): L.DivIcon {
  // O desenho tem 40 px (48 selecionado); a folga de 2 px de cada lado leva o toque a 44 px.
  const tamanho = (selecionado ? 48 : 40) + 4;
  return L.divIcon({
    className: "pino-mapa",
    iconSize: [tamanho, tamanho],
    iconAnchor: [tamanho / 2, tamanho / 2],
    html:
      `<span class="pino-mapa-corpo ${COR[tipo]} ${selecionado ? "pino-mapa-selecionado" : ""}">` +
      `<svg width="${selecionado ? 22 : 18}" height="${selecionado ? 22 : 18}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TRACO[tipo]}</svg>` +
      `</span>`,
  });
}

// Os pinos caem só na primeira vez que o mapa abre nesta visita.
let pinosJaCairam = false;

function AjustarAoTamanho() {
  const mapa = useMap();
  useEffect(() => {
    const observador = new ResizeObserver(() => mapa.invalidateSize());
    observador.observe(mapa.getContainer());
    return () => observador.disconnect();
  }, [mapa]);
  return null;
}

// Margens do enquadramento: meio pino (22 px) de folga em volta. À esquerda, os botões de zoom vão
// até 58 px da borda; embaixo, a atribuição ocupa 17 px.
export const MARGEM_ENQUADRAMENTO = { superiorEsquerda: [84, 28] as L.PointTuple, inferiorDireita: [28, 40] as L.PointTuple };
// Com um ponto só (ou pontos muito juntos), não aproxima a ponto de perder o bairro de vista.
export const ZOOM_MAXIMO_ENQUADRAMENTO = 15;

/** Os limites que cobrem todos os pontos, ou `null` sem pontos. */
export function limitesDosPontos(pontos: readonly Pick<PontoMapa, "latitude" | "longitude">[]): L.LatLngBounds | null {
  if (pontos.length === 0) return null;
  return L.latLngBounds(pontos.map((p) => [p.latitude, p.longitude] as L.LatLngTuple));
}

// Mostra todos os pontos visíveis. Na abertura enquadra sem animação; quando o filtro muda, o mapa
// desliza até os pontos novos (com pouco movimento, pula direto). Selecionar um ponto não mexe no mapa.
function EnquadrarPontos({ pontos, poucoMovimento }: { pontos: readonly PontoMapa[]; poucoMovimento: boolean }) {
  const mapa = useMap();
  const chave = pontos.map((p) => p.id).join(",");
  const primeiraVez = useRef(true);
  const pontosAtuais = useRef(pontos);
  useEffect(() => {
    pontosAtuais.current = pontos;
  });

  useEffect(() => {
    const limites = limitesDosPontos(pontosAtuais.current);
    if (!limites) return;
    mapa.fitBounds(limites, {
      paddingTopLeft: MARGEM_ENQUADRAMENTO.superiorEsquerda,
      paddingBottomRight: MARGEM_ENQUADRAMENTO.inferiorDireita,
      maxZoom: ZOOM_MAXIMO_ENQUADRAMENTO,
      animate: !primeiraVez.current && !poucoMovimento,
    });
    primeiraVez.current = false;
  }, [mapa, chave, poucoMovimento]);

  return null;
}

// O Leaflet deixa o mapa focável para mover com as setas; o nome diz isso a quem usa leitor de tela.
function NomearMapa() {
  const mapa = useMap();
  useEffect(() => {
    const caixa = mapa.getContainer();
    caixa.setAttribute("role", "group");
    caixa.setAttribute("aria-label", "Mapa: use as setas para mover e as teclas + e − para aproximar ou afastar");
  }, [mapa]);
  return null;
}

type Props = {
  pontos: readonly PontoMapa[];
  selecionado: string | null;
  onSelecionar: (id: string) => void;
};

export default function MapaLeaflet({ pontos, selecionado, onSelecionar }: Props) {
  const poucoMovimento = usePoucoMovimento();
  const cair = useMemo(() => !pinosJaCairam && !poucoMovimento, [poucoMovimento]);

  useEffect(() => {
    pinosJaCairam = true;
  }, []);

  return (
    <MapContainer
      center={CENTRO_SAO_LUIS}
      zoom={12}
      // O enquadramento usa passos de 0,25 para chegar mais perto dos pontos; os botões seguem de 1 em 1.
      zoomSnap={0.25}
      zoomDelta={1}
      scrollWheelZoom={false}
      className="h-full w-full"
      attributionControl
      zoomControl={false}
      zoomAnimation={!poucoMovimento}
      markerZoomAnimation={!poucoMovimento}
      inertia={!poucoMovimento}
    >
      <TileLayer
        url={BLOCOS_URL}
        attribution={BLOCOS_ATRIBUICAO}
        maxZoom={18}
      />
      <ZoomControl position="topleft" zoomInTitle="Aproximar o mapa" zoomOutTitle="Afastar o mapa" />
      <AjustarAoTamanho />
      <EnquadrarPontos pontos={pontos} poucoMovimento={poucoMovimento} />
      <NomearMapa />
      {pontos.map((ponto, i) => (
        <Marker
          key={ponto.id}
          position={[ponto.latitude, ponto.longitude]}
          icon={icone(ponto.tipo, ponto.id === selecionado)}
          title={ponto.nome}
          keyboard
          zIndexOffset={ponto.id === selecionado ? 1000 : 0}
          eventHandlers={{
            click: () => onSelecionar(ponto.id),
            // O Leaflet só abre o popup dele com Enter; o cartão do ponto abre com Enter e espaço, como todo botão.
            keydown: (evento) => {
              if (evento.originalEvent.key !== "Enter" && evento.originalEvent.key !== " ") return;
              evento.originalEvent.preventDefault();
              onSelecionar(ponto.id);
            },
            add: (evento) => {
              const corpo = (evento.target as L.Marker).getElement()?.firstElementChild as HTMLElement | null | undefined;
              if (!cair || !corpo) return;
              animate(corpo, { y: [-36, 0], opacity: [0, 1] }, { type: "spring", stiffness: 420, damping: 14, delay: 0.15 + i * 0.07 });
            },
          }}
        />
      ))}
    </MapContainer>
  );
}
