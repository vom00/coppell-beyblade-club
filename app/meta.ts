import type { Metadata } from "next";
import { routes, site } from "@/lib/content";
import type { RouteId } from "@/lib/content-types";

export function routeMeta(id: RouteId): Metadata {
  const r = routes.find((x) => x.id === id);
  if (!r) throw new Error(`Unknown route ${id}`);
  // Link previews in chat apps read these. There is no image: that needs the site's public address.
  return { title: r.title, description: r.description, openGraph: { title: r.title, description: r.description, siteName: site.name, type: "website" } };
}
