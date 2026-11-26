// Question versions for items whose wording or options were materially revised.
//
// An attempt submitted before `revisedAt` saw version 1 and is marked with version 1's historical
// policy; later attempts see version 2 (the current content and answer key). Question analytics keeps the
// versions apart. Corrections that only fixed a wrong key with unchanged wording (category A) are not
// versioned: the corrected key applies to every attempt.
//
// historicalKey is the marking policy for version-1 attempts, approved by the site administrator:
// an ambiguous original question credits every defensible answer.

export const QUESTION_REVISIONS_AT = "2026-11-25T16:46:30Z";

// Test 5 Reading was replaced on 8 Apr 2026 (commit cc779ed): new headings lists, options and questions.
// Attempts before the cut-over keep the keys they were marked with (the double keys accepted the old
// heading number first, the new one second); later attempts use the corrected keys (content audit, 26 Nov 2026).
export const TEST5_READING_REPLACED_AT = "2026-04-08T08:05:00Z";

export const QUESTION_VERSIONS = {
  ielts5: {
    reading: {
      1: {
        approvedBy: "site administrator",
        reason: "Test 5 Reading was replaced on 8 Apr 2026 (new headings lists and questions). The old double key accepted the old heading number; for current attempts it wrongly credited it, and Q17 did not accept the correct heading.",
        revisedAt: TEST5_READING_REPLACED_AT,
        v1: { text: "Matching headings, list in use before 8 Apr 2026", options: {"i": "Flexible teaching within a national framework", "ii": "Professional respect in the wider community", "iii": "Early links between education and national ambition", "iv": "Practical support for pupils with difficulties", "v": "An overview of a high-performing system", "vi": "Selective entry into teacher education", "vii": "A tradition of strict school ranking", "viii": "Educational reform as economic strategy"}, key: "v / vi", historicalKey: "v / vi", historicalPolicy: "Marked as before the replacement." },
        v2: { text: "Matching headings, current list", key: "vi" },
      },
      2: {
        approvedBy: "site administrator",
        reason: "Test 5 Reading was replaced on 8 Apr 2026 (new headings lists and questions). The old double key accepted the old heading number; for current attempts it wrongly credited it, and Q17 did not accept the correct heading.",
        revisedAt: TEST5_READING_REPLACED_AT,
        v1: { text: "Matching headings, list in use before 8 Apr 2026", options: {"i": "Flexible teaching within a national framework", "ii": "Professional respect in the wider community", "iii": "Early links between education and national ambition", "iv": "Practical support for pupils with difficulties", "v": "An overview of a high-performing system", "vi": "Selective entry into teacher education", "vii": "A tradition of strict school ranking", "viii": "Educational reform as economic strategy"}, key: "viii / vii", historicalKey: "viii / vii", historicalPolicy: "Marked as before the replacement." },
        v2: { text: "Matching headings, current list", key: "vii" },
      },
      4: {
        approvedBy: "site administrator",
        reason: "Test 5 Reading was replaced on 8 Apr 2026 (new headings lists and questions). The old double key accepted the old heading number; for current attempts it wrongly credited it, and Q17 did not accept the correct heading.",
        revisedAt: TEST5_READING_REPLACED_AT,
        v1: { text: "Matching headings, list in use before 8 Apr 2026", options: {"i": "Flexible teaching within a national framework", "ii": "Professional respect in the wider community", "iii": "Early links between education and national ambition", "iv": "Practical support for pupils with difficulties", "v": "An overview of a high-performing system", "vi": "Selective entry into teacher education", "vii": "A tradition of strict school ranking", "viii": "Educational reform as economic strategy"}, key: "vi / iv", historicalKey: "vi / iv", historicalPolicy: "Marked as before the replacement." },
        v2: { text: "Matching headings, current list", key: "iv" },
      },
      5: {
        approvedBy: "site administrator",
        reason: "Test 5 Reading was replaced on 8 Apr 2026 (new headings lists and questions). The old double key accepted the old heading number; for current attempts it wrongly credited it, and Q17 did not accept the correct heading.",
        revisedAt: TEST5_READING_REPLACED_AT,
        v1: { text: "Matching headings, list in use before 8 Apr 2026", options: {"i": "Flexible teaching within a national framework", "ii": "Professional respect in the wider community", "iii": "Early links between education and national ambition", "iv": "Practical support for pupils with difficulties", "v": "An overview of a high-performing system", "vi": "Selective entry into teacher education", "vii": "A tradition of strict school ranking", "viii": "Educational reform as economic strategy"}, key: "iv / viii", historicalKey: "iv / viii", historicalPolicy: "Marked as before the replacement." },
        v2: { text: "Matching headings, current list", key: "viii" },
      },
      14: {
        approvedBy: "site administrator",
        reason: "Test 5 Reading was replaced on 8 Apr 2026 (new headings lists and questions). The old double key accepted the old heading number; for current attempts it wrongly credited it, and Q17 did not accept the correct heading.",
        revisedAt: TEST5_READING_REPLACED_AT,
        v1: { text: "Matching headings, list in use before 8 Apr 2026", options: {"i": "Commercial growth and concerns about authenticity", "ii": "A drink with growing global interest", "iii": "Why some people find production surprising", "iv": "The structure of kefir grains", "v": "Scientific doubts about all health claims", "vi": "What happens during fermentation", "vii": "How the final product is often described", "viii": "Research interest in possible benefits", "ix": "An ancient method no longer used"}, key: "ii / viii", historicalKey: "ii / viii", historicalPolicy: "Marked as before the replacement." },
        v2: { text: "Matching headings, current list", key: "viii" },
      },
      15: {
        approvedBy: "site administrator",
        reason: "Test 5 Reading was replaced on 8 Apr 2026 (new headings lists and questions). The old double key accepted the old heading number; for current attempts it wrongly credited it, and Q17 did not accept the correct heading.",
        revisedAt: TEST5_READING_REPLACED_AT,
        v1: { text: "Matching headings, list in use before 8 Apr 2026", options: {"i": "Commercial growth and concerns about authenticity", "ii": "A drink with growing global interest", "iii": "Why some people find production surprising", "iv": "The structure of kefir grains", "v": "Scientific doubts about all health claims", "vi": "What happens during fermentation", "vii": "How the final product is often described", "viii": "Research interest in possible benefits", "ix": "An ancient method no longer used"}, key: "iv / iii", historicalKey: "iv / iii", historicalPolicy: "Marked as before the replacement." },
        v2: { text: "Matching headings, current list", key: "iii" },
      },
      16: {
        approvedBy: "site administrator",
        reason: "Test 5 Reading was replaced on 8 Apr 2026 (new headings lists and questions). The old double key accepted the old heading number; for current attempts it wrongly credited it, and Q17 did not accept the correct heading.",
        revisedAt: TEST5_READING_REPLACED_AT,
        v1: { text: "Matching headings, list in use before 8 Apr 2026", options: {"i": "Commercial growth and concerns about authenticity", "ii": "A drink with growing global interest", "iii": "Why some people find production surprising", "iv": "The structure of kefir grains", "v": "Scientific doubts about all health claims", "vi": "What happens during fermentation", "vii": "How the final product is often described", "viii": "Research interest in possible benefits", "ix": "An ancient method no longer used"}, key: "vi / vii", historicalKey: "vi / vii", historicalPolicy: "Marked as before the replacement." },
        v2: { text: "Matching headings, current list", key: "vii" },
      },
      17: {
        approvedBy: "site administrator",
        reason: "Test 5 Reading was replaced on 8 Apr 2026 (new headings lists and questions). The old double key accepted the old heading number; for current attempts it wrongly credited it, and Q17 did not accept the correct heading.",
        revisedAt: TEST5_READING_REPLACED_AT,
        v1: { text: "Matching headings, list in use before 8 Apr 2026", options: {"i": "Commercial growth and concerns about authenticity", "ii": "A drink with growing global interest", "iii": "Why some people find production surprising", "iv": "The structure of kefir grains", "v": "Scientific doubts about all health claims", "vi": "What happens during fermentation", "vii": "How the final product is often described", "viii": "Research interest in possible benefits", "ix": "An ancient method no longer used"}, key: "iii / iv", historicalKey: "iii / iv", historicalPolicy: "Marked as before the replacement." },
        v2: { text: "Matching headings, current list", key: "i" },
      },
      18: {
        approvedBy: "site administrator",
        reason: "Test 5 Reading was replaced on 8 Apr 2026 (new headings lists and questions). The old double key accepted the old heading number; for current attempts it wrongly credited it, and Q17 did not accept the correct heading.",
        revisedAt: TEST5_READING_REPLACED_AT,
        v1: { text: "Matching headings, list in use before 8 Apr 2026", options: {"i": "Commercial growth and concerns about authenticity", "ii": "A drink with growing global interest", "iii": "Why some people find production surprising", "iv": "The structure of kefir grains", "v": "Scientific doubts about all health claims", "vi": "What happens during fermentation", "vii": "How the final product is often described", "viii": "Research interest in possible benefits", "ix": "An ancient method no longer used"}, key: "vii / vi", historicalKey: "vii / vi", historicalPolicy: "Marked as before the replacement." },
        v2: { text: "Matching headings, current list", key: "vi" },
      },
      19: {
        approvedBy: "site administrator",
        reason: "Test 5 Reading was replaced on 8 Apr 2026 (new headings lists and questions). The old double key accepted the old heading number; for current attempts it wrongly credited it, and Q17 did not accept the correct heading.",
        revisedAt: TEST5_READING_REPLACED_AT,
        v1: { text: "Matching headings, list in use before 8 Apr 2026", options: {"i": "Commercial growth and concerns about authenticity", "ii": "A drink with growing global interest", "iii": "Why some people find production surprising", "iv": "The structure of kefir grains", "v": "Scientific doubts about all health claims", "vi": "What happens during fermentation", "vii": "How the final product is often described", "viii": "Research interest in possible benefits", "ix": "An ancient method no longer used"}, key: "viii / ix", historicalKey: "viii / ix", historicalPolicy: "Marked as before the replacement." },
        v2: { text: "Matching headings, current list", key: "ix" },
      },
      20: {
        approvedBy: "site administrator",
        reason: "Test 5 Reading was replaced on 8 Apr 2026 (new headings lists and questions). The old double key accepted the old heading number; for current attempts it wrongly credited it, and Q17 did not accept the correct heading.",
        revisedAt: TEST5_READING_REPLACED_AT,
        v1: { text: "Matching headings, list in use before 8 Apr 2026", options: {"i": "Commercial growth and concerns about authenticity", "ii": "A drink with growing global interest", "iii": "Why some people find production surprising", "iv": "The structure of kefir grains", "v": "Scientific doubts about all health claims", "vi": "What happens during fermentation", "vii": "How the final product is often described", "viii": "Research interest in possible benefits", "ix": "An ancient method no longer used"}, key: "i / ii", historicalKey: "i / ii", historicalPolicy: "Marked as before the replacement." },
        v2: { text: "Matching headings, current list", key: "ii" },
      },
      25: {
        approvedBy: "site administrator",
        reason: "Test 5 Reading was replaced on 8 Apr 2026. Current question: products NOT mentioned as kefir replacements = C and E (B, buttermilk, is a stated substitute).",
        revisedAt: TEST5_READING_REPLACED_AT,
        group: [25, 26],
        v1: { text: "Which TWO statements are true of kefir? (version before 8 Apr 2026)", options: {"A": "Kefir is traditionally made with living grains.", "B": "All claimed health benefits of kefir have been scientifically proven.", "C": "Industrial production may reduce complexity.", "D": "Kefir has become more popular internationally.", "E": "Plant-based versions are now impossible to produce."}, key: "B / C", historicalKey: "B / C", historicalPolicy: "Marked as before the replacement." },
        v2: { text: "Which TWO products are NOT mentioned as things which kefir can replace?", key: "C / E" },
      },
      26: {
        approvedBy: "site administrator",
        reason: "Choose-TWO group with Q25.",
        revisedAt: TEST5_READING_REPLACED_AT,
        v1: { text: "Second answer of Q25-26 (version before 8 Apr 2026)", options: {"A": "Kefir is traditionally made with living grains.", "B": "All claimed health benefits of kefir have been scientifically proven.", "C": "Industrial production may reduce complexity.", "D": "Kefir has become more popular internationally.", "E": "Plant-based versions are now impossible to produce."}, key: "E", historicalKey: "E", historicalPolicy: "Marked as before the replacement." },
        v2: { text: "Second answer of Q25-26", key: "C / E" },
      },
      32: {
        approvedBy: "site administrator",
        reason: "Test 5 Reading was replaced on 8 Apr 2026. Current question: focused attention blocks associations → C only.",
        revisedAt: TEST5_READING_REPLACED_AT,
        v1: { text: "The Swiffer case suggests innovation often succeeds when", key: "D / C", historicalKey: "D / C", historicalPolicy: "Marked as before the replacement." },
        v2: { text: "Mental connections are much harder to make", key: "C" },
      },
      33: {
        approvedBy: "site administrator",
        reason: "Test 5 Reading was replaced on 8 Apr 2026. Current question: companies give time out to help find answers → D only.",
        revisedAt: TEST5_READING_REPLACED_AT,
        v1: { text: "One criticism of disposable systems is that", key: "E / D", historicalKey: "E / D", historicalPolicy: "Marked as before the replacement." },
        v2: { text: "Some companies require their employees to stop working", key: "D" },
      },
    },
  },
  ielts11: {
    reading: {
      20: {
        approvedBy: "site administrator",
        reason: "Original wording was satisfied by paragraph C (increased infertility) and paragraph D (interference with breeding pools).",
        revisedAt: QUESTION_REVISIONS_AT,
        v1: { text: "Negative effect on breeding in marine organisms.", key: "C", historicalKey: "C / D", historicalPolicy: "Credit C or D: both paragraphs satisfy the original wording." },
        v2: { text: "Reduced reproductive ability in marine organisms caused by chemical pollutants.", key: "C" },
      },
    },
  },
  ielts17: {
    reading: {
      19: {
        approvedBy: "site administrator",
        reason: "The passage places the seals on flat islets that resemble MacLeod's Tables but does not rule out the Tables themselves.",
        revisedAt: QUESTION_REVISIONS_AT,
        v1: { text: "Grey and common seals live on the flat-topped hills known as MacLeod’s Tables.", key: "NOT GIVEN", historicalKey: "FALSE / NOT GIVEN", historicalPolicy: "Credit FALSE or NOT GIVEN; TRUE stays wrong." },
        v2: { text: "The flat islets where grey and common seals have their bases are known as MacLeod’s Tables.", key: "FALSE" },
      },
    },
  },
  ielts12: {
    reading: {
      10: {
        approvedBy: "site administrator",
        reason: "Original option A ('first appearance in communications … twentieth century') could be read as electronic communication.",
        revisedAt: QUESTION_REVISIONS_AT,
        group: [10, 11],
        v1: {
          text: "Which TWO statements are true of the 'at' sign (@)?",
          options: { A: "Its first appearance in communications came in the twentieth century.", D: "The development of the 'at sign' has received less attention than its social media partner, the hashtag." },
          key: "A / E",
          historicalKey: "A / C / E",
          historicalPolicy: "Choose-TWO over A, C and E: any two different letters from A, C, E score; each letter once.",
        },
        v2: {
          text: "Which TWO statements are true of the 'at' sign (@)?",
          options: { A: "Its earliest recorded use in written documents dates back to the twentieth century.", D: "The development of the 'at' sign has received less attention than its social media partner, the hashtag." },
          key: "C / E",
        },
      },
      11: { sameAs: 10 },
      27: {
        approvedBy: "site administrator",
        reason: "The original statement asserted imminent catastrophic effects, removing the author's uncertainty ('seemingly looming crisis').",
        revisedAt: QUESTION_REVISIONS_AT,
        v1: { text: "The catastrophic effects of running out of sand are close to happening.", key: "YES", historicalKey: "YES / NOT GIVEN", historicalPolicy: "Proposed: credit YES or NOT GIVEN; NO stays wrong. Needs administrator approval." },
        v2: { text: "The author suggests that humanity may be approaching a crisis concerning the availability of sand.", key: "YES" },
      },
      36: {
        approvedBy: "site administrator",
        reason: "The original statement added a causal link ('because everything is so new') that the passage does not state.",
        revisedAt: QUESTION_REVISIONS_AT,
        v1: { text: "Expatriates feel a sense of isolation in new countries because everything is so new.", key: "NOT GIVEN", historicalKey: "NOT GIVEN", historicalPolicy: "NOT GIVEN (the cause is not stated). The revised answer NO is not applied to the old wording." },
        v2: { text: "Feelings of loneliness and homesickness generally emerge during the honeymoon period rather than the subsequent negotiation period.", key: "NO" },
      },
    },
  },
};

function entryFor(testId, section, q) {
  const s = QUESTION_VERSIONS?.[String(testId || "").toLowerCase()]?.[String(section || "").toLowerCase()];
  if (!s) return null;
  const e = s[Number(q)];
  if (!e) return null;
  return e.sameAs ? s[e.sameAs] : e;
}

// Which version an attempt saw. No timestamp → the current version.
export function questionVersionFor(testId, section, q, submittedAt) {
  const e = entryFor(testId, section, q);
  if (!e) return null;
  const t = Date.parse(String(submittedAt || ""));
  return Number.isFinite(t) && t < Date.parse(e.revisedAt) ? 1 : 2;
}

// Replaces keys of version-1 attempts with their historical policy. Current keys stay for version 2.
export function applyQuestionVersionKeys(testId, section, answerMap, submittedAt) {
  const out = { ...answerMap };
  const s = QUESTION_VERSIONS?.[String(testId || "").toLowerCase()]?.[String(section || "").toLowerCase()];
  if (!s) return out;
  Object.keys(s).forEach((q) => {
    if (questionVersionFor(testId, section, q, submittedAt) === 1) out[Number(q)] = entryFor(testId, section, q).v1.historicalKey;
  });
  return out;
}

export function getQuestionVersionInfo(testId, section, q) {
  return entryFor(testId, section, q);
}
