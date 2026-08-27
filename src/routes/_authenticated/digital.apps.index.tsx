import { createFileRoute } from "@tanstack/react-router";
import {
  LayoutGrid,
  FileText,
  ClipboardList,
  Calendar,
  Users,
  MessageSquare,
  Camera,
  CheckSquare,
  PieChart,
  Settings,
  Bell,
  HardHat,
  Truck,
  Wallet,
  Briefcase,
  Building,
  Folder,
  BookOpen,
  Globe,
  BarChart3,
  Search,
  Zap,
  Clock,
  MapPin,
  Phone,
  Mail,
  Shield,
  FileCheck,
  FileSignature,
  ListChecks,
  ListTodo,
  Receipt,
  TrendingUp,
  Cloud,
  Database,
  Layers,
  Wrench,
  Hammer,
  Ruler,
  PenTool,
  User,
  UserCog,
  Eye,
  Flag,
  AlertCircle,
  Info,
  HelpCircle,
  XCircle,
  CheckCircle,
  ExternalLink,
  Upload,
  Download,
  Image,
  Printer,
  Filter,
  Grid3X3,
  Table,
  type LucideIcon,
} from "lucide-react";

import { useAppsVisibles, type AppVisible } from "@/hooks/use-apps-visibles";

export const Route = createFileRoute("/_authenticated/digital/apps/")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Aplicaciones · Ingenio Digital" },
      { name: "description", content: "Aplicaciones disponibles para tu rol en Ingenio Digital." },
      { property: "og:title", content: "Aplicaciones · Ingenio Digital" },
      { property: "og:description", content: "Aplicaciones disponibles para tu rol en Ingenio Digital." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});


const ICONOS_APPS: Record<string, LucideIcon> = {
  LayoutGrid,
  FileText,
  ClipboardList,
  Calendar,
  Users,
  MessageSquare,
  Camera,
  CheckSquare,
  PieChart,
  Settings,
  Bell,
  HardHat,
  Truck,
  Wallet,
  Briefcase,
  Building,
  Folder,
  BookOpen,
  Globe,
  BarChart3,
  Search,
  Zap,
  Clock,
  MapPin,
  Phone,
  Mail,
  Shield,
  FileCheck,
  FileSignature,
  ListChecks,
  ListTodo,
  Receipt,
  TrendingUp,
  Cloud,
  Database,
  Layers,
  Wrench,
  Hammer,
  Ruler,
  PenTool,
  User,
  UserCog,
  Eye,
  Flag,
  AlertCircle,
  Info,
  HelpCircle,
  XCircle,
  CheckCircle,
  ExternalLink,
  Upload,
  Download,
  Image,
  Printer,
  Filter,
  Grid3X3,
  Table,
};

function iconoApp(nombre?: string | null): LucideIcon {
  if (!nombre) return LayoutGrid;
  return ICONOS_APPS[nombre] ?? LayoutGrid;
}

function Page() {
  const { apps } = Route.useLoaderData();

  return (
    <>
      <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--text-primary)" }}>
        Apps
      </h1>
      <p className="mt-2" style={{ color: "var(--text-secondary)", fontSize: "var(--text-base)" }}>
        Herramientas digitales contratadas por tu empresa.
      </p>

      {apps.length === 0 ? (
        <div
          className="mt-8"
          style={{ color: "var(--text-secondary)", fontSize: "var(--text-base)" }}
        >
          Todavía no tienes ninguna app contratada.
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-6xl">
          {apps.map((app) => (
            <AppCard key={app.clienteAppId} app={app} />
          ))}
        </div>
      )}
    </>
  );
}

function AppCard({ app }: { app: AppCliente }) {
  const Icon = iconoApp(app.icono);
  const clicable = Boolean(app.urlBase);

  const contenido = (
    <>
      {!clicable && (
        <span
          className="badge badge-neutral absolute top-3 right-3 shrink-0 !px-1.5 !py-0.5 !text-[9px]"
          aria-label="Próximamente"
        >
          Próximamente
        </span>
      )}
      <span
        className="flex h-12 w-12 items-center justify-center"
        style={{
          backgroundColor: "var(--apps-bg)",
          color: "var(--apps-text)",
          borderRadius: "var(--radius-md)",
        }}
      >
        <Icon size={22} />
      </span>
      <span
        className="mt-4 block truncate"
        style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--text-primary)" }}
      >
        {app.nombre}
      </span>
      <span
        className="mt-1 block line-clamp-2"
        style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}
      >
        {app.descripcion ?? ""}
      </span>
    </>
  );

  if (clicable && app.urlBase) {
    return (
      <a
        href={app.urlBase}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block transition-shadow hover:shadow-md"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "var(--radius-lg)",
          border: "var(--border-width-thin) solid var(--border-default)",
          boxShadow: "var(--shadow-xs)",
          padding: "var(--space-6)",
        }}
      >
        {contenido}
      </a>
    );
  }

  return (
    <article
      className="relative opacity-70"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderRadius: "var(--radius-lg)",
        border: "var(--border-width-thin) solid var(--border-default)",
        boxShadow: "var(--shadow-xs)",
        padding: "var(--space-6)",
      }}
    >
      {contenido}
    </article>
  );
}
