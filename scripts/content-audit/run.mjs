// Content and answer-key audit for the built-in tests: every question on the page, keys match the options,
// choose-TWO groups share one key, single-answer questions accept one letter, word limits. Run:
//   node scripts/content-audit/run.mjs
// Imported exams: run auditTest from core.cjs in the admin page on importedExamGet content (see
// docs/CONTENT-AUDIT-2026-11-26.md).
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { JSDOM } = require("jsdom");
const dom = new JSDOM("<!doctype html><body></body>");
globalThis.window = dom.window; globalThis.document = dom.window.document;
const { auditTest } = require("./core.cjs");
const R = new URL("../../src/", import.meta.url).href;
const { PROTECTED_TEST_CONTENT: C } = await import(R + "protectedTestContent.mjs");
const { OBJECTIVE_ANSWER_KEYS: K } = await import(R + "objectiveAnswerKeys.mjs");
const { QUESTION_TYPES: T } = await import(R + "questionTypes.mjs");
const parse = (html) => new JSDOM(`<!doctype html><body>${html}</body>`).window.document;

// Test 1 uses the legacy factory: turn its helper calls into the shared block format.
const HELPER_TYPE = { renderHeadingsTask: "headings", renderShortAnswerBlock: "shortAnswer", renderSentenceGapsBlock: "sentenceGaps", renderTFNGBlock: "tfng", renderMCQBlock: "mcq", renderEndingsMatchBlock: "endingsMatch", renderSummarySelectBlock: "summarySelect" };
function legacyParts(factory) {
  const parts = [];
  let cur;
  const H = new Proxy({}, { get: (x, k) => (cfg, ...rest) => {
    const type = HELPER_TYPE[String(k)];
    if (type) cur.blocks.push({ type, ...cfg });
    else if (String(k) === "renderNotesBlock") cur.blocks.push({ type: "__notes", cfg, rest });
    return document.createElement("div");
  } });
  const out = factory(H);
  for (const p of out.parts) {
    cur = { id: p.id, blocks: [] };
    const el = p.renderQuestions({});
    // Notes blocks build their own inputs: read them from the rendered DOM.
    if (cur.blocks.some((b) => b.type === "__notes")) {
      const html = el?.outerHTML || "";
      const notes = cur.blocks.filter((b) => b.type === "__notes");
      cur.blocks = cur.blocks.filter((b) => b.type !== "__notes");
      cur.blocks.push({ type: "html", html, instructions: notes.flatMap((n) => n.cfg?.instructions || []) });
    }
    parts.push(cur);
  }
  return parts;
}

const all = [];
for (const [id, t] of Object.entries(C)) {
  const reading = t.reading.parts || legacyParts(t.reading.legacyFactory);
  const issues = auditTest({ id, reading, listeningHtml: t.listening.html, keys: K[id] || {}, types: T[id] || {} }, parse);
  all.push(...issues);
}
const byTest = {};
all.forEach((i) => (byTest[i.test] = byTest[i.test] || []).push(i));
for (const [t, list] of Object.entries(byTest)) {
  console.log(`\n## ${t} (${list.length})`);
  list.forEach((i) => console.log(`  ${i.sec[0].toUpperCase()}${i.q}: ${i.msg}`));
}
console.log(`\nTOTAL ${all.length}`);
