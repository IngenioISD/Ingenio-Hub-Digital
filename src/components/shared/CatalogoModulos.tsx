import { DynamicIcon } from "lucide-react/dynamic";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CATALOGO_MODULOS,
  type CapituloCatalogo,
  type ModuloCatalogo,
} from "@/lib/erp/modulos-catalogo";

type CatalogoModulosProps = {
  subtitulo: string;
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
            className={`chapter-box chapter-box--${capitulo.slug} flex h-[32rem] min-w-0 flex-col`}
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
              <h2 className="chapter-box-title min-w-0">{capitulo.titulo}</h2>
              <span className="badge badge-neutral shrink-0" aria-label={`${capitulo.modulos.length} módulos`}>
                {capitulo.modulos.length}
              </span>
            </div>

            <div className="min-h-0">
              {capitulo.modulos.slice(0, 3).map((modulo) => (
                <TarjetaModulo key={modulo.titulo} modulo={modulo} />
              ))}
            </div>

            <div className="mt-auto flex min-h-8 items-end">
              {capitulo.modulos.length > 3 ? <DialogCapitulo capitulo={capitulo} /> : null}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

function TarjetaModulo({ modulo }: { modulo: ModuloCatalogo }) {
  return (
    <article className="module-card cursor-default opacity-70 shadow-none hover:shadow-none">
      <span className="module-card-icon" aria-hidden="true">
        <DynamicIcon name={modulo.icono} size={18} strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
          <h3 className="module-card-title min-w-0">{modulo.titulo}</h3>
          <span className="badge badge-neutral shrink-0">En desarrollo</span>
        </div>
        <p className="module-card-description">{modulo.descripcion}</p>
      </div>
    </article>
  );
}

function DialogCapitulo({ capitulo }: { capitulo: CapituloCatalogo }) {
  const restantes = capitulo.modulos.length - 3;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="link"
          className="h-auto p-0 text-sm font-semibold text-current no-underline opacity-80 hover:opacity-100 hover:no-underline"
        >
          + {restantes} más →
        </Button>
      </DialogTrigger>
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
        <div className="grid min-h-0 grid-cols-1 gap-x-3 overflow-y-auto px-6 pb-6 md:grid-cols-2">
          {capitulo.modulos.map((modulo) => (
            <TarjetaModulo key={modulo.titulo} modulo={modulo} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}