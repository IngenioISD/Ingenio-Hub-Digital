export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accesos_externos: {
        Row: {
          activo: boolean | null
          cliente_id: string
          creado_en: string | null
          id: string
          puede_crear: boolean | null
          puede_ver: boolean | null
          referencia_id: string
          tipo_acceso: string
          user_id: string
        }
        Insert: {
          activo?: boolean | null
          cliente_id: string
          creado_en?: string | null
          id?: string
          puede_crear?: boolean | null
          puede_ver?: boolean | null
          referencia_id: string
          tipo_acceso: string
          user_id: string
        }
        Update: {
          activo?: boolean | null
          cliente_id?: string
          creado_en?: string | null
          id?: string
          puede_crear?: boolean | null
          puede_ver?: boolean | null
          referencia_id?: string
          tipo_acceso?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accesos_externos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      acta_firmas: {
        Row: {
          acta_id: string
          firma_url: string
          id: string
          usuario_id: string | null
        }
        Insert: {
          acta_id: string
          firma_url: string
          id?: string
          usuario_id?: string | null
        }
        Update: {
          acta_id?: string
          firma_url?: string
          id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acta_firmas_acta_id_fkey"
            columns: ["acta_id"]
            isOneToOne: false
            referencedRelation: "actas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acta_firmas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "personal"
            referencedColumns: ["id"]
          },
        ]
      }
      acta_imagenes: {
        Row: {
          acta_id: string
          id: string
          orden: number | null
          url: string
        }
        Insert: {
          acta_id: string
          id?: string
          orden?: number | null
          url: string
        }
        Update: {
          acta_id?: string
          id?: string
          orden?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "acta_imagenes_acta_id_fkey"
            columns: ["acta_id"]
            isOneToOne: false
            referencedRelation: "actas"
            referencedColumns: ["id"]
          },
        ]
      }
      acta_participantes: {
        Row: {
          acta_id: string
          contacto_id: string | null
          id: string
          nombre_libre: string | null
          referencia_nif: string | null
          tipo_participante: string
        }
        Insert: {
          acta_id: string
          contacto_id?: string | null
          id?: string
          nombre_libre?: string | null
          referencia_nif?: string | null
          tipo_participante: string
        }
        Update: {
          acta_id?: string
          contacto_id?: string | null
          id?: string
          nombre_libre?: string | null
          referencia_nif?: string | null
          tipo_participante?: string
        }
        Relationships: [
          {
            foreignKeyName: "acta_participantes_acta_id_fkey"
            columns: ["acta_id"]
            isOneToOne: false
            referencedRelation: "actas"
            referencedColumns: ["id"]
          },
        ]
      }
      actas: {
        Row: {
          acciones: string | null
          actualizado_en: string | null
          asunto: string
          cliente_id: string
          creado_en: string | null
          creado_por_id: string | null
          email_enviado_en: string | null
          estado: string
          fecha_reunion: string
          id: string
          lugar: string
          nombre_pdf: string | null
          notas: string
          otros_asistentes: string | null
          pdf_url: string | null
          proyecto_codigo: string | null
          proyecto_id: string | null
          tipo_otro_descripcion: string | null
          tipo_reunion: string
        }
        Insert: {
          acciones?: string | null
          actualizado_en?: string | null
          asunto: string
          cliente_id: string
          creado_en?: string | null
          creado_por_id?: string | null
          email_enviado_en?: string | null
          estado?: string
          fecha_reunion: string
          id?: string
          lugar: string
          nombre_pdf?: string | null
          notas: string
          otros_asistentes?: string | null
          pdf_url?: string | null
          proyecto_codigo?: string | null
          proyecto_id?: string | null
          tipo_otro_descripcion?: string | null
          tipo_reunion: string
        }
        Update: {
          acciones?: string | null
          actualizado_en?: string | null
          asunto?: string
          cliente_id?: string
          creado_en?: string | null
          creado_por_id?: string | null
          email_enviado_en?: string | null
          estado?: string
          fecha_reunion?: string
          id?: string
          lugar?: string
          nombre_pdf?: string | null
          notas?: string
          otros_asistentes?: string | null
          pdf_url?: string | null
          proyecto_codigo?: string | null
          proyecto_id?: string | null
          tipo_otro_descripcion?: string | null
          tipo_reunion?: string
        }
        Relationships: [
          {
            foreignKeyName: "actas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actas_creado_por_id_fkey"
            columns: ["creado_por_id"]
            isOneToOne: false
            referencedRelation: "personal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actas_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      albaranes: {
        Row: {
          cliente_id: string
          creado_en: string | null
          creado_por: string | null
          eliminado_en: string | null
          eliminado_por: string | null
          email_rechazo_enviado: boolean | null
          estado_factura: string
          estado_imputacion: string
          estado_validacion: string
          fecha: string | null
          id: string
          imagen_nombre: string | null
          imagen_url: string | null
          importe_total: number | null
          modificado_en: string | null
          motivo_rechazo: string | null
          num_albaran: string | null
          observaciones: string | null
          proveedor_id: string | null
          proveedor_nif: string | null
          proyecto_id: string
          texto_agente_ia: string | null
        }
        Insert: {
          cliente_id: string
          creado_en?: string | null
          creado_por?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          email_rechazo_enviado?: boolean | null
          estado_factura?: string
          estado_imputacion?: string
          estado_validacion?: string
          fecha?: string | null
          id?: string
          imagen_nombre?: string | null
          imagen_url?: string | null
          importe_total?: number | null
          modificado_en?: string | null
          motivo_rechazo?: string | null
          num_albaran?: string | null
          observaciones?: string | null
          proveedor_id?: string | null
          proveedor_nif?: string | null
          proyecto_id: string
          texto_agente_ia?: string | null
        }
        Update: {
          cliente_id?: string
          creado_en?: string | null
          creado_por?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          email_rechazo_enviado?: boolean | null
          estado_factura?: string
          estado_imputacion?: string
          estado_validacion?: string
          fecha?: string | null
          id?: string
          imagen_nombre?: string | null
          imagen_url?: string | null
          importe_total?: number | null
          modificado_en?: string | null
          motivo_rechazo?: string | null
          num_albaran?: string | null
          observaciones?: string | null
          proveedor_id?: string | null
          proveedor_nif?: string | null
          proyecto_id?: string
          texto_agente_ia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "albaranes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "albaranes_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedor_subcontrata"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "albaranes_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      albaranes_historial: {
        Row: {
          albaran_id: string
          campo_modificado: string | null
          cliente_id: string
          creado_en: string | null
          descripcion: string | null
          id: string
          tipo_evento: string
          user_id: string | null
          valor_anterior: string | null
          valor_nuevo: string | null
        }
        Insert: {
          albaran_id: string
          campo_modificado?: string | null
          cliente_id: string
          creado_en?: string | null
          descripcion?: string | null
          id?: string
          tipo_evento: string
          user_id?: string | null
          valor_anterior?: string | null
          valor_nuevo?: string | null
        }
        Update: {
          albaran_id?: string
          campo_modificado?: string | null
          cliente_id?: string
          creado_en?: string | null
          descripcion?: string | null
          id?: string
          tipo_evento?: string
          user_id?: string | null
          valor_anterior?: string | null
          valor_nuevo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "albaranes_historial_albaran_id_fkey"
            columns: ["albaran_id"]
            isOneToOne: false
            referencedRelation: "albaranes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "albaranes_historial_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      albaranes_incidencias: {
        Row: {
          albaran_id: string
          cliente_id: string
          creado_en: string | null
          creado_por: string | null
          descripcion: string
          estado_incidencia: string
          id: string
          resolucion: string | null
          resuelto_en: string | null
          resuelto_por: string | null
          tipo_incidencia: string
        }
        Insert: {
          albaran_id: string
          cliente_id: string
          creado_en?: string | null
          creado_por?: string | null
          descripcion: string
          estado_incidencia?: string
          id?: string
          resolucion?: string | null
          resuelto_en?: string | null
          resuelto_por?: string | null
          tipo_incidencia: string
        }
        Update: {
          albaran_id?: string
          cliente_id?: string
          creado_en?: string | null
          creado_por?: string | null
          descripcion?: string
          estado_incidencia?: string
          id?: string
          resolucion?: string | null
          resuelto_en?: string | null
          resuelto_por?: string | null
          tipo_incidencia?: string
        }
        Relationships: [
          {
            foreignKeyName: "albaranes_incidencias_albaran_id_fkey"
            columns: ["albaran_id"]
            isOneToOne: false
            referencedRelation: "albaranes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "albaranes_incidencias_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      albaranes_lineas: {
        Row: {
          albaran_id: string
          cantidad: number | null
          cliente_id: string
          descripcion: string
          id: string
          importe_linea: number | null
          naturaleza_coste: string | null
          orden: number
          precio_unitario: number | null
          unidad: string | null
        }
        Insert: {
          albaran_id: string
          cantidad?: number | null
          cliente_id: string
          descripcion: string
          id?: string
          importe_linea?: number | null
          naturaleza_coste?: string | null
          orden?: number
          precio_unitario?: number | null
          unidad?: string | null
        }
        Update: {
          albaran_id?: string
          cantidad?: number | null
          cliente_id?: string
          descripcion?: string
          id?: string
          importe_linea?: number | null
          naturaleza_coste?: string | null
          orden?: number
          precio_unitario?: number | null
          unidad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "albaranes_lineas_albaran_id_fkey"
            columns: ["albaran_id"]
            isOneToOne: false
            referencedRelation: "albaranes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "albaranes_lineas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      albaranes_listados: {
        Row: {
          cliente_id: string
          creado_en: string
          creado_por: string | null
          eliminado_en: string | null
          filtro_estados: string[] | null
          filtro_fecha_desde: string | null
          filtro_fecha_hasta: string | null
          filtro_proveedor_nif: string | null
          filtro_proveedor_nombre: string | null
          filtro_proyectos: string[] | null
          id: string
          nombre_fichero: string
          num_registros: number | null
          storage_path: string
          tipo: string
        }
        Insert: {
          cliente_id: string
          creado_en?: string
          creado_por?: string | null
          eliminado_en?: string | null
          filtro_estados?: string[] | null
          filtro_fecha_desde?: string | null
          filtro_fecha_hasta?: string | null
          filtro_proveedor_nif?: string | null
          filtro_proveedor_nombre?: string | null
          filtro_proyectos?: string[] | null
          id?: string
          nombre_fichero: string
          num_registros?: number | null
          storage_path: string
          tipo: string
        }
        Update: {
          cliente_id?: string
          creado_en?: string
          creado_por?: string | null
          eliminado_en?: string | null
          filtro_estados?: string[] | null
          filtro_fecha_desde?: string | null
          filtro_fecha_hasta?: string | null
          filtro_proveedor_nif?: string | null
          filtro_proveedor_nombre?: string | null
          filtro_proyectos?: string[] | null
          id?: string
          nombre_fichero?: string
          num_registros?: number | null
          storage_path?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "albaranes_listados_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      campos_custom_cliente: {
        Row: {
          cliente_id: string
          creado_en: string | null
          etiqueta: string
          id: string
          modulo: string
          nombre_interno: string
          nota_ingenio: string | null
          obligatorio: boolean | null
          orden: number | null
          tipo_dato: string
          validacion_regex: string | null
          visible: boolean | null
        }
        Insert: {
          cliente_id: string
          creado_en?: string | null
          etiqueta: string
          id?: string
          modulo: string
          nombre_interno: string
          nota_ingenio?: string | null
          obligatorio?: boolean | null
          orden?: number | null
          tipo_dato?: string
          validacion_regex?: string | null
          visible?: boolean | null
        }
        Update: {
          cliente_id?: string
          creado_en?: string | null
          etiqueta?: string
          id?: string
          modulo?: string
          nombre_interno?: string
          nota_ingenio?: string | null
          obligatorio?: boolean | null
          orden?: number | null
          tipo_dato?: string
          validacion_regex?: string | null
          visible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "campos_custom_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      catalogo: {
        Row: {
          activo: boolean | null
          categoria: string
          codigo: string
          etiqueta: string
          id: string
          orden: number | null
        }
        Insert: {
          activo?: boolean | null
          categoria: string
          codigo: string
          etiqueta: string
          id?: string
          orden?: number | null
        }
        Update: {
          activo?: boolean | null
          categoria?: string
          codigo?: string
          etiqueta?: string
          id?: string
          orden?: number | null
        }
        Relationships: []
      }
      catalogo_apps: {
        Row: {
          codigo: string
          creado_en: string | null
          descripcion: string | null
          icono: string | null
          id: string
          nombre: string
          url_base: string | null
        }
        Insert: {
          codigo: string
          creado_en?: string | null
          descripcion?: string | null
          icono?: string | null
          id?: string
          nombre: string
          url_base?: string | null
        }
        Update: {
          codigo?: string
          creado_en?: string | null
          descripcion?: string | null
          icono?: string | null
          id?: string
          nombre?: string
          url_base?: string | null
        }
        Relationships: []
      }
      catalogo_campos: {
        Row: {
          activo_por_defecto: boolean | null
          campo_id: string
          creado_en: string | null
          descripcion: string | null
          es_obligatorio_base: boolean | null
          etiqueta_defecto: string
          modulo: string
          nombre_interno: string
          opciones_lista: string[] | null
          orden_defecto: number | null
          tipo_dato: string
          validacion_regex: string | null
        }
        Insert: {
          activo_por_defecto?: boolean | null
          campo_id?: string
          creado_en?: string | null
          descripcion?: string | null
          es_obligatorio_base?: boolean | null
          etiqueta_defecto: string
          modulo: string
          nombre_interno: string
          opciones_lista?: string[] | null
          orden_defecto?: number | null
          tipo_dato: string
          validacion_regex?: string | null
        }
        Update: {
          activo_por_defecto?: boolean | null
          campo_id?: string
          creado_en?: string | null
          descripcion?: string | null
          es_obligatorio_base?: boolean | null
          etiqueta_defecto?: string
          modulo?: string
          nombre_interno?: string
          opciones_lista?: string[] | null
          orden_defecto?: number | null
          tipo_dato?: string
          validacion_regex?: string | null
        }
        Relationships: []
      }
      catalogo_comunidades_autonomas: {
        Row: {
          id: string
          nombre: string
          pais_id: string
        }
        Insert: {
          id?: string
          nombre: string
          pais_id: string
        }
        Update: {
          id?: string
          nombre?: string
          pais_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalogo_comunidades_autonomas_pais_id_fkey"
            columns: ["pais_id"]
            isOneToOne: false
            referencedRelation: "catalogo_paises"
            referencedColumns: ["id"]
          },
        ]
      }
      catalogo_paises: {
        Row: {
          codigo_iso: string | null
          id: string
          nombre: string
        }
        Insert: {
          codigo_iso?: string | null
          id?: string
          nombre: string
        }
        Update: {
          codigo_iso?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      catalogo_provincias: {
        Row: {
          comunidad_autonoma_id: string
          id: string
          nombre: string
        }
        Insert: {
          comunidad_autonoma_id: string
          id?: string
          nombre: string
        }
        Update: {
          comunidad_autonoma_id?: string
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalogo_provincias_comunidad_autonoma_id_fkey"
            columns: ["comunidad_autonoma_id"]
            isOneToOne: false
            referencedRelation: "catalogo_comunidades_autonomas"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_apps: {
        Row: {
          activo: boolean | null
          app_id: string
          cliente_id: string
          fecha_alta: string | null
          fecha_baja: string | null
          id: string
          url_cliente: string | null
        }
        Insert: {
          activo?: boolean | null
          app_id: string
          cliente_id: string
          fecha_alta?: string | null
          fecha_baja?: string | null
          id?: string
          url_cliente?: string | null
        }
        Update: {
          activo?: boolean | null
          app_id?: string
          cliente_id?: string
          fecha_alta?: string | null
          fecha_baja?: string | null
          id?: string
          url_cliente?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cliente_apps_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps_visibles_usuario"
            referencedColumns: ["app_id"]
          },
          {
            foreignKeyName: "cliente_apps_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "catalogo_apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_apps_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_direccion_facultativa: {
        Row: {
          activo: boolean
          cliente_id: string
          creado_en: string | null
          direccion_facultativa_id: string
          id: string
        }
        Insert: {
          activo?: boolean
          cliente_id: string
          creado_en?: string | null
          direccion_facultativa_id: string
          id?: string
        }
        Update: {
          activo?: boolean
          cliente_id?: string
          creado_en?: string | null
          direccion_facultativa_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_direccion_facultativa_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_direccion_facultativa_direccion_facultativa_id_fkey"
            columns: ["direccion_facultativa_id"]
            isOneToOne: false
            referencedRelation: "direccion_facultativa"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_modulos: {
        Row: {
          activo: boolean | null
          cliente_id: string
          creado_en: string | null
          en_prueba: boolean | null
          fecha_alta: string | null
          fecha_fin_prueba: string | null
          id: string
          modulo: string
          notas: string | null
        }
        Insert: {
          activo?: boolean | null
          cliente_id: string
          creado_en?: string | null
          en_prueba?: boolean | null
          fecha_alta?: string | null
          fecha_fin_prueba?: string | null
          id?: string
          modulo: string
          notas?: string | null
        }
        Update: {
          activo?: boolean | null
          cliente_id?: string
          creado_en?: string | null
          en_prueba?: boolean | null
          fecha_alta?: string | null
          fecha_fin_prueba?: string | null
          id?: string
          modulo?: string
          notas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cliente_modulos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_propiedad_contactos: {
        Row: {
          activo: boolean
          cliente_id: string
          contacto_id: string
          fecha_alta: string
          id: string
          propiedad_id: string
        }
        Insert: {
          activo?: boolean
          cliente_id: string
          contacto_id: string
          fecha_alta?: string
          id?: string
          propiedad_id: string
        }
        Update: {
          activo?: boolean
          cliente_id?: string
          contacto_id?: string
          fecha_alta?: string
          id?: string
          propiedad_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_propiedad_contactos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_propiedad_contactos_contacto_id_fkey"
            columns: ["contacto_id"]
            isOneToOne: false
            referencedRelation: "propiedad_contactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_propiedad_contactos_propiedad_id_fkey"
            columns: ["propiedad_id"]
            isOneToOne: false
            referencedRelation: "propiedad"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_proveedor_contactos: {
        Row: {
          activo: boolean
          cliente_id: string
          contacto_id: string
          fecha_alta: string
          id: string
          proveedor_id: string
        }
        Insert: {
          activo?: boolean
          cliente_id: string
          contacto_id: string
          fecha_alta?: string
          id?: string
          proveedor_id: string
        }
        Update: {
          activo?: boolean
          cliente_id?: string
          contacto_id?: string
          fecha_alta?: string
          id?: string
          proveedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_proveedor_contactos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_proveedor_contactos_contacto_id_fkey"
            columns: ["contacto_id"]
            isOneToOne: false
            referencedRelation: "proveedor_contactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_proveedor_contactos_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedor_subcontrata"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_proveedores: {
        Row: {
          activo: boolean
          cliente_id: string
          fecha_alta: string
          id: string
          proveedor_id: string
        }
        Insert: {
          activo?: boolean
          cliente_id: string
          fecha_alta?: string
          id?: string
          proveedor_id: string
        }
        Update: {
          activo?: boolean
          cliente_id?: string
          fecha_alta?: string
          id?: string
          proveedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_proveedores_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_proveedores_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedor_subcontrata"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_roles: {
        Row: {
          activo: boolean | null
          cliente_id: string
          creado_en: string | null
          descripcion: string | null
          es_admin: boolean | null
          id: string
          nombre_visible: string
          rol_id: string
          tipo_portal: string
        }
        Insert: {
          activo?: boolean | null
          cliente_id: string
          creado_en?: string | null
          descripcion?: string | null
          es_admin?: boolean | null
          id?: string
          nombre_visible: string
          rol_id: string
          tipo_portal?: string
        }
        Update: {
          activo?: boolean | null
          cliente_id?: string
          creado_en?: string | null
          descripcion?: string | null
          es_admin?: boolean | null
          id?: string
          nombre_visible?: string
          rol_id?: string
          tipo_portal?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_roles_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          activo: boolean | null
          actualizado_en: string | null
          color_primario: string | null
          color_secundario: string | null
          creado_en: string | null
          fecha_alta_digital: string | null
          fecha_alta_hub: string | null
          formato_fecha: string | null
          formato_numero: string | null
          grupo_id: string | null
          id: string
          logo_jpeg_url: string | null
          logo_png_url: string | null
          logo_url: string | null
          modo: string
          moneda_defecto: string | null
          pais: string | null
          subdominio: string
          subdominio_externo: string | null
          zona_horaria: string | null
        }
        Insert: {
          activo?: boolean | null
          actualizado_en?: string | null
          color_primario?: string | null
          color_secundario?: string | null
          creado_en?: string | null
          fecha_alta_digital?: string | null
          fecha_alta_hub?: string | null
          formato_fecha?: string | null
          formato_numero?: string | null
          grupo_id?: string | null
          id?: string
          logo_jpeg_url?: string | null
          logo_png_url?: string | null
          logo_url?: string | null
          modo: string
          moneda_defecto?: string | null
          pais?: string | null
          subdominio: string
          subdominio_externo?: string | null
          zona_horaria?: string | null
        }
        Update: {
          activo?: boolean | null
          actualizado_en?: string | null
          color_primario?: string | null
          color_secundario?: string | null
          creado_en?: string | null
          fecha_alta_digital?: string | null
          fecha_alta_hub?: string | null
          formato_fecha?: string | null
          formato_numero?: string | null
          grupo_id?: string | null
          id?: string
          logo_jpeg_url?: string | null
          logo_png_url?: string | null
          logo_url?: string | null
          modo?: string
          moneda_defecto?: string | null
          pais?: string | null
          subdominio?: string
          subdominio_externo?: string | null
          zona_horaria?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes_datos: {
        Row: {
          actualizado_en: string | null
          ciudad: string | null
          cliente_id: string
          codigo_postal: string | null
          creado_en: string | null
          direccion: string | null
          email_contacto: string | null
          id: string
          idioma_principal: string | null
          modo_negocio: string | null
          modo_negocio_fecha: string | null
          moneda_contabilidad: string | null
          nif: string | null
          nombre_empresa: string
          nombre_fiscal: string | null
          notas: string | null
          pais: string | null
          persona_contacto: string | null
          provincia: string | null
          telefono: string | null
          web: string | null
        }
        Insert: {
          actualizado_en?: string | null
          ciudad?: string | null
          cliente_id: string
          codigo_postal?: string | null
          creado_en?: string | null
          direccion?: string | null
          email_contacto?: string | null
          id?: string
          idioma_principal?: string | null
          modo_negocio?: string | null
          modo_negocio_fecha?: string | null
          moneda_contabilidad?: string | null
          nif?: string | null
          nombre_empresa: string
          nombre_fiscal?: string | null
          notas?: string | null
          pais?: string | null
          persona_contacto?: string | null
          provincia?: string | null
          telefono?: string | null
          web?: string | null
        }
        Update: {
          actualizado_en?: string | null
          ciudad?: string | null
          cliente_id?: string
          codigo_postal?: string | null
          creado_en?: string | null
          direccion?: string | null
          email_contacto?: string | null
          id?: string
          idioma_principal?: string | null
          modo_negocio?: string | null
          modo_negocio_fecha?: string | null
          moneda_contabilidad?: string | null
          nif?: string | null
          nombre_empresa?: string
          nombre_fiscal?: string | null
          notas?: string | null
          pais?: string | null
          persona_contacto?: string | null
          provincia?: string | null
          telefono?: string | null
          web?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_datos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: true
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes_propiedades: {
        Row: {
          activo: boolean
          cliente_id: string
          fecha_alta: string
          id: string
          nombre_comercial: string | null
          propiedad_id: string
        }
        Insert: {
          activo?: boolean
          cliente_id: string
          fecha_alta?: string
          id?: string
          nombre_comercial?: string | null
          propiedad_id: string
        }
        Update: {
          activo?: boolean
          cliente_id?: string
          fecha_alta?: string
          id?: string
          nombre_comercial?: string | null
          propiedad_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_propiedades_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_propiedades_propiedad_id_fkey"
            columns: ["propiedad_id"]
            isOneToOne: false
            referencedRelation: "propiedad"
            referencedColumns: ["id"]
          },
        ]
      }
      config_audit_log: {
        Row: {
          cliente_id: string | null
          creado_en: string | null
          datos_antes: Json | null
          datos_despues: Json | null
          id: string
          ip: string | null
          operacion: string
          registro_id: string | null
          tabla: string
          user_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          creado_en?: string | null
          datos_antes?: Json | null
          datos_despues?: Json | null
          id?: string
          ip?: string | null
          operacion: string
          registro_id?: string | null
          tabla: string
          user_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          creado_en?: string | null
          datos_antes?: Json | null
          datos_despues?: Json | null
          id?: string
          ip?: string | null
          operacion?: string
          registro_id?: string | null
          tabla?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "config_audit_log_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_config: {
        Row: {
          alto_filas: number | null
          ancho_cols: number | null
          cliente_id: string
          creado_en: string | null
          dispositivo: string | null
          filtro_proyecto: string | null
          id: string
          kpi_comparar_con: string | null
          kpi_formula: string | null
          kpi_unidad: string | null
          moneda_referencia: string | null
          posicion_col: number | null
          posicion_fila: number | null
          rol_id: string
          tipo_widget: string
          titulo: string | null
          visible: boolean | null
          widget_id: string
        }
        Insert: {
          alto_filas?: number | null
          ancho_cols?: number | null
          cliente_id: string
          creado_en?: string | null
          dispositivo?: string | null
          filtro_proyecto?: string | null
          id?: string
          kpi_comparar_con?: string | null
          kpi_formula?: string | null
          kpi_unidad?: string | null
          moneda_referencia?: string | null
          posicion_col?: number | null
          posicion_fila?: number | null
          rol_id: string
          tipo_widget: string
          titulo?: string | null
          visible?: boolean | null
          widget_id: string
        }
        Update: {
          alto_filas?: number | null
          ancho_cols?: number | null
          cliente_id?: string
          creado_en?: string | null
          dispositivo?: string | null
          filtro_proyecto?: string | null
          id?: string
          kpi_comparar_con?: string | null
          kpi_formula?: string | null
          kpi_unidad?: string | null
          moneda_referencia?: string | null
          posicion_col?: number | null
          posicion_fila?: number | null
          rol_id?: string
          tipo_widget?: string
          titulo?: string | null
          visible?: boolean | null
          widget_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_config_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_tipos_cambio: {
        Row: {
          actualizado_en: string | null
          cliente_id: string
          creado_en: string | null
          es_defecto: boolean | null
          id: string
          moneda_proyecto: string
          moneda_referencia: string
          periodo_anio: number | null
          periodo_mes: number | null
          proyecto_id: string
          sobrescrito_usuario: boolean | null
          tipo_cambio: number
          user_id: string
        }
        Insert: {
          actualizado_en?: string | null
          cliente_id: string
          creado_en?: string | null
          es_defecto?: boolean | null
          id?: string
          moneda_proyecto: string
          moneda_referencia: string
          periodo_anio?: number | null
          periodo_mes?: number | null
          proyecto_id: string
          sobrescrito_usuario?: boolean | null
          tipo_cambio: number
          user_id: string
        }
        Update: {
          actualizado_en?: string | null
          cliente_id?: string
          creado_en?: string | null
          es_defecto?: boolean | null
          id?: string
          moneda_proyecto?: string
          moneda_referencia?: string
          periodo_anio?: number | null
          periodo_mes?: number | null
          proyecto_id?: string
          sobrescrito_usuario?: boolean | null
          tipo_cambio?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_tipos_cambio_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      direccion_facultativa: {
        Row: {
          creado_en: string | null
          id: string
          nif: string
          nombre_comercial: string | null
          nombre_legal: string
        }
        Insert: {
          creado_en?: string | null
          id?: string
          nif: string
          nombre_comercial?: string | null
          nombre_legal: string
        }
        Update: {
          creado_en?: string | null
          id?: string
          nif?: string
          nombre_comercial?: string | null
          nombre_legal?: string
        }
        Relationships: []
      }
      direccion_facultativa_contactos: {
        Row: {
          apellido_1: string
          apellido_2: string | null
          creado_en: string | null
          direccion_facultativa_id: string
          email: string | null
          id: string
          nombre: string
          telefono: string | null
        }
        Insert: {
          apellido_1: string
          apellido_2?: string | null
          creado_en?: string | null
          direccion_facultativa_id: string
          email?: string | null
          id?: string
          nombre: string
          telefono?: string | null
        }
        Update: {
          apellido_1?: string
          apellido_2?: string | null
          creado_en?: string | null
          direccion_facultativa_id?: string
          email?: string | null
          id?: string
          nombre?: string
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "direccion_facultativa_contactos_direccion_facultativa_id_fkey"
            columns: ["direccion_facultativa_id"]
            isOneToOne: false
            referencedRelation: "direccion_facultativa"
            referencedColumns: ["id"]
          },
        ]
      }
      etiquetas_cliente: {
        Row: {
          clave: string
          cliente_id: string
          creado_en: string | null
          etiqueta: string
          id: string
          idioma: string | null
          modulo: string | null
        }
        Insert: {
          clave: string
          cliente_id: string
          creado_en?: string | null
          etiqueta: string
          id?: string
          idioma?: string | null
          modulo?: string | null
        }
        Update: {
          clave?: string
          cliente_id?: string
          creado_en?: string | null
          etiqueta?: string
          id?: string
          idioma?: string | null
          modulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "etiquetas_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      flujo_aprobacion: {
        Row: {
          accion_rechazo: string | null
          canal_notificacion: string | null
          cliente_id: string
          creado_en: string | null
          id: string
          importe_maximo: number | null
          modulo: string
          nivel_aprobacion_min: number | null
          nombre_paso: string | null
          notificar_roles: string[] | null
          paso: number
          plazo_horas: number | null
          requiere_comentario: boolean | null
          rol_aprobador: string
        }
        Insert: {
          accion_rechazo?: string | null
          canal_notificacion?: string | null
          cliente_id: string
          creado_en?: string | null
          id?: string
          importe_maximo?: number | null
          modulo: string
          nivel_aprobacion_min?: number | null
          nombre_paso?: string | null
          notificar_roles?: string[] | null
          paso: number
          plazo_horas?: number | null
          requiere_comentario?: boolean | null
          rol_aprobador: string
        }
        Update: {
          accion_rechazo?: string | null
          canal_notificacion?: string | null
          cliente_id?: string
          creado_en?: string | null
          id?: string
          importe_maximo?: number | null
          modulo?: string
          nivel_aprobacion_min?: number | null
          nombre_paso?: string | null
          notificar_roles?: string[] | null
          paso?: number
          plazo_horas?: number | null
          requiere_comentario?: boolean | null
          rol_aprobador?: string
        }
        Relationships: [
          {
            foreignKeyName: "flujo_aprobacion_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos: {
        Row: {
          activo: boolean | null
          actualizado_en: string | null
          creado_en: string | null
          id: string
          logo_url: string | null
          moneda_defecto: string | null
          nif: string | null
          nombre: string
          nombre_fiscal: string | null
          pais_sede: string | null
        }
        Insert: {
          activo?: boolean | null
          actualizado_en?: string | null
          creado_en?: string | null
          id?: string
          logo_url?: string | null
          moneda_defecto?: string | null
          nif?: string | null
          nombre: string
          nombre_fiscal?: string | null
          pais_sede?: string | null
        }
        Update: {
          activo?: boolean | null
          actualizado_en?: string | null
          creado_en?: string | null
          id?: string
          logo_url?: string | null
          moneda_defecto?: string | null
          nif?: string | null
          nombre?: string
          nombre_fiscal?: string | null
          pais_sede?: string | null
        }
        Relationships: []
      }
      ingenio_accesos_clientes: {
        Row: {
          activo: boolean | null
          actualizado_en: string | null
          autorizado_por: string | null
          cliente_id: string
          creado_en: string | null
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          ingenio_user_id: string
          motivo: string | null
          nivel_acceso: string
        }
        Insert: {
          activo?: boolean | null
          actualizado_en?: string | null
          autorizado_por?: string | null
          cliente_id: string
          creado_en?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          ingenio_user_id: string
          motivo?: string | null
          nivel_acceso?: string
        }
        Update: {
          activo?: boolean | null
          actualizado_en?: string | null
          autorizado_por?: string | null
          cliente_id?: string
          creado_en?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          ingenio_user_id?: string
          motivo?: string | null
          nivel_acceso?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingenio_accesos_clientes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      modulo_campos: {
        Row: {
          campo_id: string
          cliente_id: string
          creado_en: string | null
          etiqueta_override: string | null
          id: string
          obligatorio: boolean | null
          orden: number | null
          visible: boolean | null
        }
        Insert: {
          campo_id: string
          cliente_id: string
          creado_en?: string | null
          etiqueta_override?: string | null
          id?: string
          obligatorio?: boolean | null
          orden?: number | null
          visible?: boolean | null
        }
        Update: {
          campo_id?: string
          cliente_id?: string
          creado_en?: string | null
          etiqueta_override?: string | null
          id?: string
          obligatorio?: boolean | null
          orden?: number | null
          visible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "modulo_campos_campo_id_fkey"
            columns: ["campo_id"]
            isOneToOne: false
            referencedRelation: "catalogo_campos"
            referencedColumns: ["campo_id"]
          },
          {
            foreignKeyName: "modulo_campos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      personal: {
        Row: {
          activo: boolean | null
          apellido_1: string
          apellido_2: string | null
          cliente_id: string
          email: string
          id: string
          nif: string
          nombre: string
          telefono: string | null
        }
        Insert: {
          activo?: boolean | null
          apellido_1: string
          apellido_2?: string | null
          cliente_id: string
          email: string
          id?: string
          nif: string
          nombre: string
          telefono?: string | null
        }
        Update: {
          activo?: boolean | null
          apellido_1?: string
          apellido_2?: string | null
          cliente_id?: string
          email?: string
          id?: string
          nif?: string
          nombre?: string
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      plantilla_detalle: {
        Row: {
          creado_en: string | null
          datos: Json
          id: string
          plantilla_id: string
          tipo: string
        }
        Insert: {
          creado_en?: string | null
          datos: Json
          id?: string
          plantilla_id: string
          tipo: string
        }
        Update: {
          creado_en?: string | null
          datos?: Json
          id?: string
          plantilla_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "plantilla_detalle_plantilla_id_fkey"
            columns: ["plantilla_id"]
            isOneToOne: false
            referencedRelation: "plantillas_config"
            referencedColumns: ["id"]
          },
        ]
      }
      plantillas_config: {
        Row: {
          activa: boolean | null
          creado_en: string | null
          descripcion: string | null
          id: string
          modulos_incluidos: string[] | null
          nombre: string
        }
        Insert: {
          activa?: boolean | null
          creado_en?: string | null
          descripcion?: string | null
          id?: string
          modulos_incluidos?: string[] | null
          nombre: string
        }
        Update: {
          activa?: boolean | null
          creado_en?: string | null
          descripcion?: string | null
          id?: string
          modulos_incluidos?: string[] | null
          nombre?: string
        }
        Relationships: []
      }
      propiedad: {
        Row: {
          codigo_postal: string | null
          id: string
          modificado_en: string | null
          modificado_por: string | null
          municipio: string | null
          nif: string | null
          nombre_legal: string | null
          nombre_via: string | null
          numero: string | null
          pais: string | null
          provincia: string | null
          tipo_via: string | null
        }
        Insert: {
          codigo_postal?: string | null
          id?: string
          modificado_en?: string | null
          modificado_por?: string | null
          municipio?: string | null
          nif?: string | null
          nombre_legal?: string | null
          nombre_via?: string | null
          numero?: string | null
          pais?: string | null
          provincia?: string | null
          tipo_via?: string | null
        }
        Update: {
          codigo_postal?: string | null
          id?: string
          modificado_en?: string | null
          modificado_por?: string | null
          municipio?: string | null
          nif?: string | null
          nombre_legal?: string | null
          nombre_via?: string | null
          numero?: string | null
          pais?: string | null
          provincia?: string | null
          tipo_via?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "propiedad_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "usuarios_cliente"
            referencedColumns: ["id"]
          },
        ]
      }
      propiedad_contactos: {
        Row: {
          apellido_1: string | null
          apellido_2: string | null
          departamento: string | null
          email: string | null
          id: string
          nombre: string | null
          propiedad_id: string
          telefono: string | null
        }
        Insert: {
          apellido_1?: string | null
          apellido_2?: string | null
          departamento?: string | null
          email?: string | null
          id?: string
          nombre?: string | null
          propiedad_id: string
          telefono?: string | null
        }
        Update: {
          apellido_1?: string | null
          apellido_2?: string | null
          departamento?: string | null
          email?: string | null
          id?: string
          nombre?: string | null
          propiedad_id?: string
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "propiedad_contactos_propiedad_id_fkey"
            columns: ["propiedad_id"]
            isOneToOne: false
            referencedRelation: "propiedad"
            referencedColumns: ["id"]
          },
        ]
      }
      proveedor_contactos: {
        Row: {
          apellido_1: string | null
          apellido_2: string | null
          departamento: string | null
          email: string | null
          id: string
          nombre: string | null
          proveedor_id: string
          telefono: string | null
        }
        Insert: {
          apellido_1?: string | null
          apellido_2?: string | null
          departamento?: string | null
          email?: string | null
          id?: string
          nombre?: string | null
          proveedor_id: string
          telefono?: string | null
        }
        Update: {
          apellido_1?: string | null
          apellido_2?: string | null
          departamento?: string | null
          email?: string | null
          id?: string
          nombre?: string | null
          proveedor_id?: string
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proveedor_contactos_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedor_subcontrata"
            referencedColumns: ["id"]
          },
        ]
      }
      proveedor_subcontrata: {
        Row: {
          activo: boolean | null
          codigo_postal: string | null
          email: string | null
          id: string
          modificado_en: string | null
          modificado_por: string | null
          municipio: string | null
          nif: string
          nombre_comercial: string | null
          nombre_legal: string
          nombre_via: string | null
          numero: string | null
          pais: string | null
          persona_contacto_apellido_1: string | null
          persona_contacto_apellido_2: string | null
          persona_contacto_nombre: string | null
          provincia: string | null
          telefono: string | null
          tipo_proveedor: string | null
          tipo_via: string | null
        }
        Insert: {
          activo?: boolean | null
          codigo_postal?: string | null
          email?: string | null
          id?: string
          modificado_en?: string | null
          modificado_por?: string | null
          municipio?: string | null
          nif: string
          nombre_comercial?: string | null
          nombre_legal: string
          nombre_via?: string | null
          numero?: string | null
          pais?: string | null
          persona_contacto_apellido_1?: string | null
          persona_contacto_apellido_2?: string | null
          persona_contacto_nombre?: string | null
          provincia?: string | null
          telefono?: string | null
          tipo_proveedor?: string | null
          tipo_via?: string | null
        }
        Update: {
          activo?: boolean | null
          codigo_postal?: string | null
          email?: string | null
          id?: string
          modificado_en?: string | null
          modificado_por?: string | null
          municipio?: string | null
          nif?: string
          nombre_comercial?: string | null
          nombre_legal?: string
          nombre_via?: string | null
          numero?: string | null
          pais?: string | null
          persona_contacto_apellido_1?: string | null
          persona_contacto_apellido_2?: string | null
          persona_contacto_nombre?: string | null
          provincia?: string | null
          telefono?: string | null
          tipo_proveedor?: string | null
          tipo_via?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proveedor_subcontrata_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "usuarios_cliente"
            referencedColumns: ["id"]
          },
        ]
      }
      proyecto_direccion_facultativa: {
        Row: {
          activo: boolean
          contacto_id: string | null
          creado_en: string | null
          direccion_facultativa_id: string
          id: string
          proyecto_id: string
        }
        Insert: {
          activo?: boolean
          contacto_id?: string | null
          creado_en?: string | null
          direccion_facultativa_id: string
          id?: string
          proyecto_id: string
        }
        Update: {
          activo?: boolean
          contacto_id?: string | null
          creado_en?: string | null
          direccion_facultativa_id?: string
          id?: string
          proyecto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proyecto_direccion_facultativa_contacto_id_fkey"
            columns: ["contacto_id"]
            isOneToOne: false
            referencedRelation: "direccion_facultativa_contactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyecto_direccion_facultativa_direccion_facultativa_id_fkey"
            columns: ["direccion_facultativa_id"]
            isOneToOne: false
            referencedRelation: "direccion_facultativa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyecto_direccion_facultativa_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: true
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      proyecto_proveedores: {
        Row: {
          activo: boolean
          fecha_asignacion: string
          id: string
          proveedor_id: string
          proyecto_id: string
        }
        Insert: {
          activo?: boolean
          fecha_asignacion?: string
          id?: string
          proveedor_id: string
          proyecto_id: string
        }
        Update: {
          activo?: boolean
          fecha_asignacion?: string
          id?: string
          proveedor_id?: string
          proyecto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proyecto_proveedores_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedor_subcontrata"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyecto_proveedores_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      proyectos: {
        Row: {
          activo: boolean | null
          cliente_id: string | null
          codigo_estudios: string | null
          codigo_obra: string | null
          codigo_postal: string | null
          estado: string
          fecha_adjudicacion: string | null
          fecha_apertura_estudio: string
          fecha_inicio_proyecto: string | null
          id: string
          municipio: string | null
          nombre: string
          nombre_via: string | null
          numero: string | null
          plazo_ejecucion_meses: number | null
          propiedad_id: string
          propiedad_nif: string | null
          provincia: string | null
          provincia_id: string | null
          tipo_obra: string | null
          tipo_via: string | null
        }
        Insert: {
          activo?: boolean | null
          cliente_id?: string | null
          codigo_estudios?: string | null
          codigo_obra?: string | null
          codigo_postal?: string | null
          estado?: string
          fecha_adjudicacion?: string | null
          fecha_apertura_estudio?: string
          fecha_inicio_proyecto?: string | null
          id?: string
          municipio?: string | null
          nombre: string
          nombre_via?: string | null
          numero?: string | null
          plazo_ejecucion_meses?: number | null
          propiedad_id: string
          propiedad_nif?: string | null
          provincia?: string | null
          provincia_id?: string | null
          tipo_obra?: string | null
          tipo_via?: string | null
        }
        Update: {
          activo?: boolean | null
          cliente_id?: string | null
          codigo_estudios?: string | null
          codigo_obra?: string | null
          codigo_postal?: string | null
          estado?: string
          fecha_adjudicacion?: string | null
          fecha_apertura_estudio?: string
          fecha_inicio_proyecto?: string | null
          id?: string
          municipio?: string | null
          nombre?: string
          nombre_via?: string | null
          numero?: string | null
          plazo_ejecucion_meses?: number | null
          propiedad_id?: string
          propiedad_nif?: string | null
          provincia?: string | null
          provincia_id?: string | null
          tipo_obra?: string | null
          tipo_via?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proyectos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyectos_propiedad_id_fkey"
            columns: ["propiedad_id"]
            isOneToOne: false
            referencedRelation: "propiedad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyectos_provincia_id_fkey"
            columns: ["provincia_id"]
            isOneToOne: false
            referencedRelation: "catalogo_provincias"
            referencedColumns: ["id"]
          },
        ]
      }
      proyectos_config: {
        Row: {
          actualizado_en: string | null
          cliente_id: string
          creado_en: string | null
          formato_fecha: string | null
          formato_numero: string | null
          id: string
          latitud: number | null
          longitud: number | null
          moneda: string
          pais_proyecto: string | null
          presupuesto_venta_estimado: number | null
          proyecto_id: string
          zona_horaria: string | null
        }
        Insert: {
          actualizado_en?: string | null
          cliente_id: string
          creado_en?: string | null
          formato_fecha?: string | null
          formato_numero?: string | null
          id?: string
          latitud?: number | null
          longitud?: number | null
          moneda?: string
          pais_proyecto?: string | null
          presupuesto_venta_estimado?: number | null
          proyecto_id: string
          zona_horaria?: string | null
        }
        Update: {
          actualizado_en?: string | null
          cliente_id?: string
          creado_en?: string | null
          formato_fecha?: string | null
          formato_numero?: string | null
          id?: string
          latitud?: number | null
          longitud?: number | null
          moneda?: string
          pais_proyecto?: string | null
          presupuesto_venta_estimado?: number | null
          proyecto_id?: string
          zona_horaria?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proyectos_config_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      rol_jerarquia: {
        Row: {
          cliente_id: string
          creado_en: string | null
          id: string
          modulo: string
          puede_aprobar: boolean | null
          puede_editar: boolean | null
          puede_eliminar: boolean | null
          rol_inferior: string
          rol_superior: string
        }
        Insert: {
          cliente_id: string
          creado_en?: string | null
          id?: string
          modulo: string
          puede_aprobar?: boolean | null
          puede_editar?: boolean | null
          puede_eliminar?: boolean | null
          rol_inferior: string
          rol_superior: string
        }
        Update: {
          cliente_id?: string
          creado_en?: string | null
          id?: string
          modulo?: string
          puede_aprobar?: boolean | null
          puede_editar?: boolean | null
          puede_eliminar?: boolean | null
          rol_inferior?: string
          rol_superior?: string
        }
        Relationships: [
          {
            foreignKeyName: "rol_jerarquia_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      rol_permisos: {
        Row: {
          cliente_id: string
          creado_en: string | null
          id: string
          modulo: string
          puede_aprobar: boolean | null
          puede_crear: boolean | null
          puede_editar: boolean | null
          puede_eliminar: boolean | null
          puede_exportar: boolean | null
          puede_ver: boolean | null
          rol_id: string
          solo_sus_proyectos: boolean | null
        }
        Insert: {
          cliente_id: string
          creado_en?: string | null
          id?: string
          modulo: string
          puede_aprobar?: boolean | null
          puede_crear?: boolean | null
          puede_editar?: boolean | null
          puede_eliminar?: boolean | null
          puede_exportar?: boolean | null
          puede_ver?: boolean | null
          rol_id: string
          solo_sus_proyectos?: boolean | null
        }
        Update: {
          cliente_id?: string
          creado_en?: string | null
          id?: string
          modulo?: string
          puede_aprobar?: boolean | null
          puede_crear?: boolean | null
          puede_editar?: boolean | null
          puede_eliminar?: boolean | null
          puede_exportar?: boolean | null
          puede_ver?: boolean | null
          rol_id?: string
          solo_sus_proyectos?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "rol_permisos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_cambio_proyecto: {
        Row: {
          cliente_id: string
          creado_en: string | null
          creado_por: string | null
          id: string
          moneda_destino: string
          moneda_origen: string
          periodo_anio: number
          periodo_mes: number
          proyecto_id: string
          tipo_cambio: number
        }
        Insert: {
          cliente_id: string
          creado_en?: string | null
          creado_por?: string | null
          id?: string
          moneda_destino: string
          moneda_origen: string
          periodo_anio: number
          periodo_mes: number
          proyecto_id: string
          tipo_cambio: number
        }
        Update: {
          cliente_id?: string
          creado_en?: string | null
          creado_por?: string | null
          id?: string
          moneda_destino?: string
          moneda_origen?: string
          periodo_anio?: number
          periodo_mes?: number
          proyecto_id?: string
          tipo_cambio?: number
        }
        Relationships: [
          {
            foreignKeyName: "tipos_cambio_proyecto_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      usuario_notificaciones: {
        Row: {
          actualizado_en: string | null
          alerta_plazo: string | null
          aprobacion_pendiente: string | null
          aprobacion_resuelta: string | null
          canal_defecto: string | null
          creado_en: string | null
          hora_resumen: string | null
          id: string
          resumen_diario: boolean | null
          silencio_desde: string | null
          silencio_hasta: string | null
          user_id: string
        }
        Insert: {
          actualizado_en?: string | null
          alerta_plazo?: string | null
          aprobacion_pendiente?: string | null
          aprobacion_resuelta?: string | null
          canal_defecto?: string | null
          creado_en?: string | null
          hora_resumen?: string | null
          id?: string
          resumen_diario?: boolean | null
          silencio_desde?: string | null
          silencio_hasta?: string | null
          user_id: string
        }
        Update: {
          actualizado_en?: string | null
          alerta_plazo?: string | null
          aprobacion_pendiente?: string | null
          aprobacion_resuelta?: string | null
          canal_defecto?: string | null
          creado_en?: string | null
          hora_resumen?: string | null
          id?: string
          resumen_diario?: boolean | null
          silencio_desde?: string | null
          silencio_hasta?: string | null
          user_id?: string
        }
        Relationships: []
      }
      usuario_proyectos: {
        Row: {
          activo: boolean | null
          cliente_id: string
          creado_en: string | null
          id: string
          proyecto_id: string
          user_id: string
        }
        Insert: {
          activo?: boolean | null
          cliente_id: string
          creado_en?: string | null
          id?: string
          proyecto_id: string
          user_id: string
        }
        Update: {
          activo?: boolean | null
          cliente_id?: string
          creado_en?: string | null
          id?: string
          proyecto_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuario_proyectos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios_cliente: {
        Row: {
          acceso_total_proyectos: boolean | null
          activo: boolean | null
          actualizado_en: string | null
          apellido1: string | null
          apellido2: string | null
          apellidos: string | null
          cargo_visible: string | null
          cliente_id: string
          creado_en: string | null
          email: string | null
          es_corporativo: boolean | null
          estado_actual: string | null
          fecha_inicio: string | null
          grupo_id: string | null
          id: string
          modo_preferente: string | null
          nivel_aprobacion: number | null
          nombre: string | null
          portal: string
          rol_id: string
          telefono: string | null
          ultimo_acceso: string | null
          user_id: string
        }
        Insert: {
          acceso_total_proyectos?: boolean | null
          activo?: boolean | null
          actualizado_en?: string | null
          apellido1?: string | null
          apellido2?: string | null
          apellidos?: string | null
          cargo_visible?: string | null
          cliente_id: string
          creado_en?: string | null
          email?: string | null
          es_corporativo?: boolean | null
          estado_actual?: string | null
          fecha_inicio?: string | null
          grupo_id?: string | null
          id?: string
          modo_preferente?: string | null
          nivel_aprobacion?: number | null
          nombre?: string | null
          portal?: string
          rol_id: string
          telefono?: string | null
          ultimo_acceso?: string | null
          user_id: string
        }
        Update: {
          acceso_total_proyectos?: boolean | null
          activo?: boolean | null
          actualizado_en?: string | null
          apellido1?: string | null
          apellido2?: string | null
          apellidos?: string | null
          cargo_visible?: string | null
          cliente_id?: string
          creado_en?: string | null
          email?: string | null
          es_corporativo?: boolean | null
          estado_actual?: string | null
          fecha_inicio?: string | null
          grupo_id?: string | null
          id?: string
          modo_preferente?: string | null
          nivel_aprobacion?: number | null
          nombre?: string | null
          portal?: string
          rol_id?: string
          telefono?: string | null
          ultimo_acceso?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_cliente_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios_estados: {
        Row: {
          cliente_id: string
          creado_en: string | null
          estado: string
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          motivo: string | null
          registrado_por: string | null
          user_id: string
        }
        Insert: {
          cliente_id: string
          creado_en?: string | null
          estado: string
          fecha_fin?: string | null
          fecha_inicio: string
          id?: string
          motivo?: string | null
          registrado_por?: string | null
          user_id: string
        }
        Update: {
          cliente_id?: string
          creado_en?: string | null
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          motivo?: string | null
          registrado_por?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_estados_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios_roles_historial: {
        Row: {
          cargo_visible_anterior: string | null
          cargo_visible_nuevo: string | null
          cliente_id: string
          creado_en: string | null
          fecha_cambio: string
          id: string
          motivo: string | null
          nivel_aprobacion_anterior: number | null
          nivel_aprobacion_nuevo: number | null
          registrado_por: string | null
          rol_id_anterior: string | null
          rol_id_nuevo: string
          user_id: string
        }
        Insert: {
          cargo_visible_anterior?: string | null
          cargo_visible_nuevo?: string | null
          cliente_id: string
          creado_en?: string | null
          fecha_cambio?: string
          id?: string
          motivo?: string | null
          nivel_aprobacion_anterior?: number | null
          nivel_aprobacion_nuevo?: number | null
          registrado_por?: string | null
          rol_id_anterior?: string | null
          rol_id_nuevo: string
          user_id: string
        }
        Update: {
          cargo_visible_anterior?: string | null
          cargo_visible_nuevo?: string | null
          cliente_id?: string
          creado_en?: string | null
          fecha_cambio?: string
          id?: string
          motivo?: string | null
          nivel_aprobacion_anterior?: number | null
          nivel_aprobacion_nuevo?: number | null
          registrado_por?: string | null
          rol_id_anterior?: string | null
          rol_id_nuevo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_roles_historial_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      zonas_operativas_cliente: {
        Row: {
          cliente_id: string
          creado_en: string | null
          id: string
          nombre: string
        }
        Insert: {
          cliente_id: string
          creado_en?: string | null
          id?: string
          nombre: string
        }
        Update: {
          cliente_id?: string
          creado_en?: string | null
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "zonas_operativas_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      zonas_operativas_provincias: {
        Row: {
          provincia_id: string
          zona_id: string
        }
        Insert: {
          provincia_id: string
          zona_id: string
        }
        Update: {
          provincia_id?: string
          zona_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zonas_operativas_provincias_provincia_id_fkey"
            columns: ["provincia_id"]
            isOneToOne: false
            referencedRelation: "catalogo_provincias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zonas_operativas_provincias_zona_id_fkey"
            columns: ["zona_id"]
            isOneToOne: false
            referencedRelation: "zonas_operativas_cliente"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      apps_visibles_usuario: {
        Row: {
          app_id: string | null
          cliente_id: string | null
          codigo: string | null
          descripcion: string | null
          icono: string | null
          nombre: string | null
          rol_id: string | null
          url_base: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cliente_apps_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
