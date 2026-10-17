import type { Metadata } from "next";
import { TelaSimuladorAparelhos } from "@/telas/TelaSimuladorAparelhos";

export const metadata: Metadata = { title: "Simulador pelos aparelhos" };

export default function Pagina() {
  return <TelaSimuladorAparelhos />;
}
