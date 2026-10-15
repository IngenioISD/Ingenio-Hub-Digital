/**
 * Suma meses naturales a una fecha "YYYY-MM-DD". Si el día no existe en el
 * mes final, usa el último día de ese mes (31-ene + 1 mes = 28/29-feb).
 * Devuelve "" si la fecha o los meses no son válidos.
 */
export function sumarMeses(fecha: string, meses: number | null | undefined): string {
  if (!fecha || meses == null || !Number.isFinite(meses) || meses <= 0) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (!m) return "";
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const total = mo + Math.trunc(meses);
  const ny = y + Math.floor(total / 12);
  const nm = ((total % 12) + 12) % 12;
  const ultimo = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  const nd = Math.min(d, ultimo);
  return `${ny}-${String(nm + 1).padStart(2, "0")}-${String(nd).padStart(2, "0")}`;
}
