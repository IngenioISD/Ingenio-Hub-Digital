export type ModuloCatalogo = {
  titulo: string;
  descripcion: string;
};

export type CapituloCatalogo = {
  slug:
    | "estudios-ofertas"
    | "gestion-contractual"
    | "operaciones"
    | "gestion-economica"
    | "recursos"
    | "cumplimiento"
    | "documentacion"
    | "riesgos";
  titulo: string;
  modulos: readonly ModuloCatalogo[];
};

// TODO: cuando se conecte el filtrado real, usar la tabla cliente_modulos
// (cliente_id, modulo, activo) ya existente en Supabase para decidir qué ve
// cada cliente. OJO: la columna "modulo" de esa tabla mezcla dos niveles:
// algunos valores son módulos individuales (diario_obra, albaranes,
// repasos_tareas, produccion_costes) y otros son capítulos enteros
// (cumplimiento, documentacion, riesgos, control_economico, rrhh,
// gestion_comercial). Antes de conectar el filtro, confirmar con el cliente
// humano si esa mezcla de granularidad es intencional o si hay que normalizarla
// a un único nivel (por módulo individual) antes de usarla. Y cuando un módulo
// se construya de verdad, quitarle el badge "En desarrollo" y activar su franja
// y ruta de módulo abierto — no antes.
export const CATALOGO_MODULOS: readonly CapituloCatalogo[] = [
  {
    slug: "estudios-ofertas",
    titulo: "Estudios y Ofertas",
    modulos: [
      {
        titulo: "Estudios y Ofertas",
        descripcion: "Generación de estudios de obra con distintas versiones y ofertas asociadas.",
      },
      {
        titulo: "Histórico de Ofertas y Licitaciones",
        descripcion: "Comparativo de licitaciones pasadas por competidor, tipo de obra, fecha y cliente.",
      },
      {
        titulo: "Biblioteca de Costes",
        descripcion: "Costes actuales e históricos de material, maquinaria y mano de obra, por proveedor, región y año.",
      },
      {
        titulo: "Catálogo de Proyectos Ejecutados",
        descripcion: "Experiencias y lecciones aprendidas de proyectos ya ejecutados.",
      },
      {
        titulo: "Plantillas y Versiones",
        descripcion: "Plantillas de estudios, memorias y documentos tipo.",
      },
    ],
  },
  {
    slug: "gestion-contractual",
    titulo: "Gestión Contractual",
    modulos: [
      {
        titulo: "Gestión de Contratos",
        descripcion: "Control de contratos vigentes, fechas contractuales y litigios.",
      },
      {
        titulo: "Órdenes de Cambio",
        descripcion: "Flujo de aprobación automático de órdenes de cambio.",
      },
      {
        titulo: "Decisiones Pendientes",
        descripcion: "Seguimiento de decisiones pendientes de aprobación del cliente.",
      },
      {
        titulo: "Registro de Reclamaciones",
        descripcion: "Seguimiento de reclamaciones al cliente.",
      },
      {
        titulo: "Comunicaciones con Cliente",
        descripcion: "Repositorio de comunicaciones (email, chat, correo) con DF, propiedad y DO.",
      },
      {
        titulo: "Actas de Reuniones con Cliente",
        descripcion: "Documentación de reuniones con clientes.",
      },
      {
        titulo: "Litigios (Legal)",
        descripcion: "Control de litigios de toda la empresa.",
      },
    ],
  },
  {
    slug: "operaciones",
    titulo: "Operaciones",
    modulos: [
      {
        titulo: "Planificación de Obra",
        descripcion: "Planificación temporal de los tajos en obra.",
      },
      {
        titulo: "Planificación de Equipos y Tareas",
        descripcion: "Coordinación de cuadrillas según los tajos a ejecutar.",
      },
      {
        titulo: "Diario de Obra",
        descripcion: "Registro diario de trabajos ejecutados, general o por tajos.",
      },
      {
        titulo: "Partes de Trabajo",
        descripcion: "Registro diario de trabajos ejecutados.",
      },
      {
        titulo: "Control de Albaranes",
        descripcion: "Digitalización, aprobación e imputación a centro de costes de albaranes de obra.",
      },
      {
        titulo: "Repasos y Tareas Pendientes",
        descripcion: "Repasos y deficiencias con avisos y flujo de aprobación.",
      },
      {
        titulo: "Reuniones de Obra",
        descripcion: "Registro de las reuniones de obra.",
      },
    ],
  },
  {
    slug: "gestion-economica",
    titulo: "Gestión Económica",
    modulos: [
      {
        titulo: "Planificación Económica",
        descripcion: "Planificación económica del proyecto.",
      },
      {
        titulo: "Producción y Costes",
        descripcion: "Control de la producción y gestión económica del proyecto.",
      },
      {
        titulo: "Certificaciones y Facturas a Clientes",
        descripcion: "Certifica y genera facturas a clientes de forma automática.",
      },
      {
        titulo: "Ofertas y Comparativos",
        descripcion: "Solicitud de ofertas a proveedores y comparativos.",
      },
      {
        titulo: "Gestión de Compras",
        descripcion: "Gestión de compras a subcontratistas y proveedores.",
      },
      {
        titulo: "Facturas de Proveedores y Subcontratas",
        descripcion: "Recepción, aprobación y remesas de pago de facturas.",
      },
      {
        titulo: "Cash-flow",
        descripcion: "Control de flujo de caja, previsión vs real.",
      },
      {
        titulo: "Gastos Generales",
        descripcion: "Gastos generales no imputables a proyecto.",
      },
      {
        titulo: "Gastos de Personal",
        descripcion: "Digitalización e imputación de gastos de personal.",
      },
      {
        titulo: "Gastos Financieros",
        descripcion: "Gastos financieros y amortizaciones.",
      },
      {
        titulo: "Seguros y Avales",
        descripcion: "Gestión de seguros y avales de todas las obras.",
      },
    ],
  },
  {
    slug: "recursos",
    titulo: "Recursos",
    modulos: [
      {
        titulo: "Control de Acceso a Obra",
        descripcion: "Control digital de acceso, verificando documentación del operario.",
      },
      {
        titulo: "Control Horario",
        descripcion: "Control digital de entrada y salida del personal.",
      },
      {
        titulo: "Control de Almacenes",
        descripcion: "Existencias, entradas y salidas de todos los almacenes y proyectos.",
      },
      {
        titulo: "Control de Pequeña Maquinaria",
        descripcion: "Número y coste de maquinaria propia y alquilada.",
      },
      {
        titulo: "Control de Camiones y Maquinaria Pesada",
        descripcion: "Producción y costes de la flota pesada.",
      },
      {
        titulo: "Control de Flotas",
        descripcion: "Control de los vehículos de flota de cada proyecto.",
      },
      {
        titulo: "Gestión del Parque de Maquinaria",
        descripcion: "Existencias, mantenimiento, coste horario y amortizaciones.",
      },
    ],
  },
  {
    slug: "cumplimiento",
    titulo: "Cumplimiento",
    modulos: [
      {
        titulo: "Documentación de Seguridad y Salud",
        descripcion: "Control automatizado de documentación de S&S de proveedores y personal.",
      },
      {
        titulo: "EPIs y Protecciones Colectivas",
        descripcion: "Recepción de EPIs e inspección/mantenimiento de protecciones colectivas.",
      },
      {
        titulo: "Incidencias de Seguridad y Salud",
        descripcion: "Creación y seguimiento de incidencias y accidentes.",
      },
      {
        titulo: "Inspecciones de Calidad",
        descripcion: "Plan de Calidad de la obra, con seguimiento y aprobaciones.",
      },
      {
        titulo: "No Conformidades",
        descripcion: "Estado, responsables y medidas correctoras.",
      },
      {
        titulo: "Emisiones de CO2",
        descripcion: "Cálculo de emisiones de cada proyecto.",
      },
      {
        titulo: "Gestión de Residuos",
        descripcion: "Gestión de residuos de obra y control de vertederos.",
      },
      {
        titulo: "Permisos y Licencias",
        descripcion: "Solicitudes y permisos/licencias aprobados del proyecto.",
      },
      {
        titulo: "Gestor de Auditorías",
        descripcion: "Docs, informes e inspecciones de auditorías (Calidad, Medioambiente, Seguridad).",
      },
      {
        titulo: "Certificaciones ISO",
        descripcion: "Calidad, Seguridad y Salud, Medioambiente y Seguridad de la Información.",
      },
    ],
  },
  {
    slug: "documentacion",
    titulo: "Documentación",
    modulos: [
      {
        titulo: "Planos",
        descripcion: "Control de versiones y distribución de planos, con visor integrado.",
      },
      {
        titulo: "Fotos y Vídeos",
        descripcion: "Repositorio de fotos y vídeos por obra, con búsqueda por fecha.",
      },
      {
        titulo: "Gestor de Reportes",
        descripcion: "Repositorio de todos los reportes oficiales de obra.",
      },
    ],
  },
  {
    slug: "riesgos",
    titulo: "Riesgos",
    modulos: [
      {
        titulo: "Panel de Riesgos",
        descripcion: "Semáforo global, riesgos abiertos, impacto estimado y tendencia.",
      },
      {
        titulo: "Riesgo de Plazo",
        descripcion: "Hitos comprometidos, retrasos y restricciones críticas.",
      },
      {
        titulo: "Riesgo de Costes",
        descripcion: "Sobrecostes, baja productividad, compras por encima de objetivo.",
      },
      {
        titulo: "Riesgo de Tipo de Cambio",
        descripcion: "Variación de tipo de cambio en proyectos en moneda extranjera.",
      },
      {
        titulo: "Riesgos de Cliente",
        descripcion: "Órdenes de cambio sin aprobar, decisiones pendientes, impago o deuda.",
      },
      {
        titulo: "Riesgo País",
        descripcion: "Falta de estabilidad económica o jurídica del país del proyecto.",
      },
      {
        titulo: "Riesgos de Calidad",
        descripcion: "Incidencias recurrentes, no conformidades abiertas, hallazgos críticos.",
      },
      {
        titulo: "Riesgos PRL",
        descripcion: "Incidencias recurrentes, no conformidades abiertas, hallazgos críticos de PRL.",
      },
    ],
  },
] as const;