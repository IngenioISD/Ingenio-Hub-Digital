export type EstadoProyecto = "en_estudio" | "adjudicado" | "perdido" | "finalizado";

export type ProyectoListado = {
  id: string;
  nombre: string;
  codigoEstudios: string | null;
  codigoObra: string | null;
  propiedadNombre: string | null;
  tipoObra: string | null;
  region: string | null;
  presupuestoVenta: number | null;
  estado: EstadoProyecto | string;
};
