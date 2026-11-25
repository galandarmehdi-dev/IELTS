// The one marking engine for Listening and Reading answers.
//
// Used by every Worker path (full mocks, practice, analytics, recounts, key fixes) and copied into the
// Apps Script by scripts/build-appsscript-grading.mjs, so the sheet marks exactly the same way.
//
// Answer-key syntax (unchanged from the AnswerKey sheet):
//   "a / b"          either alternative is correct (top-level slash)
//   "(two) sledges"  optional word(s): "sledges" or "two sledges"
//   "disease(s)"     optional ending attached to a word: "disease" or "diseases"
//   "(a/b) c"        optional alternatives: "c", "a c" or "b c"
//   Consecutive questions sharing one multi-letter key such as "C/E" are a choose-TWO/THREE group
//   (see alignGroupedAnswerMap).
//
// Only deterministic formatting differences are forgiven — never spelling, word form, synonyms or
// missing/extra words:
//   * letter case, extra spaces, invisible characters, non-breaking spaces, curly quotes/dashes, accents
//   * hyphen vs space ("long-term" = "long term"), "&" = "and", "%" = "per cent" = "percent"
//   * a trailing full stop, dots in abbreviations ("a.m." = "am")
//   * number words vs digits ("ten" = "10", "twentieth" = "20th"), thousands separators ("1,500" = "1500")
//   * date order and ordinal endings ("2 July" = "2nd July" = "July 2" = "the 2nd of July")
//   * times with am/pm ("2 pm" = "2 p.m." = "2.00 PM"; "8:55 am" = "8.55 am")
//   * numeric value when the key is a plain number ("1.80" = "1.8"), and "8.55" = "8:55" when the key is a time

const INVISIBLE_RE = /[\u200B-\u200D\u2060\uFEFF\u00AD]/g;
const SPACE_RE = /[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000\t\r\n]/g;

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const MONTH_RE = MONTHS.join("|");

const SMALL_NUMBERS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
const ORDINAL_WORDS = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
  eleventh: 11, twelfth: 12, thirteenth: 13, fourteenth: 14, fifteenth: 15, sixteenth: 16, seventeenth: 17,
  eighteenth: 18, nineteenth: 19, twentieth: 20, thirtieth: 30, fortieth: 40, fiftieth: 50, sixtieth: 60,
  seventieth: 70, eightieth: 80, ninetieth: 90, hundredth: 100,
};

function ordinalSuffix(n) {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  return ({ 1: "st", 2: "nd", 3: "rd" })[n % 10] || "th";
}

// Unicode and whitespace clean-up, lower-cased. Keeps every meaningful character.
export function cleanAnswerText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // accents: café = cafe
    .normalize("NFKC")
    .replace(INVISIBLE_RE, "")
    .replace(SPACE_RE, " ")
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u0060\u00B4]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"')
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\u0131/g, "i") // Turkish/Azerbaijani dotless i (capital \u0130 loses its dot above)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Replaces runs of number words with digits: "two hundred and fifty" -> "250", "twenty-five" -> "25",
// "twentieth" -> "20th", "thirty-first" -> "31st".
function numberWordsToDigits(text) {
  const tokens = text.split(" ");
  const out = [];
  let i = 0;
  while (i < tokens.length) {
    let j = i;
    let total = 0;
    let current = 0;
    let used = false;
    let ordinal = false;
    while (j < tokens.length) {
      const tok = tokens[j];
      if (tok === "and" && used && j + 1 < tokens.length && (tokens[j + 1] in SMALL_NUMBERS || tokens[j + 1] in ORDINAL_WORDS)) { j += 1; continue; }
      if (tok in SMALL_NUMBERS) {
        const v = SMALL_NUMBERS[tok];
        // "twenty five": tens followed by a unit; two separate small numbers ("five six") end the run.
        if (used && current % 100 !== 0 && !(current % 10 === 0 && current % 100 >= 20 && v < 10)) break;
        current += v; used = true; j += 1; continue;
      }
      if (tok in ORDINAL_WORDS && !(tok === "second" && !used)) {
        const v = ORDINAL_WORDS[tok];
        if (v === 100) { current = (current || 1) * 100; } else { if (used && current % 10 !== 0) break; current += v; }
        used = true; ordinal = true; j += 1; break;
      }
      if (tok === "second" && !used) {
        // "second" alone is both an ordinal and a unit; treat it as "2nd" only before a month or after "the".
        const next = tokens[j + 1] || "";
        const prev = out[out.length - 1] || "";
        if (new RegExp(`^(of|${MONTH_RE})$`).test(next) || prev === "the") { current = 2; used = true; ordinal = true; j += 1; }
        break;
      }
      if ((tok === "hundred" || tok === "thousand") && used) {
        if (tok === "hundred") current *= 100;
        else { total += current * 1000; current = 0; }
        j += 1; continue;
      }
      break;
    }
    if (used) {
      const n = total + current;
      out.push(ordinal ? `${n}${ordinalSuffix(n)}` : String(n));
      i = j;
    } else {
      out.push(tokens[i]);
      i += 1;
    }
  }
  return out.join(" ");
}

// The comparison form of an answer. Both the student's answer and every key variant go through it.
export function canonicalAnswer(value) {
  let s = cleanAnswerText(value);
  if (!s) return "";
  s = s
    .replace(/^["']+|["']+$/g, "")                 // wrapping quotes
    .replace(/[.,;:!?]+$/g, "")                     // trailing punctuation
    .replace(/\b([a-z])\.(?=[a-z]\b|[a-z]\.|\s|$)/g, "$1")  // dots in abbreviations: a.m. -> am, U.K. -> uk
    .replace(/&/g, " and ")
    .replace(/(\d)\s*%/g, "$1 percent")
    .replace(/\bper\s*cent\b/g, "percent")
    .replace(/-/g, " ")                              // hyphen = space
    .replace(/\s+/g, " ")
    .trim();
  // Thousands separators: 1,500 -> 1500 (only real groups of three digits).
  for (let k = 0; k < 3; k += 1) s = s.replace(/(\d),(\d{3})(?!\d)/g, "$1$2");
  s = numberWordsToDigits(s);
  // Times with am/pm: "2 pm", "2.00pm", "2:00 p m" -> "2:00 pm".
  s = s.replace(/\b(\d{1,2})(?:[.:\s](\d{2}))?\s*(a|p)\s?m\b/g, (_, h, m, ap) => `${Number(h)}:${m || "00"} ${ap}m`);
  // Dates: "the 2nd of july", "july 2nd", "2nd july" -> "2 july".
  s = s.replace(new RegExp(`\\b(?:the )?(\\d{1,2})(?:st|nd|rd|th)?(?: of)? (${MONTH_RE})\\b`, "g"), (_, d, mo) => `${Number(d)} ${mo}`);
  s = s.replace(new RegExp(`\\b(${MONTH_RE}) (?:the )?(\\d{1,2})(?:st|nd|rd|th)?\\b(?!\\d)`, "g"), (_, mo, d) => `${Number(d)} ${mo}`);
  return s.replace(/\s+/g, " ").trim();
}

// Splits a key on top-level "/" (not inside parentheses). A key that is only a date or fraction such as
// "30/10" or "3/4" is one answer, but "7.30/7:30" is two.
function splitTopLevelAlternatives(key) {
  if (/^\s*\d{1,4}\/\d{1,4}(?:\/\d{2,4})?\s*$/.test(key)) return [key.trim()];
  const parts = [];
  let depth = 0;
  let current = "";
  for (let i = 0; i < key.length; i += 1) {
    const ch = key[i];
    if (ch === "(") depth += 1;
    if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === "/" && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  parts.push(current);
  return parts.map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
}

// Expands optional parts. "disease(s)" -> disease, diseases; "(certain) disease" -> disease, certain disease.
function expandOptionalParts(text) {
  let variants = [text];
  for (let guard = 0; guard < 8; guard += 1) {
    let changed = false;
    const next = [];
    variants.forEach((v) => {
      const m = v.match(/\(([^()]*)\)/);
      if (!m) { next.push(v); return; }
      changed = true;
      const before = v.slice(0, m.index);
      const after = v.slice(m.index + m[0].length);
      const attachedLeft = /[A-Za-z0-9]$/.test(before);   // word(s): an ending glued to the word
      const attachedRight = /^[A-Za-z0-9]/.test(after);   // (re)form: a prefix glued to the word
      const glue = (alt) => {
        const left = attachedLeft ? before : before.replace(/\s*$/, " ");
        const right = attachedRight ? after : after.replace(/^\s*/, " ");
        return `${left}${alt}${right}`;
      };
      next.push(`${before}${attachedLeft || attachedRight ? "" : " "}${after}`);
      m[1].split("/").map((x) => x.trim()).filter(Boolean).forEach((alt) => next.push(glue(alt)));
    });
    variants = Array.from(new Set(next.map((x) => x.replace(/\s+/g, " ").trim()).filter(Boolean)));
    if (!changed) break;
  }
  return variants;
}

// Every accepted form of a key, in canonical form.
export function acceptedAnswers(key) {
  const raw = String(key ?? "").replace(INVISIBLE_RE, "").replace(SPACE_RE, " ").trim();
  if (!raw || /^[-\u2013\u2014]$/.test(raw)) return [];
  const out = new Set();
  splitTopLevelAlternatives(raw).forEach((alt) => {
    expandOptionalParts(alt).forEach((variant) => {
      const c = canonicalAnswer(variant);
      if (c) out.add(c);
    });
  });
  return Array.from(out);
}

const PLAIN_NUMBER_RE = /^\d+(?:\.\d+)?$/;
const BARE_TIME_RE = /^(\d{1,2})[.:](\d{2})$/;

// Is the student's answer correct for this key? This is the only answer comparison in the platform.
export function isAnswerCorrect(studentValue, key) {
  const student = canonicalAnswer(studentValue);
  if (!student) return false;
  const accepted = acceptedAnswers(key);
  if (!accepted.length) return false;
  if (accepted.includes(student)) return true;
  const keyIsTime = accepted.some((a) => /\d:\d{2}/.test(a) || /\b[ap]m\b/.test(a));
  // "8.55" = "8:55" when the key is a time.
  const st = student.match(BARE_TIME_RE);
  if (keyIsTime && st && Number(st[2]) < 60) {
    if (accepted.some((a) => { const m = a.match(BARE_TIME_RE); return m && Number(m[1]) === Number(st[1]) && m[2] === st[2]; })) return true;
  }
  // "1.80" = "1.8" when the key is a plain number (never for times, where 10.3 is not 10.30).
  if (!keyIsTime && PLAIN_NUMBER_RE.test(student)) {
    const n = Number(student);
    if (accepted.some((a) => PLAIN_NUMBER_RE.test(a) && Number(a) === n)) return true;
  }
  return false;
}

// ---------- Choose-TWO / choose-THREE groups ----------
// Consecutive questions that share one key made only of single letters ("C/E" on Q21 and Q22, "A/D/E" on
// Q25-27) form a group when the group is no larger than the number of letters. Each correct letter scores
// once, in any order, and the same letter never scores twice. A single question with "B / C" and no twin is
// not a group: either letter is accepted.

export function groupLetters(key) {
  const parts = String(key ?? "").split("/").map((x) => cleanAnswerText(x).toUpperCase()).filter(Boolean);
  if (parts.length < 2 || !parts.every((x) => /^[A-Z]$/.test(x))) return null;
  return parts;
}

// The groups in a key map: [{ questions: [21, 22], letters: ["C", "E"] }, ...].
export function findAnswerGroups(answerMap) {
  const map = answerMap && typeof answerMap === "object" ? answerMap : {};
  const qs = Object.keys(map).map(Number).filter((q) => Number.isFinite(q) && q > 0).sort((a, b) => a - b);
  const norm = (v) => (groupLetters(v) || []).slice().sort().join("/");
  const groups = [];
  let i = 0;
  while (i < qs.length) {
    const letters = groupLetters(map[qs[i]]);
    let j = i;
    if (letters) {
      while (j + 1 < qs.length && qs[j + 1] === qs[j] + 1 && norm(map[qs[j + 1]]) === norm(map[qs[i]])) j += 1;
    }
    const size = j - i + 1;
    if (letters && size >= 2 && size <= letters.length) groups.push({ questions: qs.slice(i, j + 1), letters });
    i = j + 1;
  }
  return groups;
}

// Returns a copy of the key map in which each grouped question holds the single letter it is marked
// against for this student's answers.
export function alignGroupedAnswerMap(answerMap, answers) {
  const map = answerMap && typeof answerMap === "object" ? answerMap : {};
  const out = { ...map };
  findAnswerGroups(map).forEach(({ questions, letters }) => {
    const used = new Set();
    const pending = [];
    questions.forEach((q) => {
      const st = cleanAnswerText(answers?.[q] ?? answers?.[String(q)] ?? "").toUpperCase();
      if (letters.includes(st) && !used.has(st)) { used.add(st); out[q] = st; } else pending.push(q);
    });
    const spare = letters.filter((l) => !used.has(l));
    pending.forEach((q, idx) => { out[q] = spare[idx] || spare[spare.length - 1] || ""; });
  });
  return out;
}

// Marks a whole section: { total, marks: { q: true|false }, blank: { q: true } }.
export function markSection(answerMap, answers, overrides = {}) {
  const aligned = alignGroupedAnswerMap(answerMap, answers);
  const marks = {};
  const blank = {};
  let total = 0;
  Object.keys(answerMap || {}).map(Number).filter((q) => q > 0).forEach((q) => {
    const student = answers?.[q] ?? answers?.[String(q)] ?? "";
    if (!cleanAnswerText(student)) blank[q] = true;
    const override = overrides?.[q] ?? overrides?.[String(q)];
    const ok = typeof override === "boolean" ? override : isAnswerCorrect(student, aligned[q]);
    marks[q] = ok;
    if (ok) total += 1;
  });
  return { total, marks, blank };
}

// ---------- Answer-key validation (imports and audits) ----------
// Returns [{ q, level: "error" | "warning", message }].
export function validateAnswerKeyMap(answerMap, { expectedCount = 40 } = {}) {
  const issues = [];
  const map = answerMap && typeof answerMap === "object" ? answerMap : {};
  const qs = Object.keys(map).map(Number).filter((q) => Number.isFinite(q)).sort((a, b) => a - b);
  for (let q = 1; q <= expectedCount; q += 1) {
    if (!qs.includes(q)) issues.push({ q, level: "error", message: "No answer key." });
  }
  qs.filter((q) => q < 1 || q > expectedCount).forEach((q) => issues.push({ q, level: "error", message: `Question number outside 1-${expectedCount}.` }));
  qs.forEach((q) => {
    const raw = String(map[q] ?? "");
    if (!raw.trim() || /^[-\u2013\u2014]$/.test(raw.trim())) { issues.push({ q, level: "error", message: "Answer key is empty." }); return; }
    if (INVISIBLE_RE.test(raw)) issues.push({ q, level: "warning", message: "Contains invisible characters." });
    INVISIBLE_RE.lastIndex = 0;
    if (/[\t\r\n]/.test(raw) || /\s{2,}/.test(raw) || raw !== raw.trim()) issues.push({ q, level: "warning", message: "Contains stray spaces or tabs." });
    const opens = (raw.match(/\(/g) || []).length;
    const closes = (raw.match(/\)/g) || []).length;
    if (opens !== closes) issues.push({ q, level: "error", message: "Unbalanced brackets." });
    if (/[[\]{}]/.test(raw)) issues.push({ q, level: "warning", message: "Square/curly brackets are not optional-word syntax; use ( )." });
    if (/\/\s*\/|^\s*\/|\/\s*$/.test(raw)) issues.push({ q, level: "error", message: "Empty alternative between slashes." });
    const alts = acceptedAnswers(raw);
    if (!alts.length) issues.push({ q, level: "error", message: "No usable answer after parsing." });
    const parts = splitTopLevelAlternatives(raw).map((p) => canonicalAnswer(p));
    if (new Set(parts).size !== parts.length) issues.push({ q, level: "warning", message: "Duplicate alternatives." });
    const tf = parts.filter((p) => ["true", "false", "not given", "yes", "no"].includes(p));
    if (tf.length > 1 && new Set(tf.map((p) => ({ yes: "true", no: "false" })[p] || p)).size > 1) {
      issues.push({ q, level: "warning", message: "Alternatives contradict each other (e.g. TRUE and FALSE)." });
    }
  });
  // A letter key repeated on consecutive questions that is not a valid group (more questions than letters).
  for (let k = 0; k < qs.length; k += 1) {
    const letters = groupLetters(map[qs[k]]);
    if (!letters) continue;
    let j = k;
    while (j + 1 < qs.length && qs[j + 1] === qs[j] + 1 && String(map[qs[j + 1]]).replace(/\s/g, "").toUpperCase() === String(map[qs[k]]).replace(/\s/g, "").toUpperCase()) j += 1;
    const size = j - k + 1;
    if (size > letters.length) issues.push({ q: qs[k], level: "error", message: `Group of ${size} questions shares only ${letters.length} letters.` });
    if (size === 1) issues.push({ q: qs[k], level: "warning", message: `"${map[qs[k]]}" on a single question accepts any of these letters. If this is a choose-${letters.length === 2 ? "TWO" : "THREE"} item, put the same key on every question of the group.` });
    k = j;
  }
  return issues;
}
