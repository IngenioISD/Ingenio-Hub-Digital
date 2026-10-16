import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePermisosUsuarios } from "@/hooks/use-permisos-usuarios";
import { usePermisosPersonal } from "@/hooks/use-permisos-personal";
import { listarCatalogos, listarRoles, obtenerUsuario, puestoConRolDistinto } from "@/lib/datos-maestros/usuarios";
import { AvisoRolPuesto, BadgeAccesoUsuario, OjoAcceso } from "@/components/datos-maestros/UsuarioAccesoControles";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/datos-maestros/accesos-equipo/usuarios/$id")({
  head: () => ({ meta: [{ title: "Ficha de usuario · Datos Maestros · Ingenio HUB" }] }),
  component: Page,
});

function Page() {
  const { puedeVer, cargando } = usePermisosUsuarios();
  if (cargando) return null;
  if (!puedeVer) return <p className="py-16 text-center text-muted-foreground">No tienes acceso a esta sección.</p>;
  return <Ficha />;
}

function Dato({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm">{children || "—"}</div>
    </div>
  );
}

function Ficha() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { usuarioCliente } = useAuth();
  const { puedeEditar } = usePermisosUsuarios();
  const { puedeVer: puedeVerPersonal } = usePermisosPersonal();
  const clienteId = usuarioCliente?.cliente_id;

  const { data: u, isLoading } = useQuery({
    queryKey: ["datos-maestros", "usuarios", clienteId, id],
    enabled: !!clienteId,
    queryFn: () => obtenerUsuario(clienteId!, id),
  });
  const { data: cats = new Map() } = useQuery({
    queryKey: ["datos-maestros", "usuarios-catalogos", clienteId],
    enabled: !!clienteId,
    queryFn: () => listarCatalogos(clienteId!),
  });
  const { data: roles = [] } = useQuery({
    queryKey: ["datos-maestros", "usuarios-roles", clienteId],
    enabled: !!clienteId,
    queryFn: () => listarRoles(clienteId!),
  });
  const { data: proyectos = [] } = useQuery({
    queryKey: ["datos-maestros", "usuarios-proyectos", u?.userId],
    enabled: !!u && !u.accesoTotalProyectos,
    queryFn: async () => {
      const { data: asig, error } = await supabase
        .from("usuario_proyectos").select("proyecto_id").eq("user_id", u!.userId).eq("cliente_id", clienteId!).eq("activo", true);
      if (error) throw error;
      const ids = (asig ?? []).map((a) => a.proyecto_id);
      if (ids.length === 0) return [];
      const { data: ps, error: e2 } = await supabase.from("proyectos").select("id, codigo_obra, nombre").in("id", ids);
      if (e2) throw e2;
      return (ps ?? []).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    },
  });

  const [rol, setRol] = useState("");
  const [confirmarPropio, setConfirmarPropio] = useState(false);
  const [guardando, setGuardando] = useState(false);
  useEffect(() => { if (u) setRol(u.rolId); }, [u?.rolId]);

  const refrescar = () => void qc.invalidateQueries({ queryKey: ["datos-maestros", "usuarios"] });

  if (isLoading) return null;
  if (!u) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">No se ha encontrado el usuario.</p>
        <Button variant="outline" asChild><Link to="/datos-maestros/accesos-equipo/usuarios"><ArrowLeft className="h-4 w-4" /> Volver</Link></Button>
      </div>
    );
  }

  const esPropio = u.userId === usuarioCliente?.user_id;
  const rolesInternos = roles.filter((r) => r.tipo_portal === "interno" && r.activo !== false);
  const nombreRol = roles.find((r) => r.rol_id === u.rolId)?.nombre_visible ?? u.rolId;
  const puesto = u.puestoId ? cats.get(u.puestoId)?.nombre ?? null : null;
  const estadoFicha = u.estadoId ? cats.get(u.estadoId)?.nombre ?? "" : "";
  const motivo = u.activo
    ? null
    : u.accesoDesactivado
      ? "Acceso desactivado manualmente"
      : !u.fichaActiva
        ? `Sin acceso por el estado en la ficha: ${estadoFicha}`
        : null;

  const guardarRol = async () => {
    setGuardando(true);
    try {
      const { error } = await supabase.from("usuarios_cliente").update({ rol_id: rol }).eq("id", u.id);
      if (error) throw error;
      toast.success("Rol actualizado");
      refrescar();
      if (esPropio) void qc.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/datos-maestros/accesos-equipo/usuarios"><ArrowLeft className="h-4 w-4" /> Volver</Link>
      </Button>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{u.nombreCompleto}</h1>
        <BadgeAccesoUsuario activo={u.activo} />
        {puedeEditar && <OjoAcceso usuario={u} esPropio={esPropio} onCambiado={refrescar} />}
      </div>
      {motivo && <p className="text-sm text-muted-foreground">{motivo}</p>}

      <Card>
        <CardHeader><CardTitle>Datos de la ficha</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Dato label="Nombre">
            {puedeVerPersonal ? (
              <Link to="/datos-maestros/accesos-equipo/personal-propio/$id" params={{ id: u.personalId }}>{u.nombreCompleto}</Link>
            ) : u.nombreCompleto}
          </Dato>
          <Dato label="Email">{u.email}</Dato>
          <Dato label="Puesto">{puesto}</Dato>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Rol</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {puedeEditar ? (
            <div className="flex flex-wrap items-center gap-3">
              <Select value={rol} onValueChange={setRol}>
                <SelectTrigger className="w-[260px]"><SelectValue placeholder="Selecciona un rol" /></SelectTrigger>
                <SelectContent>
                  {rolesInternos.map((r) => <SelectItem key={r.rol_id} value={r.rol_id}>{r.nombre_visible}</SelectItem>)}
                </SelectContent>
              </Select>
              <AvisoRolPuesto puesto={puestoConRolDistinto(u, cats)} />
              {rol !== u.rolId && (
                <>
                  <Button disabled={guardando} onClick={() => (esPropio ? setConfirmarPropio(true) : void guardarRol())}>Guardar</Button>
                  <Button variant="outline" onClick={() => setRol(u.rolId)}>Cancelar</Button>
                </>
              )}
            </div>
          ) : (
            <p className="inline-flex items-center gap-2 text-sm">{nombreRol} <AvisoRolPuesto puesto={puestoConRolDistinto(u, cats)} /></p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Proyectos</CardTitle></CardHeader>
        <CardContent>
          {u.accesoTotalProyectos ? (
            <p className="text-sm">Todos los proyectos</p>
          ) : proyectos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin proyectos asignados</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {proyectos.map((p) => (
                <li key={p.id}>{p.codigo_obra ? `${p.codigo_obra} · ` : ""}{p.nombre}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmarPropio} onOpenChange={setConfirmarPropio}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambiar tu rol</AlertDialogTitle>
            <AlertDialogDescription>Si cambias tu propio rol puedes quedarte sin el control y acceso a Usuarios. ¿Continuar?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void guardarRol()}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
