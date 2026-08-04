import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { AppShell } from "@/components/layout/AppShell";
import { itemsProyecto } from "@/components/layout/Sidebar";
import { KpiCard } from "@/components/shared/KpiCard";
import { getProyectoDetalle } from "@/lib/erp/inicio.functions";
import { diasHasta, fechaCorta, mesAnio, sumarMeses } from "@/lib/erp/formato";

export const Route = createFileRoute("/_authenticated/proyecto/$id/inicio")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Inicio de proyecto · Ingenio HUB" },
      { name: "description", content: "Resumen y datos generales de la obra en Ingenio HUB." },
      { property: "og:title", content: "Inicio de proyecto · Ingenio HUB" },
      {
        property: "og:description",
        content: "Resumen y datos generales de la obra en Ingenio HUB.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <div
        className="uppercase"
        style={{
          fontSize: "var(--text-xs)",
          fontWeight: 600,
          letterSpacing: "var(--tracking-wider)",
          color: "var(--text-muted)",
        }}
      >
        {etiqueta}
      </div>
      <div className="mt-1" style={{ fontSize: "var(--text-base)", color: "var(--text-primary)" }}>
        {valor}
      </div>
    </div>
  );
}

function Page() {
  const { id } = Route.useParams();
  const fetchDetalle = useServerFn(getProyectoDetalle);
  const { data: proyecto } = useQuery({
    queryKey: ["proyecto", id, "detalle"],
    queryFn: () => fetchDetalle({ data: { id } }),
  });

  const inicio = proyecto?.fechaInicioProyecto;
  const plazo = proyecto?.plazoEjecucionMeses;
  const fin = inicio && plazo ? sumarMeses(inicio, plazo) : null;
  const dias = fin ? diasHasta(fin) : null;

  const direccion =
    [
      [proyecto?.tipoVia, proyecto?.nombreVia, proyecto?.numero].filter(Boolean).join(" "),
      proyecto?.municipio,
      proyecto?.provincia,
    ]
      .filter(Boolean)
      .join(", ") || "—";

  return (
    <AppShell
      mode="proyecto"
      activeItem="inicio"
      items={itemsProyecto(id)}
      proyectoNombre={proyecto?.nombre ?? "—"}
      proyectoEstado={proyecto?.estado === "en_estudio" ? "En estudio" : "En ejecución"}
    >
      <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700 }}>Inicio</h1>
      <p className="mt-1" style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
        {[proyecto?.provincia, proyecto?.tipoObra].filter(Boolean).join(" · ") || "—"}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3 max-w-4xl">
        {/* TODO: sustituir estas tarjetas placeholder cuando exista el módulo de Control de Costes (Fase 8) */}
        <KpiCard titulo="Avance de obra" valor="—" subtitulo="Próximamente (Control de Costes)" proximamente />
        <KpiCard titulo="Coste ejecutado" valor="—" subtitulo="Próximamente (Control de Costes)" proximamente />
        <KpiCard
          titulo="Días para entrega"
          valor={dias ?? "—"}
          subtitulo={fin ? `Fin previsto ${mesAnio(fin)}` : "Pendiente de adjudicación"}
          proximamente={dias === null}
        />
      </div>

      <div
        className="mt-8 max-w-4xl"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "var(--radius-lg)",
          border: "var(--border-width-thin) solid var(--border-default)",
          boxShadow: "var(--shadow-xs)",
          padding: "var(--card-padding)",
        }}
      >
        <div
          style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--text-primary)" }}
        >
          Información del proyecto
        </div>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Dato
            etiqueta="Código de obra"
            valor={
              proyecto?.estado === "en_estudio" ? "Pendiente" : (proyecto?.codigoObra ?? "Pendiente")
            }
          />
          <Dato etiqueta="Tipo de obra" valor={proyecto?.tipoObra ?? "—"} />
          <Dato etiqueta="Dirección" valor={direccion} />
          <Dato
            etiqueta="Fecha de adjudicación"
            valor={proyecto?.fechaAdjudicacion ? fechaCorta(proyecto.fechaAdjudicacion) : "—"}
          />
          <Dato
            etiqueta="Plazo de ejecución"
            valor={plazo ? `${plazo} meses` : "—"}
          />
        </div>
      </div>
    </AppShell>
  );
}
