/**
 * Vercel Build Output API builder for TanStack Start.
 * 
 * TanStack Start v1 builds to dist/client + dist/server.
 * Vercel expects .vercel/output/ with static/, functions/, and config.json
 * This script bridges the gap.
 */
import { execSync } from "child_process";
import { cpSync, mkdirSync, writeFileSync, rmSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

console.log("🔨 Step 1/4: Running Vite build...");
execSync("npx vite build", { cwd: root, stdio: "inherit", env: { ...process.env, VERCEL: "1" } });

const outputDir = join(root, ".vercel", "output");

// Clean previous output.
if (existsSync(outputDir)) {
  rmSync(outputDir, { recursive: true, force: true });
}

console.log("📦 Step 2/4: Creating Vercel output structure...");

// Copy client assets → static/
const staticDir = join(outputDir, "static");
mkdirSync(staticDir, { recursive: true });
cpSync(join(root, "dist", "client"), staticDir, { recursive: true });
console.log("   ✅ Static assets copied");

// Create serverless function
console.log("⚡ Step 3/4: Creating serverless function...");
const funcDir = join(outputDir, "functions", "index.func");
mkdirSync(funcDir, { recursive: true });

// Copy server build into function directory
cpSync(join(root, "dist", "server"), funcDir, { recursive: true });

// Create function entry wrapper
// The built server.js exports default { fetch(request, env, ctx) }
// which is the Web API format Vercel serverless functions expect
writeFileSync(
  join(funcDir, "index.mjs"),
  `import server from './server.js';
export default async function handler(request) {
  return server.fetch(request, {}, {});
}
`
);

// Function runtime config
writeFileSync(
  join(funcDir, ".vc-config.json"),
  JSON.stringify(
    {
      runtime: "nodejs22.x",
      handler: "index.mjs",
      launcherType: "Nodejs",
      supportsResponseStreaming: true,
    },
    null,
    2
  )
);
console.log("   ✅ Serverless function created");

// Output routing config
console.log("🗺️  Step 4/4: Writing routing config...");
writeFileSync(
  join(outputDir, "config.json"),
  JSON.stringify(
    {
      version: 3,
      routes: [
        // Try static files first (CSS, JS, images, etc.)
        { handle: "filesystem" },
        // Everything else goes to the SSR function.
        { src: "/(.*)", dest: "/" },
      ],
    },
    null,
    2
  )
);

console.log("✅ Vercel Build Output API directory created at .vercel/output/");
console.log("   📁 static/     — client assets");
console.log("   📁 functions/  — SSR serverless function");
console.log("   📄 config.json — routing rules");
