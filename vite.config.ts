import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
// import cloudflare from "@cloudflare/vite-plugin"; // Uncomment if using cloudflare deployment

export default defineConfig({
  // Expose both VITE_ (standard) and NEXT_PUBLIC_ (from shared .env.local) to client code
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart({
      server: { entry: "server" },
    }),
    viteReact(),
    // cloudflare(),
  ],
});

