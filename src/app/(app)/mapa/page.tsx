import type { Metadata } from "next";
import { TelaMapa } from "@/telas/TelaMapa";

export const metadata: Metadata = { title: "Mapa da energia" };

export default function Pagina() {
  return <TelaMapa />;
}
