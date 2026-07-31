import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/_authenticated/digital/apps")({
  component: Page,
});

function Page() {
  return (
    <AppShell mode="direccion" contexto="digital" activeItem="apps">
      <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700 }}>Apps</h1>
    </AppShell>
  );
}
