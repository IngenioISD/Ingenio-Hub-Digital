import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { itemsDatosMaestros } from "@/components/layout/Sidebar";
import { GuardDatosMaestros } from "@/components/datos-maestros/GuardDatosMaestros";

export const Route = createFileRoute("/_authenticated/datos-maestros")({
  component: Page,
});

function activeItemFromPathname(pathname: string): string | undefined {
  if (pathname.includes("/entidades-obra/proyectos")) return "proyectos";
  if (pathname.includes("/entidades-obra/propiedad")) return "propiedad";
  if (pathname.includes("/entidades-obra/proveedores")) return "proveedores";
  return undefined;
}

function Page() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <AppShell mode="direccion" contexto="hub" items={itemsDatosMaestros()} activeItem={activeItemFromPathname(pathname)}>
      <GuardDatosMaestros>
        <Outlet />
      </GuardDatosMaestros>
    </AppShell>
  );
}
