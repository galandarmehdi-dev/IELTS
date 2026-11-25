import test from "node:test";
import assert from "node:assert/strict";
import {
  isAnswerCorrect, acceptedAnswers, canonicalAnswer, alignGroupedAnswerMap, findAnswerGroups, markSection,
  validateAnswerKeyMap,
} from "../src/grading.mjs";
import { OBJECTIVE_ANSWER_KEYS } from "../src/objectiveAnswerKeys.mjs";

const ok = (student, key) => assert.equal(isAnswerCorrect(student, key), true, `"${student}" should match "${key}"`);
const no = (student, key) => assert.equal(isAnswerCorrect(student, key), false, `"${student}" should NOT match "${key}"`);

test("capitalisation never matters", () => {
  ok("DOCUMENTS", "documents");
  ok("Documents", "documents");
  ok("documents", "DOCUMENTS");
  ok("j", "J");
  ok("vii", "VII");
  ok("NO", "no");
  ok("Not Given", "NOT GIVEN");
  ok("INDIVIDUAL", "individual / employees");
});

test("whitespace, invisible characters and Unicode look-alikes", () => {
  ok("  documents  ", "documents");
  ok("documents​", "documents");
  ok("﻿J", "J");
  ok("long term memory", "long-term memory");
  ok("sperm  whales", "sperm whales");
  ok("master’s degree", "master's degree");
  ok("café", "cafe");
  ok("cafe", "café");
  ok("documents.", "documents");
  ok("\"documents\"", "documents");
  ok("8.00\tA.M.", "8.00 / 8 a.m.");
  // Azerbaijani/Turkish keyboards type capital I as \u0130 and small i as \u0131.
  ok("EXPER\u0130ENCE", "experience");
  ok("RECEPT\u0130ON\u0130ST", "receptionist");
  ok("experıence", "experience");
  ok("Full", "full"); // phone auto-capitalisation
});

test("hyphen and space are the same, but joined compounds are not", () => {
  ok("long term memory", "long-term memory");
  ok("eco friendly", "eco-friendly");
  ok("thought-experiment", "thought experiment");
  no("phoneline", "phone line");
  no("database", "data base");
  no("data base", "database");
  no("reform", "re-form");
});

test("slash alternatives and optional words/endings", () => {
  ok("employees", "the individual / employees");
  ok("the individual", "the individual / employees");
  no("individual", "the individual / employees");
  for (const a of ["disease", "diseases", "certain disease", "certain diseases"]) ok(a, "(certain) disease(s)");
  no("certain", "(certain) disease(s)");
  no("disease s", "(certain) disease(s)");
  ok("sledges", "(two) sledges");
  ok("two sledges", "(two) sledges");
  ok("2 sledges", "(two) sledges");
  ok("792", "(number/no./#) 792");
  ok("no. 792", "(number/no./#) 792");
  ok("number 792", "(number/no./#) 792");
  ok("movement", "(animal) movement");
  ok("animal movement", "(animal) movement");
  no("movements", "(animal) movement");
  ok("kelp", "(vast) kelp forests/kelp");
  ok("vast kelp forests", "(vast) kelp forests/kelp");
  ok("30/10", "30/10");
  ok("7:30", "7.30/7:30");
  ok("7.30", "7.30/7:30");
  ok("9.15", "9:15 AM/9:15 am/9.15/9:15");
  assert.deepEqual(acceptedAnswers("disease(s)").sort(), ["disease", "diseases"]);
});

test("numbers: words, digits, separators and decimals", () => {
  ok("10 minutes", "ten minutes");
  ok("ten minutes", "10 minutes");
  ok("1.8", "1.80");
  ok("1.80", "1.8");
  ok("1500", "1,500");
  ok("1,500", "1500");
  ok("250", "two hundred and fifty");
  ok("two hundred fifty", "250");
  ok("twenty-five", "25");
  ok("20th century", "(the) twentieth century");
  ok("6", "six");
  ok("40", "40 / forty / fourty");
  ok("145 per cent", "145%");
  ok("145%", "145 percent");
  no("100", "10");
  no("1.18", "1.8");
  no("6", "6 months");
  no("hundred miles", "ten minutes");
});

test("dates", () => {
  for (const a of ["2 July", "2nd July", "July 2", "July 2nd", "the 2nd of July", "second July"]) ok(a, "2 July/2nd July");
  no("July", "2 July");
  no("3 July", "2 July");
  ok("13 November", "13th november");
  ok("30th of October", "October 30");
  no("Sept 1975", "September 1975");
  ok("Sept 1975", "September 1975 / Sept 1975");
});

test("times", () => {
  for (const a of ["2 pm", "2 p.m.", "2 PM", "2pm", "2.00 pm", "2:00 PM", "two pm"]) ok(a, "2 PM");
  ok("8.55 am", "8:55 am");
  ok("8:55 AM", "8.55 (am)");
  ok("8.55", "8:55");
  ok("8:55", "8.55 (am) / 8:55 (am)");
  ok("10.30", "10:30");
  no("10.3", "10:30 / 10.30");
  no("2 am", "2 pm");
  no("8.56", "8:55");
});

test("no fuzzy matching: spelling, word form, synonyms and missing words stay wrong", () => {
  no("quite", "quiet");
  no("satelites", "satellites");
  no("exlusion", "exclusion");
  no("previsions", "provisions");
  no("orchards", "orchids");
  no("bright", "brighter");
  no("Wensday", "Wednesday");
  no("Wednesday", "Wednesdays");
  no("religion", "religions");
  no("grasses", "grass");
  no("cost", "costs");
  no("danger", "dangers");
  no("sperm whale", "sperm whales");
  no("bark beetle", "beetle");
  no("measurements", "exact measurements");
  no("gunshot", "gunshot wound");
  no("Secret Garden", "The Secret Garden");
  no("Beatrice Russell", "Beatrice");
  no("Middle Ages", "late Middle Ages");
  no("large slicks", "larger slicks");
  no("", "documents");
  no("   ", "documents");
  no("documents", "");
  no("anything", "—");
});

test("TRUE/FALSE/NOT GIVEN and YES/NO/NOT GIVEN", () => {
  ok("TRUE", "TRUE / yes");
  ok("yes", "TRUE / yes");
  no("NOT GIVEN", "TRUE / yes");
  ok("not given", "Not given");
  no("NO", "not given");
  no("T", "TRUE");
  no("FALSE", "TRUE");
});

test("choose-TWO groups score each letter once, in any order", () => {
  const key = { 10: "C / E", 11: "C / E", 12: "B" };
  const score = (a, b) => markSection(key, { 10: a, 11: b, 12: "" }).total;
  assert.equal(score("C", "E"), 2);
  assert.equal(score("E", "C"), 2);
  assert.equal(score("c", "e"), 2);
  assert.equal(score("C", "C"), 1);
  assert.equal(score("E", "E"), 1);
  assert.equal(score("C", "A"), 1);
  assert.equal(score("A", "C"), 1);
  assert.equal(score("A", "B"), 0);
  assert.equal(score("", ""), 0);
  assert.equal(score("C/E", ""), 0);
});

test("choose-THREE groups and lone slash keys", () => {
  const key = { 25: "A / D / E", 26: "A / D / E", 27: "A / D / E" };
  assert.equal(markSection(key, { 25: "E", 26: "A", 27: "D" }).total, 3);
  assert.equal(markSection(key, { 25: "D", 26: "D", 27: "D" }).total, 1);
  assert.equal(markSection(key, { 25: "D", 26: "B", 27: "A" }).total, 2);
  // A single question with "B / C" and no twin accepts either letter.
  assert.deepEqual(findAnswerGroups({ 25: "B / C", 26: "A" }), []);
  assert.equal(markSection({ 25: "B / C" }, { 25: "C" }).total, 1);
  // Different keys next to each other are not a group.
  assert.deepEqual(findAnswerGroups({ 32: "D / C", 33: "E / D" }), []);
  // Same letters written in another order or spacing still form one group.
  assert.equal(findAnswerGroups({ 1: "C/E", 2: "E / C" }).length, 1);
  // A group needs no more questions than letters.
  assert.deepEqual(findAnswerGroups({ 1: "A/B", 2: "A/B", 3: "A/B" }), []);
  assert.deepEqual(alignGroupedAnswerMap({ 1: "C/E", 2: "C/E" }, { 1: "E" }), { 1: "E", 2: "C" });
});

test("manual overrides win over the key", () => {
  const r = markSection({ 1: "documents", 2: "J" }, { 1: "gateways", 2: "J" }, { 1: true, 2: false });
  assert.equal(r.total, 1);
  assert.deepEqual(r.marks, { 1: true, 2: false });
});

test("verified answer-key corrections (regressions)", () => {
  // IELTS21 Reading Q10: passage says 'White Horse Hill' "is mentioned in documents from the nearby Abbey".
  ok("documents", OBJECTIVE_ANSWER_KEYS.ielts21.reading[10]);
  ok("DOCUMENTS", OBJECTIVE_ANSWER_KEYS.ielts21.reading[10]);
  no("gateways", OBJECTIVE_ANSWER_KEYS.ielts21.reading[10]);
  // IELTS22 Reading Q28-29: "challenging task for which he had to overcome numerous problems [J]" and
  // "a straightforward internet purchase [I] would not be possible".
  ok("J", OBJECTIVE_ANSWER_KEYS.ielts22.reading[28]);
  ok("I", OBJECTIVE_ANSWER_KEYS.ielts22.reading[29]);
  // Formatting variants now accepted by the engine for keys that were trimmed by an earlier sheet sync.
  ok("socialise", OBJECTIVE_ANSWER_KEYS.ielts13.listening[36]);
  ok("six months", OBJECTIVE_ANSWER_KEYS.ielts13.listening[4]);
  ok("eco friendly", OBJECTIVE_ANSWER_KEYS.ielts11.listening[38]);
  ok("fine tunes", OBJECTIVE_ANSWER_KEYS.ielts8.reading[38]);
  ok("1,000 words", OBJECTIVE_ANSWER_KEYS.ielts11.listening[28]);
  ok("1,100", OBJECTIVE_ANSWER_KEYS.ielts10.listening[3]);
  ok("café", OBJECTIVE_ANSWER_KEYS.ielts16.listening[8]);
  ok("1.8", OBJECTIVE_ANSWER_KEYS.ielts1.listening[6]);
  ok("July 2", OBJECTIVE_ANSWER_KEYS.ielts2.listening[16]);
  ok("diseases", OBJECTIVE_ANSWER_KEYS.ielts2.listening[39]);
  ok("10 minutes", OBJECTIVE_ANSWER_KEYS.ielts13.reading[14]);
  // IELTS6 Reading Q13: passage "outbreaks of bark beetle", limit TWO WORDS. Q17 asks "Which kind of whale".
  ok("bark beetle", OBJECTIVE_ANSWER_KEYS.ielts6.reading[13]);
  ok("beetle", OBJECTIVE_ANSWER_KEYS.ielts6.reading[13]);
  ok("sperm whale", OBJECTIVE_ANSWER_KEYS.ielts6.reading[17]);
  ok("sperm whales", OBJECTIVE_ANSWER_KEYS.ielts6.reading[17]);
  ok("sperm", OBJECTIVE_ANSWER_KEYS.ielts6.reading[17]);
  // Verified as still incorrect (meaning lost or word limit broken).
  no("measurements", OBJECTIVE_ANSWER_KEYS.ielts13.reading[15]);   // passage: "exact measurements of duration"
  no("Beatrice Russell", OBJECTIVE_ANSWER_KEYS.ielts10.listening[4]); // ONE WORD AND/OR A NUMBER
  no("6", OBJECTIVE_ANSWER_KEYS.ielts13.listening[4]);             // "valid for a minimum of 6" has no unit
  no("gunshot", OBJECTIVE_ANSWER_KEYS.ielts19.reading[38]);        // passage: "a gunshot wound to the head"
});

test("every built-in answer key parses and has no critical validation errors", () => {
  for (const [testId, sections] of Object.entries(OBJECTIVE_ANSWER_KEYS)) {
    for (const section of ["listening", "reading"]) {
      const errors = validateAnswerKeyMap(sections[section]).filter((i) => i.level === "error");
      assert.deepEqual(errors, [], `${testId} ${section}: ${JSON.stringify(errors)}`);
    }
  }
});

test("canonical form keeps meaningful characters", () => {
  assert.equal(canonicalAnswer("b.russell64@xmail.co.uk"), "b.russell64@xmail.co.uk");
  assert.equal(canonicalAnswer("RI6 GH7"), "ri6 gh7");
  assert.equal(canonicalAnswer("£3.25"), "£3.25");
  no("3.25", "£3.25");
  no("1,1 billion years", "1.1 billion years"); // a decimal comma is not reinterpreted
});
