// Verification status of individual answer keys, recorded by hand after checking the source material.
//   verified : checked against the question wording and the passage (or transcript); key is right.
//   disputed : sources disagree or the evidence is ambiguous; an admin must decide. Excluded from
//              verified difficulty rankings and flagged in Question analytics.
//   unverifiable : needs material the project does not have (Listening audio/transcript).
// Every other key is "unverified": it came from the original source key and has not been re-checked.
// Add an entry whenever a key is checked. Evidence should quote the source.
export const ANSWER_KEY_VERIFICATION = {
  ielts6: {
    reading: {
      13: { status: "verified", evidence: "Passage: 'outbreaks of bark beetle'; limit TWO WORDS. Key (bark) beetle." },
      17: { status: "verified", evidence: "Q: 'Which kind of whale…'; passage: sperm whales. Key sperm whale(s) / sperm." },
    },
    listening: {
      1: { status: "unverifiable", evidence: "white vs stripes: needs the recording." },
    },
  },
  ielts7: {
    reading: {
      40: { status: "verified", evidence: "ONE WORD. 'words which sound similar [= rhyme] or go together with ___'; passage: 'putting words to music and rhyme' → music. 'rhyme' repeats the sentence." },
    },
  },
  ielts11: {
    reading: {
      20: { status: "verified", key: "C", evidence: "Approved by the site administrator on 2026-11-25. Question reworded (see src/questionVersions.mjs): chemical pollutants reducing reproductive ability = paragraph C only. Original wording credits C or D." },
    },
    listening: {
      2: { status: "verified", key: "RI6 GH7 / RI6GH7", evidence: "Approved by the site administrator on 2026-11-25. Capital I then digit 6; R16 GH7 (digit 1) is wrong." },
      3: { status: "verified", key: "07754897432", evidence: "Approved by the site administrator on 2026-11-25 (checked against the recording). Full number; the old key 07754 was truncated." },
    },
  },
  ielts12: {
    reading: {
      10: { status: "verified", key: "C / E", evidence: "Approved by the site administrator on 2026-11-25. Options reworded (A now refers to written documents; 14th-century Florentine documents contradict it). Choose-TWO C and E in either order." },
      11: { status: "verified", key: "C / E", evidence: "Approved by the site administrator on 2026-11-25. Second question of the C/E choose-TWO group." },
      22: { status: "verified", evidence: "Gap already contains 'from the seabed' and needs a plural noun: 'grains' (passage: 'the water has insulated the grains')." },
      27: { status: "verified", key: "YES", evidence: "Approved by the site administrator on 2026-11-25. Reworded to reflect the author's 'seemingly looming crisis'." },
      36: { status: "verified", key: "NO", evidence: "Approved by the site administrator on 2026-11-25. Reworded: loneliness and homesickness belong to the negotiation period, after the honeymoon period." },
    },
  },
  ielts13: {
    reading: {
      10: { status: "verified", evidence: "'making ___ responsible'; passage: 'shifting the responsibility onto the individual by encouraging their employees' → the individual / employees. Bare 'individual' is ungrammatical here." },
      14: { status: "verified", evidence: "Bristol 'approximately ten minutes behind the capital'; '100 miles apart' is not about time zones." },
      15: { status: "verified", evidence: "Passage: 'little call for exact measurements of duration'; 'measurements' alone loses the meaning." },
      5: { status: "verified", key: "FALSE", evidence: "Approved by the site administrator on 2026-11-25. Wording unchanged. Mindfulness shrinks the amygdala and reduces the stress response, contradicting 'increase'." },
    },
  },
  ielts17: {
    reading: {
      19: { status: "verified", key: "FALSE", evidence: "Approved by the site administrator on 2026-11-25. Reworded: the passage distinguishes the flat islets from MacLeod's Tables." },
      21: { status: "verified", evidence: "'climatic conditions'; 'climactic' is a misspelling." },
    },
  },
  ielts18: {
    reading: {
      20: { status: "verified", evidence: "Passage: 'French military band of the late Middle Ages'." },
    },
  },
  ielts19: {
    reading: {
      38: { status: "verified", evidence: "Passage: 'found dead with a gunshot wound to the head'." },
    },
  },
  ielts20: {
    reading: {
      28: { status: "verified", evidence: "'fundamental changes are happening as a result of the algorithmication' of the knowledge economy → D." },
      29: { status: "verified", evidence: "'workers feed the algorithm with false data to reach their targets' → C." },
    },
    listening: {
      8: { status: "unverifiable", evidence: "Wednesday vs Wednesdays ('Held on ___'): needs the recording." },
    },
  },
  ielts21: {
    reading: {
      10: { status: "verified", evidence: "Passage: 'White Horse Hill' is mentioned in documents from the nearby Abbey of Abingdon." },
      36: { status: "verified", evidence: "Students were 'instructed' and 'assigned' a viewpoint; they did not choose → FALSE." },
      40: { status: "verified", evidence: "'only a small positive relationship between wise thinking and crystallized intelligence' → TRUE." },
    },
  },
  ielts22: {
    reading: {
      28: { status: "verified", evidence: "'a challenging task for which he had to overcome [numerous problems = J]'." },
      29: { status: "verified", evidence: "'a straightforward [internet purchase = I] would not be possible'." },
    },
  },
  ielts3: { listening: { 6: { status: "verified", key: "Mairead", evidence: "Approved by the site administrator on 2026-11-25. Maired is wrong; no other spellings." } } },
  ielts1: {
    listening: {
      11: { status: "verified", key: "a", evidence: "Approved by the site administrator on 2026-11-25 (checked against the recording). Q11–14 = A, C, B, C; the June 2026 sheet sync was right." },
      12: { status: "verified", key: "c", evidence: "Approved by the site administrator on 2026-11-25 (checked against the recording)." },
      13: { status: "verified", key: "b", evidence: "Approved by the site administrator on 2026-11-25 (checked against the recording)." },
      14: { status: "verified", key: "c", evidence: "Approved by the site administrator on 2026-11-25 (checked against the recording)." },
    },
  },
  ielts10: { listening: { 6: { status: "verified", key: "b.russell64@xmail.co.uk", evidence: "Approved by the site administrator on 2026-11-25. The domain is xmail.co.uk; mail.co.uk and misspellings of Russell are wrong." } } },
  ielts15: { listening: { 3: { status: "verified", key: "Chastons", evidence: "Approved by the site administrator on 2026-11-25 (checked against the recording). chastens is wrong." } } },
  ielts16: { reading: { 31: { status: "verified", evidence: "Q31 'widespread occurrence of writer's block in literature' = para A: 'A common phenomenon in literature, writer's block… Few are the writers… who can profess to never…'. F is Q29 (historical cases). Restored A (June sheet sync had copied F)." } } },
  ielts4: { listening: { 31: { status: "unverifiable", evidence: "religion vs religions: needs the recording." } } },
  ielts5: {
    listening: {
      27: { status: "unverifiable", evidence: "Possible swap with Q28 (global hunger / pollution): needs the recording." },
      28: { status: "unverifiable", evidence: "Possible swap with Q27: needs the recording." },
      30: { status: "unverifiable", evidence: "grass vs grasses: needs the recording." },
    },
  },
  ielts9: { listening: { 9: { status: "unverifiable", evidence: "movement vs movements ('Scene must show ___'): needs the recording." } } },
};

export function getKeyVerification(testId, section, q) {
  return ANSWER_KEY_VERIFICATION?.[String(testId || "").toLowerCase()]?.[String(section || "").toLowerCase()]?.[Number(q)] || null;
}

// Content audit of 26 Nov 2026 (choose-TWO shared keys, Test 5 Reading keys).
const AUDIT_2026_11_26 = {
  ielts4: {
    reading: {
      37: { status: "verified", key: "B / E", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Choose-TWO advantages: shared key so each correct letter scores in either box." },
      38: { status: "verified", key: "B / E", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Choose-TWO group with Q37." },
      39: { status: "verified", key: "A / E", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Choose-TWO disadvantages: shared key." },
      40: { status: "verified", key: "A / E", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Choose-TWO group with Q39." },
    },
  },
  ielts5: {
    listening: {
      35: { status: "verified", key: "C / E", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Checkbox choose-TWO: shared key (answers are saved A-Z)." },
      36: { status: "verified", key: "C / E", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Group with Q35." },
      37: { status: "verified", key: "A / D", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Checkbox choose-TWO: shared key." },
      38: { status: "verified", key: "A / D", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Group with Q37." },
      39: { status: "verified", key: "A / C", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Checkbox choose-TWO: shared key." },
      40: { status: "verified", key: "A / C", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Group with Q39." },
    },
    reading: {
      1: { status: "verified", key: "vi", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Paragraph A tells the story of one boy (Besart) helped by the principal: 'An approach that helped a young learner'. v was wrongly accepted." },
      2: { status: "verified", key: "vii", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Paragraph B: PISA results = 'Statistical proof of education success'. viii was wrongly accepted." },
      4: { status: "verified", key: "iv", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Paragraph D: same quality education everywhere = equality. vi was wrongly accepted." },
      5: { status: "verified", key: "viii", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Paragraph E: maternity leave, day care, child allowance = support for families. iv was wrongly accepted." },
      14: { status: "verified", key: "viii", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Section A: fermentation happened by accident en route, 'a blessing in disguise' = a fortunate accident." },
      15: { status: "verified", key: "iii", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Section B: grains expand and propagate with use = the gift that keeps on giving." },
      16: { status: "verified", key: "vii", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Section C: how kefir is made." },
      17: { status: "verified", key: "i", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Section D: first encounter with kefir \u2014 texture, tartness, fizz, aroma = a unique sensory experience. The old key 'iii / iv' did not accept i." },
      18: { status: "verified", key: "vi", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Section E: other uses in cooking = culinary applications." },
      19: { status: "verified", key: "ix", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Section F: from babushkas to LA health-food celebrity = image makeover." },
      20: { status: "verified", key: "ii", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Section G: return to unadulterated kefir-making = getting back to basics." },
      25: { status: "verified", key: "C / E", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Kefir replaces starter yeast (D), buttermilk (B) and cow's milk (A); it only accompanies sour cream (C) and is combined with yoghurt (E). Same as Test 2 Q12-13." },
      26: { status: "verified", key: "C / E", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Choose-TWO group with Q25." },
      32: { status: "verified", key: "C", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). 'when we are diligently focused, our attention tends to be towards the details\u2026 less likely to make those vital associations' \u2192 C." },
      33: { status: "verified", key: "D", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). 'smart companies\u2026 encouraging staff to take time out\u2026 day-dreaming' \u2192 so they can increase the possibility of finding answers (D)." },
    },
  },
  ielts7: {
    listening: {
      11: { status: "verified", key: "B / E", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Checkbox choose-TWO: shared key." },
      12: { status: "verified", key: "B / E", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Group with Q11." },
      13: { status: "verified", key: "B / C", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Checkbox choose-TWO: shared key." },
      14: { status: "verified", key: "B / C", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Group with Q13." },
    },
  },
  ielts8: {
    listening: {
      31: { status: "verified", key: "B / C", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Checkbox choose-TWO: shared key." },
      32: { status: "verified", key: "B / C", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Group with Q31." },
    },
    reading: {
      20: { status: "verified", key: "B / E", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Choose-TWO: shared key." },
      21: { status: "verified", key: "B / E", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Group with Q20." },
      22: { status: "verified", key: "D / E", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Choose-TWO: shared key." },
      23: { status: "verified", key: "D / E", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Group with Q22." },
      33: { status: "verified", key: "A / B", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Choose-TWO: shared key." },
      34: { status: "verified", key: "A / B", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Group with Q33." },
      35: { status: "verified", key: "B / C", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Choose-TWO: shared key." },
      36: { status: "verified", key: "B / C", evidence: "Approved by the site administrator on 2026-11-26 (content audit, docs/CONTENT-AUDIT-2026-11-26.md). Group with Q35." },
    },
  },
};
for (const [t, secs] of Object.entries(AUDIT_2026_11_26)) {
  ANSWER_KEY_VERIFICATION[t] = ANSWER_KEY_VERIFICATION[t] || {};
  for (const [sec, qs] of Object.entries(secs)) ANSWER_KEY_VERIFICATION[t][sec] = { ...(ANSWER_KEY_VERIFICATION[t][sec] || {}), ...qs };
}
