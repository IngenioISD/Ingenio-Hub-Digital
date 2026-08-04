import { CATALOGO_MODULOS } from "@/lib/erp/modulos-catalogo";

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
            className={`chapter-box chapter-box--${capitulo.slug}`}
          >
            <h2 className="chapter-box-title">{capitulo.titulo}</h2>
            <div>
              {capitulo.modulos.map((modulo) => (
                <article
                  key={modulo.titulo}
                  className="module-card"
                  style={{ cursor: "default", opacity: 0.7, boxShadow: "none" }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="module-card-title min-w-0 flex-1">{modulo.titulo}</h3>
                      <span className="badge badge-neutral shrink-0">En desarrollo</span>
                    </div>
                    <p className="module-card-description">{modulo.descripcion}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}