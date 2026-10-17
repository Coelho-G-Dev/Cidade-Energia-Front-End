import type { ReactNode } from "react";
import { CascaSimulador } from "@/telas/CascaSimulador";

export default function LayoutSimulador({ children }: { children: ReactNode }) {
  return <CascaSimulador>{children}</CascaSimulador>;
}
