// A vitrine de componentes não é tela para o estudante: em produção só aparece com
// NEXT_PUBLIC_MOSTRAR_VITRINE=true (por exemplo, para mostrar ao júri).
export function vitrineLiberada(ambiente: string | undefined = process.env.NODE_ENV, chave = process.env.NEXT_PUBLIC_MOSTRAR_VITRINE): boolean {
  return ambiente !== "production" || chave === "true";
}
