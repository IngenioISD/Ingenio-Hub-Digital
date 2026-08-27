import { createFileRoute } from "@tanstack/react-router";

import { ActaForm } from "@/components/actas/ActaForm";
import { LayoutActas } from "@/components/actas/LayoutActas";

export const Route = createFileRoute("/_authenticated/digital/apps/actas-reunion/new")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Nueva acta de reunión · Ingenio Digital" },
      { name: "description", content: "Crea un acta de reunión de obra con firma e imágenes." },
      { property: "og:title", content: "Nueva acta de reunión · Ingenio Digital" },
      {
        property: "og:description",
        content: "Crea un acta de reunión de obra con firma e imágenes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function Page() {
  return (
    <LayoutActas subtitulo="Nueva acta">
      <ActaForm />
    </LayoutActas>
  );
}
