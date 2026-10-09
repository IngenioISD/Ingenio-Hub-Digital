import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TipoViaSelect } from "@/components/datos-maestros/TipoViaSelect";
import { ProvinciaSelect } from "@/components/datos-maestros/ProvinciaSelect";

export interface DireccionObra {
  tipoVia?: string | null;
  via?: string | null;
  numero?: string | null;
  cp?: string | null;
  municipio?: string | null;
}

interface Props {
  value: DireccionObra;
  onChange: (v: DireccionObra) => void;
  requiredKeys?: Array<keyof DireccionObra>;
  /**
   * Si se pasa `onProvinciaChange`, la provincia se muestra aquí mismo, en la
   * segunda fila junto a código postal y municipio. Si no se pasa, la
   * provincia la pinta quien use este componente (comportamiento anterior).
   */
  provinciaId?: string | null;
  onProvinciaChange?: (provinciaId: string) => void;
  provinciaRequired?: boolean;
}

/**
 * Fila 1: tipo de vía, vía y número. Fila 2: código postal, municipio y
 * (opcionalmente) provincia. El tipo de vía y la provincia salen de catálogos
 * (tabla `catalogo` con categoria = 'tipo_via', y `catalogo_provincias`),
 * nunca de texto libre.
 */
export function DireccionObraFields({
  value,
  onChange,
  requiredKeys,
  provinciaId,
  onProvinciaChange,
  provinciaRequired,
}: Props) {
  const set = <K extends keyof DireccionObra>(k: K, v: string) => onChange({ ...value, [k]: v });
  const isReq = (k: keyof DireccionObra) => requiredKeys?.includes(k) ?? false;
  const mark = (k: keyof DireccionObra) => (isReq(k) ? " *" : "");
  const conProvincia = !!onProvinciaChange;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
      <div className="space-y-1.5 sm:col-span-3">
        <Label>Tipo de vía{mark("tipoVia")}</Label>
        <TipoViaSelect value={value.tipoVia ?? null} onChange={(v) => set("tipoVia", v)} />
      </div>
      <div className="space-y-1.5 sm:col-span-7">
        <Label htmlFor="via">Vía{mark("via")}</Label>
        <Input id="via" value={value.via ?? ""} onChange={(e) => set("via", e.target.value)} required={isReq("via")} />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="numero">Número{mark("numero")}</Label>
        <Input id="numero" value={value.numero ?? ""} onChange={(e) => set("numero", e.target.value)} required={isReq("numero")} />
      </div>

      <div className="space-y-1.5 sm:col-span-3">
        <Label htmlFor="cp">Código postal{mark("cp")}</Label>
        <Input id="cp" value={value.cp ?? ""} onChange={(e) => set("cp", e.target.value)} required={isReq("cp")} />
      </div>
      <div className={`space-y-1.5 ${conProvincia ? "sm:col-span-5" : "sm:col-span-9"}`}>
        <Label htmlFor="municipio">Municipio{mark("municipio")}</Label>
        <Input id="municipio" value={value.municipio ?? ""} onChange={(e) => set("municipio", e.target.value)} required={isReq("municipio")} />
      </div>
      {conProvincia && (
        <div className="space-y-1.5 sm:col-span-4">
          <Label>Provincia{provinciaRequired ? " *" : ""}</Label>
          <ProvinciaSelect value={provinciaId ?? null} onChange={onProvinciaChange!} />
        </div>
      )}
    </div>
  );
}
