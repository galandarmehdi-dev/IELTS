import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const read = (f) => readFileSync(new URL(`../assets/js/${f}`, import.meta.url), "utf8");
function boot() {
  const dom = new JSDOM("<!doctype html><body></body>", { url: "https://ieltsmock.org/", runScripts: "outside-only" });
  dom.window.fetch = async () => ({ ok: true, json: async () => ({ ok: true, exams: [] }) });
  dom.window.IELTS = { Auth: { getAccessToken: async () => null } };
  dom.window.eval(read("tests/registry.js"));
  dom.window.eval(read("assignments.js"));
  return dom.window;
}

test("assignments show imported exams by title, never by internal id", () => {
  const w = boot();
  const R = w.IELTS.Registry;
  R.TESTS.byId["imp-full-demo-55555555"] = { id: "imp-full-demo-55555555", imported: true, title: "Demo Full Exam", skills: ["listening", "reading", "writing"], content: {} };
  R.TESTS.byId["imp-reading-solo-66666666"] = { id: "imp-reading-solo-66666666", imported: true, title: "Solo Reading", skills: ["reading"], content: {} };
  const A = w.IELTS.Assignments;
  assert.equal(A.formatAssignmentTarget("imp-full-demo-55555555"), "Demo Full Exam");
  assert.equal(A.formatAssignmentTarget("ielts5"), "IELTS Test 5");
  assert.match(A.formatAssignmentTarget("practice|reading|imp-reading-solo-66666666|full"), /^Solo Reading · reading practice$/);
  const options = A.getTestIdOptions();
  const labels = options.map((o) => o.label);
  assert.ok(labels.includes("Full exam · Demo Full Exam"));
  assert.ok(!labels.some((l) => /imp-/.test(l)), "no internal ids in any label");
  assert.ok(!options.some((o) => o.id === "imp-reading-solo-66666666"), "a single-skill exam is not offered as a full test");
  assert.ok(options.some((o) => o.id === "practice|reading|imp-reading-solo-66666666|full" && o.label === "Solo Reading · Reading"));
  assert.ok(!options.some((o) => /imp-reading-solo.*listening|imp-reading-solo.*writing/.test(o.id)));
  assert.ok(options.some((o) => o.id === "ielts5"));
});
