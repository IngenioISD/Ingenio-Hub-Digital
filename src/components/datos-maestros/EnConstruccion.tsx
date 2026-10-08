import { HardHat } from "lucide-react";

import { Card } from "@/components/ui/card";

/**
 * Placeholder genérico para secciones de Datos Maestros que ya están
 * en el menú (para no mover la navegación más adelante) pero cuya
 * pantalla todavía no se ha construido.
 */
export function EnConstruccion({
  titulo,
  descripcion,
}: {
  titulo: string;
  descripcion?: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
        {descripcion && <p className="text-sm text-muted-foreground">{descripcion}</p>}
      </div>

      <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span
          className="flex h-12 w-12 items-center justify-center"
          style={{
            backgroundColor: "var(--apps-bg)",
            color: "var(--apps-text)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <HardHat size={22} />
        </span>
        <div>
          <p className="font-medium">Próximamente</p>
          <p className="text-sm text-muted-foreground">Esta sección está en construcción.</p>
        </div>
      </Card>
    </div>
  );
}
