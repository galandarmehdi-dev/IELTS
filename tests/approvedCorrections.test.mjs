// Administrator-approved corrections of 25 Nov 2026: keys, revised wording, versions and protection.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isAnswerCorrect, markSection, resolveKeyForQuestion } from "../src/grading.mjs";
import { OBJECTIVE_ANSWER_KEYS as K } from "../src/objectiveAnswerKeys.mjs";
import { QUESTION_TYPES } from "../src/questionTypes.mjs";
import { ANSWER_KEY_VERIFICATION } from "../src/answerKeyVerification.mjs";
import { QUESTION_VERSIONS, QUESTION_REVISIONS_AT, applyQuestionVersionKeys, questionVersionFor } from "../src/questionVersions.mjs";

const ok = (a, key) => assert.equal(isAnswerCorrect(a, key), true, `"${a}" should match "${key}"`);
const no = (a, key) => assert.equal(isAnswerCorrect(a, key), false, `"${a}" should NOT match "${key}"`);
const BEFORE = "2026-11-20T10:00:00Z";
const AFTER = "2026-11-26T10:00:00Z";

test("IELTS10 L6: b.russell64@xmail.co.uk", () => {
  const key = K.ielts10.listening[6];
  ok("b.russell64@xmail.co.uk", key);
  ok("B.Russell64@XMAIL.CO.UK", key);
  no("b.russell64@mail.co.uk", key);
  no("b.russel64@xmail.co.uk", key);
  no("brussell64@xmail.co.uk", key);
  no("b russell64@xmail co uk", key);
});

test("IELTS3 L6: Mairead only", () => {
  ok("Mairead", K.ielts3.listening[6]);
  ok("MAIREAD", K.ielts3.listening[6]);
  no("Maired", K.ielts3.listening[6]);
  no("Mairaed", K.ielts3.listening[6]);
});

test("IELTS11 L2: RI6 GH7 (letter I), never R16 (digit 1)", () => {
  const key = K.ielts11.listening[2];
  ok("RI6 GH7", key);
  ok("RI6GH7", key);
  ok("ri6 gh7", key);
  ok("RI6  GH7", key);
  no("R16 GH7", key);
  no("R16GH7", key);
  no("RL6 GH7", key);
});

test("IELTS13 R5: FALSE only, strict TRUE/FALSE question", () => {
  assert.equal(QUESTION_TYPES.ielts13.reading[5], "tfng");
  const key = resolveKeyForQuestion(K.ielts13.reading[5], { questionType: "tfng" });
  ok("FALSE", key);
  no("NOT GIVEN", key);
  no("NO", key);
  no("TRUE", key);
});

test("IELTS12 R10-11: choose-TWO C and E in either order (all approved cases)", () => {
  const key = { 10: K.ielts12.reading[10], 11: K.ielts12.reading[11] };
  const score = (a, b) => markSection(key, { 10: a, 11: b }).total;
  assert.equal(score("C", "E"), 2);
  assert.equal(score("E", "C"), 2);
  assert.equal(score("C", "C"), 1);
  assert.equal(score("E", "E"), 1);
  assert.equal(score("C", "A"), 1);
  assert.equal(score("A", "E"), 1);
  assert.equal(score("A", "B"), 0);
  assert.equal(score("C", ""), 1);
  assert.equal(score("", "E"), 1);
  assert.equal(score("", ""), 0);
  // individual marks: the correct letter scores where it is written
  assert.deepEqual(markSection(key, { 10: "A", 11: "E" }).marks, { 10: false, 11: true });
});

test("revised questions: current keys for new attempts, historical policy for old ones", () => {
  assert.equal(questionVersionFor("ielts11", "reading", 20, BEFORE), 1);
  assert.equal(questionVersionFor("ielts11", "reading", 20, AFTER), 2);
  assert.equal(questionVersionFor("ielts11", "reading", 20, null), 2, "no timestamp → current version");
  assert.equal(questionVersionFor("ielts11", "reading", 21, BEFORE), null, "unrevised questions have no versions");
  const old11 = applyQuestionVersionKeys("ielts11", "reading", K.ielts11.reading, BEFORE);
  ok("D", old11[20]); ok("C", old11[20]);
  const new11 = applyQuestionVersionKeys("ielts11", "reading", K.ielts11.reading, AFTER);
  ok("C", new11[20]); no("D", new11[20]);
  const old17 = applyQuestionVersionKeys("ielts17", "reading", K.ielts17.reading, BEFORE);
  ok("NOT GIVEN", old17[19]); ok("FALSE", old17[19]); no("TRUE", old17[19]);
  const new17 = applyQuestionVersionKeys("ielts17", "reading", K.ielts17.reading, AFTER);
  ok("FALSE", new17[19]); no("NOT GIVEN", new17[19]); no("TRUE", new17[19]);
  const old12 = applyQuestionVersionKeys("ielts12", "reading", K.ielts12.reading, BEFORE);
  ok("NOT GIVEN", old12[36]); no("NO", old12[36]);
  ok("YES", old12[27]); ok("NOT GIVEN", old12[27]); no("NO", old12[27]);
  const new12 = applyQuestionVersionKeys("ielts12", "reading", K.ielts12.reading, AFTER);
  ok("NO", resolveKeyForQuestion(new12[36], { questionType: "ynng" })); no("FALSE", resolveKeyForQuestion(new12[36], { questionType: "ynng" }));
  ok("YES", new12[27]); no("NOT GIVEN", new12[27]);
  // Original @-sign wording: any two different letters of A, C, E; each once.
  const oldGroup = { 10: old12[10], 11: old12[11] };
  assert.equal(markSection(oldGroup, { 10: "A", 11: "E" }).total, 2);
  assert.equal(markSection(oldGroup, { 10: "C", 11: "A" }).total, 2);
  assert.equal(markSection(oldGroup, { 10: "A", 11: "A" }).total, 1);
  assert.equal(markSection(oldGroup, { 10: "B", 11: "D" }).total, 0);
});

test("version records preserve original and revised wording, keys, approval and reason", () => {
  for (const [t, secs] of Object.entries(QUESTION_VERSIONS)) {
    for (const [sec, qs] of Object.entries(secs)) {
      for (const [q, e] of Object.entries(qs)) {
        if (e.sameAs) continue;
        assert.ok(e.v1.text && e.v2.text, `${t} ${sec} ${q} texts`);
        assert.ok(e.v1.text !== e.v2.text || JSON.stringify(e.v1.options) !== JSON.stringify(e.v2.options), `${t} ${sec} ${q}: wording or options must differ`);
        assert.ok(e.v1.historicalKey && e.v2.key && e.reason && e.approvedBy && e.revisedAt, `${t} ${sec} ${q} metadata`);
        assert.equal(e.v2.key, K[t][sec][q], `${t} ${sec} ${q}: v2 key must be the live key`);
      }
    }
  }
  assert.ok(Date.parse(QUESTION_REVISIONS_AT));
});

test("revised wording is what students see; original wording is gone from the test content", () => {
  const content = readFileSync(new URL("../src/protectedTestContent.mjs", import.meta.url), "utf8");
  for (const secs of Object.values(QUESTION_VERSIONS)) {
    for (const qs of Object.values(secs)) {
      for (const e of Object.values(qs)) {
        if (e.sameAs || e.v1.text === e.v2.text) continue;
        if (!e.v1.options) {
          assert.ok(content.includes(e.v2.text), `missing revised text: ${e.v2.text}`);
          assert.ok(!content.includes(e.v1.text), `original text still shown: ${e.v1.text}`);
        }
        Object.entries(e.v2.options || {}).forEach(([letter, text]) => assert.ok(content.includes(`{ letter: "${letter}", text: ${JSON.stringify(text)} }`), `option ${letter}`));
        Object.values(e.v1.options || {}).forEach((text) => assert.ok(!content.includes(text), `original option still shown: ${text}`));
      }
    }
  }
});

test("protection: a sync cannot silently change a verified key", () => {
  let pinned = 0;
  for (const [t, secs] of Object.entries(ANSWER_KEY_VERIFICATION)) {
    for (const [sec, qs] of Object.entries(secs)) {
      for (const [q, e] of Object.entries(qs)) {
        if (e.status === "verified" && e.key !== undefined) {
          pinned += 1;
          assert.equal(K[t][sec][q], e.key, `${t} ${sec} Q${q} is verified as "${e.key}" but the key file says "${K[t][sec][q]}". Changing a verified key needs explicit approval: update src/answerKeyVerification.mjs in the same change.`);
        }
      }
    }
  }
  assert.ok(pinned >= 10);
});
