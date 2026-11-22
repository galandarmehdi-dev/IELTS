import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const dom = new JSDOM('<!doctype html><body><div id="root"></div></body>', { url: "https://ieltsmock.org/" });
Object.assign(globalThis, { document: dom.window.document, DOMParser: dom.window.DOMParser, location: dom.window.location, Event: dom.window.Event });
const calls = [];
globalThis.fetch = async (url, opts = {}) => {
  const u = new URL(String(url));
  const action = u.searchParams.get("action");
  calls.push({ action, method: opts.method || "GET", body: opts.body ? JSON.parse(opts.body) : null, auth: opts.headers?.Authorization });
  const reply = (status, data) => ({ ok: status < 400, status, json: async () => data });
  if (action === "importedExamList") return reply(200, { ok: true, exams: globalThis.__library || [] });
  if (action === "importedExamRename") return reply(200, { ok: true });
  if (action === "importedExamGet") return reply(200, { ok: true, exam: globalThis.__editExam });
  if (action === "importedExamUpdate") return reply(globalThis.__updateStatus || 200, globalThis.__updateStatus ? { ok: false, error: "This exam is live, so changes that would break it are not saved." } : { ok: true, status: "published" });
  if (action === "importedExamSave") {
    const body = JSON.parse(opts.body);
    if (globalThis.__saveMode === "published" && !body.replacePublished) return reply(409, { ok: false, published: true, testId: "imp-x", error: "This exam is already published." });
    return reply(200, { ok: true, testId: `imp-${calls.length}`, replaced: !!body.replacePublished });
  }
  return reply(404, { ok: false });
};
const { mountExamConverter } = await import("../assets/js/converter/converterUi.mjs");

const fixture = (f) => ({ name: f, arrayBuffer: async () => { const b = readFileSync(new URL(`./fixtures/${f}`, import.meta.url)); return b.buffer.slice(b.byteOffset, b.byteOffset + b.length); } });
const until = async (fn, ms = 30000) => { const t = Date.now(); while (Date.now() - t < ms) { if (fn()) return; await new Promise((r) => setTimeout(r, 15)); } throw new Error("timed out"); };
const root = document.getElementById("root");
const text = () => root.textContent;
const button = (label) => [...root.querySelectorAll("button")].find((b) => b.textContent.startsWith(label));

test("admin converter: drop files, fix media via source URL, save drafts, review answers", async () => {
  mountExamConverter(root, { getToken: async () => "token-123" });
  await until(() => calls.some((c) => c.action === "importedExamList"));
  assert.equal(calls[0].auth, "Bearer token-123");

  const drop = root.querySelector(".xc-drop");
  const ev = new dom.window.Event("drop", { bubbles: true });
  ev.dataTransfer = { files: [fixture("ielts-reading-test-1.html"), fixture("ielts-listening-185.html"), fixture("ielts-reading-test-1.html")] };
  drop.dispatchEvent(ev);
  await until(() => /This batch \(3\)/.test(text()));

  assert.match(text(), /1 ready/);
  assert.match(text(), /1 need review/);
  assert.match(text(), /1 duplicates/);

  const url = root.querySelector('input[type="url"]');
  url.value = "https://audio.ieltsmock.org";
  url.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  await until(() => /2 ready/.test(text()));
  assert.match(text(), /40\/40 · 40 answers/);

  button("Save 2 ready as drafts").click();
  await until(() => /2 saved/.test(text()));
  const saves = calls.filter((c) => c.action === "importedExamSave");
  assert.equal(saves.length, 2);
  const reading = saves.find((s) => s.body.skill === "reading").body;
  const listening = saves.find((s) => s.body.skill === "listening").body;
  assert.equal(reading.title, "IELTS Reading Test 1");
  assert.equal(Object.keys(reading.answerKeys).length, 40);
  assert.equal(reading.content.reading.parts.length, 3);
  assert.equal(listening.content.listening.audioSrc, "https://audio.ieltsmock.org/wp-content/uploads/audio/185_we.mp3");
  assert.deepEqual([21, 22, 23, 24].map((q) => listening.answerKeys[q]), ["C", "E", "B", "E"]);
  assert.match(listening.sourceHash, /^[a-f0-9]{64}$/);
  assert.ok(!JSON.stringify(saves).match(/<script/i));
});

test("admin converter: review panel edits an answer and overrides a question type", async () => {
  [...root.querySelectorAll("button")].filter((b) => b.textContent === "Review")[0].click();
  await until(() => /Review: /.test(text()));
  const answerInput = [...root.querySelectorAll(".xc-answers label")].find((l) => l.firstChild.textContent === "9").querySelector("input");
  answerInput.value = "A";
  answerInput.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  await until(() => [...root.querySelectorAll(".xc-answers label")].find((l) => l.firstChild.textContent === "9").querySelector("input").value === "A");
  const select = [...root.querySelectorAll("table select")][0];
  assert.ok(select && select.querySelectorAll("option").length >= 2);
  assert.match(text(), /Preview/);
  assert.match(text(), /agree with the claims of the writer/);
});


test("admin converter: flags exams made by an older converter and replaces a published one in one click", async () => {
  globalThis.__library = [{ test_id: "imp-reading-old", title: "Old import", skill: "reading", status: "published", validation: {}, updated_at: new Date().toISOString() }];
  globalThis.__saveMode = "published";
  root.querySelector(".xc-row button.btn.secondary[type=button]");
  [...root.querySelectorAll("button")].find((b) => b.textContent === "Refresh").click();
  await until(() => /Made with an older converter/.test(text()));

  const before = calls.filter((c) => c.action === "importedExamSave").length;
  [...root.querySelectorAll("button")].find((b) => b.textContent === "Clear batch").click();
  const drop = root.querySelector(".xc-drop");
  const ev = new dom.window.Event("drop", { bubbles: true });
  ev.dataTransfer = { files: [fixture("ielts-reading-test-9.html")] };
  drop.dispatchEvent(ev);
  await until(() => /This batch \(1\)/.test(text()));
  button("Save draft").click();
  await until(() => /Duplicate/.test(text()));
  [...root.querySelectorAll("button")].find((b) => b.textContent === "Review").click();
  await until(() => /Unpublish and replace with this version/.test(text()));
  button("Unpublish and replace").click();
  await until(() => /published version was replaced/.test(text()));
  const saves = calls.filter((c) => c.action === "importedExamSave").slice(before);
  assert.equal(saves.length, 2);
  assert.equal(saves[0].body.replacePublished, false);
  assert.equal(saves[1].body.replacePublished, true);
  assert.equal(saves[1].body.converterVersion >= 3, true);
  assert.equal(saves[1].body.content.reading.parts.length, 3);
});


test("admin converter: full exam from three files, saved as one exam", async () => {
  globalThis.__library = [];
  globalThis.__saveMode = "";
  [...root.querySelectorAll("button")].find((b) => b.textContent === "Clear batch")?.click();
  const url = root.querySelector('input[type="url"]');
  url.value = "https://audio.ieltsmock.org";
  url.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  const put = async (skill, file) => {
    const input = root.querySelector(`#xcFull-${skill}`);
    Object.defineProperty(input, "files", { value: [fixture(file)], configurable: true });
    input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    await until(() => root.querySelector(`#xcFull-${skill}`)?.parentElement.textContent.includes(file));
  };
  await put("listening", "ielts-listening-185.html");
  await put("reading", "ielts-reading-test-9.html");
  assert.equal(button("Save full exam as draft"), undefined, "needs all three parts first");
  await put("writing", "ielts-writing-test-100.html");
  await until(() => !!button("Save full exam as draft"));
  assert.equal(root.querySelector("#xcFullTitle").value, "Full Exam: IELTS Reading Test 9");
  assert.equal(button("Save full exam as draft").disabled, false);

  const before = calls.filter((c) => c.action === "importedExamSave").length;
  button("Save full exam as draft").click();
  await until(() => calls.filter((c) => c.action === "importedExamSave").length > before);
  const body = calls.filter((c) => c.action === "importedExamSave").pop().body;
  assert.equal(body.skill, "full");
  assert.deepEqual(Object.keys(body.content).sort(), ["listening", "reading", "writing"]);
  assert.equal(Object.keys(body.answerKeys.listening).length, 40);
  assert.equal(Object.keys(body.answerKeys.reading).length, 40);
  assert.match(body.sourceHash, /^[a-f0-9]{64}$/);
  assert.equal(body.content.listening.audioSrc, "https://audio.ieltsmock.org/wp-content/uploads/audio/185_we.mp3");
  assert.match(body.content.writing.task1Html, /graph below shows the amounts of waste/);
  assert.equal(body.content.reading.parts.length, 3);
  await until(() => /Saved as a draft/.test(root.textContent));
});

test("admin converter: reviewing a Listening part keeps the review panel on screen (no full-screen player overlay)", async () => {
  const slot = root.querySelector("#xcFull-listening").parentElement;
  [...slot.querySelectorAll("button")].find((b) => b.textContent === "Review").click();
  await until(() => /Review: ielts-listening-185\.html/.test(text()));
  assert.equal(root.querySelector(".listening-screen"), null, "the preview must not reuse the fixed full-screen player class");
  assert.ok(root.querySelector(".xc-lpreview .listen-card"), "preview of the listening notes is shown");
  assert.match(text(), /Question groups/);
  assert.match(text(), /Answer key/);
  assert.ok(root.querySelector(".xc-lpreview input[disabled]"), "preview inputs are disabled");
});

test("admin converter: edit writing tasks and reading passages, then save the changes", async () => {
  const slotReview = async (skill, re) => {
    const slot = root.querySelector(`#xcFull-${skill}`).parentElement;
    [...slot.querySelectorAll("button")].find((b) => b.textContent === "Review").click();
    await until(() => re.test(text()));
  };
  await slotReview("writing", /Review: ielts-writing-test-100/);
  assert.ok(root.querySelector("#xcW1Text") && root.querySelector("#xcW2Text"), "task editors are present");
  const t1 = root.querySelector("#xcW1Text");
  t1.value = "Edited chart prompt line one.\nWrite at least 150 words.";
  t1.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  await until(() => /Edited chart prompt line one/.test(root.querySelector(".xc-preview").textContent));
  const type2 = root.querySelector("#xcW2Type");
  type2.value = "Essay";
  type2.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  await until(() => /Task 2 preview \(Essay\)/.test(text()));
  root.querySelector("button.btn.secondary[type=button]");
  [...root.querySelectorAll("button")].find((b) => b.textContent === "Close").click();

  await slotReview("reading", /Review: ielts-reading-test-9/);
  assert.equal(root.querySelectorAll('[id^="xcPTitle"]').length, 3);
  assert.equal(root.querySelector("#xcPTitle0").value, "Ant Intelligence");
  const title = root.querySelector("#xcPTitle0");
  title.value = "Ant Intelligence (edited)";
  title.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  await until(() => root.querySelector("#xcPTitle0")?.value === "Ant Intelligence (edited)" && !!root.querySelector("#xcPText0"));
  [...root.querySelectorAll("button")].find((b) => b.textContent === "Close").click();

  const before = calls.filter((c) => c.action === "importedExamSave").length;
  button("Save changes to draft").click();
  await until(() => calls.filter((c) => c.action === "importedExamSave").length > before);
  const body = calls.filter((c) => c.action === "importedExamSave").pop().body;
  assert.match(body.content.writing.task1Html, /Edited chart prompt line one\.<br\/>Write at least 150 words\./);
  assert.equal(body.content.writing.task2Type, "Essay");
  assert.match(body.content.reading.parts[0].passageText, /^Ant Intelligence \(edited\)\n\nWhen we think of intelligent members/);
  assert.equal(body.overwriteDraft, true);
});


test("admin converter: edit a saved published exam without the original file", async () => {
  globalThis.__editExam = {
    test_id: "imp-reading-z-00000000", skill: "reading", status: "published", title: "Original Title",
    content: { reading: { parts: [{ id: "part1", passageText: "Old Title\n\nOld body paragraph.", blocks: [{ type: "tfng", title: "Questions 1-2", instructions: ["Do the following statements agree?"], items: [{ q: 1, text: "Statement one" }, { q: 2, text: "Statement two" }] }] }] } },
    answer_keys: { 1: "TRUE", 2: "FALSE" },
  };
  globalThis.__library = [{ test_id: "imp-reading-z-00000000", title: "Original Title", skill: "reading", status: "published", validation: { converterVersion: 99 }, updated_at: new Date().toISOString() }];
  [...root.querySelectorAll("button")].find((b) => b.textContent === "Refresh").click();
  await until(() => !!button("Edit"));
  button("Edit").click();
  await until(() => !!root.querySelector("#xcEditor"));
  assert.match(root.querySelector("#xcEditor").textContent, /This exam is live/);
  const change = (el, value) => { el.value = value; el.dispatchEvent(new dom.window.Event("change", { bubbles: true })); };
  change(root.querySelector("#xcEdTitle"), "Edited Title");
  const ed = root.querySelector("#xcEditor");
  const inputs = [...ed.querySelectorAll("details input[type=text], details textarea")];
  const byValue = (v) => inputs.find((i) => i.value === v);
  change(byValue("Old body paragraph."), "New body paragraph.");
  change(byValue("Statement two"), "Statement two (fixed)");
  change(byValue("Do the following statements agree?"), "Do the statements agree with the writer?");
  const key2 = [...ed.querySelectorAll(".xc-answers label")].find((l) => l.firstChild.textContent === "2").querySelector("input");
  change(key2, "NOT GIVEN");
  const before = calls.filter((c) => c.action === "importedExamUpdate").length;
  [...ed.querySelectorAll("button")].find((b) => b.textContent === "Save changes").click();
  await until(() => calls.filter((c) => c.action === "importedExamUpdate").length > before);
  const body = calls.filter((c) => c.action === "importedExamUpdate").pop().body;
  assert.equal(body.testId, "imp-reading-z-00000000");
  assert.equal(body.title, "Edited Title");
  const part = body.content.reading.parts[0];
  assert.equal(part.passageText, "Old Title\n\nNew body paragraph.");
  assert.equal(part.blocks[0].items[1].text, "Statement two (fixed)");
  assert.equal(part.blocks[0].instructions[0], "Do the statements agree with the writer?");
  assert.deepEqual(body.answerKeys, { 1: "TRUE", 2: "NOT GIVEN" });
  await until(() => /Students see the change/.test(root.textContent));

  globalThis.__updateStatus = 422;
  [...root.querySelector("#xcEditor").querySelectorAll("button")].find((b) => b.textContent === "Save changes").click();
  await until(() => /would break it/.test(root.querySelector("#xcEditor").textContent));
  globalThis.__updateStatus = 0;
});


test("admin converter: rename an exam directly in the Saved exams list", async () => {
  globalThis.__library = [{ test_id: "imp-full-r-77777777", title: "Full Exam: IELTS Writing Test 105", skill: "full", status: "published", validation: { converterVersion: 99 }, updated_at: new Date().toISOString() }];
  [...root.querySelectorAll("button")].find((b) => b.textContent === "Refresh").click();
  await until(() => !![...root.querySelectorAll("input[type=text]")].find((i) => i.value === "Full Exam: IELTS Writing Test 105"));
  const input = [...root.querySelectorAll("input[type=text]")].find((i) => i.value === "Full Exam: IELTS Writing Test 105");
  input.value = "IELTS Full Test 105";
  input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  await until(() => calls.some((c) => c.action === "importedExamRename"));
  const call = calls.filter((c) => c.action === "importedExamRename").pop();
  assert.deepEqual({ testId: call.body.testId, title: call.body.title }, { testId: "imp-full-r-77777777", title: "IELTS Full Test 105" });
});
