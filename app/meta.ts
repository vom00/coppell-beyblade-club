import type { Metadata } from "next";
import { routes } from "@/lib/content";
import type { RouteId } from "@/lib/content-types";

export function routeMeta(id: RouteId): Metadata {
  const r = routes.find((x) => x.id === id);
  if (!r) throw new Error(`Unknown route ${id}`);
  return { title: r.title, description: r.description };
}
