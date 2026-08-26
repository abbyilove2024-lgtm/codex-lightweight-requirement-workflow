#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const pluginRoot = path.join(repoRoot, "plugins", "lightweight-requirement-workflow");
const skillRoot = path.join(pluginRoot, "skills", "lightweight-requirement-workflow");
const errors = [];

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    errors.push(`Invalid JSON ${path.relative(repoRoot, file)}: ${error.message}`);
    return {};
  }
}

const marketplace = readJson(path.join(repoRoot, ".agents", "plugins", "marketplace.json"));
const plugin = readJson(path.join(pluginRoot, ".codex-plugin", "plugin.json"));
const skillFile = path.join(skillRoot, "SKILL.md");
const skill = fs.existsSync(skillFile) ? fs.readFileSync(skillFile, "utf8") : "";

if (marketplace.name !== "team-product") errors.push("Marketplace name must be team-product.");
const entry = marketplace.plugins?.find((item) => item.name === "lightweight-requirement-workflow");
if (!entry) errors.push("Marketplace plugin entry is missing.");
if (entry?.source?.path !== "./plugins/lightweight-requirement-workflow") errors.push("Marketplace source path is invalid.");
if (entry?.policy?.installation !== "AVAILABLE") errors.push("Marketplace installation policy must be AVAILABLE.");
if (entry?.policy?.authentication !== "ON_INSTALL") errors.push("Marketplace authentication policy must be ON_INSTALL.");
if (!entry?.category) errors.push("Marketplace category is missing.");
if (plugin.name !== "lightweight-requirement-workflow") errors.push("Plugin name does not match folder.");
if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(plugin.version || "")) errors.push("Plugin version is not semver.");
if (plugin.skills !== "./skills/") errors.push("Plugin skills path must be ./skills/.");
for (const field of ["displayName", "shortDescription", "longDescription", "developerName", "category"]) {
  if (!plugin.interface?.[field]) errors.push(`Plugin interface.${field} is missing.`);
}
if (!skill.startsWith("---\nname: lightweight-requirement-workflow\n")) errors.push("Skill frontmatter name is missing.");
if (!/^description: .+/m.test(skill)) errors.push("Skill description is missing.");

const lib = fs.readFileSync(path.join(skillRoot, "scripts", "lib.mjs"), "utf8");
const workflowVersion = lib.match(/WORKFLOW_VERSION\s*=\s*"([^"]+)"/)?.[1];
if (workflowVersion !== plugin.version) {
  errors.push(`Workflow version ${workflowVersion || "missing"} does not match Plugin version ${plugin.version || "missing"}.`);
}

for (const file of [skillFile, path.join(skillRoot, "agents", "openai.yaml")]) {
  if (!fs.existsSync(file)) errors.push(`Missing required file: ${path.relative(repoRoot, file)}`);
  else if (/\[TODO:|\bTODO\b/.test(fs.readFileSync(file, "utf8"))) errors.push(`TODO remains in ${path.relative(repoRoot, file)}`);
}

const referenceLinks = [...skill.matchAll(/\]\(references\/([^)]+)\)/g)].map((match) => match[1]);
for (const reference of referenceLinks) {
  if (!fs.existsSync(path.join(skillRoot, "references", reference))) errors.push(`Missing referenced file: ${reference}`);
}

const scriptsDir = path.join(skillRoot, "scripts");
for (const file of fs.readdirSync(scriptsDir).filter((name) => name.endsWith(".mjs"))) {
  const result = spawnSync(process.execPath, ["--check", path.join(scriptsDir, file)], { encoding: "utf8" });
  if (result.status !== 0) errors.push(`Syntax error in ${file}: ${result.stderr.trim()}`);
}

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}
console.log("Repository validation passed.");
