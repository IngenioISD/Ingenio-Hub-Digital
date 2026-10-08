import { createFileRoute } from "@tanstack/react-router";

import { EnConstruccion } from "@/components/datos-maestros/EnConstruccion";

export const Route = createFileRoute("/_authenticated/datos-maestros/accesos-equipo/catalogos")({
  head: () => ({ meta: [{ title: "Catálogos · Datos Maestros · Ingenio HUB" }] }),
  component: Page,
});

function Page() {
  return <EnConstruccion titulo="Catálogos" descripcion="Listas desplegables usadas en toda la plataforma." />;
}
