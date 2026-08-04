const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

/** "Martes, 4 de agosto de 2026" */
export function fechaLarga(d: Date): string {
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

/** "agosto 2028" */
export function mesAnio(d: Date): string {
  return `${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

/** "4.200.000 €" */
export function formatoEuros(valor: number): string {
  return `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(valor)} €`;
}

/** "04/08/2026" */
export function fechaCorta(iso: string): string {
  const [anio, mes, dia] = iso.split("-");
  return dia && mes && anio ? `${dia}/${mes}/${anio}` : iso;
}

export function sumarMeses(iso: string, meses: number): Date {
  const [anio, mes, dia] = iso.split("-").map(Number);
  const d = new Date(anio ?? 1970, (mes ?? 1) - 1, dia ?? 1);
  d.setMonth(d.getMonth() + meses);
  return d;
}

export function diasHasta(fecha: Date): number {
  const hoy = new Date();
  const a = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const b = Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  return Math.round((b - a) / 86_400_000);
}
