import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { parseExamHtml, parseAnswerLines, normalizeAnswer, resolveMediaUrl } from "../assets/js/converter/examParser.mjs";

const parseHtml = (h) => new JSDOM(h).window.document;
const load = (f, opts = {}) => parseExamHtml(readFileSync(new URL(`./fixtures/${f}`, import.meta.url), "utf8"), { parseHtml, filename: f, ...opts });
const groups = (r) => r.parts.flatMap((p) => p.groups);
const groupAt = (r, q) => groups(r).find((g) => q >= g.range[0] && q <= g.range[1]);

test("reading: 3 passages, 40 questions, 40 answers, no fabricated keys", () => {
  const r = load("ielts-reading-test-1.html");
  assert.equal(r.skill, "reading");
  assert.equal(r.title, "IELTS Reading Test 1");
  assert.deepEqual(r.parts.map((p) => p.title), ["Attitudes to Language", "Tidal Power", "Information Theory – The Bid Idea"]);
  assert.deepEqual(r.parts.map((p) => p.groups.map((g) => g.range.join("-"))), [["1-8", "9-12", "13-13"], ["14-17", "18-22", "23-26"], ["27-32", "33-37", "38-40"]]);
  assert.equal(r.stats.questionsCovered, 40);
  assert.equal(Object.keys(r.answerKeys).length, 40);
  assert.equal(r.ok, true);
  assert.equal(r.issues.filter((i) => ["missing_answer", "question_not_found", "question_duplicated"].includes(i.code)).length, 0);
});

test("reading: every question type is recognised correctly", () => {
  const r = load("ielts-reading-test-1.html");
  const type = (q) => groupAt(r, q).type;
  assert.equal(type(1), "yes_no_not_given");
  assert.equal(type(9), "summary_completion_wordbank");
  assert.equal(type(13), "multiple_choice");
  assert.equal(type(14), "matching_information");
  assert.equal(type(18), "multiple_answer");
  assert.equal(type(23), "diagram_labelling");
  assert.equal(type(27), "matching_information");
  assert.equal(type(33), "note_completion");
  assert.equal(type(38), "true_false_not_given");
});

test("reading: answers matched to the right questions and normalised", () => {
  const r = load("ielts-reading-test-1.html");
  assert.equal(r.answerKeys[1], "YES");
  assert.equal(r.answerKeys[4], "NOT GIVEN");
  assert.equal(r.answerKeys[9], "H");
  assert.equal(r.answerKeys[24], "slow / slow turning");
  assert.equal(r.answerKeys[33], "jupiter and saturn");
  assert.equal(r.answerKeys[40], "FALSE");
  const multi = groupAt(r, 18).multi;
  assert.equal(multi.count, 5);
  assert.deepEqual(multi.answerSet, ["A", "D", "E", "F", "J"]);
});

test("reading: instructions, options, word bank and gaps are preserved", () => {
  const r = load("ielts-reading-test-1.html");
  const g1 = groupAt(r, 1);
  assert.match(g1.instructionsHtml.join(" "), /agree with the claims of the writer/);
  assert.match(g1.instructionsHtml.join(" "), /NOT GIVEN/);
  assert.equal(g1.items.length, 8);
  assert.match(g1.items[0].html, /understandable reasons/);
  assert.deepEqual(groupAt(r, 9).options.map((o) => o.letter).join(""), "ABCDEFGHI");
  assert.equal(groupAt(r, 18).options.length, 10);
  const mc = groupAt(r, 13).items[0];
  assert.match(mc.html, /writer’s purpose/);
  assert.equal(mc.options.length, 4);
  const notes = groupAt(r, 33);
  assert.deepEqual(notes.items.filter((i) => i.gaps > 1).map((i) => i.q), [33, 35]);
  assert.match(notes.bodyLines[0].html, /\{\{q:33\}\}.*\{\{q:33\.2\}\}/);
});

test("reading: diagram image uses data-src, is flagged as relative, and labels are inferred with a warning", () => {
  const r = load("ielts-reading-test-1.html");
  const img = r.media.find((m) => m.kind === "image");
  assert.equal(img.original, "/wp-content/uploads/2024/09/test-1-min-2.png");
  assert.equal(img.inferredBase, true);
  assert.equal(img.resolved, "https://practicepteonline.com/wp-content/uploads/2024/09/test-1-min-2.png");
  assert.ok(r.issues.some((i) => i.code === "items_inferred"));
  const withBase = load("ielts-reading-test-1.html", { sourceBaseUrl: "https://example.test" });
  assert.equal(withBase.media.find((m) => m.kind === "image").inferredBase, false);
  assert.equal(withBase.media.find((m) => m.kind === "image").resolved, "https://example.test/wp-content/uploads/2024/09/test-1-min-2.png");
});

test("listening: 4 parts, 40 questions, 40 answers, audio flagged until resolved", () => {
  const r = load("ielts-listening-185.html");
  assert.equal(r.skill, "listening");
  assert.equal(r.parts.length, 4);
  assert.deepEqual(r.parts.map((p) => p.groups.map((g) => g.range.join("-"))), [["1-10"], ["11-14", "15-20"], ["21-22", "23-24", "25-30"], ["31-40"]]);
  assert.equal(r.stats.questionsCovered, 40);
  assert.equal(Object.keys(r.answerKeys).length, 40);
  assert.equal(r.audioSrc, "/wp-content/uploads/audio/185_we.mp3");
  const audio = r.media.find((m) => m.kind === "audio");
  assert.equal(audio.status, "needs_source_url");
  assert.ok(r.issues.some((i) => i.code === "media_needs_source" && /Audio/.test(i.message)));
  assert.equal(load("ielts-listening-185.html", { sourceBaseUrl: "https://example.test" }).audioSrc, "https://example.test/wp-content/uploads/audio/185_we.mp3");
});

test("listening: checkbox inputs do not fool type detection", () => {
  const r = load("ielts-listening-185.html");
  assert.equal(groupAt(r, 1).type, "note_completion");
  assert.equal(groupAt(r, 11).type, "multiple_choice");
  assert.equal(groupAt(r, 11).items.length, 4);
  assert.equal(groupAt(r, 11).items[1].options.length, 3);
  assert.equal(groupAt(r, 15).type, "map_labelling");
  assert.equal(groupAt(r, 21).type, "multiple_answer");
  assert.equal(groupAt(r, 23).type, "multiple_answer");
  assert.equal(groupAt(r, 25).type, "matching_features");
  assert.equal(groupAt(r, 31).type, "note_completion");
});

test("listening: multi-answer pairs, alternatives, and blanks", () => {
  const r = load("ielts-listening-185.html");
  assert.deepEqual(groupAt(r, 21).multi.answerSet, ["C", "E"]);
  assert.deepEqual(groupAt(r, 23).multi.answerSet, ["B", "E"]);
  assert.equal(groupAt(r, 21).multi.count, 2);
  assert.equal(r.answerKeys[21], "C, E");
  assert.equal(r.answerKeys[6], "Movie / film");
  assert.equal(r.answerKeys[40], "Practice / practise");
  assert.equal(r.answerKeys[15], "H");
  assert.equal(r.answerKeys[1], "Egg");
  const blanks = groupAt(r, 1).bodyLines.flatMap((l) => l.blanks.map((b) => b.q));
  assert.deepEqual(blanks, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(groupAt(r, 25).options.map((o) => o.letter).join(""), "ABCDEFGH");
  assert.equal(groupAt(r, 15).items.length, 6);
  assert.match(groupAt(r, 15).items[0].html, /Coffee room/);
});

test("no answer key is a blocking error and nothing is invented", () => {
  const html = readFileSync(new URL("./fixtures/ielts-reading-test-1.html", import.meta.url), "utf8").split("<input type='hidden' bg_collapse_expand")[0];
  const r = parseExamHtml(html, { parseHtml });
  assert.equal(r.ok, false);
  assert.ok(r.issues.some((i) => i.code === "no_answer_key"));
  assert.equal(Object.keys(r.answerKeys).length, 0);
});

test("a listening file with no audio is a blocking error", () => {
  const html = readFileSync(new URL("./fixtures/ielts-listening-185.html", import.meta.url), "utf8").replace(/<audio[\s\S]*?<\/audio>/, "");
  const r = parseExamHtml(html, { parseHtml, skill: "listening" });
  assert.equal(r.ok, false);
  assert.ok(r.issues.some((i) => i.code === "missing_audio"));
});

test("scripts in uploaded HTML are never kept or executed", () => {
  const evil = readFileSync(new URL("./fixtures/ielts-listening-185.html", import.meta.url), "utf8")
    .replace("<audio", '<script>window.__pwned=1</script><p onclick="x()">Questions 99</p><audio');
  const dom = new JSDOM("");
  const r = parseExamHtml(evil, { parseHtml: (h) => new dom.window.DOMParser().parseFromString(h, "text/html") });
  assert.equal(dom.window.__pwned, undefined);
  assert.ok(!JSON.stringify(r).match(/<script|onclick|__pwned/));
});

test("answer line parsing handles ranges, alternatives and conflicts", () => {
  const { answers, issues } = parseAnswerLines("1. A<br>2) b<br>3-4: C, E<br>5. x<br>5. y", parseHtml);
  assert.equal(answers[2], "b");
  assert.equal(answers[3], "C, E");
  assert.equal(answers[4], "C, E");
  assert.equal(issues.length, 1);
  assert.equal(normalizeAnswer("Colour (or color)/ hue", "text").value, "Colour / Colour or color / hue");
  assert.equal(normalizeAnswer("ng", "tfng").value, "NOT GIVEN");
  assert.deepEqual(normalizeAnswer("c, e", "letter").letters, ["C", "E"]);
  assert.equal(resolveMediaUrl("a.mp3", "").status, "needs_source_url");
});

test("reading test 9: passages without headings, labelled paragraphs, roman headings, table word bank", () => {
  const r = load("ielts-reading-test-9.html");
  assert.deepEqual(r.parts.map((p) => p.title), ["Ant Intelligence", "Population Movement and Genetics", "Reading Passage 3"]);
  assert.equal(r.stats.questionsCovered, 40);
  assert.equal(Object.keys(r.answerKeys).length, 40);
  assert.deepEqual(r.parts.map((p) => p.groups.map((g) => g.range.join("-"))), [["1-6", "7-13"], ["14-19", "20-21", "22-25", "26-26"], ["27-33", "34-39", "40-40"]]);
  assert.equal(groupAt(r, 7).type, "summary_completion_wordbank");
  assert.equal(groupAt(r, 7).options.length, 15);
  assert.equal(groupAt(r, 7).items.length, 7);
  const h = groupAt(r, 14);
  assert.equal(h.type, "matching_headings");
  assert.equal(h.options.length, 10);
  assert.match(h.options[0].html, /^The results of the research into blood-variants/);
  assert.equal(h.items.length, 6);
  assert.equal(r.answerKeys[17], "i");
  assert.ok(!r.issues.some((i) => i.code === "answer_not_in_options"));
  assert.equal(groupAt(r, 20).type, "table_completion");
  assert.equal(groupAt(r, 22).type, "table_completion");
  assert.deepEqual(r.parts[1].passage.map((p) => p.label || "-").join(""), "ABCDEF-G");
  assert.equal(r.issues.filter((i) => i.severity === "error").length, 0);
  assert.ok(!r.issues.some((i) => ["part_count", "short_passage", "type_uncertain"].includes(i.code)));
});

test("parsed result carries the converter version", () => {
  assert.ok(load("ielts-reading-test-9.html").converterVersion >= 3);
});

test("heading lists written as 'i. Heading' are found (reading test 31)", () => {
  const r = load("ielts-reading-test-31.html");
  const g = groupAt(r, 1);
  assert.equal(g.type, "matching_headings");
  assert.equal(g.options.length, 10);
  assert.equal(g.options[0].html, "Growth in the market for glass crafts");
  assert.equal(g.items.length, 5);
  assert.ok(!r.issues.some((i) => i.code === "headings_not_found"));
});

test("answers written as an unnumbered ordered list are numbered by position", () => {
  const { answers } = parseAnswerLines("<ol><li>Park</li><li>Blue</li><li>Reference</li><li>Story</li><li>Rain</li><li>A, C</li></ol>", parseHtml);
  assert.deepEqual(answers, { 1: "Park", 2: "Blue", 3: "Reference", 4: "Story", 5: "Rain", 6: "A, C" });
  assert.equal(parseAnswerLines('<ol start="11"><li>a</li><li>b</li><li>c</li><li>d</li><li>e</li></ol>', parseHtml).answers[11], "a");
});

test("Cyrillic lookalike option letters are read as Latin (reading test 17)", () => {
  const r = load("ielts-reading-test-17.html");
  const g = groupAt(r, 5);
  assert.equal(g.type, "matching_features");
  assert.deepEqual(g.options.map((o) => o.letter), ["A", "B", "C", "D"]);
  assert.ok(!r.issues.some((i) => i.code === "type_uncertain" && /Questions 5-10/.test(i.message)));
});

test("a passage's title and short lead-in paragraph after the previous questions are kept (reading test 313)", () => {
  const r = load("ielts-reading-test-313.html");
  assert.equal(r.parts[2].title, "A new role for livestock guard dogs");
  assert.match(r.parts[2].passage[0].html, /^Livestock guard dogs, traditionally used to protect farm animals/);
  assert.equal(r.parts[2].passage.length, 8);
  assert.equal(groupAt(r, 23).items.length, 4);
  assert.deepEqual(r.parts.map((p) => p.groups.map((g) => g.range.join("-")).join(",")), ["1-7,8-13", "14-17,18-22,23-26", "27-31,32-36,37-40"]);
});

test("question lines written without a space after the number ('28.an …') are kept (reading test 313)", () => {
  const r = load("ielts-reading-test-313.html");
  const items = groupAt(r, 27).items;
  assert.deepEqual(items.map((i) => i.q), [27, 28, 29, 30, 31]);
  assert.match(items.find((i) => i.q === 28).html, /^an optimistic suggestion about the possible positive developments/);
  assert.match(items.find((i) => i.q === 29).html, /^a description of how the methods used by livestock guard dogs/);
  assert.equal(r.issues.filter((i) => i.code === "question_not_found").length, 0);
});
