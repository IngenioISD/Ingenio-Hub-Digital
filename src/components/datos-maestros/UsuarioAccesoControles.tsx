import { useState } from "react";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cambiarAccesoDesactivado, type UsuarioFila } from "@/lib/datos-maestros/usuarios";

export function BadgeAccesoUsuario({ activo }: { activo: boolean }) {
  return <span className={activo ? "badge badge-success" : "badge badge-neutral"}>{activo ? "Activo" : "Sin acceso"}</span>;
}

export function AvisoRolPuesto({ puesto }: { puesto: string | null }) {
  if (!puesto) return null;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex align-middle text-muted-foreground" aria-label={`Rol distinto al de su puesto (${puesto})`}>
            <AlertTriangle className="h-4 w-4" />
          </span>
        </TooltipTrigger>
        <TooltipContent>Rol distinto al de su puesto ({puesto})</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function OjoAcceso({ usuario, esPropio, onCambiado }: { usuario: UsuarioFila; esPropio: boolean; onCambiado: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const desactivado = usuario.accesoDesactivado;

  const boton = (
    <Button
      variant="ghost"
      size="icon"
      disabled={esPropio}
      aria-label={desactivado ? "Reactivar acceso" : "Desactivar acceso"}
      onClick={(e) => { e.stopPropagation(); setAbierto(true); }}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {desactivado ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </Button>
  );

  return (
    <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      {esPropio ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild><span tabIndex={0}>{boton}</span></TooltipTrigger>
            <TooltipContent>No puedes desactivar tu propio acceso</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : boton}
      <AlertDialog open={abierto} onOpenChange={setAbierto}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{desactivado ? "Reactivar acceso" : "Desactivar acceso"}</AlertDialogTitle>
            <AlertDialogDescription>
              {desactivado
                ? `¿Reactivar el acceso de ${usuario.nombreCompleto}?`
                : `¿Desactivar el acceso de ${usuario.nombreCompleto}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={guardando}
              onClick={async () => {
                setGuardando(true);
                try {
                  await cambiarAccesoDesactivado(usuario.id, !desactivado);
                  toast.success(desactivado ? "Acceso reactivado" : "Acceso desactivado");
                  onCambiado();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "No se pudo guardar");
                } finally {
                  setGuardando(false);
                }
              }}
            >
              {desactivado ? "Reactivar" : "Desactivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </span>
  );
}
