#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { currentStage, parseArgs, readState, requireArg } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const requirementDir = path.resolve(requireArg(args, "requirement"));
const state = readState(requirementDir);
const errors = [];
const warnings = [];

function hasExternalDependency(html) {
  const remoteAttribute = /\b(?:src|href|srcset|poster)\s*=\s*["'][^"']*(?:https?:)?\/\//i;
  const remoteCssUrl = /\burl\(\s*["']?(?:https?:)?\/\//i;
  const remoteCssImport = /@import\s+(?:url\(\s*)?["']?(?:https?:)?\/\//i;
  return remoteAttribute.test(html) || remoteCssUrl.test(html) || remoteCssImport.test(html);
}

function requireFile(relativePath, label) {
  const file = path.join(requirementDir, relativePath);
  if (!fs.existsSync(file) || fs.statSync(file).size === 0) errors.push(`${label} missing or empty: ${relativePath}`);
  return file;
}

requireFile("decision_log.md", "Decision log");
const computedStage = currentStage(state);
if (state.currentStage !== computedStage) {
  errors.push(`Stored currentStage is ${state.currentStage}; expected ${computedStage}.`);
}

if (state.gates.summary.status === "confirmed") requireFile("requirement_summary.md", "Summary");
if (state.gates.documents.status === "confirmed") {
  for (const file of ["flowchart.md", "prd.md", "user_story.md", "prototype.md", "review.md"]) {
    requireFile(file, "Document");
  }
}
if (state.gates.wireframe.status === "confirmed") {
  const dir = path.join(requirementDir, "prototypes");
  if (!fs.existsSync(dir) || !fs.readdirSync(dir).some((file) => file.endsWith(".svg"))) {
    errors.push("Confirmed wireframe gate requires at least one SVG.");
  }
}
if (state.gates.html_visual.status === "confirmed") requireFile("visual_direction.md", "Visual direction");
if (state.gates.html.status === "confirmed") {
  const htmlPath = requireFile(path.join("prototype_html", "index.html"), "HTML prototype");
  if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, "utf8");
    if (!/<html[\s>]/i.test(html) || !/<style[\s>]/i.test(html) || !/<script[\s>]/i.test(html)) {
      errors.push("HTML prototype must contain html, style, and script blocks.");
    }
    if (hasExternalDependency(html)) errors.push("HTML prototype contains an external dependency.");
  }
}
if (state.gates.self_review.status === "confirmed") {
  const review = requireFile("self_review.md", "Self-review");
  if (fs.existsSync(review) && /\bFAIL\b/.test(fs.readFileSync(review, "utf8"))) {
    errors.push("Self-review still contains FAIL; resolve it and run the review again before completion.");
  }
}
if (state.gates.knowledge_base_draft.status === "confirmed") {
  requireFile("knowledge_base_draft.md", "Knowledge-base draft");
}

const result = { valid: errors.length === 0, errors, warnings };
console.log(JSON.stringify(result, null, 2));
if (errors.length > 0) process.exitCode = 1;
