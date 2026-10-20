import { Fragment, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { RolFila, UsuarioFila } from "@/lib/datos-maestros/usuarios";
import { nombreElemento, nivelAcceso, permiteAcciones, puedeGuardarExcepcion, type AccesoUsuario } from "@/lib/datos-maestros/usuario-accesos-reglas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SelectorProyectos } from "@/components/datos-maestros/SelectorProyectos";
import { Label } from "@/components/ui/label";

type Props = { usuario: UsuarioFila; clienteId: string; roles: RolFila[]; puedeEditar: boolean; esPropio: boolean };
const mensajeError = (error: unknown) => error && typeof error === "object" && "message" in error ? String(error.message) : "No se pudo completar la operación";

export function UsuarioAccesosTabla({ usuario, clienteId, roles, puedeEditar, esPropio }: Props) {
  const qc = useQueryClient();
  const [editando, setEditando] = useState<AccesoUsuario | null>(null);
  const [quitando, setQuitando] = useState<AccesoUsuario | null>(null);
  const tablaKey = ["datos-maestros", "usuarios", clienteId, usuario.id, "accesos"];
  const { data: filas, isLoading, error } = useQuery({
    queryKey: tablaKey,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("accesos_usuario", { p_user_id: usuario.userId } as never);
      if (error) throw error;
      return (data ?? []) as AccesoUsuario[];
    },
  });
  useEffect(() => { if (error) toast.error(mensajeError(error)); }, [error]);
  const refrescar = async () => {
    await qc.invalidateQueries({ queryKey: ["datos-maestros", "usuarios"] });
    if (esPropio) await qc.invalidateQueries();
  };
  const quitar = useMutation({
    mutationFn: async (fila: AccesoUsuario) => {
      if (!puedeEditar) throw new Error("No tienes permiso para editar los accesos.");
      const { error } = await supabase.rpc("quitar_excepcion_rol", { p_user_id: usuario.userId, p_modulo: fila.modulo } as never);
      if (error) throw error;
    },
    onSuccess: async () => { setQuitando(null); await refrescar(); },
    onError: (error) => toast.error(mensajeError(error)),
  });
  const nombreRol = (rol: string | null) => rol === null ? "—" : roles.find((r) => r.rol_id === rol)?.nombre_visible ?? rol;
  if (isLoading) return null;
  return (
    <Card>
      <CardHeader><CardTitle>Accesos por módulo y app</CardTitle></CardHeader>
      <CardContent>
        {error ? null : !filas?.length ? <p className="text-sm text-muted-foreground">Este usuario no tiene accesos contratados.</p> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Elemento</TableHead><TableHead>Tipo</TableHead><TableHead>Rol aplicado</TableHead><TableHead>Origen</TableHead><TableHead>Permisos</TableHead>
              {puedeEditar && <TableHead><span className="sr-only">Acciones</span></TableHead>}
            </TableRow></TableHeader>
            <TableBody>
              {([['modulo', 'Módulos'], ['app', 'Apps']] as const).map(([tipo, titulo]) => {
                const grupo = (filas ?? []).filter((f) => f.tipo === tipo).sort((a, b) => a.orden - b.orden);
                if (!grupo.length) return null;
                return <Fragment key={tipo}>
                  <TableRow><TableCell colSpan={puedeEditar ? 6 : 5} className="font-semibold">{titulo}</TableCell></TableRow>
                  {grupo.map((fila) => <TableRow key={`${tipo}-${fila.modulo}`}>
                    <TableCell>{nombreElemento(fila.modulo)}</TableCell>
                    <TableCell>{tipo === "modulo" ? "Módulo" : "App"}</TableCell>
                    <TableCell>{nombreRol(fila.rol_aplicado)}</TableCell>
                    <TableCell>{fila.es_excepcion ? <div className="space-y-1">
                      <span style={{ color: "var(--state-warning)" }}>Excepción</span>
                      <p className="text-xs text-muted-foreground">{fila.todos_los_proyectos ? "Todos los proyectos" : `${fila.proyectos?.length ?? 0} proyecto(s)`}</p>
                      <p className="text-xs text-muted-foreground">Rol base: {nombreRol(fila.rol_base)}</p>
                    </div> : "Rol base"}</TableCell>
                    <TableCell><div className="space-y-1">
                      <p>{({ sin_acceso: "Sin acceso", lectura: "Solo lectura", escritura: "Lectura y escritura" })[nivelAcceso(fila)]}</p>
                      <div className="flex flex-wrap gap-1">
                        {fila.puede_eliminar && <span className="badge badge-neutral">Elimina</span>}
                        {fila.puede_aprobar && <span className="badge badge-neutral">Aprueba</span>}
                        {fila.puede_exportar && <span className="badge badge-neutral">Exporta</span>}
                      </div>
                    </div></TableCell>
                    {puedeEditar && <TableCell>{permiteAcciones(puedeEditar, fila) && <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditando(fila)}><Pencil className="h-4 w-4" />{fila.es_excepcion ? "Editar" : "Cambiar rol en este elemento"}</Button>
                      {fila.es_excepcion && <Button variant="outline" size="sm" onClick={() => setQuitando(fila)}><RotateCcw className="h-4 w-4" />Volver al rol base</Button>}
                    </div>}</TableCell>}
                  </TableRow>)}
                </Fragment>;
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
      {editando && puedeEditar && <EditorExcepcion key={editando.modulo} fila={editando} usuario={usuario} clienteId={clienteId} roles={roles} esPropio={esPropio} cerrar={() => setEditando(null)} refrescar={refrescar} />}
      <AlertDialog open={Boolean(quitando) && puedeEditar} onOpenChange={(open) => { if (!open && !quitar.isPending) setQuitando(null); }}>
        <AlertDialogContent><AlertDialogHeader>
          <AlertDialogTitle>Volver al rol base</AlertDialogTitle>
          <AlertDialogDescription>{esPropio ? "Estás cambiando tus propios accesos. " : ""}{usuario.nombreCompleto} volverá a su rol base en {quitando ? nombreElemento(quitando.modulo) : ""} y se borrarán también los proyectos de esta excepción.</AlertDialogDescription>
        </AlertDialogHeader><AlertDialogFooter>
          <AlertDialogCancel disabled={quitar.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction disabled={quitar.isPending} onClick={(e) => { e.preventDefault(); if (quitando) quitar.mutate(quitando); }}>Volver al rol base</AlertDialogAction>
        </AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function EditorExcepcion({ fila, usuario, clienteId, roles, esPropio, cerrar, refrescar }: Omit<Props, "puedeEditar"> & { fila: AccesoUsuario; cerrar: () => void; refrescar: () => Promise<void> }) {
  const [rol, setRol] = useState(fila.rol_aplicado ?? "");
  const [todos, setTodos] = useState(fila.es_excepcion && fila.todos_los_proyectos);
  const [seleccion, setSeleccion] = useState<string[]>(fila.es_excepcion ? fila.proyectos ?? [] : []);
  const [confirmar, setConfirmar] = useState(false);
  const { data: proyectos = [], error, isLoading } = useQuery({
    queryKey: ["datos-maestros", "usuarios", clienteId, "proyectos-excepcion"],
    queryFn: async () => {
      const { data, error } = await supabase.from("proyectos").select("id, nombre, codigo_obra").eq("cliente_id", clienteId).order("nombre");
      if (error) throw error;
      return data ?? [];
    },
  });
  useEffect(() => { if (error) toast.error(mensajeError(error)); }, [error]);
  const valido = puedeGuardarExcepcion(rol, fila.rol_base, todos, seleccion);
  const guardar = useMutation({
    mutationFn: async () => {
      if (!valido) throw new Error("Revisa el rol y los proyectos seleccionados.");
      const { error } = await supabase.rpc("guardar_excepcion_rol", {
        p_user_id: usuario.userId, p_modulo: fila.modulo, p_rol_id: rol,
        p_todos: todos, p_proyectos: todos ? [] : seleccion,
      } as never);
      if (error) throw error;
    },
    onSuccess: async () => { cerrar(); await refrescar(); },
    onError: (error) => { setConfirmar(false); toast.error(mensajeError(error)); },
  });
  return <>
    <Dialog open onOpenChange={(open) => { if (!open && !guardar.isPending) cerrar(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cambiar rol en {nombreElemento(fila.modulo)}</DialogTitle>
          <DialogDescription>Este cambio afecta solo a {nombreElemento(fila.modulo)}. El resto de sus accesos no cambia.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label htmlFor="rol-excepcion">Rol</Label>
            <Select value={rol} onValueChange={setRol} disabled={guardar.isPending}>
              <SelectTrigger id="rol-excepcion"><SelectValue placeholder="Selecciona un rol" /></SelectTrigger>
              <SelectContent>{roles.filter((r) => r.tipo_portal === "interno" && r.activo !== false).map((r) => <SelectItem key={r.rol_id} value={r.rol_id}>{r.nombre_visible}</SelectItem>)}</SelectContent>
            </Select>
            {rol && rol === fila.rol_base && <p className="text-sm text-muted-foreground">Es el mismo rol base; no hace falta excepción.</p>}
          </div>
          <RadioGroup value={todos ? "todos" : "concretos"} onValueChange={(v) => setTodos(v === "todos")} disabled={guardar.isPending} aria-label="Proyectos de la excepción">
            <div className="flex items-center gap-2"><RadioGroupItem id="proyectos-concretos" value="concretos" /><Label htmlFor="proyectos-concretos">Proyectos concretos</Label></div>
            <div className="flex items-start gap-2"><RadioGroupItem id="proyectos-todos" value="todos" /><Label htmlFor="proyectos-todos">Todos los proyectos (incluidos los que se creen en el futuro)</Label></div>
          </RadioGroup>
          {!todos && <SelectorProyectos proyectos={proyectos} cargando={isLoading} conError={Boolean(error)} seleccion={seleccion} setSeleccion={setSeleccion} deshabilitado={guardar.isPending} idPrefijo="excepcion-proyecto" />}
        </div>
        <DialogFooter><Button variant="outline" onClick={cerrar} disabled={guardar.isPending}>Cancelar</Button>
          <Button disabled={!valido || guardar.isPending} onClick={() => esPropio ? setConfirmar(true) : guardar.mutate()}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <AlertDialog open={confirmar} onOpenChange={(open) => { if (!guardar.isPending) setConfirmar(open); }}>
      <AlertDialogContent><AlertDialogHeader>
        <AlertDialogTitle>Cambiar tus propios accesos</AlertDialogTitle>
        <AlertDialogDescription>Estás cambiando tus propios accesos en {nombreElemento(fila.modulo)}. Puedes quedarte sin el control y acceso a este elemento. ¿Continuar?</AlertDialogDescription>
      </AlertDialogHeader><AlertDialogFooter>
        <AlertDialogCancel disabled={guardar.isPending}>Cancelar</AlertDialogCancel>
        <AlertDialogAction disabled={!valido || guardar.isPending} onClick={(e) => { e.preventDefault(); guardar.mutate(); }}>Continuar</AlertDialogAction>
      </AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
  </>;
}