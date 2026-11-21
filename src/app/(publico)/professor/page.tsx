import type { Metadata } from "next";
import { TelaProfessor } from "@/telas/TelaProfessor";

export const metadata: Metadata = { title: "Painel do professor" };

export default function PaginaProfessor() {
  return <TelaProfessor />;
}
