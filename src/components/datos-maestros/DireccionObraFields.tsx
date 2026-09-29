import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface DireccionObra {
  via?: string | null;
  numero?: string | null;
  cp?: string | null;
  municipio?: string | null;
}

interface Props {
  value: DireccionObra;
  onChange: (v: DireccionObra) => void;
  requiredKeys?: Array<keyof DireccionObra>;
}

/**
 * Vía, número, código postal y municipio. La provincia queda fuera a
 * propósito — se resuelve con <ProvinciaSelect /> (catálogo real), nunca
 * como texto libre aquí.
 */
export function DireccionObraFields({ value, onChange, requiredKeys }: Props) {
  const set = <K extends keyof DireccionObra>(k: K, v: string) => onChange({ ...value, [k]: v });
  const isReq = (k: keyof DireccionObra) => requiredKeys?.includes(k) ?? false;
  const mark = (k: keyof DireccionObra) => (isReq(k) ? " *" : "");

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
      <div className="space-y-1.5 sm:col-span-4">
        <Label htmlFor="via">Vía{mark("via")}</Label>
        <Input id="via" value={value.via ?? ""} onChange={(e) => set("via", e.target.value)} required={isReq("via")} />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="numero">Número{mark("numero")}</Label>
        <Input id="numero" value={value.numero ?? ""} onChange={(e) => set("numero", e.target.value)} required={isReq("numero")} />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="cp">Código postal{mark("cp")}</Label>
        <Input id="cp" value={value.cp ?? ""} onChange={(e) => set("cp", e.target.value)} required={isReq("cp")} />
      </div>
      <div className="space-y-1.5 sm:col-span-4">
        <Label htmlFor="municipio">Municipio{mark("municipio")}</Label>
        <Input id="municipio" value={value.municipio ?? ""} onChange={(e) => set("municipio", e.target.value)} required={isReq("municipio")} />
      </div>
    </div>
  );
}
