import { describe, expect, it } from "vitest";
import { esEstadoProtegido, motivoNoBorrar, nombreDuplicado } from "./catalogos-reglas";

const ops = [{ id: "1", nombre: "Administración" }, { id: "2", nombre: "Obra" }];

describe("nombreDuplicado", () => {
  it("detecta duplicado sin distinguir mayúsculas, tildes ni espacios", () => {
    expect(nombreDuplicado("  ADMINISTRACION ", ops)).toBe(true);
  });
  it("no cuenta la propia fila al editar", () => {
    expect(nombreDuplicado("administración", ops, "1")).toBe(false);
  });
  it("acepta un nombre nuevo", () => {
    expect(nombreDuplicado("Compras", ops)).toBe(false);
  });
});

describe("esEstadoProtegido", () => {
  it("alta y baja_empresa son protegidos en estados", () => {
    expect(esEstadoProtegido("estado_personal", "alta")).toBe(true);
    expect(esEstadoProtegido("estado_personal", "baja_empresa")).toBe(true);
  });
  it("otros códigos o tipos no", () => {
    expect(esEstadoProtegido("estado_personal", "excedencia")).toBe(false);
    expect(esEstadoProtegido("puesto", "alta")).toBe(false);
    expect(esEstadoProtegido("estado_personal", null)).toBe(false);
  });
});

describe("motivoNoBorrar", () => {
  it("bloquea si está en uso", () => {
    expect(motivoNoBorrar("departamento", null, 3)).toBe("En uso por 3 personas. Puedes desactivarla.");
  });
  it("permite borrar si nadie la usa", () => {
    expect(motivoNoBorrar("departamento", null, 0)).toBeNull();
  });
  it("bloquea estados protegidos aunque no se usen", () => {
    expect(motivoNoBorrar("estado_personal", "alta", 0)).not.toBeNull();
  });
});
