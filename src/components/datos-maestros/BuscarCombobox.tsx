import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

/**
 * Buscador genérico para elegir una entidad ya vinculada al cliente
 * (una propiedad, un proveedor...) entre las que devuelve `search`.
 * No crea entidades nuevas — solo busca y selecciona.
 */
export function BuscarCombobox<T>({
  placeholder,
  queryKey,
  search,
  getLabel,
  getSubLabel,
  getValue,
  getItemClassName,
  value,
  selectedLabel,
  onSelect,
  emptyMessage = "Sin resultados.",
  disabled,
}: {
  placeholder: string;
  queryKey: unknown[];
  search: (term: string) => Promise<T[]>;
  getLabel: (item: T) => string;
  getSubLabel?: (item: T) => string;
  getValue: (item: T) => string;
  getItemClassName?: (item: T) => string | undefined;
  value?: string | null;
  selectedLabel?: string | null;
  onSelect: (item: T) => void;
  emptyMessage?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: [...queryKey, term],
    enabled: open,
    queryFn: () => search(term),
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{selectedLabel || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder={placeholder} value={term} onValueChange={setTerm} />
          <CommandList>
            {!isLoading && <CommandEmpty>{emptyMessage}</CommandEmpty>}
            <CommandGroup>
              {data.map((item) => {
                const itemValue = getValue(item);
                return (
                  <CommandItem
                    key={itemValue}
                    value={itemValue}
                    className={getItemClassName?.(item)}
                    onSelect={() => {
                      onSelect(item);
                      setOpen(false);
                    }}
                  >

                    <Check
                      className={cn("mr-2 h-4 w-4", value === itemValue ? "opacity-100" : "opacity-0")}
                    />
                    <div className="flex flex-col">
                      <span>{getLabel(item)}</span>
                      {getSubLabel && (
                        <span className="text-xs text-muted-foreground">{getSubLabel(item)}</span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
