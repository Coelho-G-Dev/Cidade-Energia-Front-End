import type { Metadata } from "next";
import { TelaPedale } from "@/telas/TelaPedale";

export const metadata: Metadata = { title: "Pedale e veja" };

export default function Pagina() {
  return <TelaPedale />;
}
