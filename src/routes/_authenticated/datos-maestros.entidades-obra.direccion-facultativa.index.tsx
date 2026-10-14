import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePermisosDatosMaestros } from "@/hooks/use-permisos-datos-maestros";
import { normalizarNif } from "@/components/datos-maestros/NuevaPropiedadDialog";
import { NuevaDireccionFacultativaDialog } from "@/components/datos-maestros/NuevaDireccionFacultativaDialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/datos-maestros/entidades-obra/direccion-facultativa/")({
  head: () => ({ meta: [{ title: "Dirección Facultativa · Datos Maestros · Ingenio HUB" }] }),
  component: DFListado,
});

interface Row {
  id: string;
  dfId: string;
  nombre: string;
  nif: string;
  activo: boolean;
}

const normalizar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

function DFListado() {
  const { usuarioCliente } = useAuth();
  const { puedeCrear, puedeEditar, puedeEliminar } = usePermisosDatosMaestros();
  const clienteId = usuarioCliente?.cliente_id;
  const qc = useQueryClient();
  const navigate = useNavigate();
  const queryKey = ["datos-maestros", "direccion-facultativa", clienteId] as const;
  const [q, setQ] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey,
    enabled: !!clienteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cliente_direccion_facultativa")
        .select("id, direccion_facultativa_id, activo, direccion_facultativa(nif, nombre_legal)")
        .eq("cliente_id", clienteId!);
      if (error) throw error;
      return (data ?? []).map((r): Row => {
        const d = Array.isArray(r.direccion_facultativa) ? r.direccion_facultativa[0] : r.direccion_facultativa;
        return { id: r.id, dfId: r.direccion_facultativa_id, nombre: d?.nombre_legal ?? "", nif: d?.nif ?? "", activo: r.activo };
      });
    },
  });

  const term = normalizar(q);
  const termNif = normalizarNif(q);
  const filtradas = data
    .filter((r) => !term || normalizar(r.nombre).includes(term) || (!!termNif && r.nif.includes(termNif)))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const toggle = useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const { error } = await supabase.from("cliente_direccion_facultativa").update({ activo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
    onError: (e: Error) => toast.error(e.message),
  });

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cliente_direccion_facultativa").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey }); toast.success("Dirección Facultativa quitada de tu lista"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Listado de Dirección Facultativa</h1>
          <p className="text-sm text-muted-foreground">{"\n"}</p>
        </div>
        {puedeCrear && <NuevaDireccionFacultativaDialog />}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por nombre o NIF…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>NIF</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Cargando…</TableCell></TableRow>}
            {!isLoading && filtradas.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Sin resultados</TableCell></TableRow>}
            {filtradas.map((r) => {
              const tenue = r.activo ? "" : "opacity-50";
              return (
                <TableRow
                  key={r.id}
                  className={r.activo ? "cursor-pointer" : "hover:bg-transparent"}
                  onClick={r.activo ? () => navigate({ to: "/datos-maestros/entidades-obra/direccion-facultativa/$id", params: { id: r.dfId } }) : undefined}
                >
                  <TableCell className={`font-medium ${tenue}`}>{r.nombre}</TableCell>
                  <TableCell className={tenue}>{r.nif}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Switch checked={r.activo} disabled={!puedeEditar} onCheckedChange={(activo) => toggle.mutate({ id: r.id, activo })} />
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    {puedeEliminar && (
                      <Button size="icon" variant="ghost" onClick={() => eliminar.mutate(r.id)} aria-label="Quitar de mi lista">
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
