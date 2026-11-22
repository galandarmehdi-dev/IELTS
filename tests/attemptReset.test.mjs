import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const src = (f) => readFileSync(new URL(`../assets/js/${f}`, import.meta.url), "utf8");
const listFrom = (code, re) => JSON.parse(code.match(re)[1].replace(/'/g, '"').replace(/,\s*\]/, "]"));

test("a new attempt clears the saved Reading state of imported exams, so Reading is not skipped", () => {
  const appPrefixes = listFrom(src("app.js"), /const prefixes = (\[[^\]]*\]);/);
  const uiPrefixes = listFrom(src("ui.js"), /removeByPrefixes\((\[[^\]]*\])\)/);

  const dom = new JSDOM("<!doctype html><body></body>", { url: "https://ieltsmock.org/", runScripts: "outside-only" });
  dom.window.fetch = async () => ({ ok: true, json: async () => ({ ok: true, exams: [] }) });
  dom.window.IELTS = { Auth: { getAccessToken: async () => null } };
  dom.window.eval(src("tests/registry.js"));
  const R = dom.window.IELTS.Registry;
  R.TESTS.byId["imp-full-demo-00000000"] = { id: "imp-full-demo-00000000", readingTestId: "imp-full-demo-00000000", writingTestId: "imp-full-demo-00000000", imported: true, title: "Demo", skills: ["listening", "reading", "writing"], content: {} };

  // The Reading engine stores its state under `${readingTestId}:<suffix>` (readingEngine.js storageKey).
  for (const id of ["imp-full-demo-00000000", "ielts5"]) {
    const readingId = R.getScopedReadingTestId(id);
    for (const suffix of ["submitted", "answers", "deadlineAt"]) {
      const key = `${readingId}:${suffix}`;
      assert.ok(appPrefixes.some((p) => key.startsWith(p)), `app.js reset must clear ${key}`);
      assert.ok(uiPrefixes.some((p) => key.startsWith(p)), `ui.js reset must clear ${key}`);
    }
  }
});
