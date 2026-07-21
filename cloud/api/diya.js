import { loadConfig } from "../src/config.mjs";
import { asHttpError } from "../src/errors.mjs";
import { launchPage, privacyPage, PUBLIC_PAGE_CSP } from "../src/landing.mjs";
import { openDiyaDatabase } from "../src/open-database.mjs";
import { missingEnvironmentNames } from "../src/preflight.mjs";
import { createDiyaHandler } from "../src/server.mjs";

export const config = { maxDuration: 60 };

let runtime;

async function getRuntime() {
  if (!runtime) {
    runtime = (async () => {
      const config = loadConfig();
      const database = await openDiyaDatabase(config);
      return { handler: createDiyaHandler({ config, database }) };
    })();
    runtime.catch(() => { runtime = null; });
  }
  return runtime;
}

function publicPath(request) {
  const url = new URL(request.url || "/", "https://diya-cloud.local");
  const rewrittenPath = url.searchParams.get("diyaPath");
  if (rewrittenPath !== null) return `/${rewrittenPath.replace(/^\/+/, "")}`;
  return url.pathname;
}

function sendPublicHtml(response, html) {
  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Security-Policy": PUBLIC_PAGE_CSP,
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY"
  });
  response.end(html);
}

function sendConfigurationHealth(request, response, error) {
  const path = publicPath(request);
  if (request.method !== "GET" || path !== "/health") return false;
  const safe = asHttpError(error);
  response.writeHead(503, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer"
  });
  response.end(JSON.stringify({
    ok: false,
    service: "diya-cloud",
    ready: false,
    error: { code: safe.code, message: safe.message },
    missing: missingEnvironmentNames(process.env),
    now: new Date().toISOString()
  }));
  return true;
}

export default async function diya(request, response) {
  if (request.method === "GET") {
    const path = publicPath(request);
    if (path === "/") return sendPublicHtml(response, launchPage());
    if (path === "/privacy") return sendPublicHtml(response, privacyPage());
  }

  try {
    const { handler } = await getRuntime();
    return handler(request, response);
  } catch (error) {
    if (sendConfigurationHealth(request, response, error)) return;
    const safe = asHttpError(error);
    response.writeHead(safe.status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "no-referrer"
    });
    return response.end(JSON.stringify({ error: { code: safe.code, message: safe.message } }));
  }
}
