import type { Metadata } from "next";
import { TelaSimuladorConta } from "@/telas/TelaSimuladorConta";

export const metadata: Metadata = { title: "Simulador" };

export default function Pagina() {
  return <TelaSimuladorConta />;
}
