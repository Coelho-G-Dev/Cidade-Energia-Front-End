import type { Metadata } from "next";
import { TelaImpacto } from "@/telas/TelaImpacto";

export const metadata: Metadata = { title: "Painel de impacto" };

export default function PaginaImpacto() {
  return <TelaImpacto />;
}
