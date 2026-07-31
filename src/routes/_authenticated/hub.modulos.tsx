import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/_authenticated/hub/modulos")({
  component: Page,
});

function Page() {
  return (
    <AppShell mode="direccion" contexto="hub" activeItem="modulos">
      <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700 }}>Módulos</h1>
    </AppShell>
  );
}
