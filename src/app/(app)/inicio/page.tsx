import type { Metadata } from "next";
import { TelaInicio } from "@/telas/TelaInicio";

export const metadata: Metadata = { title: "Início" };

export default function Pagina() {
  return <TelaInicio />;
}
