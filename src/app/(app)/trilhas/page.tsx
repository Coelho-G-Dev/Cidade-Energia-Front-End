import type { Metadata } from "next";
import { TelaTrilhas } from "@/telas/TelaTrilhas";

export const metadata: Metadata = { title: "Trilhas" };

export default function Pagina() {
  return <TelaTrilhas />;
}
