import type { Metadata } from "next";
import { TelaPerfil } from "@/telas/TelaPerfil";

export const metadata: Metadata = { title: "Meu perfil" };

export default function Pagina() {
  return <TelaPerfil />;
}
