import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { vitrineLiberada } from "@/lib/vitrine";
import { Vitrine } from "./Vitrine";

export const metadata: Metadata = { title: "Design", robots: { index: false, follow: false } };

export default function PaginaDesign() {
  if (!vitrineLiberada()) notFound();
  return <Vitrine />;
}
