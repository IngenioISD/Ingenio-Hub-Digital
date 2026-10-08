import { createFileRoute } from "@tanstack/react-router";

import { EnConstruccion } from "@/components/datos-maestros/EnConstruccion";

export const Route = createFileRoute("/_authenticated/datos-maestros/accesos-equipo/personal-externo")({
  head: () => ({ meta: [{ title: "Personal externo · Datos Maestros · Ingenio HUB" }] }),
  component: Page,
});

function Page() {
  return (
    <EnConstruccion
      titulo="Personal externo"
      descripcion="Personas de subcontratas, Propiedad u otras partes con acceso puntual a la plataforma."
    />
  );
}
