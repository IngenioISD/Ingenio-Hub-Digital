import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/_authenticated/configuracion")({
  component: Page,
});

function Page() {
  return (
    <AppShell mode="direccion" contexto="hub" activeItem="">
      <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700 }}>Configuración</h1>
    </AppShell>
  );
}
