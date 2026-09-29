import type { ReactNode } from "react";
import { Sidebar, type SidebarItem, type SidebarMode } from "./Sidebar";

type AppShellProps = {
  mode: SidebarMode;
  activeItem?: string | undefined;
  contexto?: "hub" | "digital";
  items?: SidebarItem[];
  proyectoNombre?: string;
  proyectoEstado?: string;
  volverA?: string;
  volverLabel?: string;
  children: ReactNode;
};

export function AppShell({ children, ...sidebarProps }: AppShellProps) {
  return (
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: "var(--bg-app)", fontFamily: "var(--font-family)" }}
    >
      <Sidebar {...sidebarProps} />
      <main className="flex-1 overflow-x-hidden p-8" style={{ color: "var(--text-primary)" }}>
        {children}
      </main>
    </div>
  );
}
