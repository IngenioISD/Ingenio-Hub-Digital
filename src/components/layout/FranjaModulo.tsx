import type { LucideIcon } from "lucide-react";

type FranjaModuloProps = {
  colorFondo: string;
  colorTexto: string;
  icono: LucideIcon;
  titulo: string;
  subtitulo?: string;
};

/**
 * Franja superior de un módulo abierto. NO se usa en Inicio / Módulos / Proyectos.
 * Los colores llegan por props desde la paleta de capítulos del design system.
 */
export function FranjaModulo({
  colorFondo,
  colorTexto,
  icono: Icono,
  titulo,
  subtitulo,
}: FranjaModuloProps) {
  return (
    <div
      className="flex h-14 items-center gap-3 px-5"
      style={{
        backgroundColor: colorFondo,
        color: colorTexto,
        borderRadius: "9px",
        fontFamily: "var(--font-family)",
      }}
    >
      <Icono size={22} />
      <div className="min-w-0">
        <div className="truncate" style={{ fontSize: "var(--text-md)", fontWeight: 600 }}>
          {titulo}
        </div>
        {subtitulo ? (
          <div className="truncate" style={{ fontSize: "var(--text-xs)", opacity: 0.8 }}>
            {subtitulo}
          </div>
        ) : null}
      </div>
    </div>
  );
}
