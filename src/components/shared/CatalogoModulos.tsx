import {
  AlertCircle, AlertTriangle, ArrowLeftRight, Award, BarChart3, BookOpen,
  Calendar, CalendarDays, Car, ClipboardCheck, ClipboardList, Clock, Cloud,
  Copy, DoorOpen, FileCheck, FileSignature, FileText, FolderCheck, Gauge,
  GitCompare, Globe, HardHat, History, Image, Landmark, Layers, Library,
  ListChecks, ListTodo, Mail, Receipt, RefreshCw, Scale, Search, Settings,
  ShieldAlert, ShieldCheck, ShoppingCart, Trash2, TrendingDown, TrendingUp,
  Truck, Users, Wallet, Warehouse, Wrench, XCircle,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CATALOGO_MODULOS,
  type CapituloCatalogo,
  type ModuloCatalogo,
} from "@/lib/erp/modulos-catalogo";

type CatalogoModulosProps = {
  subtitulo: string;
};

const ICONOS_MODULOS: Record<ModuloCatalogo["icono"], LucideIcon> = {
  AlertCircle, AlertTriangle, ArrowLeftRight, Award, BarChart3, BookOpen,
  Calendar, CalendarDays, Car, ClipboardCheck, ClipboardList, Clock, Cloud,
  Copy, DoorOpen, FileCheck, FileSignature, FileText, FolderCheck, Gauge,
  GitCompare, Globe, HardHat, History, Image, Landmark, Layers, Library,
  ListChecks, ListTodo, Mail, Receipt, RefreshCw, Scale, Search, Settings,
  ShieldAlert, ShieldCheck, ShoppingCart, Trash2, TrendingDown, TrendingUp,
  Truck, Users, Wallet, Warehouse, Wrench, XCircle,
};

export function CatalogoModulos({ subtitulo }: CatalogoModulosProps) {
  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Módulos</h1>
          <p className="page-subtitle">{subtitulo}</p>
        </div>
      </header>

      <div className="chapter-grid">
        {CATALOGO_MODULOS.map((capitulo) => (
          <section
            key={capitulo.slug}
            className={`chapter-box chapter-box--${capitulo.slug} flex h-[19rem] min-w-0 flex-col !p-4`}
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
              <h2 className="chapter-box-title min-w-0">{capitulo.titulo}</h2>
              <span className="badge badge-neutral shrink-0" aria-label={`${capitulo.modulos.length} módulos`}>
                {capitulo.modulos.length}
              </span>
            </div>

            <div className="flex min-h-0 flex-col gap-3">
              {capitulo.modulos.slice(0, 3).map((modulo) => (
                <TarjetaModulo key={modulo.titulo} modulo={modulo} slugCapitulo={capitulo.slug} />
              ))}
            </div>

            <div className="mt-auto flex min-h-5 items-end">
              {capitulo.modulos.length > 3 ? <DialogCapitulo capitulo={capitulo} /> : null}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

function TarjetaModulo({
  modulo,
  slugCapitulo,
}: {
  modulo: ModuloCatalogo;
  slugCapitulo: string;
  compacta?: boolean;
}) {
  const IconoModulo = ICONOS_MODULOS[modulo.icono] ?? Search;

  return (
    <article className="module-card relative !mb-0 h-[4.25rem] !cursor-default !items-center !py-2 opacity-70 transition-[background-color,box-shadow] duration-(--transition-base) hover:!bg-(--bg-surface-hover) hover:shadow-(--shadow-sm)">
      <span
        className="module-card-icon"
        aria-hidden="true"
        style={{ backgroundColor: "var(--bg-muted)" }}
      >
        <IconoModulo
          size={18}
          strokeWidth={1.8}
          style={{ color: `var(--capitulo-${slugCapitulo}-text)` }}
        />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="module-card-title flex-1 truncate min-w-0">
            {modulo.titulo}
          </h3>
          <span className="badge badge-neutral shrink-0 !px-1.5 !py-0.5 !text-[9px]">
            En desarrollo
          </span>
        </div>
        <p className="module-card-description line-clamp-2 text-muted">
          {modulo.descripcion}
        </p>
      </div>
    </article>
  );
}

function DialogCapitulo({ capitulo }: { capitulo: CapituloCatalogo }) {
  const restantes = capitulo.modulos.length - 3;
  const [abierto, setAbierto] = useState(false);

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <Button
        type="button"
        variant="link"
        className="h-auto p-0 text-sm font-semibold text-current no-underline opacity-80 hover:opacity-100 hover:no-underline"
        onClick={() => setAbierto(true)}
      >
        + {restantes} más →
      </Button>
      <DialogContent
        className={`chapter-box--${capitulo.slug} max-h-[85vh] w-[calc(100%-2rem)] max-w-4xl overflow-hidden border-0 p-0 text-current sm:rounded-lg`}
      >
        <DialogHeader className="px-6 pt-6 pr-14">
          <div className="flex min-w-0 items-center gap-3">
            <DialogTitle className="chapter-box-title mb-0 min-w-0 text-left text-current">
              {capitulo.titulo}
            </DialogTitle>
            <span className="badge badge-neutral shrink-0" aria-label={`${capitulo.modulos.length} módulos`}>
              {capitulo.modulos.length}
            </span>
          </div>
        </DialogHeader>
        <div className="grid min-h-0 grid-cols-1 gap-3 overflow-y-auto px-6 pb-6 md:grid-cols-2">
          {capitulo.modulos.map((modulo) => (
            <TarjetaModulo key={modulo.titulo} modulo={modulo} slugCapitulo={capitulo.slug} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}