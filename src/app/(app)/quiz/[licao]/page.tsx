import type { Metadata } from "next";
import { TelaQuiz } from "@/telas/TelaQuiz";

export const metadata: Metadata = { title: "Quiz" };

export default async function Pagina({ params }: { params: Promise<{ licao: string }> }) {
  const { licao } = await params;
  return <TelaQuiz licaoId={licao} />;
}
