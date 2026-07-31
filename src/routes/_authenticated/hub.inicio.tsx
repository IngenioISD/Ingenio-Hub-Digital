import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/_authenticated/hub/inicio")({
  component: Page,
});

function Page() {
  return (
    <AppShell mode="direccion" contexto="hub" activeItem="inicio">
      <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700 }}>Inicio HUB</h1>
    </AppShell>
  );
}
