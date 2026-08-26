import fs from "node:fs";
import path from "node:path";

export const WORKFLOW_VERSION = "0.1.0";

export const GATES = [
  "summary",
  "documents",
  "wireframe",
  "html_visual",
  "html",
  "self_review",
  "knowledge_base_draft",
  "knowledge_base_write"
];

export const ALLOWED_STATUS = {
  summary: ["confirmed"],
  documents: ["confirmed"],
  wireframe: ["confirmed", "skipped"],
  html_visual: ["confirmed", "skipped"],
  html: ["confirmed", "skipped"],
  self_review: ["confirmed"],
  knowledge_base_draft: ["confirmed", "cancelled"],
  knowledge_base_write: ["confirmed"]
};

export function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2).replaceAll("-", "_");
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) result[key] = true;
    else {
      result[key] = next;
      index += 1;
    }
  }
  return result;
}

export function requireArg(args, name) {
  if (!args[name] || args[name] === true) {
    throw new Error(`Missing required argument: --${name.replaceAll("_", "-")}`);
  }
  return String(args[name]);
}

export function assertRequirementName(name) {
  if (!/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/.test(name)) {
    throw new Error("Requirement name must use English snake_case.");
  }
}

export function statePath(requirementDir) {
  return path.join(requirementDir, ".workflow", "state.json");
}

export function readState(requirementDir) {
  const file = statePath(requirementDir);
  if (!fs.existsSync(file)) throw new Error(`Workflow state not found: ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function writeState(requirementDir, state) {
  state.updatedAt = new Date().toISOString();
  fs.writeFileSync(statePath(requirementDir), `${JSON.stringify(state, null, 2)}\n`);
}

export function isResolved(state, gate) {
  const status = state.gates?.[gate]?.status;
  return status === "confirmed" || status === "skipped" || status === "cancelled";
}

export function currentStage(state) {
  if (state.gates.knowledge_base_draft.status === "cancelled") return "complete";
  if (state.gates.knowledge_base_write.status === "confirmed") return "complete";

  for (const gate of GATES) {
    if (!isResolved(state, gate)) return gate;
  }
  return "complete";
}

export function validateGateTransition(state, gate, status) {
  if (!GATES.includes(gate)) throw new Error(`Unknown gate: ${gate}`);
  if (!ALLOWED_STATUS[gate].includes(status)) {
    throw new Error(`Status ${status} is not allowed for ${gate}.`);
  }
  if (isResolved(state, gate)) throw new Error(`Gate ${gate} is already resolved.`);

  const index = GATES.indexOf(gate);
  for (const prerequisite of GATES.slice(0, index)) {
    if (gate === "knowledge_base_write" && prerequisite === "knowledge_base_draft") continue;
    if (!isResolved(state, prerequisite)) {
      throw new Error(`Gate ${gate} requires ${prerequisite} to be resolved first.`);
    }
  }

  if (gate === "knowledge_base_write" && state.gates.knowledge_base_draft.status !== "confirmed") {
    throw new Error("Knowledge-base write requires an explicitly confirmed draft.");
  }
  if (gate === "html" && status === "confirmed" && state.gates.html_visual.status !== "confirmed") {
    throw new Error("Confirmed HTML requires a confirmed visual direction.");
  }
  if (gate === "html" && status === "skipped" && state.gates.html_visual.status !== "skipped") {
    throw new Error("Skipping HTML requires the visual-direction gate to be skipped first.");
  }
}

export function newState(name, title) {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    workflowVersion: WORKFLOW_VERSION,
    requirementName: name,
    title,
    createdAt: now,
    updatedAt: now,
    currentStage: "summary",
    gates: Object.fromEntries(GATES.map((gate) => [gate, {
      status: "pending",
      decidedAt: null,
      note: ""
    }]))
  };
}

export function appendDecision(requirementDir, gate, status, note, timestamp) {
  const file = path.join(requirementDir, "decision_log.md");
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, "# 决策记录\n\n| 时间 | 门槛 | 状态 | 说明 |\n| --- | --- | --- | --- |\n");
  }
  const safeNote = note.replaceAll("|", "\\|").replaceAll("\n", " ");
  fs.appendFileSync(file, `| ${timestamp} | ${gate} | ${status} | ${safeNote} |\n`);
}
