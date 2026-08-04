import { Link } from "@tanstack/react-router";
import { Boxes, Bot, Database, Home, LayoutGrid, LayoutList, ArrowLeft, type LucideIcon } from "lucide-react";

import { usePerfilUsuario } from "@/hooks/use-perfil-usuario";

export type SidebarMode = "direccion" | "proyecto";

export type SidebarItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  to: string;
};

type SidebarProps = {
  mode: SidebarMode;
  activeItem?: string;
  /** Logo de cabecera en modo dirección */
  contexto?: "hub" | "digital";
  items?: SidebarItem[];
  /** Modo proyecto */
  proyectoNombre?: string;
  proyectoEstado?: string;
  volverA?: string;
  volverLabel?: string;
};

export const ITEMS_HUB: SidebarItem[] = [
  { key: "inicio", label: "Inicio", icon: Home, to: "/hub/inicio" },
  { key: "modulos", label: "Módulos", icon: Boxes, to: "/hub/modulos" },
  { key: "proyectos", label: "Proyectos", icon: LayoutList, to: "/hub/proyectos" },
  { key: "apps", label: "Apps", icon: LayoutGrid, to: "/digital/apps" },
  { key: "agentes", label: "Agentes", icon: Bot, to: "/digital/agentes" },
];

export const ITEMS_DIGITAL: SidebarItem[] = [
  { key: "inicio", label: "Inicio", icon: Home, to: "/digital/inicio" },
  { key: "modulos", label: "Módulos", icon: Boxes, to: "/hub/modulos" },
  { key: "proyectos", label: "Proyectos", icon: LayoutList, to: "/hub/proyectos" },
  { key: "apps", label: "Apps", icon: LayoutGrid, to: "/digital/apps" },
  { key: "agentes", label: "Agentes", icon: Bot, to: "/digital/agentes" },
];

export function itemsProyecto(id: string): SidebarItem[] {
  return [
    { key: "inicio", label: "Inicio", icon: Home, to: `/proyecto/${id}/inicio` },
    { key: "modulos", label: "Módulos", icon: Boxes, to: `/proyecto/${id}/modulos` },
  ];
}

export function Sidebar({
  mode,
  activeItem,
  contexto = "hub",
  items,
  proyectoNombre,
  proyectoEstado,
  volverA = "/hub/proyectos",
  volverLabel = "Proyectos",
}: SidebarProps) {
  const perfil = usePerfilUsuario();
  const esDireccion = mode === "direccion";

  const bg = esDireccion ? "var(--sidebar-bg)" : "var(--sidebar-proyecto-bg)";
  const textColor = esDireccion ? "var(--sidebar-text)" : "var(--sidebar-proyecto-text)";
  const activeText = esDireccion ? "var(--sidebar-text-active)" : "var(--sidebar-proyecto-text-active)";
  const activeBg = esDireccion ? "var(--sidebar-item-active-bg)" : "var(--sidebar-proyecto-item-active-bg)";
  const activeBorder = esDireccion ? "var(--sidebar-item-active-border)" : "var(--sidebar-proyecto-item-active-border)";
  const borderColor = esDireccion ? "var(--sidebar-border)" : "var(--sidebar-proyecto-border)";

  const menu = items ?? (contexto === "digital" ? ITEMS_DIGITAL : ITEMS_HUB);

  const renderItem = (item: SidebarItem, isActive: boolean) => {
    const Icon = item.icon;
    return (
      <Link
        key={item.key}
        to={item.to}
        className="flex items-center gap-3 py-2.5 pl-4 pr-3 transition-colors"
        style={{
          fontSize: "var(--text-sm)",
          fontWeight: isActive ? 600 : 500,
          color: isActive ? activeText : textColor,
          backgroundColor: isActive ? activeBg : "transparent",
          borderLeft: `2.5px solid ${isActive ? activeBorder : "transparent"}`,
        }}
      >
        <Icon size={18} className="shrink-0" />
        <span className="hidden lg:inline truncate">{item.label}</span>
      </Link>
    );
  };

  return (
    <aside
      className="sticky top-0 flex h-screen w-[60px] shrink-0 flex-col lg:w-[240px]"
      style={{ backgroundColor: bg, fontFamily: "var(--font-family)" }}
    >
      {/* Cabecera / logo */}
      <div className="px-4 py-5 flex flex-col items-center" style={{ borderBottom: `1px solid ${borderColor}` }}>
        <img
          src={contexto === "digital" ? "/digital-sin-fondo.svg" : "/hub-sin-fondo.svg"}
          alt={contexto === "digital" ? "Ingenio Digital" : "Ingenio Hub"}
          className="h-14 w-auto object-contain"
        />
      </div>

      {/* Bloque obra activa (modo proyecto) */}
      {!esDireccion && (
        <div className="px-4 py-4" style={{ borderBottom: `1px solid ${borderColor}` }}>
          <Link
            to={volverA}
            className="mb-3 flex items-center gap-1.5"
            style={{ color: "var(--sidebar-proyecto-text-muted)", fontSize: "var(--text-xs)" }}
          >
            <ArrowLeft size={13} />
            <span className="hidden lg:inline">{volverLabel}</span>
          </Link>
          <div className="hidden lg:block">
            <div
              className="uppercase"
              style={{
                color: "var(--sidebar-proyecto-text-muted)",
                fontSize: "var(--text-xs)",
                letterSpacing: "0.12em",
              }}
            >
              Obra activa
            </div>
            <div
              className="mt-1 uppercase leading-tight"
              style={{
                color: "var(--sidebar-proyecto-nombre-color)",
                fontSize: "var(--text-base)",
                fontWeight: 700,
              }}
            >
              {proyectoNombre ?? "—"}
            </div>
            <span
              className="mt-2 inline-block px-2 py-0.5"
              style={{
                backgroundColor: "var(--sidebar-proyecto-badge-bg)",
                color: "var(--sidebar-proyecto-badge-text)",
                fontSize: "var(--text-xs)",
                borderRadius: "7px",
              }}
            >
              {proyectoEstado ?? "En ejecución"}
            </span>
          </div>
        </div>
      )}

      {/* Menú */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto py-3">
        {menu.map((item) => renderItem(item, item.key === activeItem))}
      </nav>

      {/* Pie: Datos Maestros + tarjeta de perfil */}
      <div style={{ borderTop: `1px solid ${borderColor}` }} className="pb-4 pt-3">
        {renderItem(
          { key: "datos-maestros", label: "Datos Maestros", icon: Database, to: "/datos-maestros" },
          activeItem === "datos-maestros",
        )}

        <Link
          to="/configuracion"
          className="mx-3 mt-3 flex items-center gap-3 p-2 transition-colors"
          style={{ backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "9px" }}
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{
              backgroundColor: esDireccion ? "rgba(179,255,0,0.16)" : "rgba(255,255,255,0.16)",
              color: esDireccion ? "var(--brand-lime)" : "var(--text-inverse)",
              fontSize: "var(--text-sm)",
              fontWeight: 700,
            }}
          >
            {perfil?.iniciales ?? "··"}
          </span>
          <span className="hidden min-w-0 lg:block">
            <span
              className="block truncate"
              style={{ color: "var(--text-inverse)", fontSize: "var(--text-base)", fontWeight: 700 }}
            >
              {perfil?.nombreCompleto ?? "Cargando..."}
            </span>
            <span className="block truncate" style={{ color: "rgba(255,255,255,0.55)", fontSize: "12px" }}>
              {perfil?.rolEtiqueta ?? ""}
            </span>
          </span>
        </Link>
      </div>
    </aside>
  );
}
