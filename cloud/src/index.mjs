import { loadConfig } from "./config.mjs";
import { OrbitDatabase } from "./database.mjs";
import { createOrbitServer } from "./server.mjs";

const config = loadConfig();
const database = new OrbitDatabase(config.databasePath);
const server = createOrbitServer({ config, database });

server.listen(config.port, config.host, () => {
  console.log(`Orbit Cloud listening on http://${config.host}:${config.port}`);
});

function shutdown() {
  server.close(() => { database.close(); process.exit(0); });
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
