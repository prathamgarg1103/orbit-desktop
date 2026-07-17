import { loadConfig } from "./config.mjs";
import { DiyaDatabase } from "./database.mjs";
import { createDiyaServer } from "./server.mjs";

const config = loadConfig();
const database = new DiyaDatabase(config.databasePath);
const server = createDiyaServer({ config, database });

server.listen(config.port, config.host, () => {
  console.log(`Diya Cloud listening on http://${config.host}:${config.port}`);
});

function shutdown() {
  server.close(() => { database.close(); process.exit(0); });
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
