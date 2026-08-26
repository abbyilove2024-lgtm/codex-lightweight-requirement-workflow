#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  appendDecision,
  currentStage,
  parseArgs,
  readState,
  requireArg,
  validateGateTransition,
  writeState
} from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const requirementDir = path.resolve(requireArg(args, "requirement"));
const gate = requireArg(args, "gate");
const status = requireArg(args, "status");
const note = String(args.note || "User explicitly decided this gate.");
const state = readState(requirementDir);

validateGateTransition(state, gate, status);
if (status === "confirmed") {
  const requiredFiles = {
    summary: ["requirement_summary.md"],
    documents: ["flowchart.md", "prd.md", "user_story.md", "prototype.md", "review.md"],
    html_visual: ["visual_direction.md"],
    html: [path.join("prototype_html", "index.html")],
    self_review: ["self_review.md"],
    knowledge_base_draft: ["knowledge_base_draft.md"]
  };
  for (const relative of requiredFiles[gate] || []) {
    const file = path.join(requirementDir, relative);
    if (!fs.existsSync(file) || fs.statSync(file).size === 0) {
      throw new Error(`Cannot confirm ${gate}; artifact missing or empty: ${relative}`);
    }
  }
  if (gate === "wireframe") {
    const dir = path.join(requirementDir, "prototypes");
    if (!fs.existsSync(dir) || !fs.readdirSync(dir).some((file) => file.endsWith(".svg"))) {
      throw new Error("Cannot confirm wireframe; no SVG artifact exists.");
    }
  }
}
const timestamp = new Date().toISOString();
state.gates[gate] = { status, decidedAt: timestamp, note };
state.currentStage = currentStage(state);
writeState(requirementDir, state);
appendDecision(requirementDir, gate, status, note, timestamp);
console.log(JSON.stringify({ gate, status, currentStage: state.currentStage }, null, 2));
