import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePermisosPersonal } from "@/hooks/use-permisos-personal";
import { SinAcceso } from "@/components/layout/SinAcceso";
import { listarRoles } from "@/lib/datos-maestros/usuarios";
import {
  COLUMNA_PERSONAL,
  esEstadoProtegido,
  motivoNoBorrar,
  nombreDuplicado,
  type TipoCatalogo,
} from "@/lib/datos-maestros/catalogos-reglas";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TITULO = "Catálogos · Datos Maestros · Ingenio HUB";
const DESC = "Listas desplegables de tu empresa: departamentos, puestos, centros de trabajo y estados de personal.";

export const Route = createFileRoute("/_authenticated/datos-maestros/accesos-equipo/catalogos")({
  head: () => ({ meta: [
    { title: TITULO },
    { name: "description", content: DESC },
    { property: "og:title", content: TITULO },
    { property: "og:description", content: DESC },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Page,
});

const PESTANAS: { tipo: TipoCatalogo; etiqueta: string }[] = [
  { tipo: "departamento", etiqueta: "Departamentos" },
  { tipo: "puesto", etiqueta: "Puestos" },
  { tipo: "centro_trabajo", etiqueta: "Centros de trabajo" },
  { tipo: "estado_personal", etiqueta: "Estados de personal" },
];

const SIN_ROL = "__sin_rol__";
const MSG_DUP = "Ya existe una opción con ese nombre.";
const MSG_ACCESO = "Cambiar esto afecta a quién puede entrar a la plataforma. ¿Continuar?";

interface Opcion {
  id: string;
  tipo: string;
  codigo: string | null;
  nombre: string;
  activo: boolean;
  cuenta_como_activo: boolean;
  rol_id: string | null;
}

function Page() {
  const { puedeVer, cargando } = usePermisosPersonal();
  if (cargando) return null;
  if (!puedeVer) return <SinAcceso elemento="Datos Maestros · Catálogos" />;
  return <Catalogos />;
}

function Catalogos() {
  const { usuarioCliente } = useAuth();
  const { puedeEditar } = usePermisosPersonal();
  const clienteId = usuarioCliente?.cliente_id;

  const { data: opciones = [], isLoading } = useQuery({
    queryKey: ["datos-maestros", "catalogos-gestion", clienteId],
    enabled: !!clienteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cliente_catalogos")
        .select("id, tipo, codigo, nombre, activo, cuenta_como_activo, rol_id")
        .eq("cliente_id", clienteId!)
        .in("tipo", PESTANAS.map((p) => p.tipo));
      if (error) throw error;
      return (data ?? []) as Opcion[];
    },
  });

  const { data: usos = new Map<string, number>() } = useQuery({
    queryKey: ["datos-maestros", "catalogos-usos", clienteId],
    enabled: !!clienteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("personal")
        .select("departamento_id, puesto_id, centro_trabajo_id, estado_id")
        .eq("cliente_id", clienteId!);
      if (error) throw error;
      const m = new Map<string, number>();
      for (const p of data ?? []) {
        for (const v of [p.departamento_id, p.puesto_id, p.centro_trabajo_id, p.estado_id]) {
          if (v) m.set(v, (m.get(v) ?? 0) + 1);
        }
      }
      return m;
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["datos-maestros", "usuarios-roles", clienteId],
    enabled: !!clienteId,
    queryFn: () => listarRoles(clienteId!),
  });
  const rolesInternos = roles.filter((r) => r.tipo_portal === "interno" && r.activo !== false);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Catálogos</h1>
        <p className="text-sm text-muted-foreground">{DESC}</p>
      </div>
      <Tabs defaultValue="departamento">
        <TabsList>
          {PESTANAS.map((p) => <TabsTrigger key={p.tipo} value={p.tipo}>{p.etiqueta}</TabsTrigger>)}
        </TabsList>
        {PESTANAS.map((p) => (
          <TabsContent key={p.tipo} value={p.tipo}>
            <Pestana
              tipo={p.tipo}
              clienteId={clienteId!}
              opciones={opciones.filter((o) => o.tipo === p.tipo)}
              cargando={isLoading}
              usos={usos}
              roles={rolesInternos}
              nombreRol={(id) => roles.find((r) => r.rol_id === id)?.nombre_visible ?? id}
              editable={puedeEditar}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function errorGuardar(e: { code?: string; message?: string } | null) {
  if (e?.code === "23505") toast.error(MSG_DUP);
  else toast.error("No se ha podido guardar");
}

function Pestana({
  tipo, clienteId, opciones, cargando, usos, roles, nombreRol, editable,
}: {
  tipo: TipoCatalogo;
  clienteId: string;
  opciones: Opcion[];
  cargando: boolean;
  usos: Map<string, number>;
  roles: { rol_id: string; nombre_visible: string }[];
  nombreRol: (id: string) => string;
  editable: boolean;
}) {
  const qc = useQueryClient();
  const esPuesto = tipo === "puesto";
  const esEstado = tipo === "estado_personal";
  const [dialogo, setDialogo] = useState<{ fila: Opcion | null } | null>(null);
  const [borrar, setBorrar] = useState<Opcion | null>(null);

  const ordenadas = useMemo(
    () => [...opciones].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    [opciones],
  );

  const refrescar = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["datos-maestros", "catalogos-gestion", clienteId] }),
      qc.invalidateQueries({ queryKey: ["datos-maestros", "catalogos-usos", clienteId] }),
      qc.invalidateQueries({ queryKey: ["datos-maestros", "personal-catalogos-full", clienteId] }),
      qc.invalidateQueries({ queryKey: ["datos-maestros", "personal-catalogos", clienteId] }),
      qc.invalidateQueries({ queryKey: ["datos-maestros", "usuarios-catalogos", clienteId] }),
    ]);
  };

  const cambiarActivo = async (o: Opcion, activo: boolean) => {
    const { error } = await supabase.from("cliente_catalogos").update({ activo }).eq("id", o.id);
    if (error) return errorGuardar(error);
    toast.success(activo ? "Opción activada" : "Opción desactivada");
    await refrescar();
  };

  const confirmarBorrar = async () => {
    if (!borrar) return;
    const { error } = await supabase.from("cliente_catalogos").delete().eq("id", borrar.id);
    setBorrar(null);
    if (error) return void toast.error("No se ha podido borrar");
    toast.success("Opción borrada");
    await refrescar();
  };

  const columnas = 2 + (esPuesto ? 1 : 0) + (esEstado ? 1 : 0) + (editable ? 1 : 0);
  void COLUMNA_PERSONAL;

  return (
    <div className="space-y-3">
      {editable && (
        <div className="flex justify-end">
          <Button onClick={() => setDialogo({ fila: null })}><Plus className="h-4 w-4" />Añadir</Button>
        </div>
      )}
      <Card className="overflow-hidden">
        <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                {esPuesto && <TableHead>Rol asociado</TableHead>}
                {esEstado && <TableHead>Permite acceso a la plataforma</TableHead>}
                <TableHead>Activo</TableHead>
                {editable && <TableHead className="w-[1%]" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargando && <TableRow><TableCell colSpan={columnas} className="text-center text-muted-foreground">Cargando…</TableCell></TableRow>}
              {!cargando && ordenadas.length === 0 && <TableRow><TableCell colSpan={columnas} className="text-center text-muted-foreground">Todavía no hay opciones.</TableCell></TableRow>}
              {ordenadas.map((o) => {
                const protegido = esEstadoProtegido(tipo, o.codigo);
                const motivo = motivoNoBorrar(tipo, o.codigo, usos.get(o.id) ?? 0);
                const gris = o.activo ? undefined : { color: "var(--text-muted)" };
                return (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium" style={gris}>
                      <span className="inline-flex items-center gap-2">
                        {o.nombre}
                        {!o.activo && <span className="badge badge-neutral">Inactivo</span>}
                        {protegido && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span tabIndex={0} aria-label="Estado del sistema: no se puede desactivar ni borrar."><Lock className="h-4 w-4" /></span>
                            </TooltipTrigger>
                            <TooltipContent>Estado del sistema: no se puede desactivar ni borrar.</TooltipContent>
                          </Tooltip>
                        )}
                      </span>
                    </TableCell>
                    {esPuesto && <TableCell style={gris}>{o.rol_id ? nombreRol(o.rol_id) : "Sin rol"}</TableCell>}
                    {esEstado && <TableCell style={gris}>{o.cuenta_como_activo ? "Sí" : "No"}</TableCell>}
                    <TableCell>
                      {editable ? (
                        <Switch
                          checked={o.activo}
                          disabled={protegido}
                          aria-label="Activo"
                          onCheckedChange={(v) => void cambiarActivo(o, v)}
                        />
                      ) : (
                        <span style={gris}>{o.activo ? "Sí" : "No"}</span>
                      )}
                    </TableCell>
                    {editable && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => setDialogo({ fila: o })}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {motivo ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span tabIndex={0}>
                                  <Button variant="ghost" size="icon" aria-label={motivo} disabled>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>{motivo}</TooltipContent>
                            </Tooltip>
                          ) : (
                            <Button variant="ghost" size="icon" aria-label="Borrar" onClick={() => setBorrar(o)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TooltipProvider>
      </Card>

      {dialogo && (
        <DialogoOpcion
          tipo={tipo}
          clienteId={clienteId}
          fila={dialogo.fila}
          opciones={opciones}
          roles={roles}
          onCerrar={() => setDialogo(null)}
          onGuardado={refrescar}
        />
      )}

      <AlertDialog open={!!borrar} onOpenChange={(v) => !v && setBorrar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Borrar opción</AlertDialogTitle>
            <AlertDialogDescription>¿Borrar «{borrar?.nombre}»? Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmarBorrar()}>Borrar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DialogoOpcion({
  tipo, clienteId, fila, opciones, roles, onCerrar, onGuardado,
}: {
  tipo: TipoCatalogo;
  clienteId: string;
  fila: Opcion | null;
  opciones: Opcion[];
  roles: { rol_id: string; nombre_visible: string }[];
  onCerrar: () => void;
  onGuardado: () => Promise<void>;
}) {
  const esPuesto = tipo === "puesto";
  const esEstado = tipo === "estado_personal";
  const protegido = !!fila && esEstadoProtegido(tipo, fila.codigo);
  const [nombre, setNombre] = useState(fila?.nombre ?? "");
  const [rol, setRol] = useState(fila?.rol_id ?? SIN_ROL);
  const [acceso, setAcceso] = useState<"si" | "no">(fila ? (fila.cuenta_como_activo ? "si" : "no") : "si");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmarAcceso, setConfirmarAcceso] = useState(false);

  const accesoCambia = esEstado && !!fila && fila.cuenta_como_activo !== (acceso === "si");

  const validar = () => {
    const limpio = nombre.trim();
    if (!limpio) { setError("El nombre es obligatorio."); return false; }
    if (nombreDuplicado(limpio, opciones, fila?.id)) { setError(MSG_DUP); return false; }
    setError(null);
    return true;
  };

  const guardar = async () => {
    setGuardando(true);
    const limpio = nombre.trim();
    const extra: Record<string, unknown> = {};
    if (esPuesto) extra["rol_id"] = rol === SIN_ROL ? null : rol;
    if (esEstado && !protegido) extra["cuenta_como_activo"] = acceso === "si";
    const { error: e } = fila
      ? await supabase.from("cliente_catalogos").update({ nombre: limpio, ...extra } as never).eq("id", fila.id)
      : await supabase.from("cliente_catalogos").insert({
          cliente_id: clienteId, tipo, codigo: null, orden: 0, activo: true, nombre: limpio,
          ...(esEstado ? { cuenta_como_activo: acceso === "si" } : {}),
          ...(esPuesto ? { rol_id: extra["rol_id"] } : {}),
        } as never);
    setGuardando(false);
    if (e) {
      if (e.code === "23505") setError(MSG_DUP);
      errorGuardar(e);
      return;
    }
    toast.success("Cambios guardados");
    await onGuardado();
    onCerrar();
  };

  const alPulsarGuardar = () => {
    if (!validar()) return;
    if (accesoCambia) setConfirmarAcceso(true);
    else void guardar();
  };

  return (
    <>
      <Dialog open onOpenChange={(v) => !v && onCerrar()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{fila ? "Editar opción" : "Añadir opción"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-nombre">Nombre</Label>
              <Input id="cat-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            {esPuesto && (
              <div className="space-y-2">
                <Label>Rol asociado</Label>
                <Select value={rol} onValueChange={setRol}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SIN_ROL}>Sin rol</SelectItem>
                    {roles.map((r) => <SelectItem key={r.rol_id} value={r.rol_id}>{r.nombre_visible}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {esEstado && (
              <div className="space-y-2">
                <Label>Permite acceso a la plataforma</Label>
                <Select value={acceso} onValueChange={(v) => setAcceso(v as "si" | "no")} disabled={protegido}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="si">Sí</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onCerrar}>Cancelar</Button>
            <Button onClick={alPulsarGuardar} disabled={guardando}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirmarAcceso} onOpenChange={setConfirmarAcceso}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permite acceso a la plataforma</AlertDialogTitle>
            <AlertDialogDescription>{MSG_ACCESO}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setConfirmarAcceso(false); void guardar(); }}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
