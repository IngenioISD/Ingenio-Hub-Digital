import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/_authenticated/digital/agentes")({
  component: Page,
});

function Page() {
  return (
    <AppShell mode="direccion" contexto="digital" activeItem="agentes">
      <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700 }}>Agentes</h1>
    </AppShell>
  );
}
