import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ArrowLeft, Save, Trash2, Pencil, X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePermisosDatosMaestros } from "@/hooks/use-permisos-datos-maestros";

import { DireccionObraFields, type DireccionObra } from "@/components/datos-maestros/DireccionObraFields";
import { BuscarCombobox } from "@/components/datos-maestros/BuscarCombobox";
import { PropiedadSelector, reactivarPropiedad, type PropiedadSeleccion } from "@/components/datos-maestros/PropiedadSelector";
import { BadgeEstado } from "@/components/shared/BadgeEstado";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

function formatFecha(v: string | null | undefined): string {
  if (!v) return "";
  const d = new Date(v);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()}`;
}

const ESTADOS = [
  { value: "en_estudio", label: "En estudio" },
  { value: "adjudicado", label: "Adjudicado" },
  { value: "perdido", label: "Perdido" },
  { value: "finalizado", label: "Finalizado" },
] as const;

export const Route = createFileRoute("/_authenticated/datos-maestros/entidades-obra/proyectos/$id")({
  head: () => ({ meta: [{ title: "Proyecto · Datos Maestros · Ingenio HUB" }] }),
  component: Page,
});

function Page() {
  return <ProyectoDetail />;
}

function ProyectoDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { puedeEditar } = usePermisosDatosMaestros();

  const { data, isLoading } = useQuery({
    queryKey: ["datos-maestros", "proyecto", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("proyectos").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [nombre, setNombre] = useState("");
  const [tipoObra, setTipoObra] = useState("");
  const [codigoEstudios, setCodigoEstudios] = useState("");
  const [fechaInicioReal, setFechaInicioReal] = useState("");
  const [fechaFinalizacionReal, setFechaFinalizacionReal] = useState("");
  const [propiedadSel, setPropiedadSel] = useState<PropiedadSeleccion>({ id: null, label: null, inactiva: false });
  const { usuarioCliente } = useAuth();
  const [adjudicarOpen, setAdjudicarOpen] = useState(false);
  const [finalizarOpen, setFinalizarOpen] = useState(false);
  const [avisoFaltaInicioReal, setAvisoFaltaInicioReal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const resetForm = () => {
    if (!data) return;
    setNombre(data.nombre ?? "");
    setTipoObra(data.tipo_obra ?? "");
    setCodigoEstudios(data.codigo_estudios ?? "");
    setFechaInicioReal(data.fecha_inicio_real ?? "");
    setFechaFinalizacionReal(data.fecha_finalizacion_real ?? "");
    setPropiedadSel({ id: data.propiedad_id ?? null, label: null, inactiva: false });
  };

  useEffect(() => {
    if (data) resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const { data: tipos = [] } = useQuery({
    queryKey: ["catalogo", "tipo_obra"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalogo")
        .select("id, codigo, etiqueta")
        .eq("categoria", "tipo_obra");
      if (error) throw error;
      return ((data ?? []) as { id: string; codigo: string; etiqueta: string | null }[]).sort((a, b) =>
        (a.etiqueta || a.codigo).localeCompare(b.etiqueta || b.codigo, "es"),
      );
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (data?.estado === "finalizado" && !fechaFinalizacionReal) {
        throw new Error("La fecha real de finalización es obligatoria en un proyecto Finalizado.");
      }
      if (!propiedadSel.id) throw new Error("Selecciona una propiedad.");
      const { error } = await supabase
        .from("proyectos")
        .update({
          nombre,
          propiedad_id: propiedadSel.id,
          tipo_obra: tipoObra,
          codigo_estudios: data?.estado === "en_estudio" ? (codigoEstudios || null) : data?.codigo_estudios ?? null,
          fecha_inicio_real: data?.estado !== "en_estudio" ? (fechaInicioReal || null) : null,
          fecha_finalizacion_real: data?.estado === "finalizado" ? fechaFinalizacionReal : data?.fecha_finalizacion_real ?? null,
        })
        .eq("id", id);
      if (error) throw error;
      if (propiedadSel.inactiva && usuarioCliente?.cliente_id) {
        await reactivarPropiedad(usuarioCliente.cliente_id, propiedadSel.id);
      }
    },
    onSuccess: () => {
      toast.success("Cambios guardados");
      qc.invalidateQueries({ queryKey: ["datos-maestros", "propiedad-df-card"] });
      setEditMode(false);
      qc.invalidateQueries({ queryKey: ["datos-maestros", "proyecto", id] });
      qc.invalidateQueries({ queryKey: ["datos-maestros", "proyectos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cambiarEstado = useMutation({
    mutationFn: async (nuevo: string) => {
      const { error } = await supabase.from("proyectos").update({ estado: nuevo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["datos-maestros", "proyecto", id] });
      qc.invalidateQueries({ queryKey: ["datos-maestros", "proyectos"] });
      toast.success("Estado actualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Cargando…</div>;
  if (!data) return <div className="text-sm text-muted-foreground">No encontrado.</div>;

  const editing = puedeEditar && editMode;
  const tipoObraLabel = tipos.find((t) => t.codigo === tipoObra)?.etiqueta || tipoObra;

  const Field = ({ label, value, colSpan = "" }: { label: string; value: string; colSpan?: string }) => (
    <div className={`space-y-1 ${colSpan}`}>
      <Label className="text-muted-foreground">{label}</Label>
      <p className="text-sm">{value || <span className="text-muted-foreground">—</span>}</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/datos-maestros/entidades-obra/proyectos">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Link>
          </Button>
          <h1 className="text-xl font-bold">{nombre}</h1>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Datos generales del proyecto</CardTitle>
          {puedeEditar && !editing && (
            <Button size="icon" variant="ghost" onClick={() => setEditMode(true)} aria-label="Editar">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {editing && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { resetForm(); setEditMode(false); }}>
                <X className="mr-2 h-4 w-4" /> Cancelar
              </Button>
              <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
                <Save className="mr-2 h-4 w-4" /> Guardar
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Nombre</Label>
                  <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo de obra</Label>
                  <Select value={tipoObra} onValueChange={setTipoObra}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {tipos.map((t) => (
                        <SelectItem key={t.id} value={t.codigo}>{t.etiqueta || t.codigo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 border-t pt-4">
                <Field label="Código de obra" value={data.codigo_obra ?? ""} />
                {data.estado === "en_estudio" ? (
                  <div className="space-y-1.5">
                    <Label>Código de estudios</Label>
                    <Input value={codigoEstudios} onChange={(e) => setCodigoEstudios(e.target.value)} />
                  </div>
                ) : (
                  <Field label="Código de estudios" value={codigoEstudios} />
                )}
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Nombre" value={nombre} />
                <Field label="Tipo de obra" value={tipoObraLabel} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-t pt-4">
                <Field label="Código de obra" value={data.codigo_obra ?? ""} />
                <Field label="Código de estudios" value={codigoEstudios} />
              </div>
            </>
          )}

          <div className="flex items-center gap-3 border-t pt-4">
            <Label className="m-0">Estado:</Label>
            {editing ? (
              <Select
                value={data.estado ?? "en_estudio"}
                onValueChange={(v) => {
                  if (v === "adjudicado" && data.estado !== "adjudicado") {
                    setAdjudicarOpen(true);
                  } else if (v === "finalizado" && data.estado !== "finalizado") {
                    if (!data.fecha_inicio_real) {
                      setAvisoFaltaInicioReal(true);
                      return;
                    }
                    setFinalizarOpen(true);
                  } else {
                    cambiarEstado.mutate(v);
                  }
                }}
              >
                <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ESTADOS.map((e) => (
                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              data.estado && <BadgeEstado estado={data.estado} />
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 border-t pt-4">
            <Field
              label="Fecha adjudicación"
              value={formatFecha(data.fecha_adjudicacion)}
            />
            <Field
              label="Fecha de inicio (contractual)"
              value={formatFecha(data.fecha_inicio_proyecto)}
            />
            <Field label="Duración (meses)" value={String(data.plazo_ejecucion_meses ?? "")} />
          </div>

          <div className={`grid grid-cols-1 gap-4 border-t pt-4 ${data.estado === "finalizado" ? "sm:grid-cols-2" : "sm:grid-cols-1"}`}>
            {editing && data.estado !== "en_estudio" ? (
              <div className="space-y-1.5 max-w-xs">
                <Label>Fecha de inicio (real)</Label>
                <Input type="date" value={fechaInicioReal} onChange={(e) => setFechaInicioReal(e.target.value)} />
              </div>
            ) : (
              <Field
                label="Fecha de inicio (real)"
                value={formatFecha(data.fecha_inicio_real)}
              />
            )}
            {data.estado === "finalizado" && (
              editing ? (
                <div className="space-y-1.5 max-w-xs">
                  <Label>Fecha real de finalización *</Label>
                  <Input type="date" value={fechaFinalizacionReal} onChange={(e) => setFechaFinalizacionReal(e.target.value)} />
                </div>
              ) : (
                <Field
                  label="Fecha real de finalización"
                  value={formatFecha(data.fecha_finalizacion_real)}
                />
              )
            )}
          </div>
        </CardContent>
      </Card>

      <PropiedadDFCard
        propiedadId={data.propiedad_id ?? null}
        editing={editing}
        propiedadSel={propiedadSel}
        onPropiedadChange={setPropiedadSel}
      />

      <Card>
        <CardHeader>
          <CardTitle>Proveedores asignados</CardTitle>
        </CardHeader>
        <CardContent>
          <ProveedoresAsignados proyectoId={id} />
        </CardContent>
      </Card>

      <AdjudicarDialog
        open={adjudicarOpen}
        onOpenChange={setAdjudicarOpen}
        proyectoId={id}
        initial={data}
        onDone={() => {
          setAdjudicarOpen(false);
          qc.invalidateQueries({ queryKey: ["datos-maestros", "proyecto", id] });
          qc.invalidateQueries({ queryKey: ["datos-maestros", "proyectos"] });
        }}
      />

      <FinalizarDialog
        open={finalizarOpen}
        onOpenChange={setFinalizarOpen}
        proyectoId={id}
        onDone={() => {
          setFinalizarOpen(false);
          qc.invalidateQueries({ queryKey: ["datos-maestros", "proyecto", id] });
          qc.invalidateQueries({ queryKey: ["datos-maestros", "proyectos"] });
        }}
      />

      <AlertDialog open={avisoFaltaInicioReal} onOpenChange={setAvisoFaltaInicioReal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Falta un dato</AlertDialogTitle>
            <AlertDialogDescription>
              Para poder cambiar a estado Finalizado es necesario incluir la fecha de inicio real.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAvisoFaltaInicioReal(false)}>Aceptar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AdjudicarDialog({
  open, onOpenChange, proyectoId, initial, onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  proyectoId: string;
  initial?: Record<string, unknown> | null;
  onDone: () => void;
}) {
  const [codigo, setCodigo] = useState("");
  const [fecha, setFecha] = useState("");
  const [meses, setMeses] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [dir, setDir] = useState<DireccionObra>({});
  const [provinciaId, setProvinciaId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const d = (initial ?? {}) as Record<string, unknown>;
    const str = (v: unknown) => (v == null ? "" : String(v));
    setCodigo(str(d["codigo_obra"]));
    setFecha(str(d["fecha_adjudicacion"]));
    setMeses(d["plazo_ejecucion_meses"] == null ? "" : String(d["plazo_ejecucion_meses"]));
    setFechaInicio(str(d["fecha_inicio_proyecto"]));
    setDir({
      tipoVia: (d["tipo_via"] as string | null) ?? "",
      via: (d["nombre_via"] as string | null) ?? "",
      numero: (d["numero"] as string | null) ?? "",
      cp: (d["codigo_postal"] as string | null) ?? "",
      municipio: (d["municipio"] as string | null) ?? "",
    });
    setProvinciaId((d["provincia_id"] as string | null) ?? null);
  }, [open, initial]);

  async function confirmar() {
    if (!codigo || !fecha || !meses || !dir.municipio || !provinciaId) {
      toast.error("Faltan campos obligatorios para adjudicar.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from("proyectos")
      .update({
        estado: "adjudicado",
        codigo_obra: codigo,
        fecha_adjudicacion: fecha,
        plazo_ejecucion_meses: Number(meses),
        fecha_inicio_proyecto: fechaInicio || null,
        tipo_via: dir.tipoVia ?? null,
        nombre_via: dir.via ?? null,
        numero: dir.numero ?? null,
        codigo_postal: dir.cp ?? null,
        municipio: dir.municipio ?? null,
        provincia_id: provinciaId,
      })
      .eq("id", proyectoId);
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Proyecto adjudicado");
    onDone();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adjudicar proyecto</DialogTitle>
          <DialogDescription>Para pasar el proyecto a Adjudicado necesitas completar estos datos.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Código *</Label>
            <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Fecha de adjudicación *</Label>
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Duración (meses) *</Label>
            <Input type="number" min="1" value={meses} onChange={(e) => setMeses(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5 max-w-xs">
          <Label>Inicio de los trabajos (según contrato)</Label>
          <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
        </div>
        <div className="space-y-2 border-t pt-3">
          <Label className="text-sm font-medium">Dirección de la obra *</Label>
          <DireccionObraFields
            value={dir}
            onChange={setDir}
            requiredKeys={["municipio"]}
            provinciaId={provinciaId}
            onProvinciaChange={setProvinciaId}
            provinciaRequired
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={confirmar} disabled={submitting}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FinalizarDialog({
  open, onOpenChange, proyectoId, onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  proyectoId: string;
  onDone: () => void;
}) {
  const [fecha, setFecha] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) setFecha("");
  }, [open]);

  async function confirmar() {
    if (!fecha) {
      toast.error("La fecha de finalización real es obligatoria.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from("proyectos")
      .update({ estado: "finalizado", fecha_finalizacion_real: fecha })
      .eq("id", proyectoId);
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Proyecto marcado como finalizado");
    onDone();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Finalizar proyecto</DialogTitle>
          <DialogDescription>Indica cuándo terminó de verdad la obra.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Fecha de finalización real *</Label>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={confirmar} disabled={submitting}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface PPRow {
  id: string;
  proveedor_id: string;
  activo: boolean | null;
  proveedor_subcontrata: { nombre_legal: string; nif: string; tipo_proveedor: string | null } | null;
}

function PropiedadDFCard({
  propiedadId,
  editing,
  propiedadSel,
  onPropiedadChange,
}: {
  propiedadId: string | null;
  editing: boolean;
  propiedadSel: PropiedadSeleccion;
  onPropiedadChange: (v: PropiedadSeleccion) => void;
}) {
  const { usuarioCliente } = useAuth();
  const clienteId = usuarioCliente?.cliente_id;

  const { data, isLoading } = useQuery({
    queryKey: ["datos-maestros", "propiedad-df-card", clienteId, propiedadId],
    enabled: !!propiedadId && !!clienteId,
    queryFn: async () => {
      const { data: prop, error: errProp } = await supabase
        .from("propiedad")
        .select("nombre_legal")
        .eq("id", propiedadId!)
        .maybeSingle();
      if (errProp) throw errProp;

      const { data: contactos, error: errContactos } = await supabase
        .from("cliente_propiedad_contactos")
        .select("propiedad_contactos(nombre, apellido_1, apellido_2, departamento, email, telefono)")
        .eq("cliente_id", clienteId!)
        .eq("propiedad_id", propiedadId!)
        .eq("activo", true);
      if (errContactos) throw errContactos;

      return {
        nombreLegal: prop?.nombre_legal ?? null,
        contactos: (contactos ?? [])
          .map((c) => (Array.isArray(c.propiedad_contactos) ? c.propiedad_contactos[0] : c.propiedad_contactos))
          .filter((c): c is NonNullable<typeof c> => !!c),
      };
    },
  });

  return (
    <Card>
      <CardContent className="grid grid-cols-1 gap-6 pt-6 sm:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Propiedad</h3>
          {editing ? (
            <div className="space-y-1.5">
              <PropiedadSelector
                clienteId={clienteId}
                value={{
                  ...propiedadSel,
                  label: propiedadSel.label ?? (propiedadSel.id === propiedadId ? data?.nombreLegal ?? null : null),
                }}
                onChange={onPropiedadChange}
              />
            </div>
          ) : (
          <>
          {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
          {!isLoading && !data?.nombreLegal && <p className="text-sm text-muted-foreground">—</p>}
          {data?.nombreLegal && (
            <div className="space-y-3">
              <p className="text-sm font-medium">{data.nombreLegal}</p>
              {data.contactos.length === 0 && (
                <p className="text-xs text-muted-foreground">Sin contactos asignados.</p>
              )}
              {data.contactos.map((c, i) => (
                <div key={i} className="space-y-0.5 border-l-2 pl-3 text-sm">
                  <p className="font-medium">
                    {c.nombre} {c.apellido_1} {c.apellido_2 ?? ""}
                    {c.departamento && <span className="ml-1 text-xs text-muted-foreground">({c.departamento})</span>}
                  </p>
                  {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                  {c.telefono && <p className="text-xs text-muted-foreground">{c.telefono}</p>}
                </div>
              ))}
            </div>
          )}
          </>
          )}
        </div>

        {/* Dirección Facultativa: misma estructura que Propiedad (lectura: nombre y contactos;
            edición: selector propio). Pendiente de construir en ambos modos. */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Dirección Facultativa</h3>
          {editing ? (
            <p className="text-sm text-muted-foreground">Pendiente de construir.</p>
          ) : (
            <p className="text-sm text-muted-foreground">Pendiente de construir.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ProveedoresAsignados({ proyectoId }: { proyectoId: string }) {
  const { usuarioCliente } = useAuth();
  const clienteId = usuarioCliente?.cliente_id;
  const { puedeCrear, puedeEditar, puedeEliminar } = usePermisosDatosMaestros();
  const qc = useQueryClient();
  const queryKey = ["datos-maestros", "proyecto-proveedores", proyectoId] as const;

  const { data = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proyecto_proveedores")
        .select("id, proveedor_id, activo, proveedor_subcontrata(nombre_legal, nif, tipo_proveedor)")
        .eq("proyecto_id", proyectoId);
      if (error) throw error;
      return (data ?? []) as unknown as PPRow[];
    },
  });

  const asignadosIds = data.map((r) => r.proveedor_id).sort();
  const asignadosKey = asignadosIds.join(",");
  const [todosAsignados, setTodosAsignados] = useState(false);

  const asignar = useMutation({
    mutationFn: async (proveedorId: string) => {
      const { error } = await supabase.from("proyecto_proveedores").insert({
        proyecto_id: proyectoId, proveedor_id: proveedorId, activo: true,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey }); toast.success("Proveedor asignado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const { error } = await supabase.from("proyecto_proveedores").update({ activo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
    onError: (e: Error) => toast.error(e.message),
  });

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("proyecto_proveedores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey }); toast.success("Eliminado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      {puedeCrear && (
        <div className="max-w-md">
          <BuscarCombobox
            placeholder="Asignar proveedor (busca por nombre o NIF)…"
            queryKey={["datos-maestros", "proveedor-search", clienteId, asignadosKey]}
            search={async (term) => {
              if (!clienteId) return [];
              let qb = supabase
                .from("proveedor_subcontrata")
                .select("id, nif, nombre_legal, cliente_proveedores!inner(cliente_id)")
                .eq("cliente_proveedores.cliente_id", clienteId);
              // Excluye en la propia consulta los ya asignados (activos o no) antes del limit.
              if (asignadosIds.length) qb = qb.not("id", "in", `(${asignadosIds.join(",")})`);
              if (term) qb = qb.or(`nombre_legal.ilike.%${term}%,nif.ilike.%${term}%`);
              const { data, error } = await qb.order("nombre_legal", { ascending: true }).limit(20);
              if (error) throw error;
              const lista = (data ?? []) as { id: string; nif: string; nombre_legal: string }[];
              if (lista.length === 0 && !term && asignadosIds.length) {
                const { count } = await supabase
                  .from("proveedor_subcontrata")
                  .select("id, cliente_proveedores!inner(cliente_id)", { count: "exact", head: true })
                  .eq("cliente_proveedores.cliente_id", clienteId);
                setTodosAsignados((count ?? 0) > 0);
              } else {
                setTodosAsignados(false);
              }
              return lista;
            }}
            getLabel={(p) => p.nombre_legal}
            getSubLabel={(p) => p.nif}
            getValue={(p) => p.id}
            onSelect={(p) => asignar.mutate(p.id)}
            emptyMessage={todosAsignados ? "Todos los proveedores ya están asignados." : "Sin proveedores vinculados todavía."}
          />
        </div>
      )}

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proveedor</TableHead>
              <TableHead>NIF</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Cargando…</TableCell></TableRow>
            )}
            {!isLoading && data.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sin proveedores asignados</TableCell></TableRow>
            )}
            {data.map((pp) => (
              <TableRow key={pp.id}>
                <TableCell className="font-medium">{pp.proveedor_subcontrata?.nombre_legal}</TableCell>
                <TableCell>{pp.proveedor_subcontrata?.nif}</TableCell>
                <TableCell>
                  {pp.proveedor_subcontrata?.tipo_proveedor && (
                    <Badge variant="secondary">{pp.proveedor_subcontrata.tipo_proveedor}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={!!pp.activo}
                    disabled={!puedeEditar}
                    onCheckedChange={(activo) => toggle.mutate({ id: pp.id, activo })}
                  />
                </TableCell>
                <TableCell className="text-right">
                  {puedeEliminar && (
                    <Button size="icon" variant="ghost" onClick={() => eliminar.mutate(pp.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
