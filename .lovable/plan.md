# Contenido real de las tres pantallas de Inicio

Solo se tocan `/digital/inicio`, `/hub/inicio` y `/proyecto/$id/inicio`. Sidebar, Login y el resto de rutas quedan intactos.

Regla transversal: si el dato no existe en base de datos, la tarjeta muestra "—" con un subtítulo gris "Próximamente". Nunca un número inventado ni fijo.

## Comprobaciones hechas sobre la base de datos

- `proyectos`: 7 filas, 6 con estado `adjudicado` (todas con `fecha_inicio_proyecto` y `plazo_ejecucion_meses`) y 1 `en_estudio` (sin ambas fechas). Hay 3 clientes, 6 provincias, 3 tipos de obra y 6 propiedades distintas, así que los filtros tendrán contenido real.
- `proyectos_config` está **vacía**: hoy la tarjeta "Presupuesto Total Previsto" y la columna de presupuesto de la tabla saldrán "—" en todos los casos. La consulta se implementa igual, para que se rellene sola cuando existan datos.
- El nombre comercial de la propiedad **no está en `propiedad`** (esa tabla tiene `nombre_legal`); `nombre_comercial` vive en `clientes_propiedades`, por cliente. Se usará `clientes_propiedades.nombre_comercial` del cliente actual, con `propiedad.nombre_legal` como respaldo cuando esté vacío.
- `/hub/proyectos` es todavía un `<h1>` vacío: **no hay estilo de tabla previo que reutilizar**. Se usarán las clases ya existentes del sistema de diseño (`.table-wrapper`, `.table`, `.badge` + `.badge-success/-info/-neutral`), que son fondo suave + texto del mismo tono, y esa tabla quedará como referencia para cuando se construya `/hub/proyectos`.

## Pantalla 1 — /digital/inicio

- Título "Inicio Digital" y mensaje de bienvenida.
- Dos tarjetas grandes clicables (icono + título + frase corta) hacia `/digital/apps` y `/digital/agentes`.
- Sin gráficos, contadores ni listados de uso.

## Pantalla 2 — /hub/inicio

- Título "Inicio" con la fecha de hoy en formato "Martes, 4 de agosto de 2026" (locale es-ES, calculada en cliente para evitar desajustes de render).
- Fila de 3 filtros (Select de shadcn): **Propiedad**, **Región** (valores de `provincia`) y **Tipo de proyecto** (`tipo_obra`), cada uno con su opción "Todas/Todos" por defecto y alimentados por los proyectos del cliente actual.
- 4 tarjetas de KPI, todas sujetas a los filtros:
  1. Proyectos Activos: recuento de `adjudicado`; subtítulo "X en estudio".
  2. Presupuesto Total Previsto: suma de `presupuesto_venta_estimado` en formato español con €; si es nulo o 0 → "—" y "Sin datos de presupuesto todavía".
  3. Coste Ejecutado: "—" / "Próximamente (Control de Costes)".
  4. Avance Medio de Obra: "—" / "Próximamente (Control de Costes)".
- Tabla (máx. 50 filas, sin paginación): Proyecto, Propiedad, Tipo, Región, Presupuesto de venta estimado (o "—") y Estado como badge suave.

## Pantalla 3 — /proyecto/$id/inicio

- Título "Inicio" con "provincia · tipo_obra" debajo.
- 3 tarjetas de KPI:
  1. Avance de obra: "—" / "Próximamente (Control de Costes)".
  2. Coste ejecutado: "—" / "Próximamente (Control de Costes)".
  3. Días para entrega: `fecha_inicio_proyecto` + `plazo_ejecucion_meses`, días restantes hasta hoy y subtítulo "Fin previsto [mes] [año]". Si no hay fecha de inicio → "—" y "Pendiente de adjudicación".
- Card de información del proyecto: código de obra (o "Pendiente" si está en estudio), tipo de obra, dirección completa, fecha de adjudicación y plazo en meses.

## Notas técnicas

- Datos vía server functions con `requireSupabaseAuth`, llamadas desde componente con TanStack Query; el scope de cliente se toma del `cliente_id`/`empresa_id` del usuario autenticado además de RLS.
- Solo variables CSS de `ingenio-design-system.css`; ningún hex suelto.
- Componentes nuevos reutilizables: `KpiCard` (con estado "próximamente") y `BadgeEstado`.
- Comentario `TODO` en las pantallas 2 y 3: "sustituir estas tarjetas placeholder cuando exista el módulo de Control de Costes (Fase 8)".
- Verificación: build de desarrollo sin errores y revisión de las tres pantallas en el navegador.

## Pendiente de confirmar

La verificación con "un usuario de cada tipo" (Digital, HUB dirección, jefe de obra) requiere credenciales de prueba; sin ellas comprobaré las pantallas con la sesión disponible y lo indicaré explícitamente.
