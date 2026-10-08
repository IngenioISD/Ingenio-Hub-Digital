import { createFileRoute } from "@tanstack/react-router";

import { EnConstruccion } from "@/components/datos-maestros/EnConstruccion";

export const Route = createFileRoute("/_authenticated/datos-maestros/entidades-obra/propiedad")({
  head: () => ({ meta: [{ title: "Propiedad · Datos Maestros · Ingenio HUB" }] }),
  component: Page,
});

function Page() {
  return <EnConstruccion titulo="Propiedad" descripcion="Propiedades de tu empresa." />;
}
