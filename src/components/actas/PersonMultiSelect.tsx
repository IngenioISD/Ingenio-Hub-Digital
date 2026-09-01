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
  return (
    <div
      className="max-h-56 overflow-y-auto p-2"
      style={{
        border: "var(--border-width-thin) solid var(--border-default)",
        borderRadius: "var(--radius-md)",
      }}
    >
      {opciones.length === 0 ? (
        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
          {mensajeVacio}
        </span>
      ) : (
        opciones.map((o) => (
          <label key={o.value} className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              checked={seleccionados.includes(o.value)}
              onChange={(e) => onToggle(o.value, e.target.checked)}
            />
            <span style={{ fontSize: "var(--text-sm)" }}>{o.label}</span>
          </label>
        ))
      )}
    </div>
  );
}
