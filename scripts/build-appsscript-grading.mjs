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

const original = readFileSync(target, "utf8");
const block = buildGradingBlock();
let next;
if (original.includes(START)) {
  const i = original.indexOf(START);
  const j = original.indexOf(END, i) + END.length;
  next = original.slice(0, i) + block + original.slice(j);
} else {
  next = removeFunction(removeFunction(removeFunction(original, "isAnswerCorrect_"), "alignGroupedAnswerKeys_"), "groupLetterSet_");
  next = next.replace(/\s*$/, "\n\n") + block + "\n";
}
if (check) {
  if (next !== original) { console.error(`${target} has an out-of-date grading engine. Run: node scripts/build-appsscript-grading.mjs`); process.exit(1); }
  console.log("Apps Script grading engine is up to date.");
} else {
  writeFileSync(target, next);
  console.log(`Wrote grading engine into ${target}`);
}
