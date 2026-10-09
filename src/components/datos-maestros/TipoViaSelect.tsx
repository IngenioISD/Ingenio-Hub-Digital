import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TipoVia = { id: string; codigo: string; etiqueta: string | null };

/**
 * Desplegable de "tipo de vía" (Calle, Avenida, Paseo…), sobre el catálogo
 * genérico `catalogo` (categoria = 'tipo_via'), igual que el "Tipo de obra"
 * de Proyectos. Se usa dentro de <DireccionObraFields />, nunca suelto.
 */
export function TipoViaSelect({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (codigo: string) => void;
  disabled?: boolean;
}) {
  const { data: tipos = [], isLoading } = useQuery({
    queryKey: ["catalogo", "tipo_via"],
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalogo")
        .select("id, codigo, etiqueta")
        .eq("categoria", "tipo_via")
        .order("etiqueta");
      if (error) throw error;
      return (data ?? []) as TipoVia[];
    },
  });

  return (
    <Select value={value ?? ""} onValueChange={onChange} disabled={disabled || isLoading}>
      <SelectTrigger>
        <SelectValue placeholder={isLoading ? "Cargando…" : "Tipo…"} />
      </SelectTrigger>
      <SelectContent>
        {tipos.map((t) => (
          <SelectItem key={t.id} value={t.codigo}>
            {t.etiqueta || t.codigo}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
