import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { parseExamHtml, parseWritingHtml } from "../assets/js/converter/examParser.mjs";
import { convertToEngineContent, convertWritingToEngineContent, gapItems } from "../assets/js/converter/examAdapter.mjs";
import { getImportedAnswerMap, hydrateImportedExams, invalidateImportedExamCache, validateImportedExam, sanitizeImportedContent } from "../src/importedExams.mjs";

const parseHtml = (h) => new JSDOM(h).window.document;
const BASE = "https://practicepteonline.com";
const run = (f, opts = {}) => {
  const parsed = parseExamHtml(readFileSync(new URL(`./fixtures/${f}`, import.meta.url), "utf8"), { parseHtml, sourceBaseUrl: BASE, ...opts });
  return { parsed, out: convertToEngineContent(parsed) };
};

test("reading converts to the existing parts/blocks format with every question present", () => {
  const { out } = run("ielts-reading-test-1.html");
  const parts = out.content.reading.parts;
  assert.equal(parts.length, 3);
  assert.deepEqual(parts.map((p) => p.blocks.map((b) => b.type)), [
    ["ynng", "summarySelect", "mcq"],
    ["endingsMatch", "multiTextChoices", "sentenceGaps"],
    ["endingsMatch", "sentenceGaps", "tfng"],
  ]);
  const qs = parts.flatMap((p) => p.blocks.flatMap((b) => (b.items || b.questions || b.summaryLines || []).map((i) => i.q ?? i.blankQ)));
  assert.deepEqual([...new Set(qs)].sort((a, b) => a - b), Array.from({ length: 40 }, (_, i) => i + 1));
  assert.match(parts[0].passageText, /^Attitudes to Language\n\nIt is not easy/);
  assert.match(parts[1].passageText, /\n\nA Operating on the same principle/);
});

test("reading blocks carry instructions, word bank, summary flow and the diagram image", () => {
  const { out } = run("ielts-reading-test-1.html");
  const [p1, p2, p3] = out.content.reading.parts;
  assert.equal(p1.blocks[0].title, "Questions 1-8");
  assert.ok(p1.blocks[0].instructions.some((l) => /agree with the claims of the writer/.test(l)));
  assert.ok(!p1.blocks[0].instructions.some((l) => /^Questions 1-8/.test(l)));
  const sum = p1.blocks[1];
  assert.equal(sum.options.length, 9);
  assert.deepEqual(sum.options[7], { letter: "H", word: "prescriptivists" });
  assert.deepEqual(sum.summaryLines.map((l) => l.blankQ), [9, 10, 11, 12]);
  assert.match(sum.summaryLines[0].text, /According to/);
  assert.equal(p1.blocks[2].items[0].choices.B, "to present a historical account of differing views of language");
  assert.equal(p2.blocks[0].endings.C, "Paragraph C");
  assert.deepEqual(p2.blocks[1].choices.map((c) => c.letter).join(""), "ABCDEFGHIJ");
  const diagram = p2.blocks[2];
  assert.equal(diagram.imageSrc, `${BASE}/wp-content/uploads/2024/09/test-1-min-2.png`);
  assert.deepEqual(diagram.items.map((i) => i.q), [23, 24, 25, 26]);
  assert.match(p3.blocks[1].items[0].text, /pictures of both/);
  assert.equal(p3.blocks[1].items[0].q, 33);
});

test("reading multi-answer keys become ascending letters per question and are flagged", () => {
  const { out } = run("ielts-reading-test-1.html");
  assert.deepEqual([18, 19, 20, 21, 22].map((q) => out.answerKeys[q]), ["A", "D", "E", "F", "J"]);
  assert.ok(out.issues.some((i) => i.code === "multi_answer_order"));
});

test("listening html uses the player's markup and exposes all 40 questions", () => {
  const { out } = run("ielts-listening-185.html");
  const { audioSrc, html } = out.content.listening;
  assert.equal(audioSrc, `${BASE}/wp-content/uploads/audio/185_we.mp3`);
  const doc = parseHtml(`<body>${html}</body>`);
  assert.deepEqual([...doc.querySelectorAll(".listen-page")].map((e) => e.id), ["listenSec1", "listenSec2", "listenSec3", "listenSec4"]);
  assert.equal(doc.querySelectorAll(".listen-page.hidden").length, 3);
  const seen = new Set();
  doc.querySelectorAll("[data-lq]").forEach((e) => seen.add(Number(e.dataset.lq)));
  doc.querySelectorAll("[data-lq-radio]").forEach((e) => seen.add(Number(e.dataset.lqRadio)));
  doc.querySelectorAll("[data-lq-check]").forEach((e) => {
    const start = Number(e.dataset.lqCheck);
    for (let i = 0; i < Number(e.dataset.lqCount); i += 1) seen.add(start + i);
  });
  assert.deepEqual([...seen].sort((a, b) => a - b), Array.from({ length: 40 }, (_, i) => i + 1));
  assert.equal(doc.querySelectorAll('input[data-lq-radio="12"]').length, 3);
  assert.equal(doc.querySelectorAll('input[data-lq-check="21"]').length, 5);
  assert.equal(doc.querySelectorAll('select[data-lq="15"] option').length, 11);
  assert.equal(doc.querySelectorAll('input[data-lq="1"]').length, 1);
  assert.match(doc.querySelector(".img-wrap img").getAttribute("src"), /lis-test185\.png$/);
  assert.equal(doc.querySelectorAll("input[data-lq-radio]").length, 12);
});

test("listening multi-answer keys are sorted so order never matters", () => {
  const { out } = run("ielts-listening-185.html");
  assert.deepEqual([21, 22, 23, 24].map((q) => out.answerKeys[q]), ["C", "E", "B", "E"]);
  assert.equal(out.answerKeys[1], "Egg");
});

test("audio blocks publishing until uploaded, and images come from the file's own site", () => {
  const parsed = parseExamHtml(readFileSync(new URL("./fixtures/ielts-listening-185.html", import.meta.url), "utf8"), { parseHtml });
  const out = convertToEngineContent(parsed);
  assert.ok(out.issues.some((i) => i.code === "audio_unresolved"));
  assert.ok(!out.issues.some((i) => /image/.test(i.message)), "image should resolve from the page's own address");
  assert.equal(parsed.inferredBase, "https://practicepteonline.com");
  const hotlinked = convertToEngineContent(parseExamHtml(readFileSync(new URL("./fixtures/ielts-listening-185.html", import.meta.url), "utf8"), { parseHtml, sourceBaseUrl: "https://practicepteonline.com" }));
  assert.ok(hotlinked.issues.some((i) => i.code === "media_host_blocked" && /Upload the file/.test(i.message)));
  const fixed = convertToEngineContent(parsed, { mediaMap: { "/wp-content/uploads/audio/185_we.mp3?_=1": "https://bgujwyknnszwborgbkxq.supabase.co/storage/v1/object/public/exam-media/ieltsmock/a.mp3" } });
  assert.equal(fixed.issues.length, 0);
  const other = convertToEngineContent(parsed, { mediaMap: { "/wp-content/uploads/2024/09/lis-test185.png": "https://random-host.test/m.png", "/wp-content/uploads/audio/185_we.mp3?_=1": "/media/a.mp3" } });
  assert.ok(other.issues.some((i) => i.code === "media_host_blocked"));
});

test("allowed media hosts match the Worker's Content-Security-Policy", async () => {
  const csp = readFileSync(new URL("../src/worker.mjs", import.meta.url), "utf8");
  const line = (name) => csp.split("\n").find((l) => l.includes(`"${name}-src`)) || "";
  const { IMAGE_HOSTS, AUDIO_HOSTS } = await import("../assets/js/converter/examAdapter.mjs");
  IMAGE_HOSTS.forEach((h) => assert.ok(line("img").includes(`https://${h}`), `img-src is missing ${h}`));
  AUDIO_HOSTS.forEach((h) => assert.ok(line("media").includes(`https://${h}`), `media-src is missing ${h}`));
});

test("table instructions and trailing cells are kept (reading test 9)", () => {
  const { parsed, out } = run("ielts-reading-test-9.html");
  const route = out.content.reading.parts[1].blocks[1];
  assert.ok(route.instructions.some((l) => /There are six routes, A-F, marked on the map/.test(l)));
  assert.ok(route.instructions.some((l) => /Complete the form below\. Write the correct letter A-F/.test(l)));
  assert.deepEqual(route.items.map((i) => [i.q, i.text, i.tail]), [[20, "", "15,000 or more"], [21, "", "600 to 700"]]);
  const wave = out.content.reading.parts[1].blocks[2];
  assert.ok(wave.instructions.some((l) => /Classify the groups named in the table/.test(l)));
  assert.ok(wave.instructions.some((l) => /^A the first wave$/.test(l)));
  assert.ok(wave.instructions.some((l) => /Write the correct letter A, B or C/.test(l)));
  assert.equal(parsed.inferredBase, "https://practicepteonline.com");
});

test("gapItems keeps text around gaps and folds extra gaps into one question", () => {
  const items = gapItems([{ html: "Intro {{q:1}} middle {{q:2}},and{{q:2.2}} end" }]);
  assert.deepEqual(items, [{ q: 1, text: "Intro" }, { q: 2, text: "middle", tail: ",and … end" }]);
});

test("converted exams survive the save pipeline and mark correctly end to end", async () => {
  for (const f of ["ielts-reading-test-1.html", "ielts-listening-185.html"]) {
    const { parsed } = run(f);
    const out = convertToEngineContent(parsed, { mediaMap: { "/wp-content/uploads/audio/185_we.mp3?_=1": "https://cdn.test/a.mp3", "/wp-content/uploads/2024/09/lis-test185.png": "https://cdn.test/m.png" } });
    const exam = { skill: parsed.skill, title: parsed.title, content: sanitizeImportedContent(out.content), answerKeys: out.answerKeys };
    const v = validateImportedExam(exam);
    assert.equal(v.ok, true, f);
    assert.equal(v.warnings.length, 0, `${f}: ${v.warnings.join("; ")}`);
    const html = JSON.stringify(exam.content);
    assert.ok(!/<script|onerror|onclick/i.test(html));
    if (parsed.skill === "listening") assert.match(exam.content.listening.html, /data-lq-check="21"/);
    invalidateImportedExamCache();
    await hydrateImportedExams({}, async () => ({ ok: true, data: [{ test_id: `imp-${parsed.skill}-x-00000000`, skill: parsed.skill, content: exam.content, answer_keys: exam.answerKeys }] }));
    const map = getImportedAnswerMap(`imp-${parsed.skill}-x-00000000`, parsed.skill);
    assert.equal(Object.keys(map).length, 40);
  }
});

test("manual type override re-reads answers with the new kind", () => {
  const parsed = parseExamHtml(readFileSync(new URL("./fixtures/ielts-reading-test-1.html", import.meta.url), "utf8"), { parseHtml, typeOverrides: { "0-0": "true_false_not_given" } });
  const g = parsed.parts[0].groups[0];
  assert.equal(g.type, "true_false_not_given");
  assert.equal(g.confidence, "manual");
  assert.ok(parsed.issues.some((i) => i.code === "bad_answer_value" && i.q === 1));
});

test("group titles are escaped in listening html", () => {
  const parsed = parseExamHtml(readFileSync(new URL("./fixtures/ielts-listening-185.html", import.meta.url), "utf8").replace("Stoicism</strong>", "&lt;img src=x onerror=alert(1)&gt;</strong>"), { parseHtml, sourceBaseUrl: BASE });
  const html = convertToEngineContent(parsed).content.listening.html;
  assert.ok(!/<img src=x/.test(html));
});

test("reading test 9 converts headings and tables into the player's formats", () => {
  const { out } = run("ielts-reading-test-9.html");
  const parts = out.content.reading.parts;
  assert.equal(parts.length, 3);
  const headings = parts[1].blocks[0];
  assert.equal(headings.type, "headings");
  assert.equal(headings.headings.length, 10);
  assert.deepEqual(headings.headings[0].value, "i");
  assert.deepEqual(headings.questions.map((q) => [q.q, q.paragraph]), [[14, "Paragraph A"], [15, "Paragraph B"], [16, "Paragraph C"], [17, "Paragraph D"], [18, "Paragraph E"], [19, "Paragraph F"]]);
  assert.equal(parts[0].blocks[1].options.length, 15);
  assert.equal(parts[0].blocks[1].summaryLines.length, 7);
  const wave = parts[1].blocks[2];
  assert.equal(wave.type, "sentenceGaps");
  assert.deepEqual(wave.items.map((i) => [i.q, i.text]), [[22, "Inuit"], [23, "Apache"], [24, "Pima-Papago"], [25, "Ticuna"]]);
  const route = parts[1].blocks[1];
  assert.equal(route.imageSrc, `${BASE}/wp-content/uploads/2024/09/test-9-min-1.png`);
  assert.equal(out.answerKeys[17], "i");
  assert.equal(out.issues.filter((i) => i.severity === "error").length, 0);
});

test("every reading passage starts with a title line, and passages can be edited", () => {
  const parsed = parseExamHtml(readFileSync(new URL("./fixtures/ielts-reading-test-9.html", import.meta.url), "utf8"), { parseHtml, skill: "reading" });
  const plain = convertToEngineContent(parsed).content.reading.parts;
  plain.forEach((p, i) => assert.match(p.passageText, /^[^\n]+\n\n[^\n]/, `passage ${i + 1} starts with a one-line title`));
  const untitled = parseExamHtml(readFileSync(new URL("./fixtures/ielts-reading-test-9.html", import.meta.url), "utf8").replace("<strong>Ant Intelligence</strong>", ""), { parseHtml, skill: "reading" });
  assert.match(convertToEngineContent(untitled).content.reading.parts[0].passageText, /^Reading Passage 1\n\nWhen we think/);
  const edited = convertToEngineContent(parsed, { passageEdits: { 1: { title: "New Title", text: "First para.\n\nSecond para." } } }).content.reading.parts;
  assert.equal(edited[1].passageText, "New Title\n\nFirst para.\n\nSecond para.");
  assert.equal(edited[0].passageText, plain[0].passageText);
  const cleared = convertToEngineContent(parsed, { passageEdits: { 0: { title: "", text: "Body" } } }).content.reading.parts[0].passageText;
  assert.equal(cleared, "Reading Passage 1\n\nBody");
});

test("writing type overrides are applied", () => {
  const w = parseWritingHtml(readFileSync(new URL("./fixtures/ielts-writing-test-100.html", import.meta.url), "utf8"), { parseHtml });
  const c = convertWritingToEngineContent(w, { types: { task1Type: "Table", task2Type: "Essay" } }).content.writing;
  assert.equal(c.task1Type, "Table");
  assert.equal(c.task2Type, "Essay");
});
