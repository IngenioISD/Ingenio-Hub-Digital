import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ProyectosPage } from "@/components/shared/ProyectosPage";

export const Route = createFileRoute("/_authenticated/hub/proyectos")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Proyectos · Ingenio HUB" },
      { name: "description", content: "Consulta, filtra y exporta los proyectos de tu empresa en Ingenio HUB." },
      { property: "og:title", content: "Proyectos · Ingenio HUB" },
      { property: "og:description", content: "Consulta, filtra y exporta los proyectos de tu empresa en Ingenio HUB." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function Page() {
  return (
    <AppShell mode="direccion" contexto="hub" activeItem="proyectos">
      <ProyectosPage />
    </AppShell>
  );
}
