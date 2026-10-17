import type { Metadata } from "next";
import { TelaResultado } from "@/telas/TelaResultado";

export const metadata: Metadata = { title: "Seu resultado" };

export default function Pagina() {
  return <TelaResultado />;
}
