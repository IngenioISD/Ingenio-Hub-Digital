import { createFileRoute } from "@tanstack/react-router";

import { EnConstruccion } from "@/components/datos-maestros/EnConstruccion";

export const Route = createFileRoute("/_authenticated/datos-maestros/entidades-obra/direccion-facultativa")({
  head: () => ({ meta: [{ title: "Dirección Facultativa · Datos Maestros · Ingenio HUB" }] }),
  component: Page,
});

function Page() {
  return <EnConstruccion titulo="Dirección Facultativa" descripcion="Direcciones facultativas de tu empresa." />;
}
