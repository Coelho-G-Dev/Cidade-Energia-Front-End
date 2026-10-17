import type { ReactNode } from "react";
import { CascaApp } from "@/components/app/CascaApp";

export default function LayoutApp({ children }: { children: ReactNode }) {
  return <CascaApp>{children}</CascaApp>;
}
