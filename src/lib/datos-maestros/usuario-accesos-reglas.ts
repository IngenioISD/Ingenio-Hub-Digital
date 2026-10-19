export type AccesoUsuario = {
  modulo: string;
  tipo: string;
  orden: number;
  rol_base: string | null;
  rol_aplicado: string | null;
  es_excepcion: boolean;
  excepcion_id: string | null;
  todos_los_proyectos: boolean;
  proyectos: string[] | null;
  puede_ver: boolean;
  puede_crear: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
  puede_aprobar: boolean;
  puede_exportar: boolean;
};

const NOMBRES: Record<string, string> = {
  datos_maestros: "Datos Maestros · Entidades y obras",
  personal: "Datos Maestros · Personal",
  usuarios: "Datos Maestros · Usuarios",
  albaranes: "Albaranes",
  actas_reunion: "Actas de reuniones",
};

export const nombreElemento = (modulo: string) => NOMBRES[modulo] ?? modulo;
export function nivelAcceso(fila: AccesoUsuario): "sin_acceso" | "lectura" | "escritura" {
  if (fila.rol_aplicado === null || !fila.puede_ver) return "sin_acceso";
  return fila.puede_crear || fila.puede_editar || fila.puede_eliminar ? "escritura" : "lectura";
}
export const permiteAcciones = (puedeEditar: boolean, fila: AccesoUsuario) =>
  puedeEditar && (fila.es_excepcion || fila.rol_aplicado !== null);
export const puedeGuardarExcepcion = (rol: string, rolBase: string | null, todos: boolean, proyectos: string[]) =>
  Boolean(rol) && rol !== rolBase && (todos || proyectos.length > 0);
export const seleccionarVisibles = (seleccion: string[], visibles: string[]) =>
  [...new Set([...seleccion, ...visibles])];