import { pathToFileURL } from "node:url";
import { loadConfig } from "./config.mjs";
import { DiyaDatabase } from "./database.mjs";
import { hash, issueInviteCode } from "./security.mjs";

function option(args, name) {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`--${name} needs a value.`);
  return value;
}

function integerOption(args, name, fallback, minimum, maximum) {
  const value = option(args, name);
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`--${name} must be an integer from ${minimum} to ${maximum}.`);
  }
  return parsed;
}

function commandHelp() {
  return [
    "Diya Cloud operator commands:",
    "  npm run admin -- invite create --label <name> [--uses 1] [--expires-days 30]",
    "  npm run admin -- invite list",
    "  npm run admin -- invite revoke --id <invite-id>"
  ].join("\n");
}

export function runAdmin({ args = process.argv.slice(2), env = process.env, write = (value) => process.stdout.write(`${value}\n`) } = {}) {
  const [resource, action, ...options] = args;
  if (resource !== "invite" || !action) throw new Error(commandHelp());
  const config = loadConfig(env);
  const database = new DiyaDatabase(config.databasePath);
  try {
    if (action === "create") {
      const uses = integerOption(options, "uses", 1, 1, 1_000);
      const expiresDays = integerOption(options, "expires-days", 30, 1, 365);
      const code = issueInviteCode();
      const invite = database.createInvite({
        label: option(options, "label") || "early access",
        codeHash: hash(code),
        maxUses: uses,
        expiresAt: new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000).toISOString()
      });
      const result = { invite, code, warning: "Copy this code now. Diya Cloud stores only its hash and cannot show it again." };
      write(JSON.stringify(result, null, 2));
      return result;
    }
    if (action === "list") {
      const result = { invites: database.listInvites() };
      write(JSON.stringify(result, null, 2));
      return result;
    }
    if (action === "revoke") {
      const id = option(options, "id");
      if (!id) throw new Error("invite revoke needs --id <invite-id>.");
      const result = { id, revoked: database.revokeInvite(id) };
      write(JSON.stringify(result, null, 2));
      return result;
    }
    throw new Error(commandHelp());
  } finally {
    database.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    runAdmin();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
