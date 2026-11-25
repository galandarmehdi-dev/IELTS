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
      20: { status: "disputed", evidence: "Para C 'increased infertility' vs para D 'breeding pools'; original key D, sheet key C; letters may repeat." },
    },
    listening: {
      2: { status: "disputed", evidence: "Key changed by the June 2026 sheet sync without verification (R16 GH7 → RI6 GH7); needs the recording." },
      3: { status: "disputed", evidence: "Key changed by the June 2026 sheet sync without verification (07754 → 07754897432); needs the recording." },
    },
  },
  ielts12: {
    reading: {
      10: { status: "disputed", evidence: "Choose-TWO on the @ sign: original key C/E, sheet key A/E." },
      11: { status: "disputed", evidence: "Choose-TWO on the @ sign: original key C/E, sheet key A/E." },
      22: { status: "verified", evidence: "Gap already contains 'from the seabed' and needs a plural noun: 'grains' (passage: 'the water has insulated the grains')." },
      27: { status: "disputed", evidence: "'this seemingly looming crisis'; original key NO, sheet key YES." },
      36: { status: "disputed", evidence: "Original key NO, sheet key NOT GIVEN." },
    },
  },
  ielts13: {
    reading: {
      10: { status: "verified", evidence: "'making ___ responsible'; passage: 'shifting the responsibility onto the individual by encouraging their employees' → the individual / employees. Bare 'individual' is ungrammatical here." },
      14: { status: "verified", evidence: "Bristol 'approximately ten minutes behind the capital'; '100 miles apart' is not about time zones." },
      15: { status: "verified", evidence: "Passage: 'little call for exact measurements of duration'; 'measurements' alone loses the meaning." },
      5: { status: "disputed", evidence: "Key NOT GIVEN. Passage: mindfulness can 'shrink the amygdala' (fight or flight) so stress does 'not … affect us so much' — contradicts 'increase', which suggests FALSE. Needs an admin decision." },
    },
  },
  ielts17: {
    reading: {
      19: { status: "disputed", evidence: "Key NOT GIVEN. Seals' 'bases' are on 'flat islets … which mirror' MacLeod's tables, not on the hills: FALSE is arguable. TRUE is clearly wrong." },
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
  ielts3: { listening: { 6: { status: "disputed", evidence: "Key changed by the June 2026 sheet sync without verification (Maired → Mairead); needs the recording." } } },
  ielts1: {
    listening: {
      11: { status: "disputed", evidence: "Key changed by the June 2026 sheet sync without verification (c → a; Q11/13/14 shifted c,a,b → a,b,c); needs the recording." },
      13: { status: "disputed", evidence: "Key changed by the June 2026 sheet sync without verification (a → b); needs the recording." },
      14: { status: "disputed", evidence: "Key changed by the June 2026 sheet sync without verification (b → c); needs the recording." },
    },
  },
  ielts10: { listening: { 6: { status: "disputed", evidence: "Key changed by the June 2026 sheet sync without verification (b.russell64@xmail.co.uk → @mail.co.uk); needs the recording." } } },
  ielts15: { listening: { 3: { status: "disputed", evidence: "Key changed by the June 2026 sheet sync without verification (chastens → Chastons); needs the recording." } } },
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
