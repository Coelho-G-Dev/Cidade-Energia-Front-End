"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { animate } from "motion/react";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap, ZoomControl } from "react-leaflet";
import { usePoucoMovimento } from "@/lib/movimento";
import type { PontoMapa, TipoPontoMapa } from "@/types";

const CENTRO_SAO_LUIS: L.LatLngTuple = [-2.535, -44.255];

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
      scrollWheelZoom={false}
      className="h-full w-full"
      attributionControl
      zoomControl={false}
      zoomAnimation={!poucoMovimento}
      markerZoomAnimation={!poucoMovimento}
      inertia={!poucoMovimento}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={18}
      />
      <ZoomControl position="topleft" zoomInTitle="Aproximar o mapa" zoomOutTitle="Afastar o mapa" />
      <AjustarAoTamanho />
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
