import { createFileRoute } from "@tanstack/react-router";

import { EnConstruccion } from "@/components/datos-maestros/EnConstruccion";

export const Route = createFileRoute("/_authenticated/datos-maestros/entidades-obra/proveedores")({
  head: () => ({ meta: [{ title: "Proveedores · Datos Maestros · Ingenio HUB" }] }),
  component: Page,
});

function Page() {
  return <EnConstruccion titulo="Proveedores" descripcion="Proveedores y subcontratas de tu empresa." />;
}
