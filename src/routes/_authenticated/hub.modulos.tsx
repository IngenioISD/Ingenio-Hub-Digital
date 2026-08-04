import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { CatalogoModulos } from "@/components/shared/CatalogoModulos";

export const Route = createFileRoute("/_authenticated/hub/modulos")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Módulos · Ingenio HUB" },
      {
        name: "description",
        content: "Catálogo de capítulos y módulos disponibles en Ingenio HUB.",
      },
      { property: "og:title", content: "Módulos · Ingenio HUB" },
      {
        property: "og:description",
        content: "Catálogo de capítulos y módulos disponibles en Ingenio HUB.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function Page() {
  return (
    <AppShell mode="direccion" contexto="hub" activeItem="modulos">
      <CatalogoModulos subtitulo="Capítulos y módulos disponibles en tu plan HUB" />
    </AppShell>
  );
}
