import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ArrowLeft, Save, Pencil, X, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePermisosDatosMaestros } from "@/hooks/use-permisos-datos-maestros";

import { useProvincias } from "@/components/datos-maestros/ProvinciaSelect";
import { useTiposVia } from "@/components/datos-maestros/TipoViaSelect";
import { DireccionObraFields, type DireccionObra } from "@/components/datos-maestros/DireccionObraFields";
import { TIPOS_PROVEEDOR, normalizarNifProveedor } from "@/components/datos-maestros/NuevoProveedorDialog";

import { BadgeEstado } from "@/components/shared/BadgeEstado";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/datos-maestros/entidades-obra/proveedores/$id")({
  head: () => ({ meta: [{ title: "Proveedor · Datos Maestros · Ingenio HUB" }] }),
  component: ProveedorDetail,
});

const esEspana = (pais: string | null | undefined) => !pais || normalizarTexto(pais) === "espana";

function ProveedorDetail() {
  const { id } = Route.useParams();
  const { usuarioCliente } = useAuth();
  const { puedeEditar } = usePermisosDatosMaestros();
  const clienteId = usuarioCliente?.cliente_id;
  const qc = useQueryClient();
  const queryKey = ["datos-maestros", "proveedor", id, clienteId] as const;

  const { data, isLoading } = useQuery({
    queryKey,
    enabled: !!clienteId,
    queryFn: async () => {
      const [{ data: prov, error: e1 }, { data: cp, error: e2 }] = await Promise.all([
        supabase
          .from("proveedor_subcontrata")
          .select("id, nif, nombre_legal, tipo_proveedor, tipo_via, nombre_via, numero, codigo_postal, municipio, provincia_id, provincia, pais")
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("cliente_proveedores")
          .select("id, nombre_comercial, activo")
          .eq("proveedor_id", id)
          .eq("cliente_id", clienteId!)
          .maybeSingle(),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return { proveedor: prov, clienteProveedor: cp };
    },
  });

  const [editMode, setEditMode] = useState(false);
  const [nif, setNif] = useState("");
  const [nombreLegal, setNombreLegal] = useState("");
  const [nombreComercial, setNombreComercial] = useState("");
  const [tipo, setTipo] = useState("");
  const [dirObra, setDirObra] = useState<DireccionObra>({});
  const [provinciaId, setProvinciaId] = useState<string | null>(null);
  const [provinciaTxt, setProvinciaTxt] = useState("");
  const [errorNif, setErrorNif] = useState<string | null>(null);

  const espana = esEspana(data?.proveedor?.pais);
  const nifValido = espana ? nif.length === 9 : nif.length > 0;

  const resetForm = () => {
    const p = data?.proveedor;
    if (!p) return;
    setNif(p.nif ?? "");
    setNombreLegal(p.nombre_legal ?? "");
    setNombreComercial(data?.clienteProveedor?.nombre_comercial ?? "");
    setTipo(p.tipo_proveedor ?? "");
    setDirObra({ tipoVia: p.tipo_via, via: p.nombre_via, numero: p.numero, cp: p.codigo_postal, municipio: p.municipio });
    setProvinciaId(p.provincia_id);
    setProvinciaTxt(p.provincia ?? "");
  };

  useEffect(() => {
    if (data) resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const { data: tiposVia = [] } = useTiposVia();
  const tipoViaLabel = (codigo: string | null | undefined) =>
    (codigo && tiposVia.find((t) => t.codigo === codigo)?.etiqueta) || codigo || "";
  const { data: provincias = [] } = useProvincias();
  const provinciaNombre = espana ? provincias.find((p) => p.id === provinciaId)?.nombre ?? "" : provinciaTxt;

  const calle = [[tipoViaLabel(dirObra.tipoVia), dirObra.via].filter(Boolean).join(" "), dirObra.numero].filter(Boolean).join(", ");
  const localidad = [dirObra.cp, dirObra.municipio].filter(Boolean).join(" ");
  const localidadConProvincia = provinciaNombre ? [localidad, `(${provinciaNombre})`].filter(Boolean).join(" ") : localidad;
  const direccionTexto = [calle, localidadConProvincia].filter(Boolean).join(". ");

  const save = useMutation({
    mutationFn: async () => {
      const legal = nombreLegal.trim();
      if (!legal) throw new Error("El nombre legal es obligatorio");
      if (!tipo) throw new Error("El tipo de proveedor es obligatorio");
      const { error } = await supabase
        .from("proveedor_subcontrata")
        .update({
          nif,
          nombre_legal: legal,
          tipo_proveedor: tipo,
          tipo_via: dirObra.tipoVia || null,
          nombre_via: dirObra.via || null,
          numero: dirObra.numero || null,
          codigo_postal: dirObra.cp || null,
          municipio: dirObra.municipio || null,
          provincia_id: espana ? provinciaId : null,
          provincia: espana ? null : provinciaTxt.trim() || null,
        })
        .eq("id", id);
      if (error) {
        if (error.code === "23505") throw new Error("Ya existe otro proveedor con ese NIF.");
        throw error;
      }
      if (data?.clienteProveedor?.id) {
        const { error: e2 } = await supabase
          .from("cliente_proveedores")
          .update({ nombre_comercial: nombreComercial.trim() || legal })
          .eq("id", data.clienteProveedor.id);
        if (e2) throw e2;
      }
    },
    onSuccess: () => {
      toast.success("Cambios guardados");
      setEditMode(false);
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ["datos-maestros", "proveedores"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Cargando…</div>;
  if (!data?.proveedor || !data.clienteProveedor) return <div className="text-sm text-muted-foreground">No encontrado.</div>;
  if (data.clienteProveedor.activo === false) {
    return (
      <Card className="mx-auto max-w-3xl p-6">
        <p className="text-sm">Este proveedor está desactivado. Actívalo desde el listado para ver su ficha.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/datos-maestros/entidades-obra/proveedores">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Link>
        </Button>
      </Card>
    );
  }

  const editing = puedeEditar && editMode;
  const pais = data.proveedor.pais;

  const Field = ({ label, value, blankIfEmpty }: { label: string; value: string; blankIfEmpty?: boolean }) => (
    <div className="space-y-1">
      <Label className="text-muted-foreground">{label}</Label>
      <p className="text-sm">{value || (blankIfEmpty ? "" : <span className="text-muted-foreground">—</span>)}</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/datos-maestros/entidades-obra/proveedores">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Link>
        </Button>
        <h1 className="text-xl font-bold">{nombreComercial || nombreLegal}</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Datos generales</CardTitle>
          {puedeEditar && !editing && (
            <Button size="icon" variant="ghost" onClick={() => setEditMode(true)} aria-label="Editar">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {editing && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { resetForm(); setErrorNif(null); setEditMode(false); }}>
                <X className="mr-2 h-4 w-4" /> Cancelar
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (!nifValido) {
                    setErrorNif(espana ? "El NIF debe tener 9 caracteres." : "El NIF es obligatorio.");
                    return;
                  }
                  save.mutate();
                }}
                disabled={save.isPending}
              >
                <Save className="mr-2 h-4 w-4" /> Guardar
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {editing ? (
              <>
                <div className="space-y-1.5">
                  <Label>Nombre legal *</Label>
                  <Input value={nombreLegal} onChange={(e) => setNombreLegal(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Nombre comercial</Label>
                  <Input value={nombreComercial} onChange={(e) => setNombreComercial(e.target.value)} />
                </div>
              </>
            ) : (
              <>
                <Field label="Nombre legal" value={nombreLegal} blankIfEmpty />
                <Field label="Nombre comercial" value={nombreComercial} blankIfEmpty />
              </>
            )}
          </div>

          <div className="border-t pt-4">
            {editing ? (
              <div className="space-y-4">
                <div className="max-w-xs space-y-1.5">
                  <Label>NIF *</Label>
                  <Input
                    value={nif}
                    onChange={(e) => {
                      const v = normalizarNifProveedor(e.target.value);
                      setNif(espana ? v.slice(0, 9) : v);
                      setErrorNif(null);
                    }}
                    maxLength={espana ? 9 : undefined}
                  />
                  {(errorNif || (espana && nif.length > 0 && nif.length !== 9)) && (
                    <p className="text-xs font-medium text-destructive">
                      {errorNif ?? `El NIF debe tener 9 caracteres (${nif.length} de 9).`}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Dirección</Label>
                  {espana ? (
                    <DireccionObraFields value={dirObra} onChange={setDirObra} provinciaId={provinciaId} onProvinciaChange={setProvinciaId} />
                  ) : (
                    <>
                      <DireccionObraFields value={dirObra} onChange={setDirObra} />
                      <div className="max-w-xs space-y-1.5">
                        <Label>Provincia</Label>
                        <Input value={provinciaTxt} onChange={(e) => setProvinciaTxt(e.target.value)} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="NIF" value={nif} />
                <Field label="Dirección" value={direccionTexto} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2">
            {editing ? (
              <div className="space-y-1.5">
                <Label>Tipo de proveedor *</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_PROVEEDOR.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <Field label="Tipo de proveedor" value={tipo} />
            )}
            {!espana && <Field label="País" value={pais ?? ""} />}
          </div>
        </CardContent>
      </Card>

      <ProyectosProveedor proveedorId={id} clienteId={clienteId} />

      <Card>
        <CardHeader>
          <CardTitle>Contactos</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactosProveedor proveedorId={id} clienteId={clienteId} />
        </CardContent>
      </Card>
    </div>
  );
}

function ProyectosProveedor({ proveedorId, clienteId }: { proveedorId: string; clienteId: string | undefined }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["datos-maestros", "proveedor-proyectos", proveedorId, clienteId],
    enabled: !!clienteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proyecto_proveedores")
        .select("proyectos!inner(id, nombre, codigo_obra, codigo_estudios, estado, cliente_id)")
        .eq("proveedor_id", proveedorId)
        .eq("proyectos.cliente_id", clienteId!);
      if (error) throw error;
      const lista = (data ?? [])
        .map((r) => (Array.isArray(r.proyectos) ? r.proyectos[0] : r.proyectos))
        .filter((p): p is NonNullable<typeof p> => !!p);
      const unicos = Array.from(new Map(lista.map((p) => [p.id, p])).values());
      return unicos.sort((a, b) => (a.nombre ?? "").localeCompare(b.nombre ?? "", "es"));
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Proyectos</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
        {!isLoading && data.length === 0 && (
          <p className="text-sm text-muted-foreground">Este proveedor todavía no está asignado a ningún proyecto.</p>
        )}
        <div className="space-y-3">
          {data.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 border-l-2 pl-3">
              <div className="space-y-0.5 text-sm">
                <Link to="/datos-maestros/entidades-obra/proyectos/$id" params={{ id: p.id }} className="font-medium hover:underline">
                  {p.nombre}
                </Link>
                {(p.codigo_obra || p.codigo_estudios) && (
                  <p className="text-xs text-muted-foreground">{p.codigo_obra || p.codigo_estudios}</p>
                )}
              </div>
              <BadgeEstado estado={p.estado} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface ContactoRow {
  linkId: string;
  activo: boolean;
  contacto: {
    id: string;
    nombre: string | null;
    apellido_1: string | null;
    apellido_2: string | null;
    departamento: string | null;
    telefono: string | null;
    email: string | null;
  };
}

function ContactosProveedor({ proveedorId, clienteId }: { proveedorId: string; clienteId: string | undefined }) {
  const { puedeCrear, puedeEditar, puedeEliminar } = usePermisosDatosMaestros();
  const qc = useQueryClient();
  const queryKey = ["datos-maestros", "proveedor-contactos", proveedorId, clienteId] as const;

  const { data = [], isLoading } = useQuery({
    queryKey,
    enabled: !!clienteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cliente_proveedor_contactos")
        .select("id, activo, proveedor_contactos(id, nombre, apellido_1, apellido_2, departamento, telefono, email)")
        .eq("proveedor_id", proveedorId)
        .eq("cliente_id", clienteId!);
      if (error) throw error;
      return (data ?? [])
        .map((r): ContactoRow | null => {
          const c = Array.isArray(r.proveedor_contactos) ? r.proveedor_contactos[0] : r.proveedor_contactos;
          if (!c) return null;
          return { linkId: r.id, activo: r.activo, contacto: c };
        })
        .filter((r): r is ContactoRow => r !== null);
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ linkId, activo }: { linkId: string; activo: boolean }) => {
      const { error } = await supabase.from("cliente_proveedor_contactos").update({ activo }).eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
    onError: (e: Error) => toast.error(e.message),
  });

  const quitar = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase.from("cliente_proveedor_contactos").delete().eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey }); toast.success("Contacto quitado de tu lista"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const [editando, setEditando] = useState<ContactoRow["contacto"] | null>(null);

  return (
    <div className="space-y-3">
      {puedeCrear && <ContactoDialog proveedorId={proveedorId} clienteId={clienteId} queryKey={queryKey} contactos={data} />}

      {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
      {!isLoading && data.length === 0 && <p className="text-sm text-muted-foreground">Sin contactos todavía.</p>}

      <div className="space-y-3">
        {data.map((r) => (
          <div key={r.linkId} className="flex items-start justify-between gap-3 border-l-2 pl-3">
            <div className={`space-y-0.5 text-sm ${r.activo ? "" : "opacity-50"}`}>
              <p className="font-medium">
                {r.contacto.nombre} {r.contacto.apellido_1} {r.contacto.apellido_2 ?? ""}
                {r.contacto.departamento && <span className="ml-1 text-xs text-muted-foreground">({r.contacto.departamento})</span>}
              </p>
              {r.contacto.email && <p className="text-xs text-muted-foreground">{r.contacto.email}</p>}
              {r.contacto.telefono && <p className="text-xs text-muted-foreground">{r.contacto.telefono}</p>}
            </div>
            <div className="flex items-center gap-2">
              {puedeEditar && r.activo && (
                <Button size="icon" variant="ghost" onClick={() => setEditando(r.contacto)} aria-label="Editar contacto">
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {puedeEditar && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => toggle.mutate({ linkId: r.linkId, activo: !r.activo })}
                  aria-label={r.activo ? "Contacto visible: pulsa para ocultarlo" : "Contacto oculto: pulsa para mostrarlo"}
                  title={r.activo ? "Visible: pulsa para ocultarlo" : "Oculto: pulsa para mostrarlo"}
                >
                  {r.activo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                </Button>
              )}
              {puedeEliminar && (
                <Button size="icon" variant="ghost" onClick={() => quitar.mutate(r.linkId)} aria-label="Quitar de este proveedor">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {editando && (
        <ContactoDialog
          proveedorId={proveedorId}
          clienteId={clienteId}
          queryKey={queryKey}
          contacto={editando}
          contactos={data}
          onClose={() => setEditando(null)}
        />
      )}
    </div>
  );
}

/** Normalización única para comparar contactos: minúsculas, sin tildes/diéresis y espacios compactados. */
function normalizarTexto(v: string | null | undefined): string {
  return (v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function ContactoDialog({
  proveedorId, clienteId, queryKey, contacto, onClose, contactos = [],
}: {
  proveedorId: string;
  clienteId: string | undefined;
  queryKey: readonly unknown[];
  /** Si se pasa, el diálogo edita este contacto en vez de crear uno nuevo. */
  contacto?: ContactoRow["contacto"];
  /** Solo en modo edición: se llama al cerrar el diálogo (crea su propio trigger "Añadir"). */
  onClose?: () => void;
  /** Contactos actuales del cliente (activos y ocultos) para detectar duplicados. */
  contactos?: ContactoRow[];
}) {
  const esEdicion = !!contacto;
  const qc = useQueryClient();
  const [open, setOpen] = useState(esEdicion); // en edición se abre ya montado (sin trigger propio)
  const [nombre, setNombre] = useState(contacto?.nombre ?? "");
  const [apellido1, setApellido1] = useState(contacto?.apellido_1 ?? "");
  const [apellido2, setApellido2] = useState(contacto?.apellido_2 ?? "");
  const [departamento, setDepartamento] = useState(contacto?.departamento ?? "");
  const [telefono, setTelefono] = useState(contacto?.telefono ?? "");
  const [email, setEmail] = useState(contacto?.email ?? "");
  const [duplicado, setDuplicado] = useState<ContactoRow | null>(null);
  const [nivelDup, setNivelDup] = useState<1 | 2>(2);

  const reset = () => {
    setNombre(""); setApellido1(""); setApellido2(""); setDepartamento(""); setTelefono(""); setEmail("");
    setDuplicado(null);
  };

  const cerrar = (o: boolean) => {
    setOpen(o);
    if (!o) {
      setDuplicado(null);
      if (esEdicion) onClose?.();
      else reset();
    }
  };

  /** Nivel 1: nombre + apellidos + email coinciden. Nivel 2: nombre + apellidos coinciden, email distinto o ausente. */
  const buscarDuplicado = (): { row: ContactoRow; nivel: 1 | 2 } | null => {
    const n = normalizarTexto(nombre);
    const a1 = normalizarTexto(apellido1);
    const a2 = normalizarTexto(apellido2);
    const em = normalizarTexto(email);
    const mismos = contactos.filter((r) => {
      if (esEdicion && r.contacto.id === contacto!.id) return false;
      return (
        normalizarTexto(r.contacto.nombre) === n &&
        normalizarTexto(r.contacto.apellido_1) === a1 &&
        normalizarTexto(r.contacto.apellido_2) === a2
      );
    });
    const n1 = em ? mismos.find((r) => normalizarTexto(r.contacto.email) === em) : undefined;
    if (n1) return { row: n1, nivel: 1 };
    return mismos[0] ? { row: mismos[0], nivel: 2 } : null;
  };

  const intentarGuardar = () => {
    if (nombre.trim()) {
      const d = buscarDuplicado();
      if (d) { setDuplicado(d.row); setNivelDup(d.nivel); return; }
    }
    guardar.mutate();
  };

  const mostrarExistente = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase.from("cliente_proveedor_contactos").update({ activo: true }).eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contacto mostrado");
      qc.invalidateQueries({ queryKey });
      cerrar(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const guardar = useMutation({
    mutationFn: async () => {
      if (!nombre.trim()) throw new Error("Indica al menos el nombre");
      const campos = {
        nombre: nombre.trim(),
        apellido_1: apellido1.trim() || null,
        apellido_2: apellido2.trim() || null,
        departamento: departamento.trim() || null,
        telefono: telefono.trim() || null,
        email: email.trim() || null,
      };

      if (esEdicion) {
        const { error } = await supabase.from("proveedor_contactos").update(campos).eq("id", contacto!.id);
        if (error) throw error;
        return;
      }

      if (!clienteId) throw new Error("Falta identificar tu empresa");
      const nuevoId = crypto.randomUUID();
      const { error: errNuevo } = await supabase
        .from("proveedor_contactos")
        .insert({ id: nuevoId, proveedor_id: proveedorId, ...campos });
      if (errNuevo) throw errNuevo;

      const { error: errLink } = await supabase.from("cliente_proveedor_contactos").insert({
        cliente_id: clienteId,
        proveedor_id: proveedorId,
        contacto_id: nuevoId,
        activo: true,
      });
      if (errLink) throw errLink;
    },
    onSuccess: () => {
      toast.success(esEdicion ? "Contacto actualizado" : "Contacto añadido");
      qc.invalidateQueries({ queryKey });
      cerrar(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const nombreDup = duplicado
    ? [duplicado.contacto.nombre, duplicado.contacto.apellido_1, duplicado.contacto.apellido_2].filter(Boolean).join(" ")
    : "";

  return (
    <Dialog open={open} onOpenChange={cerrar}>
      {!esEdicion && (
        <DialogTrigger asChild>
          <Button size="sm" variant="outline"><Plus className="mr-2 h-4 w-4" /> Añadir contacto</Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{esEdicion ? "Editar contacto" : "Nuevo contacto"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Primer apellido</Label>
              <Input value={apellido1} onChange={(e) => setApellido1(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Segundo apellido</Label>
              <Input value={apellido2} onChange={(e) => setApellido2(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Departamento / cargo</Label>
            <Input value={departamento} onChange={(e) => setDepartamento(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
        </div>
        {duplicado ? (
          <div role="alert" className="space-y-3 rounded-md border border-[var(--state-warning)] p-3 text-sm">
            <p>
              {nivelDup === 1
                ? `Contacto duplicado: ya tienes a ${nombreDup} con este email.`
                : `Posible contacto duplicado: ya tienes a ${nombreDup} con otros datos de contacto.`}
              {!duplicado.activo && " (está oculto)"}
            </p>
            {nivelDup === 2 && (
              <p className="text-xs text-muted-foreground">
                Email: {duplicado.contacto.email || "—"} · Teléfono: {duplicado.contacto.telefono || "—"}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="ghost" onClick={() => setDuplicado(null)}>Cancelar</Button>
              {!duplicado.activo && !esEdicion && (
                <Button
                  variant="outline"
                  onClick={() => mostrarExistente.mutate(duplicado.linkId)}
                  disabled={mostrarExistente.isPending}
                >
                  Mostrar el existente
                </Button>
              )}
              <Button onClick={() => guardar.mutate()} disabled={guardar.isPending}>
                {esEdicion ? "Guardar de todas formas" : "Crear de todas formas"}
              </Button>
            </div>
          </div>
        ) : (
          <DialogFooter>
            <Button variant="ghost" onClick={() => cerrar(false)}>Cancelar</Button>
            <Button onClick={intentarGuardar} disabled={guardar.isPending}>
              {esEdicion ? "Guardar" : "Añadir"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
