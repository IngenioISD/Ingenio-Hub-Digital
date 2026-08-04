const CLASES: Record<string, string> = {
  adjudicado: "badge badge-success",
  en_estudio: "badge badge-info",
  finalizado: "badge badge-neutral",
  cancelado: "badge badge-error",
};

const ETIQUETAS: Record<string, string> = {
  adjudicado: "Adjudicado",
  en_estudio: "En estudio",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

export function etiquetaEstado(estado: string): string {
  return ETIQUETAS[estado] ?? estado.replace(/_/g, " ");
}

export function BadgeEstado({ estado }: { estado: string }) {
  return <span className={CLASES[estado] ?? "badge badge-neutral"}>{etiquetaEstado(estado)}</span>;
}
