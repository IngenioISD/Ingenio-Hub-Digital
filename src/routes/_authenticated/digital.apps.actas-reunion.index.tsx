import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ArrowUpDown, FileText, Plus } from "lucide-react";

import { LayoutActas } from "@/components/actas/LayoutActas";
import { BadgeEstadoActa, BadgeTipoReunion } from "@/components/actas/BadgesActa";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePermisosActas } from "@/hooks/use-permisos-actas";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatoFechaHora } from "@/lib/actas/actas";

export const Route = createFileRoute("/_authenticated/digital/apps/actas-reunion/")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Actas de Reunión · Ingenio Digital" },
      {
        name: "description",
        content: "Consulta, crea y comparte las actas de reunión de tus obras.",
      },
      { property: "og:title", content: "Actas de Reunión · Ingenio Digital" },
      {
        property: "og:description",
        content: "Consulta, crea y comparte las actas de reunión de tus obras.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type ActaLista = {
  id: string;
  asunto: string;
  lugar: string;
  fecha_reunion: string;
  tipo_reunion: string;
  tipo_otro_descripcion: string | null;
  tipoEtiqueta: string;
  estado: string;
  proyecto_id: string | null;
  proyectoNombre: string;
};

type TipoReunion = {
  codigo: string;
  etiqueta: string;
};

type Filtro = "todas" | "generada" | "borrador";

type SortKey = "asunto" | "proyecto" | "fecha" | "lugar" | "tipo" | "estado";
type SortDirection = "asc" | "desc" | null;

const FILTROS: { valor: Filtro; etiqueta: string }[] = [
  { valor: "todas", etiqueta: "Todas" },
  { valor: "generada", etiqueta: "Generadas" },
  { valor: "borrador", etiqueta: "Borradores" },
];

const TODOS_LOS_TIPOS = "__todos__";

const COLUMNAS: { key: SortKey; label: string }[] = [
  { key: "asunto", label: "Asunto" },
  { key: "proyecto", label: "Proyecto" },
  { key: "fecha", label: "Fecha" },
  { key: "lugar", label: "Lugar" },
  { key: "tipo", label: "Tipo" },
  { key: "estado", label: "Estado" },
];

function Page() {
  const { usuarioCliente } = useAuth();
  const { puedeEditar } = usePermisosActas();
  const isMobile = useIsMobile();
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [filtroTipo, setFiltroTipo] = useState<string>(TODOS_LOS_TIPOS);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  const { data: { actas = [], tipos = [] } = {}, isLoading } = useQuery<{
    actas: ActaLista[];
    tipos: TipoReunion[];
  }>({
    queryKey: ["actas", "listado", usuarioCliente?.cliente_id],
    enabled: !!usuarioCliente?.cliente_id,
    queryFn: async () => {
      let proyectoIds: string[] | null = null;
      if (!usuarioCliente!.acceso_total_proyectos) {
        const { data } = await supabase
          .from("usuario_proyectos")
          .select("proyecto_id")
          .eq("user_id", usuarioCliente!.user_id)
          .eq("activo", true);
        proyectoIds = (data ?? []).map((f) => f.proyecto_id);
      }

      let consulta = supabase
        .from("actas")
        .select("id, asunto, lugar, fecha_reunion, tipo_reunion, tipo_otro_descripcion, estado, proyecto_id")
        .eq("cliente_id", usuarioCliente!.cliente_id)
        .order("fecha_reunion", { ascending: false });
      if (proyectoIds) {
        if (proyectoIds.length === 0) return { actas: [], tipos: [] };
        consulta = consulta.in("proyecto_id", proyectoIds);
      }

      const { data: filas } = await consulta;
      const ids = [...new Set((filas ?? []).map((f) => f.proyecto_id).filter(Boolean))] as string[];
      const nombres = new Map<string, string>();
      if (ids.length) {
        const { data: proyectos } = await supabase
          .from("proyectos")
          .select("id, nombre")
          .in("id", ids);
        for (const p of proyectos ?? []) nombres.set(p.id, p.nombre);
      }

      const { data: tiposRows } = await supabase
        .from("catalogo")
        .select("codigo, etiqueta")
        .eq("categoria", "tipo_reunion")
        .order("orden", { ascending: true });
      const etiquetasTipo = new Map((tiposRows ?? []).map((t) => [t.codigo, t.etiqueta]));

      const actasLista = (filas ?? []).map((f) => ({
        ...f,
        proyectoNombre: f.proyecto_id ? (nombres.get(f.proyecto_id) ?? "—") : "—",
        tipoEtiqueta: etiquetasTipo.get(f.tipo_reunion) ?? f.tipo_reunion,
      })) as ActaLista[];

      return {
        actas: actasLista,
        tipos: (tiposRows ?? []) as TipoReunion[],
      };
    },
  });

  const visibles = useMemo(() => {
    let rows = filtro === "todas" ? actas : actas.filter((a) => a.estado === filtro);
    if (filtroTipo !== TODOS_LOS_TIPOS) {
      rows = rows.filter((a) => a.tipo_reunion === filtroTipo);
    }
    if (sortKey && sortDir) {
      rows = [...rows].sort((a, b) => {
        let result = 0;
        switch (sortKey) {
          case "asunto":
            result = a.asunto.localeCompare(b.asunto, "es");
            break;
          case "proyecto":
            result = a.proyectoNombre.localeCompare(b.proyectoNombre, "es");
            break;
          case "fecha":
            result = new Date(a.fecha_reunion).getTime() - new Date(b.fecha_reunion).getTime();
            break;
          case "lugar":
            result = a.lugar.localeCompare(b.lugar, "es");
            break;
          case "tipo":
            result = a.tipoEtiqueta.localeCompare(b.tipoEtiqueta, "es");
            break;
          case "estado":
            result = a.estado.localeCompare(b.estado, "es");
            break;
        }
        return sortDir === "asc" ? result : -result;
      });
    }
    return rows;
  }, [actas, filtro, filtroTipo, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
      setSortDir(null);
    }
  }

  return (
    <LayoutActas subtitulo="Listado de actas">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f) => {
            const activo = filtro === f.valor;
            return (
              <button
                key={f.valor}
                type="button"
                className="btn btn-sm"
                style={
                  activo
                    ? {
                        backgroundColor: "var(--brand-navy-deep)",
                        color: "var(--brand-lime)",
                        borderColor: "var(--brand-navy-deep)",
                      }
                    : {
                        backgroundColor: "var(--bg-surface)",
                        color: "var(--text-secondary)",
                        border: "var(--border-width-thin) solid var(--border-default)",
                      }
                }
                onClick={() => setFiltro(f.valor)}
              >
                {f.etiqueta}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-44 bg-(--bg-surface)">
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS_LOS_TIPOS}>Todos los tipos</SelectItem>
              {tipos.map((t) => (
                <SelectItem key={t.codigo} value={t.codigo}>
                  {t.etiqueta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {puedeEditar ? (
            <Link
              to="/digital/apps/actas-reunion/new"
              className="btn"
              style={{
                backgroundColor: "var(--brand-navy-deep)",
                color: "var(--brand-lime)",
                borderColor: "var(--brand-navy-deep)",
              }}
            >
              <Plus size={16} /> Nueva acta
            </Link>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <p className="mt-6" style={{ color: "var(--text-secondary)" }}>
          Cargando actas…
        </p>
      ) : visibles.length === 0 ? (
        <div
          className="mt-6 flex flex-col items-center gap-2 p-10 text-center"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "var(--border-width-thin) solid var(--border-default)",
            borderRadius: "var(--radius-lg)",
            color: "var(--text-secondary)",
          }}
        >
          <FileText size={28} />
          <span>No hay actas para este filtro.</span>
        </div>
      ) : isMobile ? (
        <div className="mt-5 flex flex-col gap-3">
          {visibles.map((acta) => (
            <Link
              key={acta.id}
              to="/digital/apps/actas-reunion/$id"
              params={{ id: acta.id }}
              className="block p-4"
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "var(--border-width-thin) solid var(--border-default)",
                borderRadius: "var(--radius-lg)",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{acta.asunto}</span>
                <BadgeEstadoActa estado={acta.estado} />
              </div>
              <div className="mt-1" style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                {acta.proyectoNombre} · {formatoFechaHora(acta.fecha_reunion)}
              </div>
              <div className="mt-2">
                <BadgeTipoReunion
                  codigo={acta.tipo_reunion}
                  etiqueta={
                    (acta.tipo_reunion === "otra" || acta.tipo_reunion === "otro") && acta.tipo_otro_descripcion
                      ? `Otra (${acta.tipo_otro_descripcion})`
                      : acta.tipoEtiqueta
                  }
                />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div
          className="mt-5 overflow-hidden"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "var(--border-width-thin) solid var(--border-default)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <table className="table w-full">
            <thead>
              <tr>
                {COLUMNAS.map(({ key, label }) => {
                  const active = sortKey === key;
                  const Icon = active
                    ? sortDir === "asc"
                      ? ArrowUp
                      : ArrowDown
                    : ArrowUpDown;
                  return (
                    <th
                      key={key}
                      aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                    >
                      <Button
                        variant="ghost"
                        className="h-auto w-full justify-start gap-1 p-0 text-xs font-semibold"
                        onClick={() => handleSort(key)}
                      >
                        {label}
                        <Icon className="size-3.5" aria-hidden="true" />
                      </Button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visibles.map((acta) => (
                <tr key={acta.id}>
                  <td>
                    <Link
                      to="/digital/apps/actas-reunion/$id"
                      params={{ id: acta.id }}
                      style={{ fontWeight: 600, color: "var(--text-primary)" }}
                    >
                      {acta.asunto}
                    </Link>
                  </td>
                  <td>{acta.proyectoNombre}</td>
                  <td>{formatoFechaHora(acta.fecha_reunion)}</td>
                  <td>{acta.lugar}</td>
                  <td>
                    <BadgeTipoReunion
                      codigo={acta.tipo_reunion}
                      etiqueta={
                        (acta.tipo_reunion === "otra" || acta.tipo_reunion === "otro") && acta.tipo_otro_descripcion
                          ? `Otra (${acta.tipo_otro_descripcion})`
                          : acta.tipoEtiqueta
                      }
                    />
                  </td>
                  <td>
                    <BadgeEstadoActa estado={acta.estado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </LayoutActas>
  );
}
