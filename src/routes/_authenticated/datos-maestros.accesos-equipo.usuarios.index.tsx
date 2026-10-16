import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { usePermisosUsuarios } from "@/hooks/use-permisos-usuarios";
import { filaClicableProps } from "@/lib/fila-clicable";
import { listarCatalogos, listarRoles, listarUsuarios, puestoConRolDistinto } from "@/lib/datos-maestros/usuarios";
import { AvisoRolPuesto, BadgeAccesoUsuario, OjoAcceso } from "@/components/datos-maestros/UsuarioAccesoControles";

import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/datos-maestros/accesos-equipo/usuarios/")({
  head: () => ({ meta: [{ title: "Usuarios · Datos Maestros · Ingenio HUB" }] }),
  component: Page,
});

function normalizar(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function Page() {
  const { puedeVer, cargando } = usePermisosUsuarios();
  if (cargando) return null;
  if (!puedeVer) return <p className="py-16 text-center text-muted-foreground">No tienes acceso a esta sección.</p>;
  return <Listado />;
}

function Listado() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { usuarioCliente } = useAuth();
  const { puedeEditar } = usePermisosUsuarios();
  const clienteId = usuarioCliente?.cliente_id;
  const [q, setQ] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["datos-maestros", "usuarios", clienteId],
    enabled: !!clienteId,
    queryFn: () => listarUsuarios(clienteId!),
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
  const nombreRol = (id: string) => roles.find((r) => r.rol_id === id)?.nombre_visible ?? id;

  const term = normalizar(q);
  const filtradas = data
    .filter((r) => !term || normalizar(`${r.nombreCompleto} ${r.email}`).includes(term))
    .sort((a, b) => a.apellido1.localeCompare(b.apellido1, "es") || a.nombre.localeCompare(b.nombre, "es"));
  const cols = puedeEditar ? 5 : 4;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por nombre o email…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              {puedeEditar && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={cols} className="text-center text-muted-foreground">Cargando…</TableCell></TableRow>}
            {!isLoading && data.length === 0 && <TableRow><TableCell colSpan={cols} className="text-center text-muted-foreground">Todavía no hay usuarios.</TableCell></TableRow>}
            {!isLoading && data.length > 0 && filtradas.length === 0 && <TableRow><TableCell colSpan={cols} className="text-center text-muted-foreground">Sin resultados</TableCell></TableRow>}
            {filtradas.map((r) => (
              <TableRow
                key={r.id}
                {...filaClicableProps(() => void navigate({ to: "/datos-maestros/accesos-equipo/usuarios/$id", params: { id: r.id } }))}
              >
                <TableCell className="font-medium">{r.nombreCompleto}</TableCell>
                <TableCell>{r.email}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-2">
                    {nombreRol(r.rolId)}
                    <AvisoRolPuesto puesto={puestoConRolDistinto(r, cats)} />
                  </span>
                </TableCell>
                <TableCell><BadgeAccesoUsuario activo={r.activo} /></TableCell>
                {puedeEditar && (
                  <TableCell>
                    <OjoAcceso
                      usuario={r}
                      esPropio={r.userId === usuarioCliente?.user_id}
                      onCambiado={() => void qc.invalidateQueries({ queryKey: ["datos-maestros", "usuarios"] })}
                    />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
