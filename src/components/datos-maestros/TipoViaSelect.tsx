import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type TipoVia = { id: string; codigo: string; etiqueta: string | null };

/**
 * Lista de tipos de vía (Calle, Avenida, Paseo…) del catálogo genérico
 * `catalogo` (categoria = 'tipo_via'), siempre ordenada alfabéticamente.
 * Cualquier pantalla que necesite esta lista (desplegable o para mostrar la
 * etiqueta de un código) debe usar este hook, nunca su propia consulta con la
 * misma clave: si no, la caché puede devolver la lista sin ordenar.
 */
export function useTiposVia() {
  return useQuery({
    queryKey: ["catalogo", "tipo_via"],
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalogo")
        .select("id, codigo, etiqueta")
        .eq("categoria", "tipo_via");
      if (error) throw error;
      return (data ?? []) as TipoVia[];
    },
    select: (rows) =>
      [...rows].sort((a, b) => (a.etiqueta || a.codigo).localeCompare(b.etiqueta || b.codigo, "es")),
  });
}

/**
 * Desplegable de "tipo de vía". Se usa dentro de <DireccionObraFields />,
 * nunca suelto.
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
  const { data: tipos = [], isLoading } = useTiposVia();

  return (
    <Select value={value ?? ""} onValueChange={onChange} disabled={disabled || isLoading}>
      <SelectTrigger>
        <SelectValue placeholder={isLoading ? "Cargando…" : "Tipo…"} />
      </SelectTrigger>
      <SelectContent>
        {tipos.map((t) => (
          <SelectItem key={t.codigo} value={t.codigo}>
            {t.etiqueta || t.codigo}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
