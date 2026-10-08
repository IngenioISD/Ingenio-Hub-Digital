import { createFileRoute } from "@tanstack/react-router";

import { EnConstruccion } from "@/components/datos-maestros/EnConstruccion";

export const Route = createFileRoute("/_authenticated/datos-maestros/accesos-equipo/usuarios")({
  head: () => ({ meta: [{ title: "Usuarios · Datos Maestros · Ingenio HUB" }] }),
  component: Page,
});

function Page() {
  return (
    <EnConstruccion
      titulo="Usuarios"
      descripcion="Quién, de Personal propio o externo, tiene acceso a la plataforma y con qué rol."
    />
  );
}
