import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { NuevaPersonaDialog } from "@/components/datos-maestros/NuevaPersonaDialog";
import { SinAcceso } from "@/components/layout/SinAcceso";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePermisosPersonal } from "@/hooks/use-permisos-personal";
import { fechaCorta } from "@/lib/erp/formato";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/datos-maestros/accesos-equipo/personal-propio/")({
  head: () => ({ meta: [{ title: "Personal propio · Datos Maestros · Ingenio HUB" }] }),
  component: Page,
});

interface Row {
  id: string;
  nombreCompleto: string;
  apellido1: string;
  nombre: string;
  codigoEmpleado: string | null;
  nif: string;
  email: string;
  departamentoId: string | null;
  puestoId: string | null;
  estadoId: string | null;
  fechaAlta: string | null;
  activo: boolean;
}

const TODOS = "__todos__";

function normalizar(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function Page() {
  const { puedeVer, cargando } = usePermisosPersonal();
  if (cargando) return null;
  if (!puedeVer) return <SinAcceso elemento="Datos Maestros · Personal" />;
  return <Listado />;
}

function Listado() {
  const navigate = useNavigate();
  const { usuarioCliente } = useAuth();
  const { puedeCrear } = usePermisosPersonal();
  const clienteId = usuarioCliente?.cliente_id;

  const [q, setQ] = useState("");
  const [dep, setDep] = useState(TODOS);
  const [puesto, setPuesto] = useState(TODOS);
  const [estado, setEstado] = useState(TODOS);
  const [ocultarBajas, setOcultarBajas] = useState(false);

  const { data: catalogos = new Map<string, { tipo: string; nombre: string }>() } = useQuery({
    queryKey: ["datos-maestros", "personal-catalogos", clienteId],
    enabled: !!clienteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cliente_catalogos")
        .select("id, tipo, nombre")
        .eq("cliente_id", clienteId!);
      if (error) throw error;
      return new Map((data ?? []).map((c) => [c.id, { tipo: c.tipo, nombre: c.nombre }]));
    },
  });

  const { data = [], isLoading } = useQuery({
    queryKey: ["datos-maestros", "personal", clienteId],
    enabled: !!clienteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("personal")
        .select("id, nif, codigo_empleado, nombre, apellido_1, apellido_2, email, departamento_id, puesto_id, estado_id, fecha_alta, activo")
        .eq("cliente_id", clienteId!);
      if (error) throw error;
      return (data ?? []).map((p): Row => ({
        id: p.id,
        nombreCompleto: `${[p.apellido_1, p.apellido_2].filter(Boolean).join(" ")}, ${p.nombre}`,
        apellido1: p.apellido_1,
        nombre: p.nombre,
        codigoEmpleado: p.codigo_empleado ?? null,
        nif: p.nif,
        email: p.email ?? "",
        departamentoId: p.departamento_id,
        puestoId: p.puesto_id,
        estadoId: p.estado_id,
        fechaAlta: p.fecha_alta,
        activo: p.activo !== false,
      }));
    },
  });

  const nombreCat = (id: string | null) => (id ? catalogos.get(id)?.nombre ?? "" : "");

  const opciones = (campo: "departamentoId" | "puestoId" | "estadoId") => {
    const ids = Array.from(new Set(data.map((r) => r[campo]).filter((x): x is string => !!x)));
    return ids
      .map((id) => ({ id, nombre: nombreCat(id) }))
      .filter((o) => o.nombre)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  };
  const opDep = useMemo(() => opciones("departamentoId"), [data, catalogos]);
  const opPuesto = useMemo(() => opciones("puestoId"), [data, catalogos]);
  const opEstado = useMemo(() => opciones("estadoId"), [data, catalogos]);

  const term = normalizar(q);
  const filtradas = data
    .filter((r) => !ocultarBajas || r.activo)
    .filter((r) => dep === TODOS || r.departamentoId === dep)
    .filter((r) => puesto === TODOS || r.puestoId === puesto)
    .filter((r) => estado === TODOS || r.estadoId === estado)
    .filter((r) => !term || normalizar(`${r.nombreCompleto} ${r.nif} ${r.email}`).includes(term))
    .sort((a, b) => a.apellido1.localeCompare(b.apellido1, "es") || a.nombre.localeCompare(b.nombre, "es"));

  const filtro = (valor: string, set: (v: string) => void, placeholder: string, ops: { id: string; nombre: string }[]) => (
    <Select value={valor} onValueChange={set}>
      <SelectTrigger className="w-[200px]"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        <SelectItem value={TODOS}>{placeholder}</SelectItem>
        {ops.map((o) => <SelectItem key={o.id} value={o.id}>{o.nombre}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Personal propio</h1>
        {puedeCrear && <NuevaPersonaDialog />}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nombre, NIF o email…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        {filtro(dep, setDep, "Todos los departamentos", opDep)}
        {filtro(puesto, setPuesto, "Todos los puestos", opPuesto)}
        {filtro(estado, setEstado, "Todos los estados", opEstado)}
        <div className="flex items-center gap-2">
          <Switch id="mostrar-bajas" checked={ocultarBajas} onCheckedChange={setOcultarBajas} />
          <Label htmlFor="mostrar-bajas">Eliminar del listado el personal en situación de baja y excedencia</Label>
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre completo</TableHead>
              <TableHead>Nº Trabajador</TableHead>
              <TableHead>NIF</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Puesto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha de alta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Cargando…</TableCell></TableRow>}
            {!isLoading && data.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Todavía no hay personal dado de alta.</TableCell></TableRow>}
            {!isLoading && data.length > 0 && filtradas.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Sin resultados</TableCell></TableRow>}
            {filtradas.map((r) => (
              <TableRow
                key={r.id}
                className={`cursor-pointer ${r.activo ? "" : "opacity-50"}`}
                onClick={() => void navigate({ to: `/datos-maestros/accesos-equipo/personal-propio/${r.id}` as never })}
              >
                <TableCell className="font-medium">{r.nombreCompleto}</TableCell>
                <TableCell>{r.codigoEmpleado ?? ""}</TableCell>
                <TableCell>{r.nif}</TableCell>
                <TableCell>{nombreCat(r.departamentoId)}</TableCell>
                <TableCell>{nombreCat(r.puestoId)}</TableCell>
                <TableCell>{nombreCat(r.estadoId)}</TableCell>
                <TableCell>{r.fechaAlta ? fechaCorta(r.fechaAlta) : ""}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
