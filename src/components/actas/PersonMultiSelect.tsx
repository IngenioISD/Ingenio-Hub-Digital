import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export type OpcionPersona = { value: string; label: string };

export function PersonMultiSelect({
  opciones,
  seleccionados,
  onToggle,
  mensajeVacio,
}: {
  opciones: OpcionPersona[];
  seleccionados: string[];
  onToggle: (value: string, checked: boolean) => void;
  mensajeVacio: string;
}) {
  const [open, setOpen] = useState(false);

  if (opciones.length === 0) {
    return (
      <div
        className="p-2"
        style={{
          border: "var(--border-width-thin) solid var(--border-default)",
          borderRadius: "var(--radius-md)",
        }}
      >
        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{mensajeVacio}</span>
      </div>
    );
  }

  // Hasta 5 opciones: checklist visible (comportamiento original)
  if (opciones.length <= 5) {
    return (
      <div
        className="max-h-56 overflow-y-auto p-2"
        style={{
          border: "var(--border-width-thin) solid var(--border-default)",
          borderRadius: "var(--radius-md)",
        }}
      >
        {opciones.map((o) => (
          <label key={o.value} className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              checked={seleccionados.includes(o.value)}
              onChange={(e) => onToggle(o.value, e.target.checked)}
            />
            <span style={{ fontSize: "var(--text-sm)" }}>{o.label}</span>
          </label>
        ))}
      </div>
    );
  }

  // Más de 5 opciones: desplegable con buscador y selección múltiple
  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="form-select flex w-full items-center justify-between gap-2 text-left"
            style={{ backgroundImage: "none" }}
          >
            <span style={{ color: seleccionados.length > 0 ? undefined : "var(--text-muted)" }}>
              {seleccionados.length > 0 ? `${seleccionados.length} seleccionados` : "Buscar y seleccionar"}
            </span>
            <ChevronsUpDown size={16} className="shrink-0" style={{ color: "var(--text-muted)" }} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar…" />
            <CommandList>
              <CommandEmpty>Sin resultados</CommandEmpty>
              <CommandGroup>
                {opciones.map((o) => (
                  <CommandItem
                    key={o.value}
                    value={o.label}
                    onSelect={() => onToggle(o.value, !seleccionados.includes(o.value))}
                  >
                    <Check
                      size={16}
                      className="mr-2 shrink-0"
                      style={{ opacity: seleccionados.includes(o.value) ? 1 : 0 }}
                    />
                    {o.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {seleccionados.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {seleccionados.map((s) => {
            const o = opciones.find((x) => x.value === s);
            return (
              <span key={s} className="badge badge-neutral gap-1">
                {o?.label ?? s}
                <button type="button" aria-label={`Quitar ${o?.label ?? s}`} onClick={() => onToggle(s, false)}>
                  ×
                </button>
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
