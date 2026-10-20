export function SinAcceso({ elemento }: { elemento?: string }) {
  return (
    <div className="space-y-3 py-16 text-center text-muted-foreground">
      <h1 className="text-base font-normal">No tienes acceso a {elemento || "esta sección"}</h1>
      <p>Contacta con el administrador de tu empresa si crees que hay un error en el acceso.</p>
    </div>
  );
}