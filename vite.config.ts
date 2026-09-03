import react from "@vitejs/plugin-react";
import fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { createServerModuleRunner, defineConfig, loadEnv, type Plugin } from "vite";

type Handler = (request: Request) => Response | Promise<Response>;

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
}

/**
 * Serves /api/<name> under `npm run dev` with the same handlers Vercel runs in production (api/<name>.ts), so the
 * API works locally. Modules are loaded through Vite, so edits apply without a restart.
 */
function localApi(): Plugin {
  return {
    name: "local-api",
    configureServer(server) {
      const runner = createServerModuleRunner(server.environments.ssr);
      server.middlewares.use("/api", async (req: IncomingMessage, res: ServerResponse) => {
        try {
          const name = (req.url ?? "/").split("?")[0].replace(/^\/+|\/+$/g, "");
          if (!/^[a-z0-9-]+$/.test(name) || !fs.existsSync(path.resolve("api", `${name}.ts`))) {
            sendJson(res, 404, { error: `No API function named ${name || "(none)"}` });
            return;
          }
          const handlers = (await runner.import(`/api/${name}.ts`)) as Record<string, Handler | undefined>;
          const method = req.method ?? "GET";
          const handler = handlers[method];
          if (!handler) {
            sendJson(res, 405, { error: `Method ${method} not allowed` });
            return;
          }
          const headers = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (typeof value === "string") headers.set(key, value);
            else if (Array.isArray(value)) headers.set(key, value.join(", "));
          }
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const hasBody = chunks.length > 0 && method !== "GET" && method !== "HEAD";
          const url = (req as IncomingMessage & { originalUrl?: string }).originalUrl ?? `/api/${name}`;
          const request = new Request(`http://${req.headers.host ?? "localhost"}${url}`, { method, headers, body: hasBody ? Buffer.concat(chunks) : undefined });
          const response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (e) {
          sendJson(res, 500, { error: e instanceof Error ? e.message : String(e) });
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // The API handlers read process.env, as they do on Vercel; expose the .env values to them in development.
  for (const [key, value] of Object.entries(loadEnv(mode, process.cwd(), "VITE_"))) process.env[key] ??= value;

  /** Public URL of the deployment, used by the research prompt to point at the ingest endpoint. */
  const appUrl = process.env.VITE_APP_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "");

  return {
    plugins: [react(), localApi()],
    define: { "import.meta.env.VITE_APP_URL": JSON.stringify(appUrl) },
  };
});
