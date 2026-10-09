import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type Provincia = { id: string; nombre: string };

/**
 * Lista de provincias del catálogo real (catalogo_provincias, 52 filas),
 * ordenada alfabéticamente. Se comparte con las pantallas que necesiten
 * mostrar el nombre de una provincia a partir de su id.
 */
export function useProvincias() {
  return useQuery({
    queryKey: ["catalogo_provincias"],
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from("catalogo_provincias").select("id, nombre");
      if (error) throw error;
      return ((data ?? []) as Provincia[]).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    },
  });
}

/**
 * Desplegable de provincia, siempre sobre el catálogo real, nunca texto libre.
 * Es el patrón a reutilizar en cualquier formulario que pida provincia.
 */
export function ProvinciaSelect({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (provinciaId: string) => void;
  disabled?: boolean;
}) {
  const { data: provincias = [], isLoading } = useProvincias();

  return (
    <Select value={value ?? ""} onValueChange={onChange} disabled={disabled || isLoading}>
      <SelectTrigger>
        <SelectValue placeholder={isLoading ? "Cargando…" : "Selecciona provincia…"} />
      </SelectTrigger>
      <SelectContent>
        {provincias.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
