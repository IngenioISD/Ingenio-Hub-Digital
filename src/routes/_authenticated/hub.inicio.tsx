import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { AppShell } from "@/components/layout/AppShell";
import { KpiCard } from "@/components/shared/KpiCard";
import { BadgeEstado } from "@/components/shared/BadgeEstado";
import { getProyectosInicio, type ProyectoInicio } from "@/lib/erp/inicio.functions";
import { fechaLarga, formatoEuros } from "@/lib/erp/formato";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/hub/inicio")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Inicio · Ingenio HUB" },
      {
        name: "description",
        content: "Resumen de proyectos, presupuesto previsto y estado de obra en Ingenio HUB.",
      },
      { property: "og:title", content: "Inicio · Ingenio HUB" },
      {
        property: "og:description",
        content: "Resumen de proyectos, presupuesto previsto y estado de obra en Ingenio HUB.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const TODAS = "__todas__";

function opciones(valores: (string | null)[]): string[] {
  return [...new Set(valores.filter((v): v is string => Boolean(v)))].sort((a, b) =>
    a.localeCompare(b, "es"),
  );
}

function Page() {
  const fetchProyectos = useServerFn(getProyectosInicio);
  const { data } = useQuery({
    queryKey: ["hub", "proyectos-inicio"],
    queryFn: () => fetchProyectos(),
  });
  const proyectos: ProyectoInicio[] = data ?? [];

  const [propiedad, setPropiedad] = useState(TODAS);
  const [region, setRegion] = useState(TODAS);
  const [tipo, setTipo] = useState(TODAS);

  const hoy = useMemo(() => fechaLarga(new Date()), []);

  const filtrados = proyectos.filter(
    (p) =>
      (propiedad === TODAS || p.propiedadNombre === propiedad) &&
      (region === TODAS || p.provincia === region) &&
      (tipo === TODAS || p.tipoObra === tipo),
  );

  const activos = filtrados.filter((p) => p.estado === "adjudicado").length;
  const enEstudio = filtrados.filter((p) => p.estado === "en_estudio").length;
  const presupuesto = filtrados.reduce((acc, p) => acc + (p.presupuestoVenta ?? 0), 0);

  return (
    <AppShell mode="direccion" contexto="hub" activeItem="inicio">
      <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700 }}>Inicio</h1>
      <p className="mt-1" style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
        {hoy}
      </p>

      {/* Filtros */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3 max-w-3xl">
        <Select value={propiedad} onValueChange={setPropiedad}>
          <SelectTrigger aria-label="Propiedad">
            <SelectValue placeholder="Todas las propiedades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS}>Todas las propiedades</SelectItem>
            {opciones(proyectos.map((p) => p.propiedadNombre)).map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={region} onValueChange={setRegion}>
          <SelectTrigger aria-label="Región">
            <SelectValue placeholder="Todas las regiones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS}>Todas las regiones</SelectItem>
            {opciones(proyectos.map((p) => p.provincia)).map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger aria-label="Tipo de proyecto">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS}>Todos los tipos</SelectItem>
            {opciones(proyectos.map((p) => p.tipoObra)).map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          titulo="Proyectos Activos"
          valor={activos}
          subtitulo={`${enEstudio} en estudio`}
        />
        <KpiCard
          titulo="Presupuesto Total Previsto"
          valor={presupuesto > 0 ? formatoEuros(presupuesto) : "—"}
          subtitulo={presupuesto > 0 ? undefined : "Sin datos de presupuesto todavía"}
          proximamente={presupuesto <= 0}
        />
        {/* TODO: sustituir estas tarjetas placeholder cuando exista el módulo de Control de Costes (Fase 8) */}
        <KpiCard titulo="Coste Ejecutado" valor="—" subtitulo="Próximamente (Control de Costes)" proximamente />
        <KpiCard
          titulo="Avance Medio de Obra"
          valor="—"
          subtitulo="Próximamente (Control de Costes)"
          proximamente
        />
      </div>

      {/* Tabla de proyectos */}
      <div className="table-wrapper mt-8">
        <table className="table">
          <thead>
            <tr>
              <th>Proyecto</th>
              <th>Propiedad</th>
              <th>Tipo</th>
              <th>Región</th>
              <th>Presupuesto de venta estimado</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.slice(0, 50).map((p) => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                <td>{p.propiedadNombre ?? "—"}</td>
                <td>{p.tipoObra ?? "—"}</td>
                <td>{p.provincia ?? "—"}</td>
                <td>{p.presupuestoVenta ? formatoEuros(p.presupuestoVenta) : "—"}</td>
                <td>
                  <BadgeEstado estado={p.estado} />
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={6} style={{ color: "var(--text-muted)" }}>
                  No hay proyectos que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
