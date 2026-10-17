import type { Metadata } from "next";
import { TelaTutor } from "@/telas/TelaTutor";

export const metadata: Metadata = { title: "Tutor Energinho" };

export default function Pagina() {
  return <TelaTutor />;
}
