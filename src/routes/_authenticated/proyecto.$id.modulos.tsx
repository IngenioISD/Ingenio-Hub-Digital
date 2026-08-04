import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { itemsProyecto } from "@/components/layout/Sidebar";
import { CatalogoModulos } from "@/components/shared/CatalogoModulos";
import { useProyectoResumen } from "@/hooks/use-proyecto-resumen";

export const Route = createFileRoute("/_authenticated/proyecto/$id/modulos")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Módulos de proyecto · Ingenio HUB" },
      {
        name: "description",
        content: "Herramientas y módulos de gestión disponibles para la obra en Ingenio HUB.",
      },
      { property: "og:title", content: "Módulos de proyecto · Ingenio HUB" },
      {
        property: "og:description",
        content: "Herramientas y módulos de gestión disponibles para la obra en Ingenio HUB.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function Page() {
  const { id } = Route.useParams();
  const proyecto = useProyectoResumen(id);

  return (
    <AppShell
      mode="proyecto"
      activeItem="modulos"
      items={itemsProyecto(id)}
      proyectoNombre={proyecto?.nombre ?? "—"}
      proyectoEstado={proyecto?.estado ?? "En ejecución"}
    >
      <CatalogoModulos subtitulo="Herramientas de gestión para esta obra" />
    </AppShell>
  );
}
