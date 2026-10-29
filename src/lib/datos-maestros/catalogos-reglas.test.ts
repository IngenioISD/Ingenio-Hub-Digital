import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { esEstadoProtegido, motivoNoBorrar, nombreDuplicado } from "./catalogos-reglas";

const ops = [{ id: "1", nombre: "Administración" }, { id: "2", nombre: "Obra" }];

describe("nombreDuplicado", () => {
  it("detecta duplicado sin distinguir mayúsculas, tildes ni espacios", () => {
    assert.equal(nombreDuplicado("  ADMINISTRACION ", ops), true);
  });
  it("no cuenta la propia fila al editar", () => {
    assert.equal(nombreDuplicado("administración", ops, "1"), false);
  });
  it("acepta un nombre nuevo", () => {
    assert.equal(nombreDuplicado("Compras", ops), false);
  });
});

describe("esEstadoProtegido", () => {
  it("alta y baja_empresa son protegidos en estados", () => {
    assert.equal(esEstadoProtegido("estado_personal", "alta"), true);
    assert.equal(esEstadoProtegido("estado_personal", "baja_empresa"), true);
  });
  it("otros códigos o tipos no", () => {
    assert.equal(esEstadoProtegido("estado_personal", "excedencia"), false);
    assert.equal(esEstadoProtegido("puesto", "alta"), false);
    assert.equal(esEstadoProtegido("estado_personal", null), false);
  });
});

describe("motivoNoBorrar", () => {
  it("bloquea si está en uso", () => {
    assert.equal(motivoNoBorrar("departamento", null, 3), "En uso por 3 personas. Puedes desactivarla.");
  });
  it("permite borrar si nadie la usa", () => {
    assert.equal(motivoNoBorrar("departamento", null, 0), null);
  });
  it("bloquea estados protegidos aunque no se usen", () => {
    assert.notEqual(motivoNoBorrar("estado_personal", "alta", 0), null);
  });
});
