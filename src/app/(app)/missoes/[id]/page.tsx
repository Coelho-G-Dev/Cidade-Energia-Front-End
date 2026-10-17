import type { Metadata } from "next";
import { TelaMissao } from "@/telas/TelaMissao";

export const metadata: Metadata = { title: "Missão" };

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TelaMissao missaoId={id} />;
}
