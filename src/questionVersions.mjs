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

export const QUESTION_VERSIONS = {
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
