import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/_authenticated/digital/apps")({
  component: Page,
});

function Page() {
  return (
    <AppShell mode="direccion" contexto="digital" activeItem="apps">
      <Outlet />
    </AppShell>
  );
}
