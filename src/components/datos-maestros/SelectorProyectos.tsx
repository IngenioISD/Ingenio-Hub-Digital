import { useState } from "react";
import { seleccionarVisibles } from "@/lib/datos-maestros/usuario-accesos-reglas";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ProyectoOpcion = { id: string; nombre: string; codigo_obra: string | null };

type Props = {
  proyectos: ProyectoOpcion[];
  cargando: boolean;
  conError: boolean;
  seleccion: string[];
  setSeleccion: (fn: (s: string[]) => string[]) => void;
  deshabilitado: boolean;
  idPrefijo: string;
};

/** Selector de proyectos con buscador, «Seleccionar todos», «Quitar selección» y contador. */
export function SelectorProyectos({ proyectos, cargando, conError, seleccion, setSeleccion, deshabilitado, idPrefijo }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const visibles = proyectos.filter((p) => `${p.nombre} ${p.codigo_obra ?? ""}`.toLocaleLowerCase("es").includes(busqueda.trim().toLocaleLowerCase("es")));
  return <div className="space-y-3">
    <Input aria-label="Buscar proyectos" placeholder="Buscar proyectos" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} disabled={deshabilitado} />
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" disabled={deshabilitado || !visibles.length} onClick={() => setSeleccion((s) => seleccionarVisibles(s, visibles.map((p) => p.id)))}>Seleccionar todos</Button>
      <Button variant="outline" size="sm" disabled={deshabilitado || !seleccion.length} onClick={() => setSeleccion(() => [])}>Quitar selección</Button>
      <span className="text-xs text-muted-foreground">{seleccion.length} seleccionados</span>
    </div>
    <div className="max-h-64 space-y-3 overflow-y-auto">
      {!cargando && !conError && !visibles.length && <p className="text-sm text-muted-foreground">No hay proyectos.</p>}
      {visibles.map((p) => <div key={p.id} className="flex items-start gap-2">
        <Checkbox id={`${idPrefijo}-${p.id}`} checked={seleccion.includes(p.id)} disabled={deshabilitado} onCheckedChange={(checked) => setSeleccion((s) => checked === true ? seleccionarVisibles(s, [p.id]) : s.filter((id) => id !== p.id))} />
        <Label htmlFor={`${idPrefijo}-${p.id}`} className="break-words">{p.codigo_obra ? `${p.codigo_obra} · ` : ""}{p.nombre}</Label>
      </div>)}
    </div>
  </div>;
}
