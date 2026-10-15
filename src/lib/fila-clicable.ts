import type { KeyboardEvent } from "react";

/**
 * Props para una fila de tabla que abre un detalle: toda la fila es clicable,
 * con cursor de mano y accesible por teclado (Tab + Enter).
 * El color al pasar el ratón lo aporta el propio TableRow (hover:bg-muted/50).
 */
export function filaClicableProps(abrir: () => void) {
  return {
    className: "cursor-pointer",
    role: "link" as const,
    tabIndex: 0,
    onClick: abrir,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        abrir();
      }
    },
  };
}
