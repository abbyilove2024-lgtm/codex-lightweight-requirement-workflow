import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const scripts = path.join(
  repoRoot,
  "plugins",
  "lightweight-requirement-workflow",
  "skills",
  "lightweight-requirement-workflow",
  "scripts"
);

function run(script, args, expected = 0) {
  const result = spawnSync(process.execPath, [path.join(scripts, script), ...args], { encoding: "utf8" });
  assert.equal(result.status, expected, `${script}\nSTDOUT: ${result.stdout}\nSTDERR: ${result.stderr}`);
  return result;
}

function write(file, content = "# Fixture\n") {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

test("initializes a workspace and requirement without overwriting", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lrw-init-"));
  run("init-workspace.mjs", ["--root", root]);
  assert.ok(fs.existsSync(path.join(root, "AGENTS.md")));
  run("init-requirement.mjs", ["--root", root, "--name", "pet_tag", "--title", "电子狗牌"]);
  const state = JSON.parse(fs.readFileSync(path.join(root, "documents", "product_requirements", "pet_tag", ".workflow", "state.json")));
  assert.equal(state.currentStage, "summary");
  run("init-requirement.mjs", ["--root", root, "--name", "pet_tag"], 1);
});

test("enforces gates and completes when knowledge-base write is cancelled", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lrw-flow-"));
  run("init-workspace.mjs", ["--root", root]);
  run("init-requirement.mjs", ["--root", root, "--name", "pet_tag"]);
  const requirement = path.join(root, "documents", "product_requirements", "pet_tag");

  run("record-gate.mjs", ["--requirement", requirement, "--gate", "documents", "--status", "confirmed"], 1);
  write(path.join(requirement, "requirement_summary.md"));
  run("record-gate.mjs", ["--requirement", requirement, "--gate", "summary", "--status", "confirmed"]);

  for (const file of ["flowchart.md", "prd.md", "user_story.md", "prototype.md", "review.md"]) write(path.join(requirement, file));
  run("record-gate.mjs", ["--requirement", requirement, "--gate", "documents", "--status", "confirmed"]);
  write(path.join(requirement, "prototypes", "main.svg"), "<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>\n");
  run("record-gate.mjs", ["--requirement", requirement, "--gate", "wireframe", "--status", "confirmed"]);
  write(path.join(requirement, "visual_direction.md"));
  const beforeVisualConfirmation = run("detect-stage.mjs", ["--requirement", requirement]);
  assert.match(beforeVisualConfirmation.stdout, /html_visual exists but is not confirmed/);
  run("record-gate.mjs", ["--requirement", requirement, "--gate", "html_visual", "--status", "confirmed"]);
  write(path.join(requirement, "prototype_html", "index.html"), "<html><style>body{color:#111}</style><script>void 0</script></html>\n");
  run("record-gate.mjs", ["--requirement", requirement, "--gate", "html", "--status", "confirmed"]);
  write(path.join(requirement, "self_review.md"), "# Self review\n\nPASS\n");
  run("record-gate.mjs", ["--requirement", requirement, "--gate", "self_review", "--status", "confirmed"]);
  run("record-gate.mjs", ["--requirement", requirement, "--gate", "knowledge_base_draft", "--status", "cancelled", "--note", "User declined knowledge-base write."]);

  const detect = run("detect-stage.mjs", ["--requirement", requirement]);
  assert.equal(JSON.parse(detect.stdout).currentStage, "complete");
  const validate = run("validate-artifacts.mjs", ["--requirement", requirement]);
  assert.equal(JSON.parse(validate.stdout).valid, true);
});

test("rejects external HTML dependencies", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lrw-html-"));
  run("init-workspace.mjs", ["--root", root]);
  run("init-requirement.mjs", ["--root", root, "--name", "external_html"]);
  const requirement = path.join(root, "documents", "product_requirements", "external_html");
  const stateFile = path.join(requirement, ".workflow", "state.json");
  const state = JSON.parse(fs.readFileSync(stateFile));
  state.gates.html.status = "confirmed";
  fs.writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`);
  write(path.join(requirement, "prototype_html", "index.html"), "<html><style></style><script src=\"https://cdn.example/app.js\"></script></html>\n");
  const result = run("validate-artifacts.mjs", ["--requirement", requirement], 1);
  assert.match(result.stdout, /external dependency/);
});

test("requires both HTML gates to be skipped in order", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lrw-skip-"));
  run("init-workspace.mjs", ["--root", root]);
  run("init-requirement.mjs", ["--root", root, "--name", "skip_html"]);
  const requirement = path.join(root, "documents", "product_requirements", "skip_html");
  const stateFile = path.join(requirement, ".workflow", "state.json");
  const state = JSON.parse(fs.readFileSync(stateFile));
  for (const gate of ["summary", "documents", "wireframe"]) state.gates[gate].status = "confirmed";
  fs.writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`);

  run("record-gate.mjs", ["--requirement", requirement, "--gate", "html", "--status", "skipped"], 1);
  run("record-gate.mjs", ["--requirement", requirement, "--gate", "html_visual", "--status", "skipped"]);
  run("record-gate.mjs", ["--requirement", requirement, "--gate", "html", "--status", "skipped"]);
});

test("rejects remote CSS dependencies and unresolved self-review failures", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lrw-validation-"));
  run("init-workspace.mjs", ["--root", root]);
  run("init-requirement.mjs", ["--root", root, "--name", "validation_case"]);
  const requirement = path.join(root, "documents", "product_requirements", "validation_case");
  const stateFile = path.join(requirement, ".workflow", "state.json");
  const state = JSON.parse(fs.readFileSync(stateFile));
  state.gates.html.status = "confirmed";
  state.gates.self_review.status = "confirmed";
  fs.writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`);
  write(
    path.join(requirement, "prototype_html", "index.html"),
    "<html><style>.hero{background:url(//cdn.example/hero.png)}</style><script>void 0</script></html>\n"
  );
  write(path.join(requirement, "self_review.md"), "# Self review\n\nFAIL: unresolved main-flow issue.\n");

  const result = run("validate-artifacts.mjs", ["--requirement", requirement], 1);
  assert.match(result.stdout, /external dependency/);
  assert.match(result.stdout, /still contains FAIL/);
});
