import { colorTipoReunion } from "@/lib/actas/actas";

export function BadgeTipoReunion({
  codigo,
  etiqueta,
}: {
  codigo: string | null | undefined;
  etiqueta?: string | null;
}) {
  const { bg, text } = colorTipoReunion(codigo);
  return (
    <span
      className="badge"
      style={{ backgroundColor: bg, color: text, border: "none" }}
    >
      {etiqueta || codigo || "—"}
    </span>
  );
}

export function BadgeEstadoActa({ estado }: { estado: string | null | undefined }) {
  const generada = estado === "generada";
  return (
    <span className={generada ? "badge badge-success" : "badge badge-warning"}>
      {generada ? "Generada" : "Borrador"}
    </span>
  );
}
