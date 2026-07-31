import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/_authenticated/digital/inicio")({
  component: Page,
});

function Page() {
  return (
    <AppShell mode="direccion" contexto="digital" activeItem="inicio">
      <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700 }}>Inicio Digital</h1>
    </AppShell>
  );
}
