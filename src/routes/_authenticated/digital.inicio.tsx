import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot, LayoutGrid } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/_authenticated/digital/inicio")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Inicio Digital · Ingenio Digital" },
      { name: "description", content: "Accede a las apps y agentes de Ingenio Digital." },
      { property: "og:title", content: "Inicio Digital · Ingenio Digital" },
      { property: "og:description", content: "Accede a las apps y agentes de Ingenio Digital." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const TARJETAS = [
  {
    to: "/digital/apps",
    icon: LayoutGrid,
    titulo: "Apps",
    descripcion: "Herramientas digitales para el día a día de tus equipos.",
  },
  {
    to: "/digital/agentes",
    icon: Bot,
    titulo: "Agentes",
    descripcion: "Asistentes inteligentes que automatizan tareas repetitivas.",
  },
] as const;

function Page() {
  return (
    <AppShell mode="direccion" contexto="digital" activeItem="inicio">
      <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700 }}>Inicio Digital</h1>
      <p className="mt-2" style={{ color: "var(--text-secondary)", fontSize: "var(--text-base)" }}>
        Bienvenido a Ingenio Digital. Accede a tus apps y agentes desde el menú lateral.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 max-w-3xl">
        {TARJETAS.map(({ to, icon: Icon, titulo, descripcion }) => (
          <Link
            key={to}
            to={to}
            className="block transition-shadow hover:shadow-md"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderRadius: "var(--radius-lg)",
              border: "var(--border-width-thin) solid var(--border-default)",
              boxShadow: "var(--shadow-xs)",
              padding: "var(--space-6)",
            }}
          >
            <span
              className="flex h-12 w-12 items-center justify-center"
              style={{
                backgroundColor: "var(--brand-navy-deep)",
                color: "var(--brand-lime)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <Icon size={22} />
            </span>
            <span
              className="mt-4 block"
              style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--text-primary)" }}
            >
              {titulo}
            </span>
            <span
              className="mt-1 block"
              style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}
            >
              {descripcion}
            </span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
