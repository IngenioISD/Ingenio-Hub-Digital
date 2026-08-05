# Pantalla de Proyectos de Ingenio HUB

## Qué se construye

Convertir `/hub/proyectos` en un listado operativo dentro del `AppShell` existente, manteniendo `mode="direccion"`, `contexto="hub"` y `activeItem="proyectos"`. No se añadirá `FranjaModulo`, porque el sistema de diseño indica que no se usa en la pantalla Proyectos.

## Datos y acceso

- Añadir una server function autenticada que obtiene el `cliente_id` activo del usuario y devuelve únicamente sus proyectos.
- Leer los proyectos por bloques para no depender del límite de 1.000 filas de Supabase.
- Resolver en servidor:
  - Propiedad: `clientes_propiedades.nombre_comercial`, con `propiedad.nombre_legal` como respaldo.
  - Región: `catalogo_provincias.nombre` mediante `proyectos.provincia_id`; sin provincia será `null` y se mostrará `—`.
  - Presupuesto: `proyectos_config.presupuesto_venta_estimado`; sin dato se mostrará `—`.
  - Búsqueda: nombre, `codigo_estudios` y `codigo_obra`.
- Mantener la función declarada en un archivo `*.functions.ts` fino y separar la composición de datos en un helper importado, siguiendo las reglas de TanStack Start.
- No se necesitan migraciones ni cambios de RLS.

## Cabecera, filtros y persistencia

- Título “Proyectos” y barra de controles responsive.
- Buscador por nombre o cualquiera de los dos códigos.
- Selects de Propiedad, Región y Tipo de obra, cuyas opciones se deducen exclusivamente de los proyectos recibidos.
- Estado como selector multiselección con `En estudio`, `Adjudicado`, `Perdido` y `Finalizado`.
- Aplicar los cinco criterios con lógica AND.
- Guardar filtros, orden y tamaño de página en `sessionStorage` con una clave específica de `/hub/proyectos`; restaurarlos al volver durante la misma sesión.
- En móvil, mostrar buscador y filtros dentro de un `Sheet`; indicar cuántos filtros están activos y permitir limpiarlos.

## Tabla de escritorio

- Columnas: Proyecto, Propiedad, Tipo de obra, Región, Presupuesto de venta estimado y Estado.
- Cabeceras accesibles y clicables, con indicador de orden ascendente/descendente para cada columna.
- Filas alternas mediante `--bg-muted` y `--bg-surface`, con hover del sistema de diseño.
- Cada fila navegará con `Link` a `/proyecto/$id/inicio` usando parámetros tipados.
- Paginación de 25 filas por defecto y selector 10/25/50/100; al cambiar filtros u orden se ajustará la página si queda fuera de rango.
- Importes con el formateador español existente.
- Ampliar el badge compartido para soportar `perdido`, conservando los estados existentes: estudio/info, adjudicado/success, perdido/error y finalizado/neutral.

## Exportación

- Menú “Exportar” con CSV y Excel.
- Exportar todo el conjunto resultante de búsqueda y filtros, respetando también el orden activo, no solo la página actual ni los registros ocultos.
- CSV con encabezados en español, escape correcto y BOM UTF-8.
- XLSX real generado en cliente con una librería compatible con navegador; las columnas y valores coincidirán con la tabla visible y los importes se conservarán como números formateados.

## Móvil

- Sustituir la tabla por tarjetas apiladas con Proyecto, Propiedad y badge de Estado; la tarjeta completa enlaza al detalle.
- Mostrar 20 resultados inicialmente y cargar bloques adicionales de 20 mediante `IntersectionObserver` al llegar al final.
- Reiniciar el tramo visible al cambiar filtros u orden y mostrar un estado de fin de lista cuando corresponda.

## Estados y acabado

- Añadir estados de carga y error dentro del contenido sin alterar el shell.
- Estado vacío con icono/ilustración de Lucide, mensaje contextual y botón para quitar filtros cuando haya alguno activo.
- Usar `Button`, `Input`, `Select`, `DropdownMenu`, `Sheet` y demás componentes shadcn existentes; colores, radios, fondos y sombras vendrán de tokens semánticos del sistema de diseño.
- Añadir metadata propia de la ruta: title, description, Open Graph, `og:type` y `twitter:card`.

## Verificación

- Comprobar con datos reales que propiedad, provincia y ausencia de presupuesto se representan correctamente.
- Verificar combinaciones de filtros, persistencia al navegar y volver, orden de todas las columnas, paginación y limpieza del estado vacío.
- Abrir una fila/tarjeta y confirmar la navegación a `/proyecto/$id/inicio`.
- Validar que CSV y XLSX contienen exactamente el conjunto filtrado y ordenado.
- Probar escritorio y móvil, incluyendo Sheet de filtros e incremento 20 a 20 del listado móvil.
- Ejecutar la verificación automática del proyecto y revisar que no haya errores de consola.