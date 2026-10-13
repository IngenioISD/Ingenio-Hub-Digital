import { createFileRoute } from "@tanstack/react-router";

import { EnConstruccion } from "@/components/datos-maestros/EnConstruccion";

export const Route = createFileRoute("/_authenticated/datos-maestros/entidades-obra/direccion-facultativa/$id")({
  head: () => ({ meta: [{ title: "Ficha de Dirección Facultativa · Datos Maestros · Ingenio HUB" }] }),
  component: Page,
});

function Page() {
  return <EnConstruccion titulo="Ficha de Dirección Facultativa" />;
}
