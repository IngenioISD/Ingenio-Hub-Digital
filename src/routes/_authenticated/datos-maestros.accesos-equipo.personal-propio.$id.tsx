import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePermisosPersonal } from "@/hooks/use-permisos-personal";
import { fechaCorta } from "@/lib/erp/formato";
import {
  buscarCodigoEmpleado,
  CatalogoSelect,
  EMAIL_RE,
  normalizarNif,
  useCatalogosPersonal,
  type CatalogoPersonal,
} from "@/components/datos-maestros/NuevaPersonaDialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/datos-maestros/accesos-equipo/personal-propio/$id")({
  head: () => ({ meta: [{ title: "Ficha de persona · Datos Maestros · Ingenio HUB" }] }),
  component: Page,
});

const LISTADO = "/datos-maestros/accesos-equipo/personal-propio";

type Persona = {
  id: string;
  nif: string;
  nombre: string;
  apellido_1: string;
  apellido_2: string | null;
  email: string | null;
  telefono: string | null;
  departamento_id: string | null;
  puesto_id: string | null;
  tipo_contrato_id: string | null;
  centro_trabajo_id: string | null;
  estado_id: string | null;
  motivo_baja_id: string | null;
  codigo_empleado: string | null;
  fecha_alta: string | null;
  fecha_baja: string | null;
  activo: boolean | null;
};

function Page() {
  const { puedeVer, cargando } = usePermisosPersonal();
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

function nombreCat(cats: CatalogoPersonal[], id: string | null) {
  if (!id) return null;
  const c = cats.find((x) => x.id === id);
  if (!c) return null;
  return c.activo ? c.nombre : <span className="text-muted-foreground">{c.nombre} (desactivado)</span>;
}

function Ficha() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { usuarioCliente } = useAuth();
  const { puedeEditar } = usePermisosPersonal();
  const clienteId = usuarioCliente?.cliente_id;
  const { data: catalogos = [] } = useCatalogosPersonal(clienteId);

  const { data: p, isLoading } = useQuery({
    queryKey: ["datos-maestros", "personal", "ficha", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("personal")
        .select(
          "id, nif, nombre, apellido_1, apellido_2, email, telefono, departamento_id, puesto_id, tipo_contrato_id, centro_trabajo_id, estado_id, motivo_baja_id, codigo_empleado, fecha_alta, fecha_baja, activo",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as Persona | null;
    },
  });

  const refrescar = async () => {
    await qc.invalidateQueries({ queryKey: ["datos-maestros", "personal"] });
  };

  if (isLoading) return <p className="py-16 text-center text-muted-foreground">Cargando…</p>;
  if (!p) return <p className="py-16 text-center text-muted-foreground">No se ha encontrado la persona.</p>;

  const estado = catalogos.find((c) => c.id === p.estado_id);

  return (
    <div className="space-y-4">
      <Link to={LISTADO as never} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver al listado
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          {[p.nombre, p.apellido_1, p.apellido_2].filter(Boolean).join(" ")}
        </h1>
        {estado && <span className={p.activo !== false ? "badge badge-success" : "badge badge-neutral"}>{estado.nombre}</span>}
      </div>
      <DatosPersonales p={p} clienteId={clienteId} puedeEditar={puedeEditar} onGuardado={refrescar} />
      <DatosLaborales p={p} clienteId={clienteId} catalogos={catalogos} puedeEditar={puedeEditar} onGuardado={refrescar} />
    </div>
  );
}

function CabeceraCard({
  titulo,
  editando,
  puedeEditar,
  onEditar,
  onCancelar,
  onGuardar,
  guardando,
}: {
  titulo: string;
  editando: boolean;
  puedeEditar: boolean;
  onEditar: () => void;
  onCancelar: () => void;
  onGuardar: () => void;
  guardando: boolean;
}) {
  return (
    <CardHeader className="flex flex-row items-center justify-between space-y-0">
      <CardTitle className="text-base">{titulo}</CardTitle>
      {puedeEditar &&
        (editando ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCancelar}>
              Cancelar
            </Button>
            <Button size="sm" disabled={guardando} onClick={onGuardar}>
              Guardar
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="icon" aria-label={`Editar ${titulo}`} onClick={onEditar}>
            <Pencil className="h-4 w-4" />
          </Button>
        ))}
    </CardHeader>
  );
}

function DatosPersonales({
  p,
  clienteId,
  puedeEditar,
  onGuardado,
}: {
  p: Persona;
  clienteId?: string | undefined;
  puedeEditar: boolean;
  onGuardado: () => Promise<void>;
}) {
  const inicial = () => ({
    nombre: p.nombre,
    apellido_1: p.apellido_1,
    apellido_2: p.apellido_2 ?? "",
    nif: p.nif,
    email: p.email ?? "",
    telefono: p.telefono ?? "",
  });
  const [editando, setEditando] = useState(false);
  const [f, setF] = useState(inicial);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [nifExiste, setNifExiste] = useState<{ id: string; nombre: string } | null>(null);
  const [confirmarNif, setConfirmarNif] = useState(false);

  const buscarNif = async (nif: string) => {
    if (!nif || !clienteId) return null;
    const { data } = await supabase
      .from("personal")
      .select("id, nombre, apellido_1, apellido_2")
      .eq("cliente_id", clienteId)
      .ilike("nif", nif)
      .neq("id", p.id)
      .limit(1);
    const o = data?.[0];
    return o ? { id: o.id, nombre: [o.nombre, o.apellido_1, o.apellido_2].filter(Boolean).join(" ") } : null;
  };

  const salirNif = async () => {
    const nif = normalizarNif(f.nif);
    setF((x) => ({ ...x, nif }));
    setNifExiste(await buscarNif(nif));
  };

  const guardar = async (confirmado = false) => {
    const e: Record<string, string> = {};
    if (!f.nombre.trim()) e["nombre"] = "Indica el nombre.";
    if (!f.apellido_1.trim()) e["apellido_1"] = "Indica el primer apellido.";
    const nif = normalizarNif(f.nif);
    if (!nif) e["nif"] = "Indica el NIF.";
    const email = f.email.trim().toLowerCase();
    if (email && !EMAIL_RE.test(email)) e["email"] = "Indica un email válido.";
    if (email && !e["email"] && clienteId) {
      const { data } = await supabase
        .from("personal")
        .select("id, nombre, apellido_1, apellido_2")
        .eq("cliente_id", clienteId)
        .ilike("email", email)
        .neq("id", p.id)
        .limit(1);
      const o = data?.[0];
      if (o) e["email"] = `Ya existe una persona con este email en tu empresa: ${[o.nombre, o.apellido_1, o.apellido_2].filter(Boolean).join(" ")}.`;
    }
    setF((x) => ({ ...x, nif }));
    const dupe = nif ? await buscarNif(nif) : null;
    setNifExiste(dupe);
    setErrores(e);
    if (Object.keys(e).length || dupe) return;
    if (nif !== p.nif && !confirmado) {
      setConfirmarNif(true);
      return;
    }
    setGuardando(true);
    const { error } = await supabase
      .from("personal")
      .update({
        nombre: f.nombre.trim(),
        apellido_1: f.apellido_1.trim(),
        apellido_2: f.apellido_2.trim() || null,
        nif,
        email: email || null,
        telefono: f.telefono.trim() || null,
      })
      .eq("id", p.id);
    setGuardando(false);
    if (error) {
      if (error.code === "23505") {
        if (error.message.includes("email")) setErrores({ email: "Ya existe una persona con este email en tu empresa." });
        else setNifExiste((await buscarNif(nif)) ?? { id: "", nombre: "" });
      } else toast.error("No se ha podido guardar.");
      return;
    }
    await onGuardado();
    setEditando(false);
  };

  const campo = (k: "nombre" | "apellido_1" | "apellido_2" | "email" | "telefono", label: string) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input value={f[k]} onChange={(ev) => setF((x) => ({ ...x, [k]: ev.target.value }))} />
      {errores[k] && <p className="text-sm text-destructive">{errores[k]}</p>}
    </div>
  );

  return (
    <Card>
      <AlertDialog open={confirmarNif} onOpenChange={setConfirmarNif}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambiar NIF</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a cambiar el NIF de {[p.nombre, p.apellido_1, p.apellido_2].filter(Boolean).join(" ")}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmarNif(false);
                void guardar(true);
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <CabeceraCard
        titulo="Datos personales"
        editando={editando}
        puedeEditar={puedeEditar}
        guardando={guardando || !!nifExiste}
        onEditar={() => {
          setF(inicial());
          setErrores({});
          setNifExiste(null);
          setEditando(true);
        }}
        onCancelar={() => setEditando(false)}
        onGuardar={() => void guardar()}
      />
      <CardContent>
        {editando ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {campo("nombre", "Nombre *")}
            {campo("apellido_1", "Primer apellido *")}
            {campo("apellido_2", "Segundo apellido")}
            <div className="space-y-1">
              <Label>NIF *</Label>
              <Input
                value={f.nif}
                onChange={(ev) => {
                  setF((x) => ({ ...x, nif: ev.target.value }));
                  setNifExiste(null);
                }}
                onBlur={() => void salirNif()}
              />
              {errores["nif"] && <p className="text-sm text-destructive">{errores["nif"]}</p>}
              {nifExiste && (
                <div className="flex items-center justify-between gap-2 text-sm text-destructive">
                  <span>Ya existe una persona con este NIF en tu empresa: {nifExiste.nombre}.</span>
                  {nifExiste.id && (
                    <Button asChild size="sm" variant="outline">
                      <Link to={`${LISTADO}/${nifExiste.id}` as never}>Abrir ficha</Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
            {campo("email", "Email")}
            {campo("telefono", "Teléfono")}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <Dato label="Nombre">{p.nombre}</Dato>
            <Dato label="Apellidos">{[p.apellido_1, p.apellido_2].filter(Boolean).join(" ")}</Dato>
            <Dato label="NIF">{p.nif}</Dato>
            <Dato label="Email">{p.email}</Dato>
            <Dato label="Teléfono">{p.telefono}</Dato>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DatosLaborales({
  p,
  clienteId,
  catalogos,
  puedeEditar,
  onGuardado,
}: {
  p: Persona;
  clienteId?: string | undefined;
  catalogos: CatalogoPersonal[];
  puedeEditar: boolean;
  onGuardado: () => Promise<void>;
}) {
  const inicial = () => ({
    departamento_id: p.departamento_id,
    puesto_id: p.puesto_id,
    tipo_contrato_id: p.tipo_contrato_id,
    centro_trabajo_id: p.centro_trabajo_id,
    codigo_empleado: p.codigo_empleado ?? "",
    fecha_alta: p.fecha_alta ?? "",
    estado_id: p.estado_id,
    fecha_baja: p.fecha_baja ?? "",
    motivo_baja_id: p.motivo_baja_id,
  });
  const [editando, setEditando] = useState(false);
  const [f, setF] = useState(inicial);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [estadoPendiente, setEstadoPendiente] = useState<string | null>(null);
  const [codigoExiste, setCodigoExiste] = useState<{ id: string; nombre: string } | null>(null);

  const salirCodigo = async () => {
    if (!clienteId) return;
    setCodigoExiste(await buscarCodigoEmpleado(clienteId, f.codigo_empleado, p.id));
  };

  const codigo = (id: string | null) => catalogos.find((c) => c.id === id)?.codigo ?? null;
  const esBaja = codigo(f.estado_id) === "baja_empresa";
  const set = <K extends keyof ReturnType<typeof inicial>>(k: K, v: ReturnType<typeof inicial>[K]) =>
    setF((x) => ({ ...x, [k]: v }));

  const cambiarEstado = (v: string | null) => {
    if (esBaja && codigo(v) !== "baja_empresa" && (f.fecha_baja || f.motivo_baja_id)) {
      setEstadoPendiente(v);
      return;
    }
    set("estado_id", v);
  };

  const guardar = async () => {
    const e: Record<string, string> = {};
    if (!f.departamento_id && p.departamento_id) e["departamento_id"] = "Indica el departamento.";
    if (!f.puesto_id && p.puesto_id) e["puesto_id"] = "Indica el puesto.";
    if (!f.fecha_alta && p.fecha_alta) e["fecha_alta"] = "Indica la fecha de alta.";
    if (esBaja) {
      if (!f.fecha_baja) e["fecha_baja"] = "Indica la fecha de baja.";
      else if (f.fecha_alta && f.fecha_baja < f.fecha_alta) e["fecha_baja"] = "La fecha de baja no puede ser anterior a la de alta.";
      if (!f.motivo_baja_id) e["motivo_baja_id"] = "Indica el motivo de baja.";
    }
    setErrores(e);
    if (Object.keys(e).length) return;
    const dupeCodigo = clienteId ? await buscarCodigoEmpleado(clienteId, f.codigo_empleado, p.id) : null;
    setCodigoExiste(dupeCodigo);
    if (dupeCodigo) return;
    setGuardando(true);
    const { error } = await supabase
      .from("personal")
      .update({
        departamento_id: f.departamento_id,
        puesto_id: f.puesto_id,
        tipo_contrato_id: f.tipo_contrato_id,
        centro_trabajo_id: f.centro_trabajo_id,
        codigo_empleado: f.codigo_empleado.trim() || null,
        fecha_alta: f.fecha_alta || null,
        estado_id: f.estado_id,
        fecha_baja: esBaja ? f.fecha_baja : null,
        motivo_baja_id: esBaja ? f.motivo_baja_id : null,
      })
      .eq("id", p.id);
    setGuardando(false);
    if (error) {
      toast.error("No se ha podido guardar.");
      return;
    }
    await onGuardado();
    setEditando(false);
  };

  const err = (k: string) => errores[k] && <p className="text-sm text-destructive">{errores[k]}</p>;
  const sel = (k: "departamento_id" | "puesto_id" | "tipo_contrato_id" | "centro_trabajo_id" | "motivo_baja_id", tipo: string, label: string, vacio: boolean) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      <CatalogoSelect catalogos={catalogos} tipo={tipo} value={f[k]} onChange={(v) => set(k, v)} permitirVacio={vacio} />
      {err(k)}
    </div>
  );
  const pBaja = codigo(p.estado_id) === "baja_empresa";

  return (
    <Card>
      <CabeceraCard
        titulo="Datos laborales"
        editando={editando}
        puedeEditar={puedeEditar}
        guardando={guardando}
        onEditar={() => {
          setF(inicial());
          setErrores({});
          setEditando(true);
        }}
        onCancelar={() => setEditando(false)}
        onGuardar={() => void guardar()}
      />
      <CardContent>
        {editando ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {sel("departamento_id", "departamento", p.departamento_id ? "Departamento *" : "Departamento", !p.departamento_id)}
            {sel("puesto_id", "puesto", p.puesto_id ? "Puesto *" : "Puesto", !p.puesto_id)}
            {sel("tipo_contrato_id", "tipo_contrato", "Tipo de contrato", true)}
            {sel("centro_trabajo_id", "centro_trabajo", "Centro de trabajo", true)}
            <div className="space-y-1">
              <Label>Nº de empleado</Label>
              <Input value={f.codigo_empleado} onChange={(e) => set("codigo_empleado", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{p.fecha_alta ? "Fecha de alta *" : "Fecha de alta"}</Label>
              <Input type="date" value={f.fecha_alta} onChange={(e) => set("fecha_alta", e.target.value)} />
              {err("fecha_alta")}
            </div>
            <div className="space-y-1">
              <Label>Estado</Label>
              <CatalogoSelect catalogos={catalogos} tipo="estado_personal" value={f.estado_id} onChange={cambiarEstado} />
            </div>
            {esBaja && (
              <>
                <div className="space-y-1">
                  <Label>Fecha de baja *</Label>
                  <Input type="date" value={f.fecha_baja} min={f.fecha_alta || undefined} onChange={(e) => set("fecha_baja", e.target.value)} />
                  {err("fecha_baja")}
                </div>
                {sel("motivo_baja_id", "motivo_baja", "Motivo de baja *", false)}
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <Dato label="Departamento">{nombreCat(catalogos, p.departamento_id)}</Dato>
            <Dato label="Puesto">{nombreCat(catalogos, p.puesto_id)}</Dato>
            <Dato label="Tipo de contrato">{nombreCat(catalogos, p.tipo_contrato_id)}</Dato>
            <Dato label="Centro de trabajo">{nombreCat(catalogos, p.centro_trabajo_id)}</Dato>
            <Dato label="Nº de empleado">{p.codigo_empleado}</Dato>
            <Dato label="Fecha de alta">{p.fecha_alta ? fechaCorta(p.fecha_alta) : null}</Dato>
            <Dato label="Estado">{nombreCat(catalogos, p.estado_id)}</Dato>
            {pBaja && (
              <>
                <Dato label="Fecha de baja">{p.fecha_baja ? fechaCorta(p.fecha_baja) : null}</Dato>
                <Dato label="Motivo de baja">{nombreCat(catalogos, p.motivo_baja_id)}</Dato>
              </>
            )}
          </div>
        )}
      </CardContent>

      <AlertDialog open={estadoPendiente !== null} onOpenChange={(o) => !o && setEstadoPendiente(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambiar estado</AlertDialogTitle>
            <AlertDialogDescription>Se borrarán la fecha y el motivo de baja</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setF((x) => ({ ...x, estado_id: estadoPendiente, fecha_baja: "", motivo_baja_id: null }));
                setEstadoPendiente(null);
              }}
            >
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
