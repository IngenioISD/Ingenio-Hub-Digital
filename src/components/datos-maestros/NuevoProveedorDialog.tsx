import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DireccionObraFields, type DireccionObra } from "@/components/datos-maestros/DireccionObraFields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const TIPOS_PROVEEDOR = ["Material", "Mixto", "Servicios"] as const;

/** Mayúsculas, sin espacios, puntos ni guiones. */
export const normalizarNifProveedor = (v: string) => v.toUpperCase().replace(/[\s.\-]/g, "");

type Origen = "es" | "ext";
type Existente = { id: string; nombre_legal: string };
type Vinculo = { id: string; activo: boolean };

export function NuevoProveedorDialog() {
  const { usuarioCliente } = useAuth();
  const clienteId = usuarioCliente?.cliente_id;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const [origen, setOrigen] = useState<Origen | null>(null);
  const [nif, setNif] = useState("");
  const [comprobado, setComprobado] = useState(false);
  const [comprobando, setComprobando] = useState(false);
  const [existente, setExistente] = useState<Existente | null>(null);
  const [vinculo, setVinculo] = useState<Vinculo | null>(null);

  const [nombreLegal, setNombreLegal] = useState("");
  const [nombreComercial, setNombreComercial] = useState("");
  const [tipo, setTipo] = useState("");
  const [dir, setDir] = useState<DireccionObra>({});
  const [provinciaId, setProvinciaId] = useState<string | null>(null);
  const [provinciaTxt, setProvinciaTxt] = useState("");
  const [pais, setPais] = useState("");

  const reset = () => {
    setOrigen(null); setNif(""); setComprobado(false); setExistente(null); setVinculo(null);
    setNombreLegal(""); setNombreComercial(""); setTipo(""); setDir({});
    setProvinciaId(null); setProvinciaTxt(""); setPais("");
  };

  const nifValido = origen === "es" ? nif.length === 9 : nif.length > 0;

  const buscar = async () => {
    if (!nifValido || !clienteId) return;
    setComprobando(true);
    try {
      const { data, error } = await supabase
        .from("proveedor_subcontrata").select("id, nombre_legal").eq("nif", nif).maybeSingle();
      if (error) throw error;
      setExistente(data);
      let v: Vinculo | null = null;
      if (data) {
        const { data: cp, error: e2 } = await supabase
          .from("cliente_proveedores").select("id, activo")
          .eq("cliente_id", clienteId).eq("proveedor_id", data.id).maybeSingle();
        if (e2) throw e2;
        v = cp;
      }
      setVinculo(v);
      setComprobado(true);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setComprobando(false);
    }
  };

  const terminar = (msg: string) => {
    toast.success(msg);
    qc.invalidateQueries({ queryKey: ["datos-maestros", "proveedores"] });
    setOpen(false); reset();
  };

  const reactivar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("cliente_proveedores").update({ activo: true }).eq("id", vinculo!.id);
      if (error) throw error;
    },
    onSuccess: () => terminar("Proveedor reactivado"),
    onError: (e: Error) => toast.error(e.message),
  });

  const guardar = useMutation({
    mutationFn: async () => {
      if (!clienteId) throw new Error("Falta identificar tu empresa");
      let proveedorId = existente?.id ?? null;
      let comercial = nombreComercial.trim() || existente?.nombre_legal || "";

      if (!proveedorId) {
        const legal = nombreLegal.trim();
        if (!legal) throw new Error("El nombre legal es obligatorio");
        if (!tipo) throw new Error("El tipo de proveedor es obligatorio");
        if (origen === "ext" && !pais.trim()) throw new Error("El país es obligatorio");
        comercial = nombreComercial.trim() || legal;
        const { data, error } = await supabase
          .from("proveedor_subcontrata")
          .insert({
            nif,
            nombre_legal: legal,
            tipo_proveedor: tipo,
            tipo_via: dir.tipoVia || null,
            nombre_via: dir.via || null,
            numero: dir.numero || null,
            codigo_postal: dir.cp || null,
            municipio: dir.municipio || null,
            provincia_id: origen === "es" ? provinciaId : null,
            provincia: origen === "ext" ? provinciaTxt.trim() || null : null,
            pais: origen === "es" ? "España" : pais.trim(),
          })
          .select("id")
          .single();
        if (error) {
          if (error.code === "23505") throw new Error("Ya existe un proveedor con ese NIF.");
          throw error;
        }
        proveedorId = data.id;
      }

      const { error: errLink } = await supabase.from("cliente_proveedores").insert({
        cliente_id: clienteId,
        proveedor_id: proveedorId,
        nombre_comercial: comercial,
        activo: true,
      });
      if (errLink) {
        if (errLink.code === "23505") throw new Error("Este proveedor ya está en tu lista");
        throw errLink;
      }
    },
    onSuccess: () => terminar("Proveedor añadido"),
    onError: (e: Error) => toast.error(e.message),
  });

  const yaEnLista = comprobado && !!vinculo;
  const puedeGuardar = comprobado && !yaEnLista && !guardar.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" /> Nuevo proveedor</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nuevo proveedor</DialogTitle>
          <DialogDescription>
            Si el NIF ya existe en el sistema, solo lo vincularemos a tu empresa, sin duplicar sus datos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Origen *</Label>
            <div className="flex gap-2">
              {(["es", "ext"] as const).map((o) => (
                <Button
                  key={o}
                  type="button"
                  variant={origen === o ? "default" : "outline"}
                  onClick={() => { setOrigen(o); setNif(""); setComprobado(false); setExistente(null); setVinculo(null); }}
                >
                  {o === "es" ? "España" : "Extranjero"}
                </Button>
              ))}
            </div>
          </div>

          {origen && (
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label>NIF *</Label>
                <Input
                  value={nif}
                  onChange={(e) => {
                    const v = normalizarNifProveedor(e.target.value);
                    setNif(origen === "es" ? v.slice(0, 9) : v);
                    setComprobado(false); setExistente(null); setVinculo(null);
                  }}
                  placeholder={origen === "es" ? "B12345678" : "NIF / VAT"}
                  maxLength={origen === "es" ? 9 : undefined}
                />
                {origen === "es" && nif.length > 0 && !nifValido && (
                  <p className="text-xs text-muted-foreground">El NIF debe tener 9 caracteres ({nif.length} de 9).</p>
                )}
              </div>
              <Button type="button" variant="outline" onClick={buscar} disabled={!nifValido || comprobando}>
                Buscar
              </Button>
            </div>
          )}

          {yaEnLista && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-2">
              <p>Este proveedor ya está en tu lista{vinculo && !vinculo.activo ? " (está desactivado)." : "."}</p>
              {vinculo && !vinculo.activo && (
                <Button size="sm" onClick={() => reactivar.mutate()} disabled={reactivar.isPending}>Reactivar</Button>
              )}
            </div>
          )}

          {comprobado && existente && !vinculo && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              Ya existe: <span className="font-medium">{existente.nombre_legal}</span>. Solo hace falta el nombre comercial que le quieras dar en tu empresa.
            </div>
          )}

          {comprobado && !yaEnLista && (
            <>
              {!existente && (
                <div className="space-y-1.5">
                  <Label>Nombre legal *</Label>
                  <Input value={nombreLegal} onChange={(e) => setNombreLegal(e.target.value)} />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Nombre comercial</Label>
                <Input
                  value={nombreComercial}
                  onChange={(e) => setNombreComercial(e.target.value)}
                  placeholder="Si lo dejas vacío se usará el nombre legal"
                />
              </div>
              {!existente && (
                <div className="space-y-4 border-t pt-4">
                  <div className="space-y-1.5">
                    <Label>Tipo de proveedor *</Label>
                    <Select value={tipo} onValueChange={setTipo}>
                      <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                      <SelectContent>
                        {TIPOS_PROVEEDOR.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Dirección fiscal</Label>
                    {origen === "es" ? (
                      <DireccionObraFields value={dir} onChange={setDir} provinciaId={provinciaId} onProvinciaChange={setProvinciaId} />
                    ) : (
                      <>
                        <DireccionObraFields value={dir} onChange={setDir} />
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label>Provincia</Label>
                            <Input value={provinciaTxt} onChange={(e) => setProvinciaTxt(e.target.value)} />
                          </div>
                          <div className="space-y-1.5">
                            <Label>País *</Label>
                            <Input value={pais} onChange={(e) => setPais(e.target.value)} />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={() => guardar.mutate()} disabled={!puedeGuardar}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
