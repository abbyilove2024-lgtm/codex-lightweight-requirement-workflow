#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  assertRequirementName,
  newState,
  parseArgs,
  requireArg,
  writeState
} from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const root = path.resolve(requireArg(args, "root"));
const name = requireArg(args, "name");
const title = String(args.title || name);
assertRequirementName(name);

const requirementDir = path.join(root, "documents", "product_requirements", name);
if (fs.existsSync(requirementDir)) {
  throw new Error(`Requirement already exists: ${requirementDir}`);
}

fs.mkdirSync(path.join(requirementDir, ".workflow"), { recursive: true });
fs.mkdirSync(path.join(requirementDir, "prototypes"), { recursive: true });
fs.mkdirSync(path.join(requirementDir, "prototype_html"), { recursive: true });
writeState(requirementDir, newState(name, title));
fs.writeFileSync(
  path.join(requirementDir, "decision_log.md"),
  "# 决策记录\n\n| 时间 | 门槛 | 状态 | 说明 |\n| --- | --- | --- | --- |\n"
);
console.log(requirementDir);
