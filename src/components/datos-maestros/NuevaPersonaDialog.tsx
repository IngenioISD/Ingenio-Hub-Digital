import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type CatalogoPersonal = { id: string; tipo: string; codigo: string | null; nombre: string; activo: boolean };

export const NINGUNO = "__ninguno__";

export function normalizarNif(s: string) {
  return s.toUpperCase().replace(/[\s.\-]/g, "");
}
/** Nº de empleado: sin espacios, minúsculas, sin ceros iniciales ("000" → "0"). */
export function normalizarCodigoEmpleado(s: string) {
  const t = s.replace(/\s/g, "").toLowerCase();
  if (!t) return "";
  return t.replace(/^0+/, "") || "0";
}
export function normalizarTexto(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Todos los valores de catálogo del cliente (activos e inactivos). */
export function useCatalogosPersonal(clienteId?: string) {
  return useQuery({
    queryKey: ["datos-maestros", "personal-catalogos-full", clienteId],
    enabled: !!clienteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cliente_catalogos")
        .select("id, tipo, codigo, nombre, activo")
        .eq("cliente_id", clienteId!);
      if (error) throw error;
      return (data ?? []) as CatalogoPersonal[];
    },
  });
}

/** Desplegable de catálogo: activos en orden alfabético + el valor actual en gris si está inactivo. */
export function CatalogoSelect({
  catalogos,
  tipo,
  value,
  onChange,
  permitirVacio,
  placeholder = "Selecciona…",
}: {
  catalogos: CatalogoPersonal[];
  tipo: string;
  value: string | null;
  onChange: (v: string | null) => void;
  permitirVacio?: boolean;
  placeholder?: string;
}) {
  const ops = catalogos
    .filter((c) => c.tipo === tipo && (c.activo || c.id === value))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  return (
    <Select value={value ?? (permitirVacio ? NINGUNO : "")} onValueChange={(v) => onChange(v === NINGUNO ? null : v)}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {permitirVacio && <SelectItem value={NINGUNO}>—</SelectItem>}
        {ops.map((o) => (
          <SelectItem key={o.id} value={o.id} className={o.activo ? undefined : "text-muted-foreground"}>
            {o.nombre}
            {!o.activo && " (desactivado)"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type Existe = { id: string; nombre: string; campo: "nif" | "email" | "codigo" };

/** Busca en el personal del cliente a alguien con el mismo Nº de empleado (normalizado). */
export async function buscarCodigoEmpleado(
  clienteId: string,
  codigo: string,
  excluirId?: string,
): Promise<{ id: string; nombre: string } | null> {
  const clave = normalizarCodigoEmpleado(codigo);
  if (!clave) return null;
  const { data } = await supabase
    .from("personal")
    .select("id, nombre, apellido_1, apellido_2, codigo_empleado")
    .eq("cliente_id", clienteId)
    .not("codigo_empleado", "is", null);
  const o = (data ?? []).find((x) => x.id !== excluirId && normalizarCodigoEmpleado(x.codigo_empleado ?? "") === clave);
  return o ? { id: o.id, nombre: [o.nombre, o.apellido_1, o.apellido_2].filter(Boolean).join(" ") } : null;
}

function hoyIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const VACIO = {
  nif: "",
  nombre: "",
  apellido_1: "",
  apellido_2: "",
  email: "",
  telefono: "",
  departamento_id: null as string | null,
  puesto_id: null as string | null,
  tipo_contrato_id: null as string | null,
  centro_trabajo_id: null as string | null,
  codigo_empleado: "",
  fecha_alta: "",
};

export function NuevaPersonaDialog() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { usuarioCliente } = useAuth();
  const clienteId = usuarioCliente?.cliente_id;
  const { data: catalogos = [] } = useCatalogosPersonal(clienteId);

  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ ...VACIO, fecha_alta: hoyIso() });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [existe, setExiste] = useState<Existe | null>(null);
  const [avisoNombre, setAvisoNombre] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  const reset = () => {
    setF({ ...VACIO, fecha_alta: hoyIso() });
    setErrores({});
    setExiste(null);
    setAvisoNombre(false);
  };

  const salirCodigo = async () => {
    if (!clienteId) return;
    const e = await buscarCodigoEmpleado(clienteId, f.codigo_empleado);
    setExiste(e ? { ...e, campo: "codigo" } : existe?.campo === "codigo" ? null : existe);
  };

  const buscarPor = async (campo: "nif" | "email", valor: string): Promise<Existe | null> => {
    if (!valor || !clienteId) return null;
    const q = supabase.from("personal").select("id, nombre, apellido_1, apellido_2").eq("cliente_id", clienteId);
    const { data } = await (campo === "nif" ? q.ilike("nif", valor) : q.ilike("email", valor)).limit(1);
    const p = data?.[0];
    return p ? { id: p.id, nombre: [p.nombre, p.apellido_1, p.apellido_2].filter(Boolean).join(" "), campo } : null;
  };

  const salirNif = async () => {
    const nif = normalizarNif(f.nif);
    set("nif", nif);
    const e = await buscarPor("nif", nif);
    setExiste(e);
  };

  const salirEmail = async () => {
    const email = f.email.trim().toLowerCase();
    set("email", email);
    if (!email || !EMAIL_RE.test(email)) return;
    const e = await buscarPor("email", email);
    if (e) setExiste(e);
    else if (existe?.campo === "email") setExiste(null);
  };

  const validar = () => {
    const e: Record<string, string> = {};
    if (!normalizarNif(f.nif)) e["nif"] = "Indica el NIF.";
    if (!f.nombre.trim()) e["nombre"] = "Indica el nombre.";
    if (!f.apellido_1.trim()) e["apellido_1"] = "Indica el primer apellido.";
    const email = f.email.trim();
    if (email && !EMAIL_RE.test(email)) e["email"] = "Indica un email válido.";
    if (!f.departamento_id) e["departamento_id"] = "Indica el departamento.";
    if (!f.puesto_id) e["puesto_id"] = "Indica el puesto.";
    if (!f.fecha_alta) e["fecha_alta"] = "Indica la fecha de alta.";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const guardar = async (saltarAvisoNombre = false) => {
    if (!clienteId || !validar()) return;
    const nif = normalizarNif(f.nif);
    const email = f.email.trim().toLowerCase();
    const dupe = (await buscarPor("nif", nif)) ?? (email ? await buscarPor("email", email) : null);
    if (dupe) {
      setExiste(dupe);
      return;
    }
    if (!saltarAvisoNombre) {
      const { data } = await supabase
        .from("personal")
        .select("nombre, apellido_1, apellido_2")
        .eq("cliente_id", clienteId);
      const clave = normalizarTexto(`${f.nombre} ${f.apellido_1} ${f.apellido_2}`);
      if ((data ?? []).some((p) => normalizarTexto(`${p.nombre} ${p.apellido_1} ${p.apellido_2 ?? ""}`) === clave)) {
        setAvisoNombre(true);
        return;
      }
    }
    setGuardando(true);
    const id = crypto.randomUUID();
    const { error } = await supabase.from("personal").insert({
      id,
      cliente_id: clienteId,
      nif,
      nombre: f.nombre.trim(),
      apellido_1: f.apellido_1.trim(),
      apellido_2: f.apellido_2.trim() || null,
      email: email || null,
      telefono: f.telefono.trim() || null,
      departamento_id: f.departamento_id,
      puesto_id: f.puesto_id,
      tipo_contrato_id: f.tipo_contrato_id,
      centro_trabajo_id: f.centro_trabajo_id,
      codigo_empleado: f.codigo_empleado.trim() || null,
      fecha_alta: f.fecha_alta,
    });
    setGuardando(false);
    if (error) {
      if (error.code === "23505") {
        const campo = error.message.includes("email") ? "email" : "nif";
        const e = await buscarPor(campo, campo === "nif" ? nif : email);
        setExiste(e ?? { id: "", nombre: "", campo });
      } else {
        setErrores({ general: "No se ha podido guardar. Inténtalo de nuevo." });
      }
      return;
    }
    await qc.invalidateQueries({ queryKey: ["datos-maestros", "personal"] });
    setOpen(false);
    reset();
    void navigate({ to: `/datos-maestros/accesos-equipo/personal-propio/${id}` as never });
  };

  const err = (k: string) => errores[k] && <p className="text-sm text-destructive">{errores[k]}</p>;
  const campo = (k: "nombre" | "apellido_1" | "apellido_2" | "telefono" | "codigo_empleado", label: string) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input value={f[k]} onChange={(e) => set(k, e.target.value)} />
      {err(k)}
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Nueva persona
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva persona</DialogTitle>
        </DialogHeader>

        {avisoNombre ? (
          <div className="space-y-4">
            <p>Ya hay una persona con este nombre. ¿Es otra persona?</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAvisoNombre(false)}>
                Cancelar
              </Button>
              <Button
                disabled={guardando}
                onClick={() => {
                  setAvisoNombre(false);
                  void guardar(true);
                }}
              >
                Sí, es otra persona
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>NIF *</Label>
              <Input
                value={f.nif}
                onChange={(e) => {
                  set("nif", e.target.value);
                  if (existe?.campo === "nif") setExiste(null);
                }}
                onBlur={() => void salirNif()}
              />
              {err("nif")}
            </div>

            {existe && (
              <div className="flex items-center justify-between gap-3 rounded-md border border-destructive p-3 text-sm">
                <span>Ya existe una persona con este {existe.campo === "nif" ? "NIF" : "email"} en tu empresa: {existe.nombre}.</span>
                {existe.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      void navigate({ to: `/datos-maestros/accesos-equipo/personal-propio/${existe.id}` as never });
                    }}
                  >
                    Abrir ficha
                  </Button>
                )}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              {campo("nombre", "Nombre *")}
              {campo("apellido_1", "Primer apellido *")}
              {campo("apellido_2", "Segundo apellido")}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={f.email}
                  onChange={(e) => {
                    set("email", e.target.value);
                    if (existe?.campo === "email") setExiste(null);
                  }}
                  onBlur={() => void salirEmail()}
                />
                {err("email")}
              </div>
              {campo("telefono", "Teléfono")}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Departamento *</Label>
                <CatalogoSelect catalogos={catalogos} tipo="departamento" value={f.departamento_id} onChange={(v) => set("departamento_id", v)} />
                {err("departamento_id")}
              </div>
              <div className="space-y-1">
                <Label>Puesto *</Label>
                <CatalogoSelect catalogos={catalogos} tipo="puesto" value={f.puesto_id} onChange={(v) => set("puesto_id", v)} />
                {err("puesto_id")}
              </div>
              <div className="space-y-1">
                <Label>Tipo de contrato</Label>
                <CatalogoSelect catalogos={catalogos} tipo="tipo_contrato" value={f.tipo_contrato_id} onChange={(v) => set("tipo_contrato_id", v)} permitirVacio />
              </div>
              <div className="space-y-1">
                <Label>Centro de trabajo</Label>
                <CatalogoSelect catalogos={catalogos} tipo="centro_trabajo" value={f.centro_trabajo_id} onChange={(v) => set("centro_trabajo_id", v)} permitirVacio />
              </div>
              {campo("codigo_empleado", "Nº de empleado")}
              <div className="space-y-1">
                <Label>Fecha de alta *</Label>
                <Input type="date" value={f.fecha_alta} onChange={(e) => set("fecha_alta", e.target.value)} />
                {err("fecha_alta")}
              </div>
            </div>
            {err("general")}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button disabled={guardando || !!existe} onClick={() => void guardar()}>
                Guardar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
