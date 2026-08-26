#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { currentStage, parseArgs, readState, requireArg } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const requirementDir = path.resolve(requireArg(args, "requirement"));
const state = readState(requirementDir);
const artifacts = {
  summary: fs.existsSync(path.join(requirementDir, "requirement_summary.md")),
  documents: ["flowchart.md", "prd.md", "user_story.md", "prototype.md", "review.md"]
    .every((file) => fs.existsSync(path.join(requirementDir, file))),
  wireframe: fs.existsSync(path.join(requirementDir, "prototypes"))
    && fs.readdirSync(path.join(requirementDir, "prototypes")).some((file) => file.endsWith(".svg")),
  html_visual: fs.existsSync(path.join(requirementDir, "visual_direction.md")),
  html: fs.existsSync(path.join(requirementDir, "prototype_html", "index.html")),
  self_review: fs.existsSync(path.join(requirementDir, "self_review.md")),
  knowledge_base_draft: fs.existsSync(path.join(requirementDir, "knowledge_base_draft.md"))
};

const unresolvedArtifacts = Object.entries(artifacts)
  .filter(([gate, exists]) => exists && state.gates[gate]?.status === "pending")
  .map(([gate]) => `${gate} exists but is not confirmed`);

console.log(JSON.stringify({
  requirement: state.requirementName,
  currentStage: currentStage(state),
  gates: state.gates,
  artifacts,
  warnings: unresolvedArtifacts
}, null, 2));
