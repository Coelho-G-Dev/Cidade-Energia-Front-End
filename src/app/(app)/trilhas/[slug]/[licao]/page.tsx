import type { Metadata } from "next";
import { TelaLicao } from "@/telas/TelaLicao";

export const metadata: Metadata = { title: "Lição" };

export default async function Pagina({ params }: { params: Promise<{ slug: string; licao: string }> }) {
  const { slug, licao } = await params;
  return <TelaLicao slug={slug} licaoId={licao} />;
}
