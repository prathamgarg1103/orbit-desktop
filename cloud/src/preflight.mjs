import { pathToFileURL } from "node:url";
import { loadConfig } from "./config.mjs";
import { DiyaDatabase } from "./database.mjs";

function domainFrom(env) {
  return String(env.DIYA_DOMAIN || env.ORBIT_DOMAIN || "").trim().toLowerCase();
}

function check(name, passed, detail, required = true) {
  return { name, passed: Boolean(passed), required, detail };
}

export function inspectDeployment({ env = process.env, Database = DiyaDatabase } = {}) {
  let config;
  try {
    config = loadConfig(env);
  } catch (error) {
    return {
      ready: false,
      environment: { publicUrl: null, domain: domainFrom(env) || null, model: null },
      checks: [check("configuration", false, error.message)],
      optional: { gmailOAuth: "unknown", notionOAuth: "unknown" }
    };
  }

  const domain = domainFrom(env);
  const publicHostname = config.publicUrl ? new URL(config.publicUrl).hostname.toLowerCase() : "";
  let databaseCheck;
  try {
    const database = new Database(config.databasePath);
    database.close();
    databaseCheck = check("database migration", true, "The database path is writable and all current migrations completed.");
  } catch (error) {
    databaseCheck = check("database migration", false, `Diya Cloud could not initialize its database: ${error.message}`);
  }

  const checks = [
    check("configuration", true, "Required encryption and bootstrap configuration is valid."),
    check("OpenAI project key", Boolean(config.openaiApiKey), config.openaiApiKey ? "A server-side OpenAI key is configured." : "Set OPENAI_API_KEY before inviting users; screen guidance will otherwise be unavailable."),
    check("public HTTPS URL", Boolean(config.publicUrl), config.publicUrl ? `Using ${config.publicUrl}.` : "Set DIYA_PUBLIC_URL to the public HTTPS Cloud URL before launch."),
    check("domain alignment", Boolean(domain && publicHostname === domain), domain && publicHostname === domain ? `DIYA_DOMAIN matches ${publicHostname}.` : "Set DIYA_DOMAIN to exactly the hostname in DIYA_PUBLIC_URL so Caddy and OAuth agree."),
    databaseCheck
  ];
  const ready = checks.every((item) => !item.required || item.passed);
  return {
    ready,
    environment: { publicUrl: config.publicUrl || null, domain: domain || null, model: config.model },
    checks,
    optional: {
      gmailOAuth: config.google ? "configured" : "not configured",
      notionOAuth: config.notion ? "configured" : "not configured"
    }
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = inspectDeployment();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.ready) process.exitCode = 1;
}
