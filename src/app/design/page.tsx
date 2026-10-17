import type { Metadata } from "next";
import { Vitrine } from "./Vitrine";

export const metadata: Metadata = { title: "Design" };

export default function PaginaDesign() {
  return <Vitrine />;
}
