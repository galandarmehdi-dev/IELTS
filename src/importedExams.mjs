const CACHE_TTL_MS = 60 * 1000;
const published = { at: 0, byId: new Map() };

export const IMPORTED_ID_PREFIX = "imp-";

export function invalidateImportedExamCache() {
  published.at = 0;
}

export function isImportedTestId(testId) {
  return String(testId || "").toLowerCase().startsWith(IMPORTED_ID_PREFIX);
}

export function sanitizeImportedHtml(value) {
  let html = String(value ?? "");
  html = html.replace(/<!--[\s\S]*?-->/g, "");
  html = html.replace(/<\s*(script|style|iframe|object|embed|link|meta|base|form)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
  html = html.replace(/<\s*(script|style|iframe|object|embed|link|meta|base|form)\b[^>]*>/gi, "");
  html = html.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  html = html.replace(/\s(href|src|xlink:href|action|formaction)\s*=\s*("|')?\s*(javascript|vbscript|data:text\/html)[^"'>\s]*("|')?/gi, "");
  return html;
}

export function sanitizeImportedContent(value) {
  if (typeof value === "string") return sanitizeImportedHtml(value);
  if (Array.isArray(value)) return value.map(sanitizeImportedContent);
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, child] of Object.entries(value)) out[key] = sanitizeImportedContent(child);
    return out;
  }
  return value;
}

export function normalizeAnswerKeys(input) {
  const out = {};
  if (!input || typeof input !== "object") return out;
  for (const [key, raw] of Object.entries(input)) {
    const q = Number(key);
    if (!Number.isInteger(q) || q < 1 || q > 80) continue;
    const text = String(raw ?? "").trim();
    if (text) out[String(q)] = text;
  }
  return out;
}

export function normalizeFullAnswerKeys(input) {
  return { listening: normalizeAnswerKeys(input?.listening), reading: normalizeAnswerKeys(input?.reading) };
}

export function makeImportedTestId(skill, title, sourceHash) {
  const slug = String(title || "exam")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${IMPORTED_ID_PREFIX}${skill}-${slug || "exam"}-${String(sourceHash || "").slice(0, 8)}`;
}

// Returns blocking errors (cannot publish) and warnings (publishable, review advised).
function validateFullExam(exam) {
  const errors = [];
  const warnings = [];
  if (!String(exam?.title || "").trim()) errors.push("Title is required.");
  let answerCount = 0;
  ["listening", "reading"].forEach((skill) => {
    const label = skill === "listening" ? "Listening" : "Reading";
    const sub = validateImportedExam({ skill, title: exam?.title || "x", content: { [skill]: exam?.content?.[skill] }, answerKeys: exam?.answerKeys?.[skill], expectedQuestions: exam?.expectedQuestions });
    sub.errors.forEach((e) => errors.push(`${label}: ${e}`));
    sub.warnings.forEach((w) => warnings.push(`${label}: ${w}`));
    answerCount += sub.answerCount;
  });
  const writing = exam?.content?.writing;
  if (!writing || !String(writing.task1Html || "").trim() || !String(writing.task2Html || "").trim()) errors.push("Writing: both Task 1 and Task 2 are required.");
  else if (writing.task1ImageSrc && !/^(https:\/\/|\/media\/)/.test(String(writing.task1ImageSrc))) errors.push("Writing: the Task 1 image has no usable URL. Upload it before publishing.");
  return { ok: errors.length === 0, errors, warnings, answerCount };
}

export function validateImportedExam(exam) {
  if (exam?.skill === "full") return validateFullExam(exam);
  const errors = [];
  const warnings = [];
  const skill = String(exam?.skill || "");
  if (!["reading", "listening"].includes(skill)) errors.push("Skill must be reading, listening or full.");
  if (!String(exam?.title || "").trim()) errors.push("Title is required.");
  const content = exam?.content && typeof exam.content === "object" ? exam.content : null;
  const section = content?.[skill];
  if (!section || typeof section !== "object") errors.push(`Missing content.${skill}.`);

  const keys = normalizeAnswerKeys(exam?.answerKeys);
  const count = Object.keys(keys).length;
  const expected = Number(exam?.expectedQuestions) || 40;
  if (count === 0) errors.push("No answer keys were extracted.");
  else if (count !== expected) warnings.push(`Expected ${expected} answers but found ${count}.`);
  for (let q = 1; q <= expected; q += 1) {
    if (!keys[String(q)]) warnings.push(`Question ${q} has no answer key.`);
  }

  if (skill === "listening") {
    const audio = String(section?.audioSrc || "").trim();
    if (!audio) errors.push("Listening exam has no audio. Upload or link the recording.");
    else if (!/^(https:\/\/|\/)/i.test(audio)) errors.push("Audio source must be an https:// or site-relative URL.");
  }
  const flat = JSON.stringify(content || {});
  const badImage = flat.match(/"imageSrc":"(?!https:\/\/|\/media\/)[^"]*"/) || flat.match(/<img [^>]*?src=\\"(?!https:\/\/|\/media\/)[^"\\]*\\"/);
  if (badImage) errors.push("An image has no usable URL. Upload it before publishing.");
  if (skill === "reading" && Array.isArray(section?.parts) && section.parts.length !== 3) {
    warnings.push(`Reading exam has ${section.parts.length} passages (expected 3).`);
  }
  return { ok: errors.length === 0, errors, warnings, answerCount: count };
}

async function refresh(env, serviceRequest) {
  if (Date.now() - published.at < CACHE_TTL_MS) return;
  const res = await serviceRequest(env, "/rest/v1/imported_exams", {
    query: { select: "test_id,skill,content,answer_keys,organization_id,validation", status: "eq.published", limit: "1000" },
  });
  if (!res.ok) {
    published.at = Date.now();
    return;
  }
  const next = new Map();
  for (const row of Array.isArray(res.data) ? res.data : []) {
    next.set(String(row.test_id).toLowerCase(), row);
  }
  published.byId = next;
  published.at = Date.now();
}

export async function hydrateImportedExams(env, serviceRequest) {
  try {
    await refresh(env, serviceRequest);
  } catch {
    // Imported exams are optional; never break the request path.
  }
}

// Imported exams are numbered after the built-in tests (built-in 1-23, then 24, 25, ...).
// The number lives in validation.testNumber and decides the exam id and the Answer Key sheet columns.
export function getImportedTestNumber(row) {
  const n = Number(row?.validation?.testNumber);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function getPublishedImportedExamByNumber(testNumber) {
  const wanted = Number(testNumber);
  for (const row of published.byId.values()) {
    if (getImportedTestNumber(row) === wanted) return row;
  }
  return null;
}

export function getPublishedImportedExam(testId) {
  return published.byId.get(String(testId || "").toLowerCase()) || null;
}

export function getImportedAnswerMap(testId, skill) {
  const row = getPublishedImportedExam(testId);
  const wanted = String(skill || "").toLowerCase();
  if (!row || (row.skill !== wanted && row.skill !== "full")) return null;
  const source = row.skill === "full" ? row.answer_keys?.[wanted] : row.answer_keys;
  if (!source) return null;
  const map = {};
  for (const [key, value] of Object.entries(source)) {
    const q = Number(key);
    const text = String(value || "").trim();
    if (Number.isFinite(q) && q > 0 && text) map[q] = text;
  }
  return map;
}
