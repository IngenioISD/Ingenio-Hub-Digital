import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DireccionObraFields, type DireccionObra } from "@/components/datos-maestros/DireccionObraFields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const NIF_LONGITUD = 9;
/** Mayúsculas y solo letras/números (quita espacios, puntos y guiones), máximo 9. */
export const normalizarNif = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, NIF_LONGITUD);

export interface PropiedadCreada {
  id: string;
  nif: string;
  nombre_legal: string | null;
  nombre_comercial: string;
}

/**
 * Diálogo de alta de propiedad (comprobación de NIF, vinculación si ya existe,
 * reglas de nombre legal/comercial y dirección). Compartido entre el listado
 * de Propiedad y el alta de proyecto.
 */
export function NuevaPropiedadDialog({
  trigger,
  onCreated,
}: {
  trigger?: ReactNode;
  onCreated?: (p: PropiedadCreada) => void;
} = {}) {
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
      return {
        id: propiedadId,
        nif: nif.trim(),
        nombre_legal: existente ? existente.nombre_legal : nombreLegal.trim() || null,
        nombre_comercial: comercialParaCliente,
      } as PropiedadCreada;
    },
    onSuccess: (creada) => {
      onCreated?.(creada);
      toast.success("Propiedad añadida");
      qc.invalidateQueries({ queryKey: ["datos-maestros", "propiedades"] });
      setOpen(false); reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        {trigger ?? <Button><Plus className="mr-2 h-4 w-4" /> Nueva propiedad</Button>}
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
