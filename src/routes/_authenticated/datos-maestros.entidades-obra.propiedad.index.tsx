import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePermisosDatosMaestros } from "@/hooks/use-permisos-datos-maestros";

import { DireccionObraFields, type DireccionObra } from "@/components/datos-maestros/DireccionObraFields";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/datos-maestros/entidades-obra/propiedad/")({
  head: () => ({ meta: [{ title: "Propiedad · Datos Maestros · Ingenio HUB" }] }),
  component: Page,
});

const NIF_LONGITUD = 9;
/** Mayúsculas y solo letras/números (quita espacios y guiones), máximo 9. */
const normalizarNif = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, NIF_LONGITUD);

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

function NuevaPropiedadDialog() {
  const { usuarioCliente } = useAuth();
  const clienteId = usuarioCliente?.cliente_id;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const [nif, setNif] = useState("");
  const [comprobado, setComprobado] = useState(false);
  const [existente, setExistente] = useState<{ id: string; nombre_legal: string | null } | null>(null);
  const [comprobando, setComprobando] = useState(false);

  const [nombreLegal, setNombreLegal] = useState("");
  const [nombreComercial, setNombreComercial] = useState("");
  const [dirObra, setDirObra] = useState<DireccionObra>({});
  const [provinciaId, setProvinciaId] = useState<string | null>(null);
  const [errorNombres, setErrorNombres] = useState<string | null>(null);

  const reset = () => {
    setNif(""); setComprobado(false); setExistente(null);
    setNombreLegal(""); setNombreComercial(""); setDirObra({}); setProvinciaId(null);
    setErrorNombres(null);
  };

  const nifValido = nif.length === NIF_LONGITUD;

  const comprobarNif = async () => {
    if (!nifValido) return;
    setComprobando(true);
    try {
      const { data, error } = await supabase
        .from("propiedad")
        .select("id, nombre_legal")
        .eq("nif", nif.trim())
        .maybeSingle();
      if (error) throw error;
      setExistente(data);
      setComprobado(true);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setComprobando(false);
    }
  };

  const crear = useMutation({
    mutationFn: async () => {
      if (!clienteId) throw new Error("Falta identificar tu empresa");
      if (!nifValido) throw new Error(`El NIF debe tener ${NIF_LONGITUD} caracteres`);

      let propiedadId = existente?.id ?? null;
      // Si no se escribe nombre comercial, se usa el legal (el de la propiedad ya existente, o el que se está creando).
      let comercialParaCliente: string = nombreComercial.trim() || existente?.nombre_legal || "";

      if (!propiedadId) {
        const legal = nombreLegal.trim();
        const comercial = nombreComercial.trim();
        if (!legal && !comercial) {
          throw new Error("Indica el nombre legal o el nombre comercial");
        }
        // Si solo se rellena el legal, se copia también al comercial.
        // Si solo se rellena el comercial, el legal se queda en blanco.
        comercialParaCliente = comercial || legal;

        const { data: nueva, error: errNueva } = await supabase
          .from("propiedad")
          .insert({
            nif: nif.trim(),
            nombre_legal: legal || null,
            tipo_via: dirObra.tipoVia || null,
            nombre_via: dirObra.via || null,
            numero: dirObra.numero || null,
            codigo_postal: dirObra.cp || null,
            municipio: dirObra.municipio || null,
            provincia_id: provinciaId,
          })
          .select("id")
          .single();
        if (errNueva) throw errNueva;
        propiedadId = nueva.id;
      }

      const { data: yaVinculada, error: errCheck } = await supabase
        .from("clientes_propiedades")
        .select("id")
        .eq("cliente_id", clienteId)
        .eq("propiedad_id", propiedadId)
        .maybeSingle();
      if (errCheck) throw errCheck;
      if (yaVinculada) throw new Error("Esta propiedad ya está vinculada a tu empresa.");

      const { error: errLink } = await supabase.from("clientes_propiedades").insert({
        cliente_id: clienteId,
        propiedad_id: propiedadId,
        nombre_comercial: comercialParaCliente,
        activo: true,
      });
      if (errLink) throw errLink;
    },
    onSuccess: () => {
      toast.success("Propiedad añadida");
      qc.invalidateQueries({ queryKey: ["datos-maestros", "propiedades"] });
      setOpen(false); reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" /> Nueva propiedad</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva propiedad</DialogTitle>
          <DialogDescription>
            Si el NIF ya existe en el sistema (otra constructora ya trabaja con ella), solo vincularemos tu empresa, sin duplicar sus datos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label>NIF *</Label>
              <Input
                value={nif}
                onChange={(e) => { setNif(normalizarNif(e.target.value)); setComprobado(false); setExistente(null); }}
                placeholder="B12345678"
                maxLength={NIF_LONGITUD}
              />
              {nif.length > 0 && !nifValido && (
                <p className="text-xs text-muted-foreground">
                  El NIF debe tener {NIF_LONGITUD} caracteres ({nif.length} de {NIF_LONGITUD}).
                </p>
              )}
            </div>
            <Button type="button" variant="outline" onClick={comprobarNif} disabled={!nifValido || comprobando}>
              Comprobar
            </Button>
          </div>

          {comprobado && existente && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              Ya existe: <span className="font-medium">{existente.nombre_legal}</span>. Solo hace falta el nombre comercial que le quieras dar en tu empresa.
            </div>
          )}

          {comprobado && (
            <>
              <div className="space-y-1.5">
                <Label>Nombre comercial</Label>
                <Input
                  value={nombreComercial}
                  onChange={(e) => setNombreComercial(e.target.value)}
                  placeholder={existente ? "Como la llamáis internamente (opcional)" : "Como la llamáis internamente"}
                />
              </div>

              {!existente && (
                <div className="space-y-4 border-t pt-4">
                  <p className="text-xs text-muted-foreground">
                    Rellena al menos uno de los dos nombres. Si solo pones el legal, se copiará también como comercial.
                  </p>
                  {errorNombres && <p className="text-xs font-medium text-destructive">{errorNombres}</p>}
                  <div className="space-y-1.5">
                    <Label>Nombre legal</Label>
                    <Input value={nombreLegal} onChange={(e) => setNombreLegal(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Dirección</Label>
                    <DireccionObraFields
                      value={dirObra}
                      onChange={setDirObra}
                      provinciaId={provinciaId}
                      onProvinciaChange={setProvinciaId}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            onClick={() => {
              if (!existente && !nombreLegal.trim() && !nombreComercial.trim()) {
                setErrorNombres("Indica al menos el nombre legal o el nombre comercial.");
                return;
              }
              setErrorNombres(null);
              crear.mutate();
            }}
            disabled={!comprobado || crear.isPending}
          >
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
