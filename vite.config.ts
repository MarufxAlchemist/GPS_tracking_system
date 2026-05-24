import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
// import cloudflare from "@cloudflare/vite-plugin"; // Uncomment if using cloudflare deployment

export default defineConfig({
  server: {
    allowedHosts: true
  },

  // Expose both VITE_ (standard) and NEXT_PUBLIC_ (from shared .env.local) to client code
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],

  ssr: {
    // Prevent leaflet and react-leaflet from being bundled in SSR —
    // they require `window` and must only run in the browser.
    external: ["leaflet", "react-leaflet"],
  },

  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart({
      server: { 
        entry: "server",
        preset: process.env.VERCEL ? "vercel" : "node",
      },
    }),
    viteReact(),
    // cloudflare(),
  ],
});
