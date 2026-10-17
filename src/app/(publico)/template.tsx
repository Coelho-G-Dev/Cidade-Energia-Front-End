import type { ReactNode } from "react";
import { TransicaoPagina } from "@/components/app/TransicaoPagina";

export default function Template({ children }: { children: ReactNode }) {
  return <TransicaoPagina>{children}</TransicaoPagina>;
}
