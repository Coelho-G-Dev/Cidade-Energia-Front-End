import type { Metadata } from "next";
import { TelaDiagnostico } from "@/telas/TelaDiagnostico";
import type { MomentoDiagnostico } from "@/types";

export const metadata: Metadata = { title: "Diagnóstico da trilha" };

export default async function PaginaDiagnostico({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ momento?: string }>;
}) {
  const { slug } = await params;
  const { momento } = await searchParams;
  const momentoValido: MomentoDiagnostico = momento === "depois" ? "depois" : "antes";
  return <TelaDiagnostico slug={slug} momento={momentoValido} />;
}
