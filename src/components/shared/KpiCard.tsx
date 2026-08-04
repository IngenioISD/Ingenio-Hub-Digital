import type { ReactNode } from "react";

type KpiCardProps = {
  titulo: string;
  valor: ReactNode;
  subtitulo?: string | undefined;
  /** Dato aún no disponible: muestra "—" y el subtítulo en gris apagado */
  proximamente?: boolean;
  /** Color semántico del valor destacado */
  color?: "default" | "warning";
};

export function KpiCard({
  titulo,
  valor,
  subtitulo,
  proximamente = false,
  color = "default",
}: KpiCardProps) {
  const valorColor = proximamente
    ? "var(--text-muted)"
    : color === "warning"
      ? "var(--state-warning)"
      : "var(--text-primary)";

  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface)",
        borderRadius: "var(--radius-lg)",
        border: "var(--border-width-thin) solid var(--border-default)",
        boxShadow: "var(--shadow-xs)",
        padding: "var(--card-padding)",
      }}
    >
      <div
        className="uppercase"
        style={{
          fontSize: "var(--text-xs)",
          fontWeight: 600,
          letterSpacing: "var(--tracking-wider)",
          color: "var(--text-muted)",
        }}
      >
        {titulo}
      </div>
      <div
        className="mt-2"
        style={{
          fontSize: "var(--text-2xl)",
          fontWeight: 700,
          color: valorColor,
        }}
      >
        {proximamente ? "—" : valor}
      </div>
      {subtitulo ? (
        <div className="mt-1" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          {subtitulo}
        </div>
      ) : null}
    </div>
  );
}

