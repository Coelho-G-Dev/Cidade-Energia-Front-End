export function limparMarcadores(texto: string): string {
  return texto
    .replace(/^>\s*\[REVISAR\]\s*$/gm, "")
    .replace(/\s?\[(REVISAR|CONFERIR FONTE)\]/g, "")
    .trim();
}

export const brl = (valor: number, casas = 2) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: casas, maximumFractionDigits: casas });

export const numero = (valor: number, casas = 1) =>
  valor.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: casas });

// O back sempre indica pelo menos 1 placa; com 1, o texto fica no singular.
export function placas(valor: number): string {
  const inteiro = Math.round(valor);
  return `${inteiro} ${inteiro === 1 ? "placa" : "placas"}`;
}

export function anos(valor: number): string {
  const texto = numero(valor);
  return `${texto} ${texto === "1" ? "ano" : "anos"}`;
}

export function dataCurta(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}/${mes}` : iso;
}

const formatoDiaEHora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Fortaleza",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

// "18/10 às 14:30", no horário de São Luís.
export function diaEHora(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return iso;
  const p = Object.fromEntries(formatoDiaEHora.formatToParts(data).map((parte) => [parte.type, parte.value]));
  return `${p.day}/${p.month} às ${p.hour}:${p.minute}`;
}
