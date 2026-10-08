import { createFileRoute } from "@tanstack/react-router";

import { EnConstruccion } from "@/components/datos-maestros/EnConstruccion";

export const Route = createFileRoute("/_authenticated/datos-maestros/accesos-equipo/personal-propio")({
  head: () => ({ meta: [{ title: "Personal propio · Datos Maestros · Ingenio HUB" }] }),
  component: Page,
});

function Page() {
  return <EnConstruccion titulo="Personal propio" descripcion="Ficha de los trabajadores de tu empresa." />;
}
