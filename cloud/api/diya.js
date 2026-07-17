import { loadConfig } from "../src/config.mjs";
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
  const { handler } = await getRuntime();
  return handler(request, response);
}
