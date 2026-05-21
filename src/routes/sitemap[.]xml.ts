import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries = [
          { path: "/", priority: "1.0" },
          { path: "/login" },
          { path: "/signup" },
          { path: "/dashboard" },
          { path: "/tracking" },
          { path: "/zones" },
          { path: "/alerts" },
          { path: "/analytics" },
          { path: "/student" },
        ];
        const urls = entries.map((e) => `  <url><loc>${BASE_URL}${e.path}</loc>${e.priority?`<priority>${e.priority}</priority>`:""}</url>`).join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml" } });
      },
    },
  },
});
