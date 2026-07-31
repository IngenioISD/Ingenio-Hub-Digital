import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/_authenticated/datos-maestros")({
  component: Page,
});

function Page() {
  return (
    <AppShell mode="direccion" contexto="hub" activeItem="datos-maestros">
      <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700 }}>Datos Maestros</h1>
    </AppShell>
  );
}
