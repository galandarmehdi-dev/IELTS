#!/usr/bin/env node
// Copies the marking engine (src/grading.mjs) into the Apps Script so the sheet marks Listening and
// Reading exactly like the Worker. The engine is placed between two marker lines; the Apps Script's
// isAnswerCorrect_ and alignGroupedAnswerKeys_ call it.
//
//   node scripts/build-appsscript-grading.mjs [path/to/appsscript.gs]   (default: src/appsscript.gs)
//   node scripts/build-appsscript-grading.mjs --check [path]             (exit 1 if the copy is out of date)
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const check = args.includes("--check");
const target = path.resolve(args.find((a) => !a.startsWith("--")) || path.join(root, "src/appsscript.gs"));

const START = "// >>> GRADING ENGINE (generated from src/grading.mjs by scripts/build-appsscript-grading.mjs; do not edit here)";
const END = "// <<< GRADING ENGINE";

export function buildGradingBlock() {
  const source = readFileSync(path.join(root, "src/grading.mjs"), "utf8");
  const exported = [...source.matchAll(/^export (?:function|const) ([A-Za-z0-9_]+)/gm)].map((m) => m[1]);
  const body = source.replace(/^export /gm, "");
  return [
    START,
    "var GRADING_ = (function () {",
    body.trim(),
    `return { ${exported.join(", ")} };`,
    "})();",
    "function isAnswerCorrect_(studentRaw, correctRaw) {",
    "  return GRADING_.isAnswerCorrect(studentRaw, correctRaw);",
    "}",
    "// keyArr is a sheet range ([[key], [key], ...] for Q1..maxQ); returns the same shape.",
    "function alignGroupedAnswerKeys_(keyArr, answers, maxQ) {",
    "  maxQ = Number(maxQ || 40);",
    "  var map = {};",
    "  for (var q = 1; q <= maxQ; q++) {",
    "    var cell = keyArr && keyArr[q - 1];",
    "    map[q] = cell && cell[0] !== undefined && cell[0] !== null ? String(cell[0]) : \"\";",
    "  }",
    "  var aligned = GRADING_.alignGroupedAnswerMap(map, answers || {});",
    "  var out = [];",
    "  for (var k = 1; k <= maxQ; k++) out.push([aligned[k] !== undefined ? aligned[k] : \"\"]);",
    "  return out;",
    "}",
    END,
  ].join("\n");
}

// Removes a top-level `function name(` ... `}` definition (the old copies the engine replaces).
function removeFunction(text, name) {
  const re = new RegExp(`^function ${name}\\(`, "m");
  const m = re.exec(text);
  if (!m) return text;
  let depth = 0;
  for (let k = text.indexOf("{", m.index); k < text.length; k += 1) {
    if (text[k] === "{") depth += 1;
    else if (text[k] === "}") { depth -= 1; if (!depth) return text.slice(0, m.index) + text.slice(k + 1).replace(/^\n/, ""); }
  }
  return text;
}

// The Writing assessment module (prompt, schema, validator, band calculation) as WRITING_.
const W_START = "// >>> WRITING ASSESSMENT (generated from src/writingTask1Facts.mjs + src/writingAssessment.mjs by scripts/build-appsscript-grading.mjs; do not edit here)";
const W_END = "// <<< WRITING ASSESSMENT";
// src/writingTask1Facts.mjs (Task 1 reference data) is placed first, inside the same closure; the module's
// import line is dropped.
export function buildWritingBlock() {
  const facts = readFileSync(path.join(root, "src/writingTask1Facts.mjs"), "utf8");
  const source = readFileSync(path.join(root, "src/writingAssessment.mjs"), "utf8").replace(/^import [^\n]*\n/gm, "");
  const exported = [...source.matchAll(/^export (?:function|const) ([A-Za-z0-9_]+)/gm)].map((m) => m[1]);
  const body = [facts.replace(/^export /gm, "").trim(), source.replace(/^export /gm, "").trim()].join("\n\n");
  return [W_START, "var WRITING_ = (function () {", body, `return { ${exported.join(", ")} };`, "})();", W_END].join("\n");
}

function replaceBlock(text, start, end, block) {
  if (text.includes(start)) {
    const i = text.indexOf(start);
    const j = text.indexOf(end, i) + end.length;
    return text.slice(0, i) + block + text.slice(j);
  }
  return text.replace(/\s*$/, "\n\n") + block + "\n";
}

const original = readFileSync(target, "utf8");
let next = original.includes(START)
  ? original
  : removeFunction(removeFunction(removeFunction(original, "isAnswerCorrect_"), "alignGroupedAnswerKeys_"), "groupLetterSet_");
next = replaceBlock(next, START, END, buildGradingBlock());
next = replaceBlock(next, W_START, W_END, buildWritingBlock());
if (check) {
  if (next !== original) { console.error(`${target} has an out-of-date generated block. Run: node scripts/build-appsscript-grading.mjs`); process.exit(1); }
  console.log("Apps Script generated blocks (grading engine, writing assessment) are up to date.");
} else {
  writeFileSync(target, next);
  console.log(`Wrote grading engine and writing assessment into ${target}`);
}
