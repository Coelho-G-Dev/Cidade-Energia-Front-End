import type { Metadata } from "next";
import { TelaEntrar } from "@/telas/TelaEntrar";

export const metadata: Metadata = { title: "Entrar" };

export default function Pagina() {
  return <TelaEntrar />;
}
