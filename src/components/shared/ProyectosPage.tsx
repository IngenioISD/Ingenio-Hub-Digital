import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderSearch,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { BadgeEstado, etiquetaEstado } from "@/components/shared/BadgeEstado";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatoEuros } from "@/lib/erp/formato";
import { getProyectosListado } from "@/lib/erp/proyectos.functions";
import type { EstadoProyecto, ProyectoListado } from "@/lib/erp/proyectos.types";

const TODAS = "__todas__";
const STORAGE_KEY = "ingenio:hub:proyectos:filtros";
const ESTADOS: EstadoProyecto[] = ["en_estudio", "adjudicado", "perdido", "finalizado"];
const EXPORT_HEADERS = [
  "Proyecto",
  "Propiedad",
  "Tipo de obra",
  "Región",
  "Presupuesto de venta estimado",
  "Estado",
] as const;

type SortKey = "nombre" | "propiedadNombre" | "tipoObra" | "region" | "presupuestoVenta" | "estado";
type SortDirection = "asc" | "desc";
type StoredState = {
  busqueda: string;
  propiedad: string;
  region: string;
  tipo: string;
  estados: EstadoProyecto[];
  sortKey: SortKey;
  sortDirection: SortDirection;
  pageSize: number;
};

const DEFAULT_STATE: StoredState = {
  busqueda: "",
  propiedad: TODAS,
  region: TODAS,
  tipo: TODAS,
  estados: [],
  sortKey: "nombre",
  sortDirection: "asc",
  pageSize: 25,
};

function normalize(value: string | null): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}

function unique(values: (string | null)[]): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort((a, b) =>
    a.localeCompare(b, "es"),
  );
}

function labelTipo(value: string | null): string {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/^./, (letter) => letter.toLocaleUpperCase("es"));
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function exportRows(rows: ProyectoListado[]) {
  return rows.map((row) => ({
    Proyecto: row.nombre,
    Propiedad: row.propiedadNombre ?? "—",
    "Tipo de obra": labelTipo(row.tipoObra),
    Región: row.region ?? "—",
    "Presupuesto de venta estimado": row.presupuestoVenta,
    Estado: etiquetaEstado(row.estado),
  }));
}

function FilterSelect({
  ariaLabel,
  value,
  onChange,
  allLabel,
  options,
}: {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  allLabel: string;
  options: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={ariaLabel} className="bg-(--bg-surface)">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={TODAS}>{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {ariaLabel === "Tipo de obra" ? labelTipo(option) : option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function StatusFilter({
  available,
  selected,
  onChange,
}: {
  available: EstadoProyecto[];
  selected: EstadoProyecto[];
  onChange: (value: EstadoProyecto[]) => void;
}) {
  const label = selected.length === 0 ? "Todos los estados" : `${selected.length} estados`;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between bg-(--bg-surface) font-normal">
          <span className="truncate">{label}</span>
          <SlidersHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuCheckboxItem checked={selected.length === 0} onCheckedChange={() => onChange([])}>
          Todos los estados
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        {available.map((estado) => (
          <DropdownMenuCheckboxItem
            key={estado}
            checked={selected.includes(estado)}
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={(checked) =>
              onChange(
                checked
                  ? [...selected, estado]
                  : selected.filter((selectedEstado) => selectedEstado !== estado),
              )
            }
          >
            {etiquetaEstado(estado)}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ProyectosPage() {
  const fetchProyectos = useServerFn(getProyectosListado);
  const { data = [], isPending, isError, refetch } = useQuery({
    queryKey: ["hub", "proyectos-listado"],
    queryFn: () => fetchProyectos(),
  });
  const [state, setState] = useState<StoredState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [page, setPage] = useState(1);
  const [mobileCount, setMobileCount] = useState(20);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setState({ ...DEFAULT_STATE, ...(JSON.parse(stored) as Partial<StoredState>) });
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const properties = useMemo(() => unique(data.map((row) => row.propiedadNombre)), [data]);
  const regions = useMemo(() => unique(data.map((row) => row.region)), [data]);
  const types = useMemo(() => unique(data.map((row) => row.tipoObra)), [data]);
  const availableStates = useMemo(
    () => ESTADOS.filter((estado) => data.some((row) => row.estado === estado)),
    [data],
  );

  const filtered = useMemo(() => {
    const query = normalize(state.busqueda.trim());
    const rows = data.filter(
      (row) =>
        (!query ||
          [row.nombre, row.codigoEstudios, row.codigoObra].some((value) =>
            normalize(value).includes(query),
          )) &&
        (state.propiedad === TODAS || row.propiedadNombre === state.propiedad) &&
        (state.region === TODAS || row.region === state.region) &&
        (state.tipo === TODAS || row.tipoObra === state.tipo) &&
        (state.estados.length === 0 || state.estados.includes(row.estado as EstadoProyecto)),
    );

    return rows.sort((left, right) => {
      const a = left[state.sortKey];
      const b = right[state.sortKey];
      let result: number;
      if (typeof a === "number" || typeof b === "number") {
        result = (a ?? Number.NEGATIVE_INFINITY) as number;
        result -= (b ?? Number.NEGATIVE_INFINITY) as number;
      } else {
        result = (a ?? "").localeCompare((b ?? "") as string, "es", { numeric: true });
      }
      return state.sortDirection === "asc" ? result : -result;
    });
  }, [data, state]);

  const activeFilterCount =
    Number(Boolean(state.busqueda.trim())) +
    Number(state.propiedad !== TODAS) +
    Number(state.region !== TODAS) +
    Number(state.tipo !== TODAS) +
    state.estados.length;
  const totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * state.pageSize, currentPage * state.pageSize);
  const mobileRows = filtered.slice(0, mobileCount);

  useEffect(() => {
    setPage(1);
    setMobileCount(20);
  }, [state.busqueda, state.propiedad, state.region, state.tipo, state.estados, state.sortKey, state.sortDirection]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || mobileCount >= filtered.length) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setMobileCount((count) => Math.min(count + 20, filtered.length));
      },
      { rootMargin: "160px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [filtered.length, mobileCount]);

  function update<K extends keyof StoredState>(key: K, value: StoredState[K]) {
    setState((previous) => ({ ...previous, [key]: value }));
  }

  function clearFilters() {
    setState((previous) => ({
      ...previous,
      busqueda: "",
      propiedad: TODAS,
      region: TODAS,
      tipo: TODAS,
      estados: [],
    }));
  }

  function sortBy(key: SortKey) {
    setState((previous) => ({
      ...previous,
      sortKey: key,
      sortDirection:
        previous.sortKey === key && previous.sortDirection === "asc" ? "desc" : "asc",
    }));
  }

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.json_to_sheet(exportRows(filtered));
    sheet["!cols"] = [{ wch: 34 }, { wch: 30 }, { wch: 20 }, { wch: 18 }, { wch: 28 }, { wch: 16 }];
    for (let row = 2; row <= filtered.length + 1; row += 1) {
      const cell = sheet[`E${row}`];
      if (cell?.v != null) cell.z = "#,##0 [$€-es-ES]";
    }
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Proyectos");
    XLSX.writeFile(workbook, "proyectos-filtrados.xlsx");
  }

  function exportCsv() {
    const rows = exportRows(filtered);
    const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [EXPORT_HEADERS.map(escape), ...rows.map((row) => Object.values(row).map(escape))]
      .map((row) => row.join(";"))
      .join("\r\n");
    downloadBlob(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }), "proyectos-filtrados.csv");
  }

  const filters = (
    <>
      <div className="relative min-w-0">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-(--text-muted)" aria-hidden="true" />
        <Input
          value={state.busqueda}
          onChange={(event) => update("busqueda", event.target.value)}
          placeholder="Buscar por proyecto o código"
          aria-label="Buscar proyectos"
          className="bg-(--bg-surface) pl-9"
        />
      </div>
      <FilterSelect ariaLabel="Propiedad" value={state.propiedad} onChange={(value) => update("propiedad", value)} allLabel="Todas las propiedades" options={properties} />
      <FilterSelect ariaLabel="Región" value={state.region} onChange={(value) => update("region", value)} allLabel="Todas las regiones" options={regions} />
      <FilterSelect ariaLabel="Tipo de obra" value={state.tipo} onChange={(value) => update("tipo", value)} allLabel="Todos los tipos" options={types} />
      <StatusFilter available={availableStates} selected={state.estados} onChange={(value) => update("estados", value)} />
    </>
  );

  if (isPending) {
    return <div className="mt-8 text-sm text-(--text-muted)">Cargando proyectos…</div>;
  }

  if (isError) {
    return (
      <div className="mt-8 flex flex-col items-start gap-3 text-sm text-(--text-muted)">
        <p>No se han podido cargar los proyectos.</p>
        <Button variant="outline" onClick={() => refetch()}>Reintentar</Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Proyectos</h1>
          <p className="mt-1 text-sm text-(--text-muted)">{filtered.length} de {data.length} proyectos</p>
        </div>
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden">
                <Filter aria-hidden="true" />
                Filtros{activeFilterCount ? ` (${activeFilterCount})` : ""}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-(--bg-surface)">
              <SheetHeader>
                <SheetTitle>Filtrar proyectos</SheetTitle>
                <SheetDescription>Combina los criterios para ajustar el listado.</SheetDescription>
              </SheetHeader>
              <div className="mt-6 grid gap-4">{filters}</div>
              <SheetFooter className="mt-6">
                <Button variant="outline" onClick={clearFilters} disabled={activeFilterCount === 0}>
                  <X aria-hidden="true" /> Quitar filtros
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={filtered.length === 0}>
                <Download aria-hidden="true" /> Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => void exportExcel()}>
                <FileSpreadsheet aria-hidden="true" /> Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={exportCsv}>
                <FileText aria-hidden="true" /> CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-6 hidden grid-cols-[minmax(220px,1.5fr)_repeat(4,minmax(150px,1fr))] gap-3 md:grid">
        {filters}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 flex min-h-80 flex-col items-center justify-center gap-3 rounded-(--radius-lg) border border-(--border-default) bg-(--bg-surface) px-6 text-center">
          <FolderSearch className="size-12 text-(--text-muted)" strokeWidth={1.5} aria-hidden="true" />
          <h2 className="text-lg font-semibold">No hay proyectos que coincidan</h2>
          <p className="max-w-md text-sm text-(--text-muted)">
            Prueba con otros términos o elimina los filtros para volver a ver el listado completo.
          </p>
          {activeFilterCount > 0 && <Button variant="outline" onClick={clearFilters}>Quitar filtros</Button>}
        </div>
      ) : (
        <>
          <div className="table-wrapper mt-6 hidden md:block">
            <table className="table">
              <thead>
                <tr>
                  {([
                    ["nombre", "Proyecto"],
                    ["propiedadNombre", "Propiedad"],
                    ["tipoObra", "Tipo de obra"],
                    ["region", "Región"],
                    ["presupuestoVenta", "Presupuesto de venta estimado"],
                    ["estado", "Estado"],
                  ] as [SortKey, string][]).map(([key, label]) => {
                    const active = state.sortKey === key;
                    const Icon = active ? (state.sortDirection === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
                    return (
                      <th key={key} aria-sort={active ? (state.sortDirection === "asc" ? "ascending" : "descending") : "none"}>
                        <Button variant="ghost" className="h-auto w-full justify-start p-0 text-xs font-semibold" onClick={() => sortBy(key)}>
                          {label}<Icon className="size-3.5" aria-hidden="true" />
                        </Button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, index) => (
                  <tr key={row.id} className={index % 2 === 1 ? "alt" : undefined}>
                    <td className="font-semibold"><Link className="block" to="/proyecto/$id/inicio" params={{ id: row.id }}>{row.nombre}</Link></td>
                    <td><Link className="block" to="/proyecto/$id/inicio" params={{ id: row.id }}>{row.propiedadNombre ?? "—"}</Link></td>
                    <td><Link className="block" to="/proyecto/$id/inicio" params={{ id: row.id }}>{labelTipo(row.tipoObra)}</Link></td>
                    <td><Link className="block" to="/proyecto/$id/inicio" params={{ id: row.id }}>{row.region ?? "—"}</Link></td>
                    <td><Link className="block" to="/proyecto/$id/inicio" params={{ id: row.id }}>{row.presupuestoVenta == null ? "—" : formatoEuros(row.presupuestoVenta)}</Link></td>
                    <td><Link className="block" to="/proyecto/$id/inicio" params={{ id: row.id }}><BadgeEstado estado={row.estado} /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 hidden items-center justify-between gap-4 md:flex">
            <div className="flex items-center gap-2 text-sm text-(--text-muted)">
              <span>Filas por página</span>
              <Select value={String(state.pageSize)} onValueChange={(value) => update("pageSize", Number(value))}>
                <SelectTrigger aria-label="Filas por página" className="w-20 bg-(--bg-surface)"><SelectValue /></SelectTrigger>
                <SelectContent>{[10, 25, 50, 100].map((size) => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-(--text-muted)">Página {currentPage} de {totalPages}</span>
              <Button variant="outline" size="icon" aria-label="Página anterior" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft /></Button>
              <Button variant="outline" size="icon" aria-label="Página siguiente" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}><ChevronRight /></Button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:hidden">
            {mobileRows.map((row) => (
              <Link
                key={row.id}
                to="/proyecto/$id/inicio"
                params={{ id: row.id }}
                className="block rounded-(--radius-lg) border border-(--border-default) bg-(--bg-surface) p-4 shadow-(--shadow-xs) transition-shadow hover:shadow-(--shadow-sm)"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="min-w-0 flex-1 font-semibold">{row.nombre}</h2>
                  <BadgeEstado estado={row.estado} />
                </div>
                <p className="mt-2 text-sm text-(--text-muted)">{row.propiedadNombre ?? "—"}</p>
              </Link>
            ))}
            <div ref={sentinelRef} className="h-1" aria-hidden="true" />
            {mobileCount >= filtered.length && <p className="py-2 text-center text-xs text-(--text-muted)">Fin del listado</p>}
          </div>
        </>
      )}
    </>
  );
}
