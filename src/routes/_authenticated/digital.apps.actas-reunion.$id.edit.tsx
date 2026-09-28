import { createFileRoute } from "@tanstack/react-router";

import { ActaForm } from "@/components/actas/ActaForm";
import { GuardActas } from "@/components/actas/GuardActas";
import { LayoutActas } from "@/components/actas/LayoutActas";

export const Route = createFileRoute("/_authenticated/digital/apps/actas-reunion/$id/edit")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Editar acta de reunión · Ingenio Digital" },
      { name: "description", content: "Modifica los datos, asistentes y firma de un acta." },
      { property: "og:title", content: "Editar acta de reunión · Ingenio Digital" },
      {
        property: "og:description",
        content: "Modifica los datos, asistentes y firma de un acta.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function Page() {
  const { id } = Route.useParams();
  return (
    <GuardActas>
      <LayoutActas subtitulo="Editar acta">
        <ActaForm actaId={id} />
      </LayoutActas>
    </GuardActas>
  );
}
