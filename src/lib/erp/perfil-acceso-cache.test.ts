import { test } from "node:test";
import assert from "node:assert/strict";
import { crearCachePerfil } from "./perfil-acceso-cache";

test("reutiliza el perfil solo durante 30 segundos", async () => {
  let tiempo = 0;
  let llamadas = 0;
  const cache = crearCachePerfil(async () => ({ llamada: ++llamadas }), () => tiempo);
  assert.deepEqual(await cache.consultar("usuario"), { llamada: 1 });
  tiempo = 29_999;
  assert.deepEqual(await cache.consultar("usuario"), { llamada: 1 });
  tiempo = 30_000;
  assert.deepEqual(await cache.consultar("usuario"), { llamada: 2 });
});

test("un perfil null conserva la falta de acceso", async () => {
  const cache = crearCachePerfil(async () => null);
  assert.equal(await cache.consultar("usuario"), null);
});

test("no reutiliza el perfil de otra identidad ni tras cerrar sesión", async () => {
  let llamadas = 0;
  const cache = crearCachePerfil(async () => ++llamadas);
  assert.equal(await cache.consultar("uno"), 1);
  assert.equal(await cache.consultar("dos"), 2);
  cache.limpiar();
  assert.equal(await cache.consultar("dos"), 3);
});