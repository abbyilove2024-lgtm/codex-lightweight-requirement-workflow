#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs, requireArg } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const root = path.resolve(requireArg(args, "root"));
const skillDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const templateDir = path.join(skillDir, "assets", "workspace-template");

function copyMissing(source, target) {
  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const entry of fs.readdirSync(source)) {
      copyMissing(path.join(source, entry), path.join(target, entry));
    }
    return;
  }
  if (!fs.existsSync(target)) fs.copyFileSync(source, target);
}

fs.mkdirSync(root, { recursive: true });
copyMissing(templateDir, root);
console.log(`Workspace initialized without overwriting existing files: ${root}`);
