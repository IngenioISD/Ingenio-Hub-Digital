import type { ReactNode } from "react";
import { ClipboardList } from "lucide-react";

import { FranjaModulo } from "@/components/layout/FranjaModulo";

/**
 * Cabecera común de la app "Actas de Reunión".
 * El AppShell (sidebar) ya lo aporta la ruta padre digital.apps.tsx.
 */
export function LayoutActas({ subtitulo, children }: { subtitulo?: string; children: ReactNode }) {
  return (
    <>
      <FranjaModulo
        colorFondo="var(--apps-bg)"
        colorTexto="var(--apps-text)"
        icono={ClipboardList}
        titulo="Actas de Reunión"
        {...(subtitulo ? { subtitulo } : {})}
      />
      <div className="mt-6">{children}</div>
    </>
  );
}
