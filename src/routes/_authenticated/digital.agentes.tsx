import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/_authenticated/digital/agentes")({
  head: () => ({ meta: [
    { title: "Agentes · Ingenio Digital" },
    { name: "description", content: "Agentes de Ingenio Digital para tu empresa." },
    { property: "og:title", content: "Agentes · Ingenio Digital" },
    { property: "og:description", content: "Agentes de Ingenio Digital para tu empresa." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Page,
});

function Page() {
  return (
    <AppShell mode="direccion" contexto="digital" activeItem="agentes">
      <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700 }}>Agentes</h1>
    </AppShell>
  );
}
