import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/datos-maestros")({
  beforeLoad: () => {
    throw redirect({ to: "/datos-maestros/entidades-obra/proyectos" });
  },
});
