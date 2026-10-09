import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePermisosDatosMaestros } from "@/hooks/use-permisos-datos-maestros";
import { NuevoProveedorDialog, TIPOS_PROVEEDOR, etiquetaTipoProveedor, normalizarNifProveedor } from "@/components/datos-maestros/NuevoProveedorDialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/datos-maestros/entidades-obra/proveedores/")({
  head: () => ({ meta: [{ title: "Proveedores · Datos Maestros · Ingenio HUB" }] }),
  component: ProveedoresListado,
});

interface Row {
  id: string;
  proveedorId: string;
  nombre: string;
  nif: string;
  tipo: string | null;
  municipio: string | null;
  activo: boolean;
}

const normalizar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

function ProveedoresListado() {
  const { usuarioCliente } = useAuth();
  const { puedeCrear, puedeEditar, puedeEliminar } = usePermisosDatosMaestros();
  const clienteId = usuarioCliente?.cliente_id;
  const qc = useQueryClient();
  const navigate = useNavigate();
  const queryKey = ["datos-maestros", "proveedores", clienteId] as const;

  const [q, setQ] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");

  const { data = [], isLoading } = useQuery({
    queryKey,
    enabled: !!clienteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cliente_proveedores")
        .select("id, proveedor_id, nombre_comercial, activo, proveedor_subcontrata(nif, nombre_legal, tipo_proveedor, municipio)")
        .eq("cliente_id", clienteId!);
      if (error) throw error;
      return (data ?? []).map((r): Row => {
        const p = Array.isArray(r.proveedor_subcontrata) ? r.proveedor_subcontrata[0] : r.proveedor_subcontrata;
        return {
          id: r.id,
          proveedorId: r.proveedor_id,
          nombre: r.nombre_comercial?.trim() || p?.nombre_legal || "",
          nif: p?.nif ?? "",
          tipo: p?.tipo_proveedor ?? null,
          municipio: p?.municipio ?? null,
          activo: r.activo,
        };
      });
    },
  });

  const term = normalizar(q);
  const termNif = normalizarNifProveedor(q);
  const filtradas = data
    .filter((r) => tipoFiltro === "todos" || (r.tipo ?? "").toLowerCase() === tipoFiltro.toLowerCase())
    .filter((r) => !term || normalizar(r.nombre).includes(term) || (!!termNif && r.nif.includes(termNif)))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const toggle = useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const { error } = await supabase.from("cliente_proveedores").update({ activo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
    onError: (e: Error) => toast.error(e.message),
  });

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cliente_proveedores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey }); toast.success("Proveedor quitado de tu lista"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-sm text-muted-foreground">Proveedores de tu empresa.</p>
        </div>
        {puedeCrear && <NuevoProveedorDialog />}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nombre o NIF…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {TIPOS_PROVEEDOR.map((t) => <SelectItem key={t.codigo} value={t.codigo}>{t.etiqueta}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre comercial</TableHead>
              <TableHead>NIF</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Municipio</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Cargando…</TableCell></TableRow>}
            {!isLoading && filtradas.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sin resultados</TableCell></TableRow>}
            {filtradas.map((r) => {
              const tenue = r.activo ? "" : "opacity-50";
              return (
                <TableRow
                  key={r.id}
                  className={r.activo ? "cursor-pointer" : "hover:bg-transparent"}
                  onClick={r.activo ? () => navigate({ to: "/datos-maestros/entidades-obra/proveedores/$id", params: { id: r.proveedorId } }) : undefined}
                >
                  <TableCell className={`font-medium ${tenue}`}>{r.nombre}</TableCell>
                  <TableCell className={tenue}>{r.nif}</TableCell>
                  <TableCell className={tenue}>{r.tipo ? etiquetaTipoProveedor(r.tipo) : ""}</TableCell>
                  <TableCell className={tenue}>{r.municipio ?? ""}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={r.activo}
                      disabled={!puedeEditar}
                      onCheckedChange={(activo) => toggle.mutate({ id: r.id, activo })}
                    />
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
