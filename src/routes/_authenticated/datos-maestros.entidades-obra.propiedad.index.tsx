import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePermisosDatosMaestros } from "@/hooks/use-permisos-datos-maestros";

import { NuevaPropiedadDialog } from "@/components/datos-maestros/NuevaPropiedadDialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/datos-maestros/entidades-obra/propiedad/")({
  head: () => ({ meta: [{ title: "Propiedad · Datos Maestros · Ingenio HUB" }] }),
  component: Page,
});

interface Row {
  id: string; // clientes_propiedades.id
  propiedadId: string;
  nombreComercial: string | null;
  nombreLegal: string;
  nif: string;
  activo: boolean;
}

function Page() {
  return <PropiedadListado />;
}

function PropiedadListado() {
  const { usuarioCliente } = useAuth();
  const { puedeCrear, puedeEditar, puedeEliminar } = usePermisosDatosMaestros();
  const clienteId = usuarioCliente?.cliente_id;
  const qc = useQueryClient();
  const queryKey = ["datos-maestros", "propiedades", clienteId] as const;

  const [q, setQ] = useState("");

  const { data: proyectosPorPropiedad = new Map<string, string[]>() } = useQuery({
    queryKey: ["datos-maestros", "propiedades-proyectos-en-ejecucion", clienteId],
    enabled: !!clienteId,
    queryFn: async () => {
      if (!clienteId) throw new Error("Falta identificar tu empresa");
      const { data, error } = await supabase
        .from("proyectos")
        .select("id, nombre, propiedad_id")
        .eq("cliente_id", clienteId)
        .eq("estado", "adjudicado");
      if (error) throw error;
      const agrupados = new Map<string, string[]>();
      for (const proyecto of data ?? []) {
        const nombres = agrupados.get(proyecto.propiedad_id) ?? [];
        nombres.push(proyecto.nombre);
        agrupados.set(proyecto.propiedad_id, nombres);
      }
      return agrupados;
    },
  });

  const { data = [], isLoading } = useQuery({
    queryKey,
    enabled: !!clienteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes_propiedades")
        .select("id, propiedad_id, nombre_comercial, activo, propiedad(nif, nombre_legal)")
        .eq("cliente_id", clienteId!);
      if (error) throw error;
      return (data ?? []).map((r): Row => {
        const p = Array.isArray(r.propiedad) ? r.propiedad[0] : r.propiedad;
        return {
          id: r.id,
          propiedadId: r.propiedad_id,
          nombreComercial: r.nombre_comercial,
          nombreLegal: p?.nombre_legal ?? "",
          nif: p?.nif ?? "",
          activo: r.activo,
        };
      });
    },
  });

  const filtradas = data
    .filter((r) => {
      if (!q) return true;
      const term = q.toLowerCase();
      return (
        (r.nombreComercial ?? "").toLowerCase().includes(term) ||
        r.nombreLegal.toLowerCase().includes(term) ||
        r.nif.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => (a.nombreComercial || a.nombreLegal).localeCompare(b.nombreComercial || b.nombreLegal));

  const toggle = useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const { error } = await supabase.from("clientes_propiedades").update({ activo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
    onError: (e: Error) => toast.error(e.message),
  });

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clientes_propiedades").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey }); toast.success("Propiedad desvinculada"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Propiedad</h1>
          <p className="text-sm text-muted-foreground">Propiedades de tu empresa.</p>
        </div>
        {puedeCrear && <NuevaPropiedadDialog />}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por nombre o NIF…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre comercial</TableHead>
              <TableHead>NIF</TableHead>
              <TableHead>Proyectos en ejecución</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Cargando…</TableCell></TableRow>}
            {!isLoading && filtradas.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sin resultados</TableCell></TableRow>}
            {filtradas.map((r) => {
              const proyectos = proyectosPorPropiedad.get(r.propiedadId) ?? [];
              return (
              <TableRow key={r.id} className={r.activo ? undefined : "hover:bg-transparent"}>
                <TableCell className={`font-medium ${r.activo ? "" : "opacity-50"}`}>
                  {r.activo ? (
                    <Link to="/datos-maestros/entidades-obra/propiedad/$id" params={{ id: r.propiedadId }} className="hover:underline">
                      {r.nombreComercial || r.nombreLegal}
                    </Link>
                  ) : (
                    <span>{r.nombreComercial || r.nombreLegal}</span>
                  )}
                </TableCell>
                <TableCell className={r.activo ? undefined : "opacity-50"}>{r.nif}</TableCell>
                <TableCell
                  className={r.activo ? undefined : "opacity-50"}
                  title={proyectos.length > 1 ? proyectos.join("\n") : undefined}
                >
                  {proyectos.length === 1 ? proyectos[0] : proyectos.length > 1 ? `${proyectos.length} proyectos` : ""}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={r.activo}
                    disabled={!puedeEditar}
                    onCheckedChange={(activo) => toggle.mutate({ id: r.id, activo })}
                  />
                </TableCell>
                <TableCell className="text-right">
                  {puedeEliminar && (
                    <Button size="icon" variant="ghost" onClick={() => eliminar.mutate(r.id)} aria-label="Desvincular">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
