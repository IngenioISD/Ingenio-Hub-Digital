import { Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { BuscarCombobox } from "@/components/datos-maestros/BuscarCombobox";
import { NuevaPropiedadDialog, normalizarNif } from "@/components/datos-maestros/NuevaPropiedadDialog";
import { Button } from "@/components/ui/button";

export interface PropiedadSeleccion {
  id: string | null;
  label: string | null;
  inactiva: boolean;
}

/**
 * Selector de propiedad del cliente (búsqueda por NIF, activas e inactivas,
 * aviso de reactivación y alta rápida). La reactivación la hace quien guarda.
 */
export function PropiedadSelector({
  clienteId,
  value,
  onChange,
}: {
  clienteId: string | null | undefined;
  value: PropiedadSeleccion;
  onChange: (v: PropiedadSeleccion) => void;
}) {
  const qc = useQueryClient();
  return (
    <>
      <BuscarCombobox
        placeholder="Buscar por NIF…"
        queryKey={["datos-maestros", "propiedad-search", clienteId]}
        search={async (term) => {
          if (!clienteId) return [];
          const nifTerm = normalizarNif(term);
          let qb = supabase
            .from("propiedad")
            .select("id, nif, nombre_legal, clientes_propiedades!inner(cliente_id, nombre_comercial, activo)")
            .eq("clientes_propiedades.cliente_id", clienteId);
          if (nifTerm) qb = qb.ilike("nif", `%${nifTerm}%`);
          const { data, error } = await qb;
          if (error) throw error;
          return (data ?? [])
            .map((p) => {
              const cp = (Array.isArray(p.clientes_propiedades) ? p.clientes_propiedades[0] : p.clientes_propiedades) as
                | { nombre_comercial?: string | null; activo?: boolean | null }
                | null;
              return {
                id: p.id as string,
                nif: (p.nif ?? "") as string,
                nombre_legal: (p.nombre_legal ?? null) as string | null,
                nombre_comercial: cp?.nombre_comercial ?? null,
                activo: cp?.activo !== false,
              };
            })
            .sort((a, b) =>
              (a.nombre_comercial || a.nombre_legal || "").localeCompare(b.nombre_comercial || b.nombre_legal || "", "es"),
            )
            .slice(0, 20);
        }}
        getLabel={(p) => p.nombre_comercial || p.nombre_legal || p.nif || "—"}
        getSubLabel={(p) => (p.activo ? p.nif : `${p.nif} · Desactivada`)}
        getItemClassName={(p) => (p.activo ? undefined : "opacity-50")}
        getValue={(p) => p.id}
        value={value.id}
        selectedLabel={value.label}
        onSelect={(p) =>
          onChange({ id: p.id, label: p.nombre_comercial || p.nombre_legal || p.nif, inactiva: !p.activo })
        }
        emptyMessage="Sin propiedades vinculadas todavía."
      />
      {value.inactiva && (
        <p className="text-xs text-muted-foreground">
          Esta propiedad se volverá a activar, ya que estaba desactivada.
        </p>
      )}
      <NuevaPropiedadDialog
        trigger={
          <Button type="button" variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" /> Crear propiedad
          </Button>
        }
        onCreated={(p) => {
          onChange({ id: p.id, label: p.nombre_comercial || p.nombre_legal || p.nif, inactiva: false });
          qc.invalidateQueries({ queryKey: ["datos-maestros", "propiedad-search"] });
        }}
      />
    </>
  );
}

/** Reactiva la vinculación cliente–propiedad (se llama al guardar). */
export async function reactivarPropiedad(clienteId: string, propiedadId: string) {
  const { error } = await supabase
    .from("clientes_propiedades")
    .update({ activo: true })
    .eq("cliente_id", clienteId)
    .eq("propiedad_id", propiedadId);
  if (error) throw error;
}
