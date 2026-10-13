import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { NIF_LONGITUD, normalizarNif } from "@/components/datos-maestros/NuevaPropiedadDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/** Ignora mayúsculas, tildes, signos de puntuación y espacios sobrantes. */
export const normalizarNombreDF = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

type Aviso =
  | { tipo: "distinto"; dfId: string; nombre: string }
  | { tipo: "ya_en_lista"; vinculoId: string; activo: boolean };

export function NuevaDireccionFacultativaDialog() {
  const { usuarioCliente } = useAuth();
  const clienteId = usuarioCliente?.cliente_id;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [nif, setNif] = useState("");
  const [nombre, setNombre] = useState("");
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [guardando, setGuardando] = useState(false);

  const reset = () => { setNif(""); setNombre(""); setAviso(null); };
  const valido = nif.length === NIF_LONGITUD && nombre.trim().length > 0;

  const terminar = (msg: string) => {
    qc.invalidateQueries({ queryKey: ["datos-maestros", "direccion-facultativa"] });
    toast.success(msg);
    setOpen(false); reset();
  };

  const vincular = async (dfId: string) => {
    const { error } = await supabase.from("cliente_direccion_facultativa").insert({
      cliente_id: clienteId!, direccion_facultativa_id: dfId, activo: true,
    });
    if (error) throw error;
  };

  const buscarPorNif = async () => {
    const { data, error } = await supabase.from("direccion_facultativa").select("id, nombre_legal").eq("nif", nif).maybeSingle();
    if (error) throw error;
    return data;
  };

  const guardar = async () => {
    if (!clienteId || !valido) return;
    setGuardando(true);
    try {
      const existente = await buscarPorNif();
      if (existente) {
        const { data: v, error: ev } = await supabase
          .from("cliente_direccion_facultativa")
          .select("id, activo")
          .eq("cliente_id", clienteId)
          .eq("direccion_facultativa_id", existente.id)
          .maybeSingle();
        if (ev) throw ev;
        if (v) { setAviso({ tipo: "ya_en_lista", vinculoId: v.id, activo: v.activo }); return; }
        if (normalizarNombreDF(existente.nombre_legal) === normalizarNombreDF(nombre)) {
          await vincular(existente.id);
          terminar("Dirección Facultativa añadida");
          return;
        }
        setAviso({ tipo: "distinto", dfId: existente.id, nombre: existente.nombre_legal });
        return;
      }
      const id = crypto.randomUUID();
      const { error } = await supabase.from("direccion_facultativa").insert({ id, nif, nombre_legal: nombre.trim() });
      if (error) {
        if (error.code === "23505") {
          const otra = await buscarPorNif();
          if (otra) { setAviso({ tipo: "distinto", dfId: otra.id, nombre: otra.nombre_legal }); return; }
        }
        throw error;
      }
      await vincular(id);
      terminar("Dirección Facultativa añadida");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  const usarExistente = async (dfId: string) => {
    setGuardando(true);
    try { await vincular(dfId); terminar("Dirección Facultativa añadida"); }
    catch (e) { toast.error((e as Error).message); }
    finally { setGuardando(false); }
  };

  const reactivar = async (vinculoId: string) => {
    setGuardando(true);
    try {
      const { error } = await supabase.from("cliente_direccion_facultativa").update({ activo: true }).eq("id", vinculoId);
      if (error) throw error;
      terminar("Dirección Facultativa reactivada");
    } catch (e) { toast.error((e as Error).message); }
    finally { setGuardando(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" /> Nueva Dirección Facultativa</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva Dirección Facultativa</DialogTitle>
          <DialogDescription>Indica el NIF y el nombre del estudio.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>NIF *</Label>
            <Input
              value={nif}
              disabled={!!aviso}
              onChange={(e) => setNif(normalizarNif(e.target.value))}
              placeholder="B12345678"
              maxLength={NIF_LONGITUD}
            />
            {nif.length > 0 && nif.length !== NIF_LONGITUD && (
              <p className="text-xs text-muted-foreground">
                El NIF debe tener {NIF_LONGITUD} caracteres ({nif.length} de {NIF_LONGITUD}).
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input value={nombre} disabled={!!aviso} onChange={(e) => setNombre(e.target.value)} />
          </div>

          {aviso?.tipo === "distinto" && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              Ya existe una Dirección Facultativa con el NIF {nif}: <span className="font-medium">{aviso.nombre}</span>.
            </div>
          )}
          {aviso?.tipo === "ya_en_lista" && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              Esta Dirección Facultativa ya está en tu lista.
            </div>
          )}
        </div>

        <DialogFooter>
          {!aviso && (
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={guardar} disabled={!valido || guardando}>Crear</Button>
            </>
          )}
          {aviso?.tipo === "distinto" && (
            <>
              <Button variant="ghost" onClick={() => setAviso(null)} disabled={guardando}>Corregir</Button>
              <Button onClick={() => usarExistente(aviso.dfId)} disabled={guardando}>Usar existente</Button>
            </>
          )}
          {aviso?.tipo === "ya_en_lista" && (
            <>
              <Button variant="ghost" onClick={() => setAviso(null)} disabled={guardando}>Corregir</Button>
              {!aviso.activo && (
                <Button onClick={() => reactivar(aviso.vinculoId)} disabled={guardando}>Reactivar</Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
