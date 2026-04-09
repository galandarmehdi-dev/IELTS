import { EmailMessage } from "cloudflare:email";
import { OBJECTIVE_ANSWER_KEYS } from "./objectiveAnswerKeys.mjs";
import { getProtectedTestContent } from "./protectedTestContent.mjs";

const OBJECTIVE_DETAIL_CACHE = new Map();
const OBJECTIVE_DETAIL_TTL_MS = 5 * 60 * 1000;
const ADMIN_RESULTS_SUMMARY_CACHE = new Map();
const ADMIN_RESULTS_SUMMARY_TTL_MS = 5 * 60 * 1000;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/contact") {
      return handleContactApi(request, env);
    }

    if (url.pathname === "/api/auth/shared-login") {
      return handleSharedStudentLogin(request, env);
    }

    if (url.pathname === "/api/test-content") {
      return handleProtectedTestContentApi(request);
    }

    if (url.pathname === "/api/test-asset") {
      return handleProtectedTestAssetApi(request);
    }

    if (url.pathname === "/api/admin") {
      return handleAdminApi(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

const WRITING_SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1ZTBc4uMJ3ZAA5yG7r7i4RhTz4Eo8onnzVNNJoF1m8iU/export?format=csv&gid=1669784116";
const DEFAULT_SHARED_STUDENT_PASSWORD = "Leznik123";

async function handleProtectedTestContentApi(request) {
  if (request.method !== "GET") {
    return json(405, { ok: false, error: "Method not allowed." });
  }

  const url = new URL(request.url);
  const testId = oneLine(url.searchParams.get("testId") || "").toLowerCase();
  const content = getProtectedTestContent(testId);
  if (!content) {
    return json(404, { ok: false, error: "Test content not found." });
  }

  const assetMap = buildProtectedTestAssetMap(testId, content);
  const clientContent = serializeProtectedTestContentForClient(content, testId, url.origin, assetMap);

  return json(
    200,
    {
      ok: true,
      testId,
      content: clientContent,
    },
    {
      "Cache-Control": "private, max-age=300",
    }
  );
}

async function handleProtectedTestAssetApi(request) {
  if (!["GET", "HEAD"].includes(request.method)) {
    return json(405, { ok: false, error: "Method not allowed." });
  }

  const url = new URL(request.url);
  const testId = oneLine(url.searchParams.get("testId") || "").toLowerCase();
  const assetId = oneLine(url.searchParams.get("asset") || "");
  if (!testId || !assetId) {
    return json(400, { ok: false, error: "Missing asset request parameters." });
  }

  const content = getProtectedTestContent(testId);
  if (!content) {
    return json(404, { ok: false, error: "Test content not found." });
  }

  const assetMap = buildProtectedTestAssetMap(testId, content);
  const upstreamUrl = assetMap[assetId] || "";
  if (!upstreamUrl) {
    return json(404, { ok: false, error: "Protected asset not found." });
  }

  const headers = new Headers();
  const range = request.headers.get("Range");
  if (range) headers.set("Range", range);

  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers,
  });

  const responseHeaders = new Headers();
  copyHeaderIfPresent(upstream.headers, responseHeaders, "content-type");
  copyHeaderIfPresent(upstream.headers, responseHeaders, "content-length");
  copyHeaderIfPresent(upstream.headers, responseHeaders, "content-range");
  copyHeaderIfPresent(upstream.headers, responseHeaders, "accept-ranges");
  copyHeaderIfPresent(upstream.headers, responseHeaders, "etag");
  copyHeaderIfPresent(upstream.headers, responseHeaders, "last-modified");
  responseHeaders.set("Cache-Control", "private, max-age=3600");
  return new Response(request.method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

function copyHeaderIfPresent(from, to, name) {
  const value = from.get(name);
  if (value) to.set(name, value);
}

function isProtectedAssetUrl(value) {
  const url = String(value || "").trim();
  if (!url.startsWith("https://")) return false;
  return [
    "https://audio.ieltsmock.org/",
    "https://practicepteonline.com/wp-content/uploads/",
    "https://static.wixstatic.com/",
    "https://www.ieltsbuddy.com/",
    "https://ieltscity.vn/",
  ].some((prefix) => url.startsWith(prefix));
}

function buildProtectedTestAssetMap(testId, content) {
  const urls = [];
  const seen = new Set();

  const visit = (value) => {
    if (typeof value === "string") {
      if (isProtectedAssetUrl(value) && !seen.has(value)) {
        seen.add(value);
        urls.push(value);
      }
      if (value.includes("https://")) {
        const matches = value.match(/https:\/\/[^"'\\s>]+/g) || [];
        for (const match of matches) {
          if (isProtectedAssetUrl(match) && !seen.has(match)) {
            seen.add(match);
            urls.push(match);
          }
        }
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (value && typeof value === "object") {
      Object.values(value).forEach(visit);
    }
  };

  visit(content);
  const map = {};
  urls.forEach((url, index) => {
    map[`a${index + 1}`] = url;
  });
  return map;
}

function serializeProtectedTestContentForClient(content, testId, origin, assetMap) {
  const replaceAssetUrl = (value) => {
    let next = String(value || "");
    for (const [assetId, upstreamUrl] of Object.entries(assetMap || {})) {
      const proxyUrl = `${origin}/api/test-asset?testId=${encodeURIComponent(testId)}&asset=${encodeURIComponent(assetId)}`;
      next = next.split(upstreamUrl).join(proxyUrl);
    }
    return next;
  };

  const walk = (value, keyName = "") => {
    if (typeof value === "function") {
      return keyName === "legacyFactory" ? { legacyFactorySource: value.toString() } : undefined;
    }
    if (typeof value === "string") {
      return replaceAssetUrl(value);
    }
    if (Array.isArray(value)) {
      return value.map((item) => walk(item));
    }
    if (value && typeof value === "object") {
      const out = {};
      for (const [key, child] of Object.entries(value)) {
        const serialized = walk(child, key);
        if (serialized === undefined) continue;
        if (key === "legacyFactory" && serialized && typeof serialized === "object" && serialized.legacyFactorySource) {
          out.legacyFactorySource = serialized.legacyFactorySource;
        } else {
          out[key] = serialized;
        }
      }
      return out;
    }
    return value;
  };

  return walk(content);
}

async function handleSharedStudentLogin(request, env) {
  if (request.method !== "POST") {
    return json(405, { ok: false, error: "Method not allowed." });
  }

  const payload = await request.json().catch(() => null);
  const email = oneLine(payload?.email).toLowerCase();
  const password = String(payload?.password || "");
  const expectedPassword = String(env.SHARED_STUDENT_PASSWORD || DEFAULT_SHARED_STUDENT_PASSWORD);

  if (!isValidEmail(email)) {
    return json(400, { ok: false, error: "Please enter a valid email address." });
  }
  if (!password || password !== expectedPassword) {
    return json(401, { ok: false, error: "Wrong shared password." });
  }

  const token = await issueSharedStudentToken(email, env);
  const displayName = deriveNameFromEmail(email);
  const user = {
    id: `shared:${email}`,
    email,
    created_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: { provider: "shared-password", is_shared_student_login: true },
    user_metadata: {
      full_name: displayName,
      name: displayName,
      preferred_name: displayName,
    },
  };

  await upsertStudentRegistry(env, {
    email,
    fullName: displayName,
    provider: "shared-password",
    isSharedPassword: true,
  });

  return json(200, { ok: true, token, user });
}

async function handleContactApi(request, env) {
  if (request.method !== "POST") {
    return json(405, { ok: false, error: "Method not allowed." });
  }

  const payload = await request.json().catch(() => null);
  const fullName = oneLine(payload?.fullName);
  const email = oneLine(payload?.email).toLowerCase();
  const phone = oneLine(payload?.phone);
  const category = oneLine(payload?.category || "General contact");
  const message = normalizeMessage(payload?.message);

  if (!fullName) return json(400, { ok: false, error: "Full name is required." });
  if (!isValidEmail(email)) return json(400, { ok: false, error: "A valid email address is required." });
  if (!phone) return json(400, { ok: false, error: "Phone number is required." });
  if (!message) return json(400, { ok: false, error: "Please describe your question or problem." });
  if (!env.CONTACT_EMAIL || typeof env.CONTACT_EMAIL.send !== "function") {
    return json(503, { ok: false, error: "Contact email is not configured yet." });
  }

  const submittedAt = new Date().toISOString();
  const subject = `[IELTS Mock Contact] ${category}`;
  const body = [
    "A new contact form submission was sent from ieltsmock.org.",
    "",
    `Submitted at: ${submittedAt}`,
    `Category: ${category}`,
    `Full name: ${fullName}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    "",
    "Message:",
    message,
  ].join("\n");

  const rawEmail = [
    'From: IELTS Mock Contact <no-reply@ieltsmock.org>',
    `Reply-To: ${email}`,
    "To: info@ieltsmock.org",
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    body,
  ].join("\r\n");

  const mail = new EmailMessage("no-reply@ieltsmock.org", undefined, rawEmail);
  try {
    await env.CONTACT_EMAIL.send(mail);
  } catch (error) {
    return json(502, { ok: false, error: error?.message || "Could not send your message right now." });
  }

  return json(200, { ok: true, message: "Your message has been sent to IELTS Mock support." });
}

async function handleAdminApi(request, env) {
  const url = new URL(request.url);
  const action = String(url.searchParams.get("action") || "").trim();

  if (request.method === "GET" && action === "session") {
    const auth = await authenticateAdmin(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error, authorized: false });
    return json(200, { ok: true, authorized: true, email: auth.user.email || "" });
  }

  if (request.method === "GET" && action === "results") {
    const auth = await authenticateAdmin(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });

    const backendUrl = new URL(env.ADMIN_BACKEND_URL);
    backendUrl.searchParams.set("action", "results");
    backendUrl.searchParams.set("adminPasscode", String(env.ADMIN_RESULTS_PASSCODE || ""));
    backendUrl.searchParams.set("t", String(Date.now()));
    return proxy(request, backendUrl.toString());
  }

  if (request.method === "GET" && action === "resultsSummary") {
    const auth = await authenticateAdmin(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });
    const forceRefresh = url.searchParams.get("refresh") === "1";

    const cacheUrl = buildAdminResultsSummaryCacheUrl(url);
    const cache = caches.default;
    const cacheRequest = new Request(cacheUrl.toString(), { method: "GET" });
    const cachedResponse = forceRefresh ? null : await cache.match(cacheRequest);
    if (cachedResponse) {
      return cachedResponse;
    }

    const search = normalizeMatchString(url.searchParams.get("q") || "");
    const examFilter = oneLine(url.searchParams.get("examId") || "");
    const monthFilter = oneLine(url.searchParams.get("month") || "");
    const yearFilter = oneLine(url.searchParams.get("year") || "");
    const sortValue = oneLine(url.searchParams.get("sort") || "submittedAt_desc");
    const limitValue = Number(url.searchParams.get("limit") || 0);

    const summaries = await getAdminResultsSummary(env, { forceRefresh });
    let rows = summaries.slice();

    if (search) {
      rows = rows.filter((row) => {
        const hay = [row.studentFullName, row.reason, row.examId]
          .map((value) => normalizeMatchString(value || ""))
          .join(" ");
        return hay.includes(search);
      });
    }

    if (examFilter) {
      rows = rows.filter((row) => String(row.examId || "") === examFilter);
    }

    if (monthFilter || yearFilter) {
      rows = rows.filter((row) => {
        const d = new Date(row?.submittedAt || 0);
        if (Number.isNaN(d.getTime())) return false;
        const rowMonth = String(d.getMonth() + 1).padStart(2, "0");
        const rowYear = String(d.getFullYear());
        if (monthFilter && rowMonth !== monthFilter) return false;
        if (yearFilter && rowYear !== yearFilter) return false;
        return true;
      });
    }

    const [field, direction] = String(sortValue || "submittedAt_desc").split("_");
    rows.sort((a, b) => compareAdminSummaryRows(a, b, field, direction));

    if (Number.isFinite(limitValue) && limitValue > 0) {
      rows = rows.slice(0, limitValue);
    }

    const response = json(200, {
      ok: true,
      results: rows,
      total: summaries.length,
      filteredTotal: rows.length,
      generatedAt: new Date().toISOString(),
    }, {
      "Cache-Control": `private, max-age=${Math.floor(ADMIN_RESULTS_SUMMARY_TTL_MS / 1000)}`
    });
    await cache.put(cacheRequest, response.clone());
    return response;
  }

  if (request.method === "GET" && action === "resultDetail") {
    const auth = await authenticateAdmin(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });

    const backendUrl = new URL(env.ADMIN_BACKEND_URL);
    backendUrl.searchParams.set("action", "studentResult");
    backendUrl.searchParams.set("submittedAt", oneLine(url.searchParams.get("submittedAt") || ""));
    backendUrl.searchParams.set("studentFullName", oneLine(url.searchParams.get("studentFullName") || ""));
    backendUrl.searchParams.set("examId", oneLine(url.searchParams.get("examId") || ""));
    backendUrl.searchParams.set("reason", oneLine(url.searchParams.get("reason") || ""));
    backendUrl.searchParams.set("t", String(Date.now()));
    return proxy(request, backendUrl.toString());
  }

  if (request.method === "GET" && action === "studentRegistry") {
    const auth = await authenticateAdmin(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });
    if (!env.STUDENT_REGISTRY) return json(200, { ok: true, students: [] });

    const listed = await env.STUDENT_REGISTRY.list({ prefix: "student:", limit: 500 });
    const students = [];
    for (const key of listed.keys || []) {
      const value = await readJsonKv(env.STUDENT_REGISTRY, key.name);
      if (value) students.push(value);
    }
    students.sort((a, b) => Date.parse(String(b?.lastSeenAt || "")) - Date.parse(String(a?.lastSeenAt || "")));
    return json(200, { ok: true, students });
  }

  if (request.method === "GET" && action === "writingSamples") {
    const response = await fetch(WRITING_SHEET_CSV_URL, { method: "GET" });
    const csvText = await response.text();
    if (!response.ok || !csvText) {
      return json(response.ok ? 502 : response.status, { ok: false, error: "Could not load writing sheet." });
    }

    const samples = buildWritingSamplesFromSheet(csvText);
    return json(200, { ok: true, samples });
  }

  if (request.method === "POST" && action === "objectiveAnswerCheck") {
    const auth = await authenticateUser(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });

    const payload = await request.json().catch(() => null);
    const testId = oneLine(payload?.testId || "");
    const skill = oneLine(payload?.skill || "").toLowerCase();
    const revealRequested = payload?.reveal === true;
    if (revealRequested) {
      const adminAuth = await authenticateAdmin(request, env);
      if (!adminAuth.ok) {
        return json(403, { ok: false, error: "Only admin accounts can reveal correct answers." });
      }
    }
    const reveal = revealRequested;
    const answers = payload?.answers && typeof payload.answers === "object" ? payload.answers : {};
    const overrideMap = payload?.overrideMap && typeof payload.overrideMap === "object" ? payload.overrideMap : {};
    const questionNumbers = Array.isArray(payload?.questionNumbers)
      ? payload.questionNumbers.map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0)
      : [];

    if (!testId || !["listening", "reading"].includes(skill) || !questionNumbers.length) {
      return json(400, { ok: false, error: "Missing grading inputs." });
    }

    const answerMap = {
      ...buildObjectiveAnswerMap(testId, skill),
      ...sanitizeObjectiveOverrideMap(overrideMap),
    };
    const review = questionNumbers
      .sort((a, b) => a - b)
      .map((q) => {
        const correctRaw = String(answerMap[q] || "").trim();
        const studentRaw = String(answers?.[q] ?? answers?.[String(q)] ?? "").trim();
        const isCorrect = matchesObjectiveAnswer(studentRaw, correctRaw);
        return {
          q,
          student: studentRaw,
          mark: isCorrect,
          ...(reveal ? { correct: correctRaw || "—" } : {}),
        };
      });

    return json(200, {
      ok: true,
      review,
      totalCorrect: review.filter((item) => item.mark).length,
      totalQuestions: review.length,
      availableCount: Object.keys(answerMap).length,
      revealed: reveal,
    });
  }

  if (request.method === "GET" && action === "studentResult") {
    const auth = await authenticateUser(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });

    const owned = await authorizeStudentSubmissionAccess(url.searchParams, auth, request, env);
    if (!owned.ok) return json(owned.status, { ok: false, error: owned.error });

    const backendUrl = new URL(env.ADMIN_BACKEND_URL);
    backendUrl.search = url.search;
    return proxy(request, backendUrl.toString());
  }

  if (request.method === "GET" && action === "submissionMeta") {
    const auth = await authenticateAdmin(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });

    const key = buildSubmissionMetaKey({
      submittedAt: url.searchParams.get("submittedAt") || "",
      studentFullName: url.searchParams.get("studentFullName") || "",
      examId: url.searchParams.get("examId") || "",
      reason: url.searchParams.get("reason") || "",
    });
    if (!key) return json(400, { ok: false, error: "Missing submission lookup fields." });

    const record = await readJsonKv(env.STUDENT_REGISTRY, `submission:${key}`);
    return json(200, { ok: true, record: record || null });
  }

  if (request.method === "GET" && action === "objectiveDetailAdmin") {
    const auth = await authenticateAdmin(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });

    const cacheKey = buildObjectiveDetailCacheKey(url.searchParams);
    const cached = getCachedObjectiveDetail(cacheKey);
    if (cached) {
      return json(200, { ok: true, result: cached, cached: true });
    }

    const backendUrl = new URL(env.ADMIN_BACKEND_URL);
    backendUrl.search = url.search;
    backendUrl.searchParams.set("action", "studentObjectiveDetail");
    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: filteredProxyHeaders(request),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data || data.ok !== true || !data.result) {
      return json(response.ok ? 502 : response.status, { ok: false, error: data?.error || "Could not load objective detail." });
    }
    setCachedObjectiveDetail(cacheKey, data.result);
    return json(200, { ok: true, result: data.result });
  }

  if (request.method === "POST" && action === "studentSessionPing") {
    const auth = await authenticateUser(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });

    const payload = await request.json().catch(() => null);
    const email = normalizeEmail(auth.user?.email || payload?.email || "");
    if (!email) return json(400, { ok: false, error: "Missing student email." });

    const provider = oneLine(payload?.provider || auth.user?.app_metadata?.provider || "email");
    const fullName = oneLine(payload?.fullName || auth.user?.user_metadata?.name || auth.user?.user_metadata?.preferred_name || deriveNameFromEmail(email));
    const record = await upsertStudentRegistry(env, {
      email,
      fullName,
      provider,
      isSharedPassword: provider === "shared-password",
    });
    return json(200, { ok: true, record });
  }

  if (request.method === "POST" && action === "recordSubmissionMeta") {
    const auth = await authenticateUser(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });

    const payload = await request.json().catch(() => null);
    const submittedAt = oneLine(payload?.submittedAt);
    const studentFullName = oneLine(payload?.studentFullName);
    const examId = oneLine(payload?.examId);
    const reason = oneLine(payload?.reason);
    const email = normalizeEmail(payload?.email || auth.user?.email || "");
    const provider = oneLine(payload?.provider || auth.user?.app_metadata?.provider || "email");
    if (!submittedAt || !studentFullName || !examId || !email) {
      return json(400, { ok: false, error: "Missing submission metadata." });
    }

    const key = buildSubmissionMetaKey({ submittedAt, studentFullName, examId, reason });
    const record = {
      email,
      provider,
      studentFullName,
      examId,
      submittedAt,
      reason,
      updatedAt: new Date().toISOString(),
    };
    await writeJsonKv(env.STUDENT_REGISTRY, `submission:${key}`, record);
    await upsertStudentRegistry(env, {
      email,
      fullName: studentFullName,
      provider,
      isSharedPassword: provider === "shared-password",
    });
    return json(200, { ok: true, record });
  }

  if (request.method === "GET" && action === "studentObjectiveDetail") {
    const auth = await authenticateUser(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });

    const owned = await authorizeStudentSubmissionAccess(url.searchParams, auth, request, env);
    if (!owned.ok) return json(owned.status, { ok: false, error: owned.error });

    const cacheKey = buildObjectiveDetailCacheKey(url.searchParams);
    const cached = getCachedObjectiveDetail(cacheKey);
    if (cached) {
      return json(200, { ok: true, result: cached, cached: true });
    }

    const backendUrl = new URL(env.ADMIN_BACKEND_URL);
    backendUrl.search = url.search;
    const response = await fetch(backendUrl.toString(), {
      method: request.method,
      headers: filteredProxyHeaders(request),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data || data.ok !== true || !data.result) {
      return json(response.ok ? 502 : response.status, { ok: false, error: data?.error || "Could not load objective detail." });
    }
    setCachedObjectiveDetail(cacheKey, data.result);
    return json(200, { ok: true, result: data.result });
  }

  if (request.method === "POST" && action === "studentResults") {
    const auth = await authenticateUser(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });

    const payload = await request.json().catch(() => null);
    const rows = Array.isArray(payload?.rows) ? payload.rows : [];
    if (!rows.length) return json(200, { ok: true, results: [] });

    const ownedRows = [];
    for (const row of rows) {
      const owned = await authorizeStudentSubmissionAccess(row, auth, request, env);
      if (owned.ok) ownedRows.push(row);
    }
    if (!ownedRows.length) return json(200, { ok: true, results: [] });

    const backendUrl = new URL(env.ADMIN_BACKEND_URL);
    backendUrl.searchParams.set("action", "results");
    backendUrl.searchParams.set("adminPasscode", String(env.ADMIN_RESULTS_PASSCODE || ""));
    backendUrl.searchParams.set("t", String(Date.now()));

    const response = await fetch(backendUrl.toString(), { method: "GET" });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data || data.ok !== true || !Array.isArray(data.results)) {
      return json(response.ok ? 502 : response.status, { ok: false, error: "Could not load student result matches." });
    }

    const matches = ownedRows
      .map((row) => {
        const match = matchStudentResultRow(row, data.results);
        if (!match) return null;
        return {
          requestedKey: buildResultMatchKey(row),
          result: match,
        };
      })
      .filter(Boolean);
    return json(200, { ok: true, results: matches });
  }

  if (request.method === "POST") {
    return proxy(request, String(env.ADMIN_BACKEND_URL || ""));
  }

  return json(405, { ok: false, error: "Method not allowed." });
}

async function authenticateAdmin(request, env) {
  const auth = await authenticateUser(request, env);
  if (!auth.ok) return auth;
  if (auth.kind === "shared") {
    return { ok: false, status: 403, error: "Shared-password student sign-in cannot use admin tools." };
  }

  const allowedEmails = String(env.ADMIN_ALLOWED_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (!allowedEmails.length) {
    return { ok: false, status: 503, error: "Admin access is not configured." };
  }

  const email = String(auth.user?.email || "").trim().toLowerCase();
  if (!allowedEmails.includes(email)) {
    return { ok: false, status: 403, error: "Your account is not allowed to use admin tools." };
  }

  return auth;
}

async function authenticateUser(request, env) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Missing access token." };
  }

  const token = String(authHeader.slice("Bearer ".length) || "").trim();
  if (token.startsWith("shared.")) {
    const payload = await verifySharedStudentToken(token, env);
    if (!payload?.email) {
      return { ok: false, status: 401, error: "Invalid shared sign-in token." };
    }
    return {
      ok: true,
      status: 200,
      kind: "shared",
      user: {
        email: payload.email,
        app_metadata: { provider: "shared-password", is_shared_student_login: true },
        user_metadata: {
          name: deriveNameFromEmail(payload.email),
          preferred_name: deriveNameFromEmail(payload.email),
        },
      },
    };
  }

  const response = await fetch(`${String(env.SUPABASE_URL || "").replace(/\/$/, "")}/auth/v1/user`, {
    method: "GET",
    headers: {
      Authorization: authHeader,
      apikey: String(env.SUPABASE_PUBLISHABLE_KEY || ""),
    },
  });

  const user = await response.json().catch(() => null);
  const email = String(user?.email || "").trim().toLowerCase();
  if (!response.ok || !email) {
    return { ok: false, status: 401, error: "Invalid access token." };
  }

  return { ok: true, status: 200, kind: "supabase", user };
}

function deriveNameFromEmail(email) {
  const local = String(email || "").split("@")[0] || "Student";
  const pretty = local
    .replace(/[._-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
  return pretty || "Student";
}

function getSharedTokenSigningSecret(env) {
  return String(env.SHARED_STUDENT_TOKEN_SECRET || env.ADMIN_RESULTS_PASSCODE || DEFAULT_SHARED_STUDENT_PASSWORD);
}

async function issueSharedStudentToken(email, env) {
  const payload = {
    email: String(email || "").trim().toLowerCase(),
    type: "shared-student",
    exp: Date.now() + (1000 * 60 * 60 * 24 * 30),
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = await signSharedTokenPayload(encodedPayload, getSharedTokenSigningSecret(env));
  return `shared.${encodedPayload}.${signature}`;
}

async function verifySharedStudentToken(token, env) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3 || parts[0] !== "shared") return null;
  const encodedPayload = parts[1];
  const signature = parts[2];
  const expected = await signSharedTokenPayload(encodedPayload, getSharedTokenSigningSecret(env));
  if (signature !== expected) return null;

  const payload = JSON.parse(fromBase64Url(encodedPayload) || "null");
  if (!payload || payload.type !== "shared-student" || !payload.email) return null;
  if (!Number.isFinite(payload.exp) || Date.now() > payload.exp) return null;
  return payload;
}

async function signSharedTokenPayload(encodedPayload, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(String(secret || "")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(String(encodedPayload || "")));
  return toBase64UrlFromBytes(new Uint8Array(signature));
}

function toBase64Url(value) {
  const bytes = new TextEncoder().encode(String(value || ""));
  return toBase64UrlFromBytes(bytes);
}

function toBase64UrlFromBytes(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const base64 = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4 || 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function proxy(request, backendUrl) {
  if (!backendUrl) {
    return json(503, { ok: false, error: "Admin backend is not configured." });
  }

  const headers = new Headers(request.headers);
  headers.delete("Authorization");
  headers.delete("Host");

  return fetch(backendUrl, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
  });
}

function filteredProxyHeaders(request) {
  const headers = new Headers(request.headers);
  headers.delete("Authorization");
  headers.delete("Host");
  return headers;
}

function buildWritingSamplesFromSheet(csvText) {
  const rows = parseCsv(csvText);
  if (!rows.length) return [];

  const samples = [];
  rows.forEach((row) => {
    const cols = Array.isArray(row) ? row : [];
    const col0 = String(cols[0] || "").trim();
    const col1 = String(cols[1] || "").trim();
    const col2 = String(cols[2] || "").trim();
    const col3 = String(cols[3] || "").trim();
    const col5 = String(cols[5] || "").trim();

    if (col1 === "Name") return;

    if (col2 !== "Task 1" && col2 !== "Task 2") return;

    samples.push({
      promptKey: normalizePromptKey(col1),
      promptText: plainText(col1),
      taskKey: col2 === "Task 1" ? "task1" : "task2",
      label: formatSampleLabel(col3),
      bandScore: formatBand(col3),
      explanation: plainText(col5 || "Stored student essay from the writing sheet."),
      sampleAnswer: col0,
      correctedForm: "",
    });
  });
  return samples;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function buildSubmissionMetaKey(row) {
  return [
    normalizeMatchString(row?.submittedAt || row?.submitted_at || ""),
    normalizeMatchString(row?.studentFullName || row?.student_full_name || ""),
    normalizeMatchString(row?.examId || row?.exam_id || row?.active_test_id || ""),
    normalizeMatchString(row?.reason || ""),
  ].join("::");
}

async function readJsonKv(binding, key) {
  if (!binding || !key) return null;
  try {
    const raw = await binding.get(key, "text");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

async function writeJsonKv(binding, key, value) {
  if (!binding || !key) return null;
  await binding.put(key, JSON.stringify(value));
  return value;
}

async function upsertStudentRegistry(env, payload) {
  const email = normalizeEmail(payload?.email);
  if (!env.STUDENT_REGISTRY || !email) return null;

  const key = `student:${email}`;
  const current = (await readJsonKv(env.STUDENT_REGISTRY, key)) || {};
  const provider = oneLine(payload?.provider || current.lastProvider || "email");
  const now = new Date().toISOString();
  const methods = {
    ...(current.methods && typeof current.methods === "object" ? current.methods : {}),
    [provider]: true,
  };

  const next = {
    email,
    fullName: oneLine(payload?.fullName || current.fullName || deriveNameFromEmail(email)),
    firstSeenAt: current.firstSeenAt || now,
    lastSeenAt: now,
    lastProvider: provider,
    signInCount: Number(current.signInCount || 0) + 1,
    sharedPasswordSignInCount: Number(current.sharedPasswordSignInCount || 0) + (payload?.isSharedPassword ? 1 : 0),
    methods,
  };

  await writeJsonKv(env.STUDENT_REGISTRY, key, next);
  return next;
}

async function authorizeStudentSubmissionAccess(rowLike, auth, request, env) {
  const email = normalizeEmail(auth?.user?.email);
  if (!email) {
    return { ok: false, status: 401, error: "Missing student email." };
  }
  if (!env.STUDENT_REGISTRY) {
    return { ok: false, status: 503, error: "Student registry is not configured." };
  }

  const key = buildSubmissionMetaKey({
    submittedAt: rowLike?.submittedAt || rowLike?.submitted_at || "",
    studentFullName: rowLike?.studentFullName || rowLike?.student_full_name || "",
    examId: rowLike?.examId || rowLike?.exam_id || rowLike?.active_test_id || "",
    reason: rowLike?.reason || "",
  });
  if (!key) {
    return { ok: false, status: 400, error: "Missing submission lookup fields." };
  }

  const record = await readJsonKv(env.STUDENT_REGISTRY, `submission:${key}`);
  if (record?.email) {
    if (normalizeEmail(record.email) !== email) {
      return { ok: false, status: 403, error: "This submission is not available for the current account." };
    }
    return { ok: true, status: 200, record };
  }

  const canFallbackToSupabase =
    auth?.kind === "supabase" &&
    !!request?.headers?.get("Authorization") &&
    !!env.SUPABASE_URL &&
    !!env.SUPABASE_PUBLISHABLE_KEY;

  if (!canFallbackToSupabase) {
    return { ok: false, status: 403, error: "This submission is not available for the current account." };
  }

  const submittedAt = oneLine(rowLike?.submittedAt || rowLike?.submitted_at || "");
  const examId = oneLine(rowLike?.examId || rowLike?.exam_id || rowLike?.active_test_id || "");
  if (!submittedAt || !examId) {
    return { ok: false, status: 403, error: "This submission is not available for the current account." };
  }

  const verifyUrl = new URL(`${String(env.SUPABASE_URL || "").replace(/\/$/, "")}/rest/v1/exam_attempts`);
  verifyUrl.searchParams.set("select", "id");
  verifyUrl.searchParams.set("submitted_at", `eq.${submittedAt}`);
  verifyUrl.searchParams.set("exam_id", `eq.${examId}`);
  verifyUrl.searchParams.set("user_email", `eq.${email}`);
  verifyUrl.searchParams.set("limit", "1");

  const verifyRes = await fetch(verifyUrl.toString(), {
    method: "GET",
    headers: {
      Authorization: request.headers.get("Authorization"),
      apikey: String(env.SUPABASE_PUBLISHABLE_KEY || ""),
    },
  });
  const rows = await verifyRes.json().catch(() => null);
  if (!verifyRes.ok || !Array.isArray(rows) || !rows.length) {
    return { ok: false, status: 403, error: "This submission is not available for the current account." };
  }

  return { ok: true, status: 200, record: null };
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    if (ch !== "\r") cell += ch;
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function normalizePromptKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/task\s*[12]\s*/g, " ")
    .replace(/you should spend about \d+ minutes on this task\.?/g, " ")
    .replace(/write at least \d+ words\.?/g, " ")
    .replace(/graph url:\s*\S+/g, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatBand(value) {
  const text = String(value || "").trim();
  if (!text) return "Student sample";
  return /^band\s+/i.test(text) ? text : `Band ${text}`;
}

function buildObjectiveAnswerMap(testId, skill) {
  const testKey = String(testId || "").trim().toLowerCase();
  const skillKey = String(skill || "").trim().toLowerCase();
  const source = OBJECTIVE_ANSWER_KEYS?.[testKey]?.[skillKey];
  if (!source || typeof source !== "object") return {};
  const map = {};
  Object.entries(source).forEach(([key, value]) => {
    const q = Number(key);
    if (!Number.isFinite(q) || q <= 0) return;
    const next = String(value || "").trim();
    if (!next) return;
    map[q] = next;
  });
  return map;
}

function matchesObjectiveAnswer(studentValue, correctValue) {
  const student = normalizeObjectiveValue(studentValue);
  if (!student) return false;

  const options = splitObjectiveCandidates(correctValue);
  if (!options.length) return false;
  return options.some((candidate) => candidate === student);
}

function splitObjectiveCandidates(value) {
  const raw = String(value || "").trim();
  if (!raw) return [];
  return raw
    .split(/\s*\/\s*/)
    .map((part) => normalizeObjectiveValue(part))
    .filter(Boolean);
}

function normalizeObjectiveValue(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeObjectiveOverrideMap(value) {
  const out = {};
  if (!value || typeof value !== "object") return out;
  Object.entries(value).forEach(([key, raw]) => {
    const q = Number(key);
    if (!Number.isFinite(q) || q <= 0) return;
    const next = String(raw || "").trim();
    if (!next) return;
    out[q] = next;
  });
  return out;
}

function buildObjectiveDetailCacheKey(searchParams) {
  return [
    String(searchParams.get("submittedAt") || "").trim(),
    String(searchParams.get("studentFullName") || "").trim().toLowerCase(),
    String(searchParams.get("examId") || "").trim().toLowerCase(),
    String(searchParams.get("reason") || "").trim().toLowerCase(),
  ].join("::");
}

function getCachedObjectiveDetail(key) {
  if (!key) return null;
  const entry = OBJECTIVE_DETAIL_CACHE.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    OBJECTIVE_DETAIL_CACHE.delete(key);
    return null;
  }
  return entry.value || null;
}

function setCachedObjectiveDetail(key, value) {
  if (!key || !value) return;
  OBJECTIVE_DETAIL_CACHE.set(key, {
    value,
    expiresAt: Date.now() + OBJECTIVE_DETAIL_TTL_MS,
  });
}

function getCachedAdminResultsSummary(key) {
  if (!key) return null;
  const entry = ADMIN_RESULTS_SUMMARY_CACHE.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    ADMIN_RESULTS_SUMMARY_CACHE.delete(key);
    return null;
  }
  return Array.isArray(entry.value) ? entry.value : null;
}

function buildAdminResultsSummaryCacheUrl(url) {
  const cacheUrl = new URL(url.toString());
  cacheUrl.searchParams.delete("t");
  return cacheUrl;
}

function setCachedAdminResultsSummary(key, value) {
  if (!key || !Array.isArray(value)) return;
  ADMIN_RESULTS_SUMMARY_CACHE.set(key, {
    value,
    expiresAt: Date.now() + ADMIN_RESULTS_SUMMARY_TTL_MS,
  });
}

async function getAdminResultsSummary(env, options = {}) {
  const cacheKey = "all";
  const forceRefresh = options?.forceRefresh === true;
  const cached = forceRefresh ? null : getCachedAdminResultsSummary(cacheKey);
  if (cached) return cached;

  const backendUrl = new URL(env.ADMIN_BACKEND_URL);
  backendUrl.searchParams.set("action", "resultsSummary");
  backendUrl.searchParams.set("adminPasscode", String(env.ADMIN_RESULTS_PASSCODE || ""));
  backendUrl.searchParams.set("t", String(Date.now()));

  const response = await fetch(backendUrl.toString(), { method: "GET" });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data || data.ok !== true || !Array.isArray(data.results)) {
    throw new Error(data?.error || "Could not load admin results summary.");
  }

  const summaries = data.results.map(summarizeAdminResultRow);
  setCachedAdminResultsSummary(cacheKey, summaries);
  return summaries;
}

function summarizeAdminResultRow(row) {
  return {
    submittedAt: oneLine(row?.submittedAt || row?.submitted_at || ""),
    studentFullName: oneLine(row?.studentFullName || row?.student_full_name || ""),
    examId: oneLine(row?.examId || row?.exam_id || row?.active_test_id || ""),
    reason: oneLine(row?.reason || ""),
    listeningTotal: toSafeNumber(row?.listeningTotal ?? row?.listening_total),
    listeningBand: oneLine(row?.listeningBand || row?.listening_band || ""),
    readingTotal: toSafeNumber(row?.readingTotal ?? row?.reading_total),
    readingBand: oneLine(row?.readingBand || row?.reading_band || ""),
    finalWritingBand: oneLine(row?.finalWritingBand || row?.final_writing_band || ""),
    task1Words: toSafeNumber(row?.task1Words ?? row?.task1_words),
    task2Words: toSafeNumber(row?.task2Words ?? row?.task2_words),
    task1Band: oneLine(row?.task1Band || row?.task1_band || ""),
    task2Band: oneLine(row?.task2Band || row?.task2_band || ""),
  };
}

function compareAdminSummaryRows(a, b, field, direction) {
  const dir = String(direction || "desc").toLowerCase() === "asc" ? 1 : -1;
  let av = a?.[field];
  let bv = b?.[field];

  if (field === "submittedAt") {
    av = toTimestamp(av);
    bv = toTimestamp(bv);
  } else if (["listeningTotal", "readingTotal", "task1Words", "task2Words", "finalWritingBand", "task1Band", "task2Band"].includes(field)) {
    av = toSafeNumber(av);
    bv = toSafeNumber(bv);
  } else {
    av = normalizeMatchString(av);
    bv = normalizeMatchString(bv);
  }

  if (av < bv) return -1 * dir;
  if (av > bv) return 1 * dir;
  return 0;
}

function toSafeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatSampleLabel(band) {
  return `${formatBand(band)} sample`;
}

function plainText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeMatchString(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function buildResultMatchKey(row) {
  return [
    normalizeMatchString(row?.submittedAt || row?.submitted_at),
    normalizeMatchString(row?.studentFullName || row?.student_full_name),
    normalizeMatchString(row?.examId || row?.exam_id || row?.active_test_id),
    normalizeMatchString(row?.reason),
  ].join("::");
}

function toTimestamp(value) {
  const ts = Date.parse(String(value || ""));
  return Number.isFinite(ts) ? ts : NaN;
}

function matchStudentResultRow(requestedRow, results) {
  const wantedExam = normalizeMatchString(requestedRow?.examId || requestedRow?.exam_id || requestedRow?.active_test_id);
  const wantedName = normalizeMatchString(requestedRow?.studentFullName || requestedRow?.student_full_name);
  const wantedReason = normalizeMatchString(requestedRow?.reason);
  const wantedTs = toTimestamp(requestedRow?.submittedAt || requestedRow?.submitted_at);

  const exact = results.find((row) => buildResultMatchKey(row) === buildResultMatchKey(requestedRow));
  if (exact) return exact;

  const filtered = results.filter((row) => {
    const exam = normalizeMatchString(row?.examId || row?.exam_id || row?.active_test_id);
    const name = normalizeMatchString(row?.studentFullName || row?.student_full_name);
    return exam === wantedExam && name === wantedName;
  });
  const fallbackByExam = results.filter((row) => {
    const exam = normalizeMatchString(row?.examId || row?.exam_id || row?.active_test_id);
    return exam === wantedExam;
  });
  if (!filtered.length && !fallbackByExam.length) return null;

  const withReason = wantedReason
    ? filtered.filter((row) => normalizeMatchString(row?.reason) === wantedReason)
    : filtered;
  const fallbackWithReason = wantedReason
    ? fallbackByExam.filter((row) => normalizeMatchString(row?.reason) === wantedReason)
    : fallbackByExam;
  const pool = withReason.length
    ? withReason
    : (filtered.length ? filtered : (fallbackWithReason.length ? fallbackWithReason : fallbackByExam));

  if (!Number.isFinite(wantedTs)) return pool[0];

  let best = null;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (const row of pool) {
    const ts = toTimestamp(row?.submittedAt || row?.submitted_at);
    if (!Number.isFinite(ts)) continue;
    const delta = Math.abs(ts - wantedTs);
    if (delta < bestDelta) {
      best = row;
      bestDelta = delta;
    }
  }

  if (best && bestDelta <= 1000 * 60 * 60 * 12) return best;
  return pool[0] || null;
}

function oneLine(value) {
  return String(value || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeMessage(value) {
  return String(value || "").replace(/\r/g, "").trim();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function json(status, payload, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}
