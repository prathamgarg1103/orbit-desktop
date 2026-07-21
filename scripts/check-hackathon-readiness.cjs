const fs = require("node:fs");
const https = require("node:https");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const packageJson = require(path.join(root, "package.json"));
const requireCloud = process.argv.includes("--require-cloud");

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function git(args) {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error) {
    return "";
  }
}

function check(name, passed, detail) {
  return { name, passed: Boolean(passed), detail };
}

function getJson(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 15000 }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        try {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ ok: false, statusCode: res.statusCode, body: body.slice(0, 240) });
        }
      });
    });
    req.on("timeout", () => {
      req.destroy(new Error("request timed out"));
    });
    req.on("error", (error) => {
      resolve({ ok: false, statusCode: 0, body: error.message });
    });
  });
}

async function main() {
  const status = git(["status", "--short", "--branch"]);
  const aheadOrDirty = status.split(/\r?\n/).some((line, index) => {
    if (index === 0) return line.includes("[ahead") || line.includes("[behind") || line.includes("[gone");
    return line.trim().length > 0;
  });
  const latestCommit = git(["log", "-1", "--oneline"]) || "unknown";
  const exePath = `dist\\Diya ${packageJson.version}.exe`;
  const health = await getJson("https://diya-cloud.vercel.app/health");
  const liveCloudReady = Boolean(health.ok && health.body && health.body.ok === true && health.body.openaiConfigured === true);

  const localChecks = [
    check("repository pushed and clean", !aheadOrDirty, status || "git status unavailable"),
    check("portable Windows app exists", exists(exePath), exePath),
    check("submission copy exists", exists("SUBMISSION.md"), "SUBMISSION.md"),
    check("demo script exists", exists("DEMO_SCRIPT.md"), "DEMO_SCRIPT.md"),
    check("readiness checklist exists", exists("HACKATHON_READINESS.md"), "HACKATHON_READINESS.md")
  ];

  const cloudChecks = [
    check("Diya Cloud health", liveCloudReady, health.ok ? JSON.stringify(health.body) : `HTTP ${health.statusCode}: ${typeof health.body === "string" ? health.body : JSON.stringify(health.body)}`)
  ];

  const localDemoReady = localChecks.every((item) => item.passed);
  const overallReady = localDemoReady && (!requireCloud || liveCloudReady);

  console.log(`Diya hackathon readiness`);
  console.log(`Latest commit: ${latestCommit}`);
  console.log("");
  console.log(`Local demo: ${localDemoReady ? "READY" : "NOT READY"}`);
  for (const item of localChecks) {
    console.log(`- ${item.passed ? "PASS" : "FAIL"} ${item.name}: ${item.detail}`);
  }
  console.log("");
  console.log(`Live cloud: ${liveCloudReady ? "READY" : "NOT READY"}`);
  for (const item of cloudChecks) {
    console.log(`- ${item.passed ? "PASS" : "FAIL"} ${item.name}: ${item.detail}`);
  }
  console.log("");
  console.log(liveCloudReady
    ? "Submission framing: local app plus live Diya Cloud are ready to claim."
    : "Submission framing: local app is ready; claim Diya Cloud as implemented startup infrastructure until Vercel has DIYA_DATABASE_URL and OPENAI_API_KEY.");

  if (!overallReady) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
