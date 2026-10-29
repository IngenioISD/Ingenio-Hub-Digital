export type TipoCatalogo = "departamento" | "puesto" | "centro_trabajo" | "estado_personal";

export const CODIGOS_PROTEGIDOS = ["alta", "baja_empresa"] as const;

/** Normaliza para comparar: sin tildes, sin mayúsculas y sin espacios sobrantes. */
export function normalizarNombre(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
}

/** True si ya existe otra opción (distinta de excluirId) con el mismo nombre normalizado. */
export function nombreDuplicado(
  nombre: string,
  opciones: { id: string; nombre: string }[],
  excluirId?: string | null,
): boolean {
  const n = normalizarNombre(nombre);
  return opciones.some((o) => o.id !== excluirId && normalizarNombre(o.nombre) === n);
}

export function esEstadoProtegido(tipo: string, codigo: string | null | undefined): boolean {
  return tipo === "estado_personal" && !!codigo && (CODIGOS_PROTEGIDOS as readonly string[]).includes(codigo);
}

/** Motivo por el que no se puede borrar, o null si se puede. */
export function motivoNoBorrar(tipo: string, codigo: string | null | undefined, enUso: number): string | null {
  if (esEstadoProtegido(tipo, codigo)) return "Estado del sistema: no se puede desactivar ni borrar.";
  if (enUso > 0) return `En uso por ${enUso} ${enUso === 1 ? "persona" : "personas"}. Puedes desactivarla.`;
  return null;
}

export const COLUMNA_PERSONAL: Record<TipoCatalogo, "departamento_id" | "puesto_id" | "centro_trabajo_id" | "estado_id"> = {
  departamento: "departamento_id",
  puesto: "puesto_id",
  centro_trabajo: "centro_trabajo_id",
  estado_personal: "estado_id",
};
