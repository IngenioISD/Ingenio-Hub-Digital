import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Provincia = { id: string; nombre: string };

/**
 * Desplegable de provincia, siempre sobre el catálogo real (catalogo_provincias,
 * 52 filas), nunca texto libre. Es el patrón a reutilizar en cualquier
 * formulario de Entidades de Obra que pida provincia (Proyectos hoy;
 * Propiedad y Proveedores cuando les llegue el turno).
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
  const { data: provincias = [], isLoading } = useQuery({
    queryKey: ["catalogo_provincias"],
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalogo_provincias")
        .select("id, nombre")
        .order("nombre");
      if (error) throw error;
      return (data ?? []) as Provincia[];
    },
  });

  return (
    <Select value={value ?? undefined} onValueChange={onChange} disabled={disabled || isLoading}>
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
