import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/_authenticated/hub/proyectos")({
  component: Page,
});

function Page() {
  return (
    <AppShell mode="direccion" contexto="hub" activeItem="proyectos">
      <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700 }}>Proyectos</h1>
    </AppShell>
  );
}
