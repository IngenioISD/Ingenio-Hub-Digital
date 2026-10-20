import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, ChevronsUpDown, Eye, EyeOff, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { RolFila } from "@/lib/datos-maestros/usuarios";
import { crearUsuario } from "@/lib/erp/usuarios-alta.functions";
import { MSG_EMAIL_EXISTE, MSG_SIN_EMAIL, passwordValida } from "@/lib/datos-maestros/usuario-alta-reglas";
import { SelectorProyectos, type ProyectoOpcion } from "@/components/datos-maestros/SelectorProyectos";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Persona = { id: string; nombre: string; apellido_1: string; apellido_2: string | null; email: string | null; puesto_id: string | null; rol_sugerido: string | null };
const etiqueta = (p: Persona) => `${[p.apellido_1, p.apellido_2].filter(Boolean).join(" ")}, ${p.nombre}`;

export function NuevoUsuarioDialog({ clienteId, roles }: { clienteId: string; roles: RolFila[] }) {
  const [abierto, setAbierto] = useState(false);
  return <>
    <Button onClick={() => setAbierto(true)}><Plus className="h-4 w-4" />Nuevo usuario</Button>
    {abierto && <Formulario clienteId={clienteId} roles={roles} cerrar={() => setAbierto(false)} />}
  </>;
}

function Formulario({ clienteId, roles, cerrar }: { clienteId: string; roles: RolFila[]; cerrar: () => void }) {
  const qc = useQueryClient();
  const crear = useServerFn(crearUsuario);
  const [personaId, setPersonaId] = useState<string | null>(null);
  const [buscadorAbierto, setBuscadorAbierto] = useState(false);
  const [rol, setRol] = useState("");
  const [todos, setTodos] = useState(false);
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [ver, setVer] = useState(false);

  const rolesInternos = roles.filter((r) => r.tipo_portal === "interno" && r.activo !== false);

  const { data: personas = [], isLoading: cargandoPersonas, isError: errorPersonas, refetch: reintentarPersonas } = useQuery({
    queryKey: ["datos-maestros", "usuarios", clienteId, "personal-sin-usuario"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("personal_sin_usuario", {} as never);
      if (error) {
        console.error("[NuevoUsuarioDialog] Error al cargar el personal:", error.message);
        throw error;
      }
      return ((data ?? []) as Persona[]).sort((a, b) => etiqueta(a).localeCompare(etiqueta(b), "es"));
    },
  });
  const persona = useMemo(() => personas.find((p) => p.id === personaId) ?? null, [personas, personaId]);
  const email = persona?.email?.trim() ?? "";

  const { data: emailExiste, isFetching: comprobandoEmail } = useQuery({
    queryKey: ["datos-maestros", "usuarios", "email-con-cuenta", email],
    enabled: !!email,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("email_con_cuenta", { p_email: email } as never);
      if (error) throw error;
      return data === true;
    },
  });

  const { data: proyectos = [], isLoading: cargandoProy, error: errorProy } = useQuery({
    queryKey: ["datos-maestros", "usuarios", clienteId, "proyectos-excepcion"],
    queryFn: async () => {
      const { data, error } = await supabase.from("proyectos").select("id, nombre, codigo_obra").eq("cliente_id", clienteId).order("nombre");
      if (error) throw error;
      return (data ?? []) as ProyectoOpcion[];
    },
  });

  useEffect(() => {
    const sug = persona?.rol_sugerido;
    setRol(sug && rolesInternos.some((r) => r.rol_id === sug) ? sug : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona?.id]);
  const rolEsSugerido = !!rol && rol === persona?.rol_sugerido;

  const passOk = passwordValida(pass1);
  const coinciden = pass1 === pass2;
  const valido = !!persona && !!email && emailExiste === false && !comprobandoEmail && !!rol
    && (todos || seleccion.length > 0) && passOk && coinciden;

  const guardar = useMutation({
    mutationFn: async () => {
      const r = await crear({ data: { personalId: persona!.id, rolId: rol, accesoTotalProyectos: todos, proyectoIds: todos ? [] : seleccion, password: pass1 } });
      if (!r.ok) throw new Error(r.error);
    },
    onSuccess: async () => {
      toast.success("Usuario creado. Deberá cambiar su contraseña en el primer acceso.");
      cerrar();
      await qc.invalidateQueries({ queryKey: ["datos-maestros", "usuarios"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo crear el usuario"),
  });
  const ocupado = guardar.isPending;
  // Paso 1: sin personal disponible o con error de carga; Paso 2: persona elegida sin problemas.
  const sinPersonal = !cargandoPersonas && !errorPersonas && personas.length === 0;
  const formVisible = !!persona && !!email && emailExiste === false && !comprobandoEmail;

  return (
    <Dialog open onOpenChange={(o) => { if (!o && !ocupado) cerrar(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nuevo usuario</DialogTitle>
          <DialogDescription>Crea el acceso para una persona de Personal.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Persona</Label>
            {errorPersonas ? (
              <>
                <p className="text-sm text-destructive">No se pudo cargar el personal. Inténtalo de nuevo.</p>
                <Button variant="outline" onClick={() => reintentarPersonas()}>Reintentar</Button>
              </>
            ) : sinPersonal ? (
              <p className="text-sm text-muted-foreground">No hay personal pendiente de acceso.</p>
            ) : (
              <Popover open={buscadorAbierto} onOpenChange={setBuscadorAbierto}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={buscadorAbierto} className="w-full justify-between font-normal" disabled={ocupado}>
                    {persona ? etiqueta(persona) : "Selecciona una persona"}
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar persona…" />
                    <CommandList>
                      <CommandEmpty>Sin resultados.</CommandEmpty>
                      <CommandGroup>
                        {personas.map((p) => (
                          <CommandItem key={p.id} value={`${etiqueta(p)} ${p.id}`} onSelect={() => { setPersonaId(p.id); setBuscadorAbierto(false); }}>
                            <Check className={cn("h-4 w-4", p.id === personaId ? "opacity-100" : "opacity-0")} />
                            {etiqueta(p)}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
            {persona && !email && <p className="text-sm text-destructive">{MSG_SIN_EMAIL}</p>}
            {persona && email && <>
              <Input aria-label="Correo electrónico" value={email} readOnly />
              {emailExiste === true && <p className="text-sm text-destructive">{MSG_EMAIL_EXISTE}</p>}
            </>}
          </div>

          {formVisible && <>
          <div className="space-y-2">
            <Label htmlFor="nuevo-usuario-rol">Rol</Label>
            <Select value={rol} onValueChange={setRol} disabled={ocupado}>
              <SelectTrigger id="nuevo-usuario-rol"><SelectValue placeholder="Selecciona un rol" /></SelectTrigger>
              <SelectContent>{rolesInternos.map((r) => <SelectItem key={r.rol_id} value={r.rol_id}>{r.nombre_visible}</SelectItem>)}</SelectContent>
            </Select>
            {rolEsSugerido && <p className="text-xs text-muted-foreground">Rol sugerido según su puesto</p>}
          </div>

          <div className="space-y-3">
            <Label>Proyectos</Label>
            <RadioGroup value={todos ? "todos" : "concretos"} onValueChange={(v) => setTodos(v === "todos")} disabled={ocupado} aria-label="Proyectos del usuario">
              <div className="flex items-center gap-2"><RadioGroupItem id="nuevo-proyectos-concretos" value="concretos" /><Label htmlFor="nuevo-proyectos-concretos">Proyectos concretos</Label></div>
              <div className="flex items-start gap-2"><RadioGroupItem id="nuevo-proyectos-todos" value="todos" /><Label htmlFor="nuevo-proyectos-todos">Todos los proyectos (incluidos los que se creen en el futuro)</Label></div>
            </RadioGroup>
            {!todos && <SelectorProyectos proyectos={proyectos} cargando={cargandoProy} conError={Boolean(errorProy)} seleccion={seleccion} setSeleccion={setSeleccion} deshabilitado={ocupado} idPrefijo="nuevo-usuario-proyecto" />}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nuevo-usuario-pass1">Contraseña temporal</Label>
            <div className="flex gap-2">
              <Input id="nuevo-usuario-pass1" type={ver ? "text" : "password"} autoComplete="new-password" value={pass1} onChange={(e) => setPass1(e.target.value)} disabled={ocupado} />
              <Button type="button" variant="outline" size="icon" aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setVer((v) => !v)} disabled={ocupado}>
                {ver ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <Label htmlFor="nuevo-usuario-pass2">Repetir contraseña</Label>
            <Input id="nuevo-usuario-pass2" type={ver ? "text" : "password"} autoComplete="new-password" value={pass2} onChange={(e) => setPass2(e.target.value)} disabled={ocupado} />
            <p className="text-xs text-muted-foreground">Mínimo 8 caracteres, con letras y números. La persona deberá cambiarla en su primer acceso.</p>
            {pass1 && !passOk && <p className="text-sm text-destructive">La contraseña debe tener al menos 8 caracteres, con letras y números</p>}
            {pass2 && !coinciden && <p className="text-sm text-destructive">Las contraseñas no coinciden</p>}
          </div>
          </>}
        </div>
        <DialogFooter>
          {sinPersonal ? (
            <Button onClick={cerrar}>Cerrar</Button>
          ) : (
            <>
              <Button variant="outline" onClick={cerrar} disabled={ocupado}>Cancelar</Button>
              {formVisible && <Button disabled={!valido || ocupado} onClick={() => guardar.mutate()}>Crear usuario</Button>}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
