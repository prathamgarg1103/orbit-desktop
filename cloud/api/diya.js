import { loadConfig } from "../src/config.mjs";
import { asHttpError } from "../src/errors.mjs";
import { openDiyaDatabase } from "../src/open-database.mjs";
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

export default async function diya(request, response) {
  try {
    const { handler } = await getRuntime();
    return handler(request, response);
  } catch (error) {
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
