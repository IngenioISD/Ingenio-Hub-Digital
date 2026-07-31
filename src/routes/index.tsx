import { createFileRoute } from "@tanstack/react-router";

// Splash mínimo del scaffold. No es una pantalla funcional; se reemplazará por
// la primera pantalla real del ERP en el siguiente prompt.
export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        Ingenio-Hub-Digital
      </h1>
      <p className="mt-4 max-w-md text-lg text-muted-foreground">
        ERP para empresas constructoras
      </p>
      <p className="mt-8 text-sm text-muted-foreground">Próximamente...</p>
    </div>
  );
}
