import type { ReactNode } from "react";
import { ClipboardList } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { FranjaModulo } from "@/components/layout/FranjaModulo";

export function LayoutActas({ subtitulo, children }: { subtitulo?: string; children: ReactNode }) {
  return (
    <AppShell mode="direccion" contexto="digital" activeItem="apps">
      <FranjaModulo
        colorFondo="var(--apps-bg)"
        colorTexto="var(--apps-text)"
        icono={ClipboardList}
        titulo="Actas de Reunión"
        subtitulo={subtitulo}
      />
      <div className="mt-6">{children}</div>
    </AppShell>
  );
}
