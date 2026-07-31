import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { itemsProyecto } from "@/components/layout/Sidebar";
import { useProyectoResumen } from "@/hooks/use-proyecto-resumen";

export const Route = createFileRoute("/_authenticated/proyecto/$id/modulos")({
  component: Page,
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
      <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700 }}>Módulos del proyecto</h1>
    </AppShell>
  );
}
