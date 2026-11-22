import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const code = readFileSync(new URL("../assets/js/tests/registry.js", import.meta.url), "utf8");
function boot(listResponse, { cache } = {}) {
  const dom = new JSDOM("<!doctype html><body></body>", { url: "https://ieltsmock.org/", runScripts: "outside-only" });
  if (cache) dom.window.sessionStorage.setItem("IELTS:importedExams:v1", JSON.stringify({ at: Date.now(), exams: cache }));
  const calls = [];
  dom.window.fetch = async (url) => {
    calls.push(String(url));
    if (String(url).includes("/api/imported-exams")) return { ok: true, json: async () => ({ ok: true, exams: listResponse() }) };
    return { ok: true, json: async () => ({ ok: true, content: { reading: { parts: [{ id: "part1", passageText: "x", blocks: [] }] } } }) };
  };
  dom.window.IELTS = { Auth: { getAccessToken: async () => "tok" } };
  dom.window.eval(code);
  return { R: dom.window.IELTS.Registry, calls, dom };
}

test("registry adds published and draft imported exams, labels drafts, and fetches draft content as a preview", async () => {
  const { R, calls } = boot(() => [
    { test_id: "imp-reading-a-11111111", title: "Test A", skill: "reading", status: "published" },
    { test_id: "imp-full-b-22222222", title: "Test B", skill: "full", status: "draft" },
  ]);
  assert.equal(Object.keys(R.TESTS.byId).filter((k) => k.startsWith("imp-")).length, 0);
  assert.equal(await R.loadImportedTests(true), true);
  assert.ok(calls[0].includes("includeDrafts=1"));
  assert.equal(R.TESTS.byId["imp-reading-a-11111111"].title, "Test A");
  assert.equal(R.TESTS.byId["imp-reading-a-11111111"].draft, false);
  assert.equal(R.TESTS.byId["imp-full-b-22222222"].title, "Test B (draft preview)");
  assert.deepEqual([...R.TESTS.byId["imp-full-b-22222222"].skills], ["listening", "reading", "writing"]);

  await R.ensureTestContent("imp-full-b-22222222");
  await R.ensureTestContent("imp-reading-a-11111111");
  const contentCalls = calls.filter((u) => u.includes("/api/test-content"));
  assert.ok(contentCalls[0].includes("preview=1"));
  assert.ok(!contentCalls[1].includes("preview"));

  const cat = R.buildHomeCatalog();
  assert.ok(cat.fullExams.some((e) => e.id === "imp-full-b-22222222"));
  assert.ok(!cat.fullExams.some((e) => e.id === "imp-reading-a-11111111"));
  assert.ok(cat.sections.reading.some((e) => e.id === "imp-reading-a-11111111"));
  assert.ok(!cat.sections.listening.some((e) => e.id === "imp-reading-a-11111111"));
});

test("a draft that gets published, or an exam that disappears, updates the registry", async () => {
  let list = [{ test_id: "imp-reading-a-11111111", title: "Test A", skill: "reading", status: "draft" }];
  const { R } = boot(() => list);
  await R.loadImportedTests(true);
  assert.equal(R.TESTS.byId["imp-reading-a-11111111"].draft, true);
  list = [{ test_id: "imp-reading-a-11111111", title: "Test A", skill: "reading", status: "published" }];
  assert.equal(await R.loadImportedTests(true), true);
  assert.equal(R.TESTS.byId["imp-reading-a-11111111"].draft, false);
  assert.equal(R.TESTS.byId["imp-reading-a-11111111"].title, "Test A");
  list = [];
  assert.equal(await R.loadImportedTests(true), true);
  assert.equal(R.TESTS.byId["imp-reading-a-11111111"], undefined);
  assert.equal(Object.keys(R.TESTS.byId).length, 23);
});


test("opening an imported exam before the list has loaded keeps its id instead of falling back to Test 1", async () => {
  const { R, calls } = boot(() => [{ test_id: "imp-full-late-33333333", title: "Late Exam", skill: "full", status: "published" }]);
  assert.equal(R.TESTS.byId["imp-full-late-33333333"], undefined);
  const active = R.setActiveTestId("imp-full-late-33333333");
  assert.equal(active, "imp-full-late-33333333");
  assert.equal(R.getActiveTestId(), "imp-full-late-33333333");
  assert.equal(R.getTestConfig("imp-full-late-33333333").imported, true);
  assert.equal(R.setActiveTestId("not-a-real-test"), R.TESTS.defaultTestId);
  await R.ensureTestContent("imp-full-late-33333333");
  assert.ok(calls.some((u) => u.includes("/api/test-content") && u.includes("imp-full-late-33333333")));
  const cat = R.buildHomeCatalog();
  assert.ok(!cat.fullExams.some((e) => e.id === "imp-full-late-33333333") || R.TESTS.byId["imp-full-late-33333333"].title === "Late Exam");
  await new Promise((r) => setTimeout(r, 50));
  const cfg = R.TESTS.byId["imp-full-late-33333333"];
  assert.equal(cfg.stub, false);
  assert.equal(cfg.title, "Late Exam");
  assert.equal(R.getTestLabel("imp-full-late-33333333"), "Late Exam");
  assert.ok(R.buildHomeCatalog().fullExams.some((e) => e.id === "imp-full-late-33333333"));
});

test("imported exams appear immediately from the session cache, published ones only", async () => {
  const { R } = boot(() => [], { cache: [{ test_id: "imp-reading-cached-44444444", title: "Cached Exam", skill: "reading", status: "published" }] });
  assert.equal(R.TESTS.byId["imp-reading-cached-44444444"].title, "Cached Exam");
  assert.ok(R.buildHomeCatalog().sections.reading.some((e) => e.id === "imp-reading-cached-44444444"));
  assert.equal(Object.keys(R.TESTS.byId).length, 24);
});
