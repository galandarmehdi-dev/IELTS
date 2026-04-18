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

    if (url.pathname === "/api/auth/shared-bypass") {
      return handleSharedStudentBypass(request, env);
    }

    if (url.pathname === "/api/auth/shared-setup") {
      return handleSharedStudentSetup(request, env);
    }

    if (url.pathname === "/api/test-password/verify") {
      return handleTestPasswordVerify(request, env);
    }

    if (url.pathname === "/api/test-content") {
      return handleProtectedTestContentApi(request);
    }

    if (url.pathname === "/api/test-content-script") {
      return handleProtectedTestContentScriptApi(request);
    }

    if (url.pathname === "/api/admin") {
      return handleAdminApi(request, env);
    }

    const response = await env.ASSETS.fetch(request);
    return applyDocumentSecurityHeaders(response);
  },
};

const WRITING_SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1ZTBc4uMJ3ZAA5yG7r7i4RhTz4Eo8onnzVNNJoF1m8iU/export?format=csv&gid=1669784116";

function applyDocumentSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  const contentType = String(headers.get("content-type") || "").toLowerCase();
  const isHtml = contentType.includes("text/html");

  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set(
    "Permissions-Policy",
    "camera=(), geolocation=(), payment=(), usb=(), fullscreen=(self), microphone=(self)"
  );

  if (isHtml) {
    headers.set("Content-Security-Policy", buildContentSecurityPolicy());
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function buildContentSecurityPolicy() {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "script-src 'self' https://esm.sh",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://audio.ieltsmock.org https://static.wixstatic.com https://www.ieltsbuddy.com https://ieltscity.vn https://practicepteonline.com",
    "media-src 'self' blob: https://audio.ieltsmock.org",
    "connect-src 'self' https://bgujwyknnszwborgbkxq.supabase.co wss://bgujwyknnszwborgbkxq.supabase.co https://script.google.com https://script.googleusercontent.com https://ielts-speaking-realtime.galandar-mehdi.workers.dev https://esm.sh",
  ].join("; ");
}

async function handleProtectedTestContentApi(request) {
  if (request.method !== "GET") {
    return json(405, { ok: false, error: "Method not allowed." });
  }

  const url = new URL(request.url);
  const testId = oneLine(url.searchParams.get("testId") || "").toLowerCase();
  const content = getProtectedTestContent(testId);
  if (!content) {
    await logSecurityEvent(null, request, "protected_test_content_not_found", { testId });
    return json(404, { ok: false, error: "Test content not found." });
  }

  const clientContent = serializeProtectedTestContentForClient(content, testId, url.origin);

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

async function handleProtectedTestContentScriptApi(request) {
  if (request.method !== "GET") {
    return json(405, { ok: false, error: "Method not allowed." });
  }

  const url = new URL(request.url);
  const testId = oneLine(url.searchParams.get("testId") || "").toLowerCase();
  const kind = oneLine(url.searchParams.get("kind") || "");
  const content = getProtectedTestContent(testId);
  if (!content || kind !== "reading-legacy" || typeof content?.reading?.legacyFactory !== "function") {
    return json(404, { ok: false, error: "Protected script not found." });
  }

  const source = [
    "(function () {",
    '  "use strict";',
    "  window.IELTS = window.IELTS || {};",
    "  window.IELTS.Registry = window.IELTS.Registry || {};",
    "  window.IELTS.Registry.__protectedLegacyFactories = window.IELTS.Registry.__protectedLegacyFactories || {};",
    `  window.IELTS.Registry.__protectedLegacyFactories[${JSON.stringify(testId)}] = ${content.reading.legacyFactory.toString()};`,
    "})();",
  ].join("\n");

  return new Response(source, {
    status: 200,
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "private, max-age=300",
      "x-content-type-options": "nosniff",
    },
  });
}

function serializeProtectedTestContentForClient(content, testId, origin) {
  const walk = (value, keyName = "") => {
    if (typeof value === "function") {
      if (keyName === "legacyFactory") {
        return {
          legacyFactoryScript: `${origin}/api/test-content-script?testId=${encodeURIComponent(testId)}&kind=reading-legacy`,
        };
      }
      return undefined;
    }
    if (Array.isArray(value)) return value.map((item) => walk(item));
    if (value && typeof value === "object") {
      const out = {};
      for (const [key, child] of Object.entries(value)) {
        const next = walk(child, key);
        if (next !== undefined) out[key] = next;
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
  const rate = await consumeRateLimit(
    env,
    `rate:shared-login:${buildRateLimitScope(request, email)}`,
    { limit: 8, windowMs: 10 * 60 * 1000 }
  );
  if (!rate.allowed) {
    await logSecurityEvent(env, request, "shared_login_rate_limited", { email });
    return json(429, { ok: false, error: "Too many sign-in attempts. Please wait and try again." });
  }
  const expectedPassword = String(env.SHARED_STUDENT_PASSWORD || "").trim();
  if (!expectedPassword) {
    await logSecurityEvent(env, request, "shared_login_not_configured", { email });
    return json(503, { ok: false, error: "Shared student sign-in is not configured." });
  }
  const current = (await readJsonKv(env.STUDENT_REGISTRY, `student:${email}`)) || null;
  const hasPersonalPassword = !!(current?.passwordHash && current?.passwordSalt);

  if (!isValidEmail(email)) {
    await logSecurityEvent(env, request, "shared_login_invalid_email", { email });
    return json(400, { ok: false, error: "Please enter a valid email address." });
  }

  if (hasPersonalPassword) {
    const matches = await verifyStudentPassword(current, email, password);
    if (!matches) {
      await logSecurityEvent(env, request, "shared_login_wrong_personal_password", { email });
      return json(401, { ok: false, error: "Wrong email or password." });
    }
  } else if (!password || password !== expectedPassword) {
    await logSecurityEvent(env, request, "shared_login_wrong_password", { email });
    return json(401, { ok: false, error: "Wrong shared password." });
  }

  const displayName = oneLine(current?.fullName || deriveNameFromEmail(email));
  const setupCompleted = hasPersonalPassword && !!oneLine(current?.fullName || "");
  const token = await issueSharedStudentToken(email, env, { mode: setupCompleted ? "student" : "setup" });
  const user = buildSharedStudentUser(email, {
    fullName: displayName,
    firstName: current?.firstName || "",
    lastName: current?.lastName || "",
    setupCompleted,
  });

  await upsertStudentRegistry(env, {
    email,
    fullName: displayName,
    firstName: current?.firstName || "",
    lastName: current?.lastName || "",
    provider: "shared-password",
    isSharedPassword: true,
  });

  return json(200, { ok: true, token, user, setupCompleted, requiresSetup: !setupCompleted });
}

async function handleSharedStudentBypass(request, env) {
  if (request.method !== "POST") {
    return json(405, { ok: false, error: "Method not allowed." });
  }

  const payload = await request.json().catch(() => null);
  const email = oneLine(payload?.email).toLowerCase();
  const bypassPassword = String(payload?.bypassPassword || "");
  const rate = await consumeRateLimit(
    env,
    `rate:shared-bypass:${buildRateLimitScope(request, email)}`,
    { limit: 5, windowMs: 10 * 60 * 1000 }
  );
  if (!rate.allowed) {
    await logSecurityEvent(env, request, "shared_bypass_rate_limited", { email });
    return json(429, { ok: false, error: "Too many bypass attempts. Please wait and try again." });
  }
  const expectedBypass = String(env.SHARED_STUDENT_BYPASS_PASSWORD || "").trim();

  if (!isValidEmail(email)) {
    await logSecurityEvent(env, request, "shared_bypass_invalid_email", { email });
    return json(400, { ok: false, error: "Please enter a valid email address." });
  }
  if (!expectedBypass) {
    return json(503, { ok: false, error: "Shared student bypass is not configured." });
  }
  if (!bypassPassword || bypassPassword !== expectedBypass) {
    await logSecurityEvent(env, request, "shared_bypass_wrong_password", { email });
    return json(401, { ok: false, error: "Wrong bypass password." });
  }

  const current = (await readJsonKv(env.STUDENT_REGISTRY, `student:${email}`)) || null;
  const displayName = oneLine(current?.fullName || deriveNameFromEmail(email));
  const token = await issueSharedStudentToken(email, env, { mode: "setup", bypass: true });
  const user = buildSharedStudentUser(email, {
    fullName: displayName,
    firstName: current?.firstName || "",
    lastName: current?.lastName || "",
    setupCompleted: false,
  });

  return json(200, {
    ok: true,
    token,
    user,
    setupCompleted: false,
    requiresSetup: true,
    recoveryMode: "bypass",
  });
}

async function handleSharedStudentSetup(request, env) {
  if (request.method !== "POST") {
    return json(405, { ok: false, error: "Method not allowed." });
  }

  const auth = await authenticateUser(request, env);
  if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });

  const email = normalizeEmail(auth?.user?.email || "");
  if (!email) return json(401, { ok: false, error: "Missing student email." });

  const payload = await request.json().catch(() => null);
  const firstName = oneLine(payload?.firstName || "");
  const lastName = oneLine(payload?.lastName || "");
  const password = String(payload?.password || "");

  if (!firstName || !lastName) {
    return json(400, { ok: false, error: "First name and surname are required." });
  }
  if (!password || password.length < 6) {
    return json(400, { ok: false, error: "Choose a password with at least 6 characters." });
  }

  const fullName = `${firstName} ${lastName}`.replace(/\s+/g, " ").trim();
  const salt = generateStudentPasswordSalt();
  const passwordHash = await hashStudentPassword(email, password, salt);
  const current = (await readJsonKv(env.STUDENT_REGISTRY, `student:${email}`)) || {};
  const methods = {
    ...(current.methods && typeof current.methods === "object" ? current.methods : {}),
    "shared-password": true,
  };
  const next = {
    ...current,
    email,
    fullName,
    firstName,
    lastName,
    methods,
    lastProvider: "shared-password",
    passwordSalt: salt,
    passwordHash,
    passwordChangedAt: new Date().toISOString(),
    setupCompleted: true,
    lastSeenAt: new Date().toISOString(),
    firstSeenAt: current.firstSeenAt || new Date().toISOString(),
  };

  await writeJsonKv(env.STUDENT_REGISTRY, `student:${email}`, next);

  const token = await issueSharedStudentToken(email, env, { mode: "student" });
  const user = buildSharedStudentUser(email, {
    fullName,
    firstName,
    lastName,
    setupCompleted: true,
  });

  return json(200, {
    ok: true,
    token,
    user,
    setupCompleted: true,
    requiresSetup: false,
    message: "Your student password is ready.",
  });
}

async function handleTestPasswordVerify(request, env) {
  if (request.method !== "POST") {
    return json(405, { ok: false, error: "Method not allowed." });
  }

  const limitKey = `rate:test-password:${buildRateLimitScope(request, "", "test-password")}`;
  const rate = await consumeRateLimit(env, limitKey, {
    limit: 8,
    windowMs: 10 * 60 * 1000,
  });
  if (!rate.allowed) {
    await logSecurityEvent(env, request, "test_password_rate_limited", {});
    return json(429, {
      ok: false,
      error: "Too many password attempts. Please wait a few minutes and try again.",
    });
  }

  const configuredPassword = String(env.TEST_ENTRY_PASSWORD || "").trim();
  if (!configuredPassword) {
    return json(503, { ok: false, error: "Test password is not configured yet." });
  }

  const payload = await request.json().catch(() => null);
  const password = String(payload?.password || "").trim();

  if (!password) {
    return json(400, { ok: false, error: "Please enter the test password." });
  }

  if (password !== configuredPassword) {
    await logSecurityEvent(env, request, "test_password_wrong", {});
    return json(401, { ok: false, error: "Wrong password. Please try again." });
  }

  return json(200, { ok: true });
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
    backendUrl.searchParams.set("t", String(Date.now()));
    return proxy(request, backendUrl.toString(), env);
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
    let rows = summaries.filter((row) => !isPracticeExamId(row?.examId));

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
      total: summaries.filter((row) => !isPracticeExamId(row?.examId)).length,
      filteredTotal: rows.length,
      generatedAt: new Date().toISOString(),
    }, {
      "Cache-Control": `private, max-age=${Math.floor(ADMIN_RESULTS_SUMMARY_TTL_MS / 1000)}`
    });
    await cache.put(cacheRequest, response.clone());
    return response;
  }

  if (request.method === "GET" && action === "practiceResultsSummary") {
    const auth = await authenticateAdmin(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });
    const rows = await getPracticeResultsSummary(env, {
      forceRefresh: url.searchParams.get("refresh") === "1",
    });
    return json(200, {
      ok: true,
      results: rows,
      total: rows.length,
      filteredTotal: rows.length,
      generatedAt: new Date().toISOString(),
    });
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
    return proxy(request, backendUrl.toString(), env);
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
    const adminAuth = await authenticateAdmin(request, env);
    if (!adminAuth.ok) {
      await logSecurityEvent(env, request, "student_answer_check_denied", {
        email: auth?.user?.email || "",
      });
      return json(403, { ok: false, error: "Answer checking is available only in admin review tools. Students can review stored results from History after submission." });
    }

    const payload = await request.json().catch(() => null);
    const testId = oneLine(payload?.testId || "");
    const skill = oneLine(payload?.skill || "").toLowerCase();
    const revealRequested = payload?.reveal === true;
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
    const signedBackendUrl = await buildSignedAppsScriptUrl(backendUrl.toString(), "GET", "", env);
    const response = await fetch(signedBackendUrl, {
      method: "GET",
      headers: await filteredProxyHeaders(request, env, signedBackendUrl),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data || data.ok !== true) {
      return json(response.ok ? 502 : response.status, { ok: false, error: data?.error || "Could not load student result." });
    }
    const scoreMeta = await readSubmissionScoreMeta(env, url.searchParams);
    const mergedResult = data.result ? mergeSummaryWithScoreMeta(data.result, scoreMeta) : data.result;
    return json(200, { ...data, result: mergedResult });
  }

  if (request.method === "GET" && action === "studentResultsSummary") {
    const auth = await authenticateUser(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });

    const email = normalizeEmail(auth?.user?.email || "");
    if (!email) return json(400, { ok: false, error: "Missing student email." });

    const summaries = await getAdminResultsSummary(env, {
      forceRefresh: url.searchParams.get("refresh") === "1",
    });
    const fullRows = summaries.filter((row) => !isPracticeExamId(row?.examId));
    const owned = [];
    for (const row of fullRows) {
      if (await studentOwnsSubmission(row, email, env)) owned.push(row);
    }

    return json(200, {
      ok: true,
      results: owned,
      total: owned.length,
      filteredTotal: owned.length,
      generatedAt: new Date().toISOString(),
    });
  }

  if (request.method === "POST" && action === "submitPracticeObjective") {
    const auth = await authenticateUser(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });
    const payload = await request.json().catch(() => null);
    const saved = await savePracticeObjectiveResult(payload, auth, request, env);
    if (!saved.ok) {
      return json(saved.status || 400, { ok: false, error: saved.error || "Could not save practice result." });
    }
    return json(200, { ok: true, row: saved.row, result: saved.result });
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

  if (request.method === "POST" && action === "adminResultSpeakingScore") {
    const auth = await authenticateAdmin(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });
    const payload = await request.json().catch(() => null);
    const speakingBand = toNullableBand(payload?.speakingBand);
    const submittedAt = oneLine(payload?.submittedAt || "");
    const studentFullName = oneLine(payload?.studentFullName || "");
    const examId = oneLine(payload?.examId || "");
    const reason = oneLine(payload?.reason || "");
    if (!submittedAt || !studentFullName || !examId) {
      return json(400, { ok: false, error: "Missing result lookup fields." });
    }
    const meta = await writeSubmissionScoreMeta(env, { submittedAt, studentFullName, examId, reason }, { speakingBand });
    try { ADMIN_RESULTS_SUMMARY_CACHE.delete("all"); } catch (e) {}
    return json(200, { ok: true, speakingBand, meta });
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
    const signedBackendUrl = await buildSignedAppsScriptUrl(backendUrl.toString(), "GET", "", env);
    const response = await fetch(signedBackendUrl, {
      method: "GET",
      headers: await filteredProxyHeaders(request, env, signedBackendUrl),
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
    const signedBackendUrl = await buildSignedAppsScriptUrl(backendUrl.toString(), "GET", "", env);
    const response = await fetch(signedBackendUrl, {
      method: request.method,
      headers: await filteredProxyHeaders(request, env, signedBackendUrl),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data || data.ok !== true || !data.result) {
      return json(response.ok ? 502 : response.status, { ok: false, error: data?.error || "Could not load objective detail." });
    }
    setCachedObjectiveDetail(cacheKey, data.result);
    return json(200, { ok: true, result: data.result });
  }

  if (request.method === "GET" && action === "practiceResultDetail") {
    const auth = await authenticateUser(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });
    const id = oneLine(url.searchParams.get("id") || "");
    if (!id) return json(400, { ok: false, error: "Missing practice result id." });
    const record = await readJsonKv(env.STUDENT_REGISTRY, `practice-result:${id}`);
    if (!record) return json(404, { ok: false, error: "Practice result not found." });

    const adminAuth = await authenticateAdmin(request, env);
    const email = normalizeEmail(auth?.user?.email || "");
    if (!adminAuth.ok && normalizeEmail(record?.email || "") !== email) {
      await logSecurityEvent(env, request, "practice_result_owner_mismatch", {
        email,
        practiceId: id,
      });
      return json(403, { ok: false, error: "This practice result is not available for the current account." });
    }

    const scoreMeta = await readSubmissionScoreMeta(env, record);
    return json(200, {
      ok: true,
      row: mergeSummaryWithScoreMeta(summarizePracticeResultRecord(record), scoreMeta),
      result: buildPracticeObjectiveDetail(record),
    });
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
    backendUrl.searchParams.set("t", String(Date.now()));

    const signedBackendUrl = await buildSignedAppsScriptUrl(backendUrl.toString(), "GET", "", env);
    const response = await fetch(signedBackendUrl, {
      method: "GET",
      headers: await filteredProxyHeaders(request, env, signedBackendUrl),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data || data.ok !== true || !Array.isArray(data.results)) {
      return json(response.ok ? 502 : response.status, { ok: false, error: "Could not load student result matches." });
    }

    const matches = await Promise.all(ownedRows
      .map((row) => {
        const match = matchStudentResultRow(row, data.results);
        if (!match) return null;
        return readSubmissionScoreMeta(env, row).then((scoreMeta) => ({
          requestedKey: buildResultMatchKey(row),
          result: mergeSummaryWithScoreMeta(match, scoreMeta),
        }));
      })
    );
    const filteredMatches = matches.filter(Boolean);
    return json(200, { ok: true, results: filteredMatches });
  }

  if (request.method === "GET" && action === "studentPracticeResults") {
    const auth = await authenticateUser(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });
    const rows = await getStudentPracticeRows(env, normalizeEmail(auth?.user?.email || ""));
    return json(200, { ok: true, results: rows });
  }

  if (request.method === "POST") {
    return proxy(request, String(env.ADMIN_BACKEND_URL || ""), env);
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
        shared_mode: payload.mode || "student",
        shared_bypass: payload.bypass === true,
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
  return String(env.SHARED_STUDENT_TOKEN_SECRET || "").trim();
}

async function issueSharedStudentToken(email, env, options = {}) {
  const secret = getSharedTokenSigningSecret(env);
  if (!secret) throw new Error("Shared student token signing secret is not configured.");
  const payload = {
    email: String(email || "").trim().toLowerCase(),
    type: "shared-student",
    exp: Date.now() + (1000 * 60 * 60 * 24 * 30),
    mode: oneLine(options?.mode || "student") || "student",
    bypass: options?.bypass === true,
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = await signSharedTokenPayload(encodedPayload, secret);
  return `shared.${encodedPayload}.${signature}`;
}

async function verifySharedStudentToken(token, env) {
  const secret = getSharedTokenSigningSecret(env);
  if (!secret) return null;
  const parts = String(token || "").split(".");
  if (parts.length !== 3 || parts[0] !== "shared") return null;
  const encodedPayload = parts[1];
  const signature = parts[2];
  const expected = await signSharedTokenPayload(encodedPayload, secret);
  if (signature !== expected) return null;

  const payload = JSON.parse(fromBase64Url(encodedPayload) || "null");
  if (!payload || payload.type !== "shared-student" || !payload.email) return null;
  if (!Number.isFinite(payload.exp) || Date.now() > payload.exp) return null;
  return payload;
}

function buildSharedStudentUser(email, options = {}) {
  const fullName = oneLine(options?.fullName || deriveNameFromEmail(email));
  const firstName = oneLine(options?.firstName || "");
  const lastName = oneLine(options?.lastName || "");
  return {
    id: `shared:${email}`,
    email,
    created_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {
      provider: "shared-password",
      is_shared_student_login: true,
      setup_completed: options?.setupCompleted === true,
    },
    user_metadata: {
      full_name: fullName,
      name: fullName,
      preferred_name: fullName,
      first_name: firstName,
      last_name: lastName,
    },
  };
}

function generateStudentPasswordSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return toBase64UrlFromBytes(bytes);
}

async function hashStudentPassword(email, password, salt) {
  const raw = `${String(salt || "").trim()}::${normalizeEmail(email)}::${String(password || "")}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return toBase64UrlFromBytes(new Uint8Array(digest));
}

async function verifyStudentPassword(record, email, password) {
  const expected = String(record?.passwordHash || "").trim();
  const salt = String(record?.passwordSalt || "").trim();
  if (!expected || !salt || !password) return false;
  const actual = await hashStudentPassword(email, password, salt);
  return actual === expected;
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

async function proxy(request, backendUrl, env) {
  if (!backendUrl) {
    return json(503, { ok: false, error: "Admin backend is not configured." });
  }

  const method = String(request.method || "GET").toUpperCase();
  const bodyText =
    method === "GET" || method === "HEAD"
      ? ""
      : await request.clone().text().catch(() => "");
  const signedUrl = await buildSignedAppsScriptUrl(backendUrl, method, bodyText, env);

  return fetch(signedUrl, {
    method: request.method,
    headers: await buildAppsScriptHeaders(request, env, signedUrl, bodyText),
    body: method === "GET" || method === "HEAD" ? undefined : bodyText,
  });
}

async function filteredProxyHeaders(request, env, backendUrl = "", bodyText = "") {
  return buildAppsScriptHeaders(request, env, backendUrl, bodyText);
}

async function buildAppsScriptHeaders(request, env, backendUrl = "", bodyText = "") {
  const headers = new Headers();
  const accept = oneLine(request.headers.get("Accept") || "");
  const contentType = oneLine(request.headers.get("Content-Type") || "");
  if (accept) headers.set("Accept", accept);
  if (contentType) headers.set("Content-Type", contentType);
  headers.set("X-IELTS-Worker-Proxy", "1");
  const signingSecret = String(env?.ADMIN_BACKEND_SIGNING_SECRET || "").trim();
  if (signingSecret && backendUrl) {
    const url = new URL(backendUrl);
    const timestamp = String(Date.now());
    const bodyHash = await sha256Base64Url(bodyText);
    const signaturePayload = [
      String(request.method || "GET").toUpperCase(),
      timestamp,
      String(url.search || "").replace(/^\?/, ""),
      bodyHash,
    ].join("\n");
    headers.set("X-IELTS-Worker-Timestamp", timestamp);
    headers.set("X-IELTS-Worker-Body-SHA256", bodyHash);
    headers.set(
      "X-IELTS-Worker-Signature",
      await signBackendProxyPayload(signaturePayload, signingSecret)
    );
  }
  return headers;
}

async function signBackendProxyPayload(payload, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(String(secret || "")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(String(payload || ""))
  );
  return toBase64UrlFromBytes(new Uint8Array(signature));
}

async function buildSignedAppsScriptUrl(rawUrl, method, bodyText, env) {
  const url = new URL(String(rawUrl || ""));
  const signingSecret = String(env?.ADMIN_BACKEND_SIGNING_SECRET || "").trim();
  if (!signingSecret) return url.toString();

  const timestamp = String(Date.now());
  const bodyHash = await sha256Base64Url(bodyText);
  url.searchParams.set("_workerTs", timestamp);
  url.searchParams.set("_workerBodySha256", bodyHash);

  const signaturePayload = [
    String(method || "GET").toUpperCase(),
    timestamp,
    canonicalizeSearchParams(url.searchParams, new Set(["_workerSig"])),
    bodyHash,
  ].join("\n");
  url.searchParams.set(
    "_workerSig",
    await signBackendProxyPayload(signaturePayload, signingSecret)
  );
  return url.toString();
}

function canonicalizeSearchParams(searchParams, exclude = new Set()) {
  const pairs = [];
  searchParams.forEach((value, key) => {
    if (exclude.has(key)) return;
    pairs.push([String(key || ""), String(value || "")]);
  });
  pairs.sort((a, b) => {
    if (a[0] === b[0]) return a[1].localeCompare(b[1]);
    return a[0].localeCompare(b[0]);
  });
  return pairs
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
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

    const promptText = plainText(col1);
    if (promptText.replace(/\s+/g, " ").trim().length < 20) return;

    samples.push({
      promptKey: normalizePromptKey(col1),
      promptText,
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

function buildSubmissionScoreKey(row) {
  const key = buildSubmissionMetaKey(row);
  return key ? `score:${key}` : "";
}

function toRoundedOverallBand(parts) {
  const nums = (Array.isArray(parts) ? parts : [])
    .map((value) => toNullableBand(value))
    .filter((value) => value !== null);
  if (!nums.length) return null;
  const avg = nums.reduce((sum, value) => sum + value, 0) / nums.length;
  return Math.round(avg * 2) / 2;
}

async function readSubmissionScoreMeta(env, row) {
  const key = buildSubmissionScoreKey(row);
  if (!env?.STUDENT_REGISTRY || !key) return {};
  const record = await readJsonKv(env.STUDENT_REGISTRY, key);
  return record && typeof record === "object" ? record : {};
}

async function writeSubmissionScoreMeta(env, row, patch = {}) {
  const key = buildSubmissionScoreKey(row);
  if (!env?.STUDENT_REGISTRY || !key) return null;
  const current = (await readJsonKv(env.STUDENT_REGISTRY, key)) || {};
  const next = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await writeJsonKv(env.STUDENT_REGISTRY, key, next);
  return next;
}

function mergeSummaryWithScoreMeta(summary, scoreMeta) {
  const speakingBand = toNullableBand(scoreMeta?.speakingBand ?? summary?.speakingBand);
  const overallBand = toRoundedOverallBand([
    summary?.listeningBand,
    summary?.readingBand,
    summary?.finalWritingBand,
    speakingBand,
  ]);
  return {
    ...summary,
    speakingBand,
    overallBand,
  };
}

async function logSecurityEvent(env, request, type, details = {}) {
  const event = {
    type: oneLine(type || "unknown"),
    at: new Date().toISOString(),
    ip: getClientIp(request),
    userAgent: oneLine(request?.headers?.get("user-agent") || ""),
    ...sanitizeTelemetryDetails(details),
  };

  try {
    console.warn("[IELTS security]", JSON.stringify(event));
  } catch (e) {}

  if (!env?.STUDENT_REGISTRY || !event.type) return event;
  const key = `telemetry:${event.at.slice(0, 10)}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  try {
    await writeJsonKv(env.STUDENT_REGISTRY, key, event);
  } catch (e) {}
  return event;
}

function sanitizeTelemetryDetails(details) {
  const out = {};
  if (!details || typeof details !== "object") return out;
  for (const [key, value] of Object.entries(details)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "object") continue;
    out[key] = oneLine(String(value));
  }
  return out;
}

function getClientIp(request) {
  return oneLine(
    request?.headers?.get("CF-Connecting-IP") ||
    request?.headers?.get("x-forwarded-for") ||
    ""
  );
}

function buildRateLimitScope(request, email, suffix = "") {
  const ip = getClientIp(request) || "unknown-ip";
  const normalizedEmail = normalizeEmail(email) || "unknown-email";
  return `${ip}:${normalizedEmail}${suffix ? `:${suffix}` : ""}`;
}

async function consumeRateLimit(env, key, options = {}) {
  if (!env?.STUDENT_REGISTRY || !key) return { allowed: true, remaining: Number(options.limit || 0) };
  const now = Date.now();
  const windowMs = Math.max(1000, Number(options.windowMs) || 10 * 60 * 1000);
  const limit = Math.max(1, Number(options.limit) || 8);
  const record = (await readJsonKv(env.STUDENT_REGISTRY, key)) || {};
  const attempts = Array.isArray(record.attempts)
    ? record.attempts.map((value) => Number(value)).filter((value) => Number.isFinite(value) && now - value < windowMs)
    : [];

  if (attempts.length >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(1000, windowMs - (now - attempts[0])),
    };
  }

  attempts.push(now);
  await writeJsonKv(env.STUDENT_REGISTRY, key, {
    attempts,
    updatedAt: new Date(now).toISOString(),
  });
  return {
    allowed: true,
    remaining: Math.max(0, limit - attempts.length),
  };
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

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function sha256Base64Url(value) {
  const bytes = new TextEncoder().encode(String(value || ""));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const chars = Array.from(new Uint8Array(digest), (byte) => String.fromCharCode(byte)).join("");
  return btoa(chars).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function normalizeObjectiveQuestionNumbers(questionNumbers) {
  return Array.isArray(questionNumbers)
    ? questionNumbers
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0)
        .sort((a, b) => a - b)
    : [];
}

async function enforceObjectiveCheckLock(env, auth, request, payload) {
  if (!env?.STUDENT_REGISTRY) return { ok: true };
  const email = normalizeEmail(auth?.user?.email || "");
  if (!email) return { ok: true };

  const skill = oneLine(payload?.skill || "").toLowerCase();
  const testId = oneLine(payload?.testId || "").toLowerCase();
  const questionNumbers = normalizeObjectiveQuestionNumbers(payload?.questionNumbers);
  const answers = payload?.answers && typeof payload.answers === "object" ? payload.answers : {};
  if (!skill || !testId || !questionNumbers.length) return { ok: true };

  const normalizedAnswers = {};
  questionNumbers.forEach((q) => {
    normalizedAnswers[String(q)] = String(answers?.[q] ?? answers?.[String(q)] ?? "").trim();
  });

  const key = `objective-check:${email}:${testId}:${skill}:${questionNumbers.join(",")}`;
  const submittedHash = await sha256Base64Url(stableStringify(normalizedAnswers));
  const existing = await readJsonKv(env.STUDENT_REGISTRY, key);
  if (!existing?.answerHash) {
    await writeJsonKv(env.STUDENT_REGISTRY, key, {
      email,
      skill,
      testId,
      questionNumbers,
      answerHash: submittedHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { ok: true };
  }

  if (String(existing.answerHash) !== submittedHash) {
    await logSecurityEvent(env, request, "objective_answer_recheck_blocked", {
      email,
      skill,
      testId,
      questionCount: String(questionNumbers.length),
    });
    return {
      ok: false,
      status: 409,
      error: "This section has already been checked. Refreshing the same review is allowed, but different answers cannot be re-checked.",
    };
  }

  await writeJsonKv(env.STUDENT_REGISTRY, key, {
    ...existing,
    updatedAt: new Date().toISOString(),
  });
  return { ok: true };
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
    firstName: oneLine(payload?.firstName || current.firstName || ""),
    lastName: oneLine(payload?.lastName || current.lastName || ""),
    firstSeenAt: current.firstSeenAt || now,
    lastSeenAt: now,
    lastProvider: provider,
    signInCount: Number(current.signInCount || 0) + 1,
    sharedPasswordSignInCount: Number(current.sharedPasswordSignInCount || 0) + (payload?.isSharedPassword ? 1 : 0),
    methods,
    setupCompleted: payload?.setupCompleted === true || current.setupCompleted === true,
    passwordHash: current.passwordHash || "",
    passwordSalt: current.passwordSalt || "",
    passwordChangedAt: current.passwordChangedAt || "",
  };

  await writeJsonKv(env.STUDENT_REGISTRY, key, next);
  return next;
}

async function authorizeStudentSubmissionAccess(rowLike, auth, request, env) {
  const email = normalizeEmail(auth?.user?.email);
  if (!email) {
    await logSecurityEvent(env, request, "student_submission_missing_email", {});
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
    await logSecurityEvent(env, request, "student_submission_missing_lookup_fields", { email });
    return { ok: false, status: 400, error: "Missing submission lookup fields." };
  }

  const record = await readJsonKv(env.STUDENT_REGISTRY, `submission:${key}`);
  if (record?.email) {
    if (normalizeEmail(record.email) !== email) {
      await logSecurityEvent(env, request, "student_submission_owner_mismatch", {
        email,
        requestedEmail: record.email,
        examId: rowLike?.examId || rowLike?.exam_id || rowLike?.active_test_id || "",
      });
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
    await logSecurityEvent(env, request, "student_submission_denied_no_registry_match", {
      email,
      examId: rowLike?.examId || rowLike?.exam_id || rowLike?.active_test_id || "",
    });
    return { ok: false, status: 403, error: "This submission is not available for the current account." };
  }

  const submittedAt = oneLine(rowLike?.submittedAt || rowLike?.submitted_at || "");
  const examId = oneLine(rowLike?.examId || rowLike?.exam_id || rowLike?.active_test_id || "");
  if (!submittedAt || !examId) {
    await logSecurityEvent(env, request, "student_submission_missing_verify_fields", { email, examId });
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
    await logSecurityEvent(env, request, "student_submission_supabase_verify_denied", {
      email,
      examId,
      submittedAt,
    });
    return { ok: false, status: 403, error: "This submission is not available for the current account." };
  }

  return { ok: true, status: 200, record: null };
}

async function studentOwnsSubmission(rowLike, email, env) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !env?.STUDENT_REGISTRY) return false;

  const key = buildSubmissionMetaKey({
    submittedAt: rowLike?.submittedAt || rowLike?.submitted_at || "",
    studentFullName: rowLike?.studentFullName || rowLike?.student_full_name || "",
    examId: rowLike?.examId || rowLike?.exam_id || rowLike?.active_test_id || "",
    reason: rowLike?.reason || "",
  });
  if (!key) return false;

  const record = await readJsonKv(env.STUDENT_REGISTRY, `submission:${key}`);
  if (record?.email) {
    return normalizeEmail(record.email) === normalizedEmail;
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) return false;
  const submittedAt = oneLine(rowLike?.submittedAt || rowLike?.submitted_at || "");
  const examId = oneLine(rowLike?.examId || rowLike?.exam_id || rowLike?.active_test_id || "");
  if (!submittedAt || !examId) return false;

  const verifyUrl = new URL(`${String(env.SUPABASE_URL || "").replace(/\/$/, "")}/rest/v1/exam_attempts`);
  verifyUrl.searchParams.set("select", "id");
  verifyUrl.searchParams.set("submitted_at", `eq.${submittedAt}`);
  verifyUrl.searchParams.set("exam_id", `eq.${examId}`);
  verifyUrl.searchParams.set("user_email", `eq.${normalizedEmail}`);
  verifyUrl.searchParams.set("limit", "1");

  const verifyRes = await fetch(verifyUrl.toString(), {
    method: "GET",
    headers: {
      apikey: String(env.SUPABASE_PUBLISHABLE_KEY || ""),
      Authorization: `Bearer ${String(env.SUPABASE_PUBLISHABLE_KEY || "")}`,
    },
  }).catch(() => null);
  if (!verifyRes?.ok) return false;
  const rows = await verifyRes.json().catch(() => []);
  return Array.isArray(rows) && rows.length > 0;
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

function isPracticeExamId(examId) {
  return /^ielts-practice-/i.test(String(examId || "").trim());
}

function inferPracticeSection(examId) {
  const value = String(examId || "").trim().toLowerCase();
  if (value.includes("-listening-")) return "listening";
  if (value.includes("-reading-")) return "reading";
  if (value.includes("-writing-")) return "writing";
  return "";
}

function inferPracticeLabel(examId) {
  const value = String(examId || "").trim().toLowerCase();
  if (!isPracticeExamId(value)) return String(examId || "").trim();
  const match = value.match(/ielts-practice-(listening|reading|writing)-(\d+)(?:-(section|part|task)-(\d+))?/i);
  if (!match) return String(examId || "").trim();
  const [, section, number, scopeKind, scopeValue] = match;
  const testLabel = `IELTS Test ${Number(number)}`;
  const sectionLabel = section.charAt(0).toUpperCase() + section.slice(1);
  if (!scopeKind || !scopeValue) return `${testLabel} · ${sectionLabel} practice`;
  const scopeMap = { section: "Section", part: "Section", task: "Task" };
  return `${testLabel} · ${sectionLabel} ${scopeMap[scopeKind] || scopeKind} ${Number(scopeValue)} practice`;
}

function objectiveBandFromRaw(skill, rawScore, totalQuestions) {
  const raw = Number(rawScore);
  if (!Number.isFinite(raw) || raw < 0 || Number(totalQuestions) !== 40) return null;
  const bands = skill === "reading"
    ? [
        [39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6],
        [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [1, 1], [0, 0],
      ]
    : [
        [39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6],
        [18, 5.5], [16, 5], [13, 4.5], [11, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [1, 1], [0, 0],
      ];
  const found = bands.find(([min]) => raw >= min);
  return found ? found[1] : null;
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

function buildPracticeFinalPayload(record) {
  const section = String(record?.practiceSection || "");
  return {
    attemptKind: "practice",
    practiceId: record?.id || "",
    practiceSection: section,
    practiceLabel: record?.practiceLabel || inferPracticeLabel(record?.examId || ""),
    examId: record?.examId || "",
    submittedAt: record?.submittedAt || "",
    studentFullName: record?.studentFullName || "",
    reason: record?.reason || "",
    listening: section === "listening"
      ? {
          saved: true,
          testId: record?.activeTestId || "",
          answerCount: Number(record?.totalQuestions || 0),
        }
      : null,
    reading: section === "reading"
      ? {
          saved: true,
          testId: record?.activeTestId || "",
          answerCount: Number(record?.totalQuestions || 0),
        }
      : null,
    writing: section === "writing"
      ? {
          saved: true,
          testId: record?.activeTestId || "",
          task1Words: Number(record?.task1Words || 0),
          task2Words: Number(record?.task2Words || 0),
        }
      : null,
  };
}

function summarizePracticeResultRecord(record) {
  const section = String(record?.practiceSection || inferPracticeSection(record?.examId || "") || "");
  const totalQuestions = Number(record?.totalQuestions || 0);
  const scoreValue = totalQuestions > 0 ? Number(record?.totalCorrect || 0) : null;
  const bandValue = objectiveBandFromRaw(section, scoreValue, totalQuestions);
  return {
    id: record?.id || "",
    source: record?.source || "practice-objective",
    practiceSection: section,
    practiceLabel: record?.practiceLabel || inferPracticeLabel(record?.examId || ""),
    studentEmail: normalizeEmail(record?.email || ""),
    signInMethod: oneLine(record?.signInMethod || "email") || "email",
    submittedAt: record?.submittedAt || "",
    studentFullName: record?.studentFullName || "",
    examId: record?.examId || "",
    reason: record?.reason || "",
    listeningTotal: section === "listening" ? scoreValue : null,
    listeningBand: section === "listening" ? bandValue : null,
    listeningTotalQuestions: section === "listening" ? totalQuestions : null,
    readingTotal: section === "reading" ? scoreValue : null,
    readingBand: section === "reading" ? bandValue : null,
    readingTotalQuestions: section === "reading" ? totalQuestions : null,
    finalWritingBand: null,
    speakingBand: null,
    overallBand: toRoundedOverallBand([
      section === "listening" ? bandValue : null,
      section === "reading" ? bandValue : null,
    ]),
    task1Words: null,
    task2Words: null,
    task1Band: null,
    task2Band: null,
    finalPayload: buildPracticeFinalPayload(record),
  };
}

function buildPracticeObjectiveDetail(record) {
  const section = String(record?.practiceSection || "");
  return {
    listening: section === "listening" ? (Array.isArray(record?.review) ? record.review : []) : [],
    reading: section === "reading" ? (Array.isArray(record?.review) ? record.review : []) : [],
  };
}

function buildPracticeHistoryRow(record) {
  const summary = summarizePracticeResultRecord(record);
  return {
    id: summary.id,
    practice_id: summary.id,
    user_id: "",
    user_email: normalizeEmail(record?.email || ""),
    student_full_name: summary.studentFullName || "",
    exam_id: summary.examId || "",
    active_test_id: record?.activeTestId || summary.examId || "",
    submitted_at: summary.submittedAt || "",
    reason: summary.reason || "",
    writing_task1: "",
    writing_task2: "",
    task1_words: 0,
    task2_words: 0,
    final_payload: summary.finalPayload,
    listening_total: summary.listeningTotal,
    listening_band: summary.listeningBand,
    reading_total: summary.readingTotal,
    reading_band: summary.readingBand,
    final_writing_band: null,
    speaking_band: summary.speakingBand,
    overall_band: summary.overallBand,
    task1_band: null,
    task2_band: null,
    task1_breakdown: null,
    task2_breakdown: null,
    task1_feedback: null,
    task2_feedback: null,
    overall_feedback: null,
    listening_total_questions: summary.listeningTotalQuestions,
    reading_total_questions: summary.readingTotalQuestions,
  };
}

async function savePracticeObjectiveResult(payload, auth, request, env) {
  if (!env?.STUDENT_REGISTRY) {
    return { ok: false, status: 503, error: "Student registry is not configured." };
  }

  const section = oneLine(payload?.section || payload?.skill || "").toLowerCase();
  const activeTestId = oneLine(payload?.activeTestId || payload?.testId || "").toLowerCase();
  const examId = oneLine(payload?.examId || "");
  const reason = oneLine(payload?.reason || `${section} section finished.`);
  const submittedAt = oneLine(payload?.submittedAt || new Date().toISOString());
  const studentFullName = oneLine(
    payload?.studentFullName ||
    auth?.user?.user_metadata?.name ||
    auth?.user?.user_metadata?.preferred_name ||
    deriveNameFromEmail(auth?.user?.email || "")
  );
  const email = normalizeEmail(auth?.user?.email || payload?.email || "");
  const signInMethod = oneLine(
    payload?.signInMethod ||
    auth?.user?.app_metadata?.provider ||
    auth?.user?.provider ||
    "email"
  ) || "email";
  const answers = payload?.answers && typeof payload.answers === "object" ? payload.answers : {};

  if (!email || !["listening", "reading"].includes(section) || !activeTestId || !examId || !studentFullName) {
    return { ok: false, status: 400, error: "Missing practice submission inputs." };
  }

  const answerMap = buildObjectiveAnswerMap(activeTestId, section);
  const questionNumbers = Object.keys(answers)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);
  const review = questionNumbers.map((q) => {
    const correctRaw = String(answerMap[q] || "").trim();
    const studentRaw = String(answers?.[q] ?? answers?.[String(q)] ?? "").trim();
    const isCorrect = matchesObjectiveAnswer(studentRaw, correctRaw);
    return {
      q,
      student: studentRaw,
      correct: correctRaw || "—",
      mark: isCorrect,
    };
  });

  const totalQuestions = review.length;
  const totalCorrect = review.filter((item) => item.mark).length;
  const answerHash = await sha256Base64Url(
    stableStringify({
      examId,
      activeTestId,
      section,
      submittedAt,
      email,
      answers,
    })
  );
  const id = `practice_${answerHash.slice(0, 24)}`;

  const record = {
    id,
    source: "practice-objective",
    practiceSection: section,
    practiceLabel: oneLine(payload?.practiceLabel || inferPracticeLabel(examId)),
    submittedAt,
    studentFullName,
    email,
    signInMethod,
    examId,
    activeTestId,
    reason,
    totalQuestions,
    totalCorrect,
    review,
    updatedAt: new Date().toISOString(),
  };

  await writeJsonKv(env.STUDENT_REGISTRY, `practice-result:${id}`, record);
  await writeJsonKv(env.STUDENT_REGISTRY, `practice-user:${email}:${id}`, record);

  return {
    ok: true,
    row: summarizePracticeResultRecord(record),
    result: buildPracticeObjectiveDetail(record),
  };
}

async function listJsonByPrefix(namespace, prefix, limit = 1000) {
  if (!namespace) return [];
  const listed = await namespace.list({ prefix, limit });
  const rows = [];
  for (const key of listed.keys || []) {
    const value = await readJsonKv(namespace, key.name);
    if (value) rows.push(value);
  }
  return rows;
}

async function getStudentPracticeRows(env, email) {
  if (!env?.STUDENT_REGISTRY || !email) return [];
  const records = await listJsonByPrefix(env.STUDENT_REGISTRY, `practice-user:${email}:`, 500);
  const rows = await Promise.all(records.map(async (record) => {
    const scoreMeta = await readSubmissionScoreMeta(env, record);
    const row = buildPracticeHistoryRow(record);
    row.speaking_band = toNullableBand(scoreMeta?.speakingBand);
    row.overall_band = toRoundedOverallBand([
      row.listening_band,
      row.reading_band,
      row.final_writing_band,
      row.speaking_band,
    ]);
    return row;
  }));
  return rows
    .sort((a, b) => Date.parse(String(b?.submitted_at || "")) - Date.parse(String(a?.submitted_at || "")));
}

async function getPracticeResultsSummary(env, options = {}) {
  const objectiveRows = (await listJsonByPrefix(env?.STUDENT_REGISTRY, "practice-result:", 1000))
    .map(summarizePracticeResultRecord);

  let backendRows = [];
  try {
    const summaries = await getAdminResultsSummary(env, options);
    backendRows = summaries
      .filter((row) => isPracticeExamId(row?.examId))
      .map((row) => ({
        ...row,
        source: "backend-practice",
        practiceSection: inferPracticeSection(row?.examId || ""),
        practiceLabel: inferPracticeLabel(row?.examId || ""),
        listeningTotalQuestions: row?.listeningTotal !== null && row?.listeningTotal !== undefined ? 40 : null,
        readingTotalQuestions: row?.readingTotal !== null && row?.readingTotal !== undefined ? 40 : null,
        finalPayload: {
          attemptKind: "practice",
          practiceSection: inferPracticeSection(row?.examId || ""),
          practiceLabel: inferPracticeLabel(row?.examId || ""),
          examId: row?.examId || "",
          submittedAt: row?.submittedAt || "",
          studentFullName: row?.studentFullName || "",
          reason: row?.reason || "",
        },
      }));
  } catch (err) {
    backendRows = [];
  }

  const merged = await Promise.all([...backendRows, ...objectiveRows].map(async (row) => {
    const scoreMeta = await readSubmissionScoreMeta(env, row);
    return mergeSummaryWithScoreMeta(row, scoreMeta);
  }));
  return merged.sort((a, b) => Date.parse(String(b?.submittedAt || "")) - Date.parse(String(a?.submittedAt || "")));
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
  backendUrl.searchParams.set("t", String(Date.now()));

  const signedBackendUrl = await buildSignedAppsScriptUrl(backendUrl.toString(), "GET", "", env);
  const response = await fetch(signedBackendUrl, { method: "GET" });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data || data.ok !== true || !Array.isArray(data.results)) {
    throw new Error(data?.error || "Could not load admin results summary.");
  }

  const summaries = await Promise.all(data.results.map(async (row) => {
    const summary = summarizeAdminResultRow(row);
    const scoreMeta = await readSubmissionScoreMeta(env, summary);
    return mergeSummaryWithScoreMeta(summary, scoreMeta);
  }));
  setCachedAdminResultsSummary(cacheKey, summaries);
  return summaries;
}

function summarizeAdminResultRow(row) {
  const task1Words = toNullableNumber(row?.task1Words ?? row?.task1_words);
  const task2Words = toNullableNumber(row?.task2Words ?? row?.task2_words);
  const task1Band = toNullableBand(row?.task1Band || row?.task1_band || "");
  const task2Band = toNullableBand(row?.task2Band || row?.task2_band || "");
  const finalWritingBand = toEffectiveWritingBand({
    finalWritingBand: row?.finalWritingBand ?? row?.final_writing_band,
    task1Words,
    task2Words,
    task1Band,
    task2Band,
  });
  return {
    submittedAt: oneLine(row?.submittedAt || row?.submitted_at || ""),
    studentFullName: oneLine(row?.studentFullName || row?.student_full_name || ""),
    examId: oneLine(row?.examId || row?.exam_id || row?.active_test_id || ""),
    reason: oneLine(row?.reason || ""),
    listeningTotal: toNullableNumber(row?.listeningTotal ?? row?.listening_total),
    listeningBand: toNullableBand(row?.listeningBand || row?.listening_band || ""),
    readingTotal: toNullableNumber(row?.readingTotal ?? row?.reading_total),
    readingBand: toNullableBand(row?.readingBand || row?.reading_band || ""),
    finalWritingBand,
    speakingBand: toNullableBand(row?.speakingBand || row?.speaking_band || ""),
    overallBand: toNullableBand(row?.overallBand || row?.overall_band || "") ?? toRoundedOverallBand([
      row?.listeningBand ?? row?.listening_band,
      row?.readingBand ?? row?.reading_band,
      finalWritingBand,
      row?.speakingBand ?? row?.speaking_band,
    ]),
    task1Words,
    task2Words,
    task1Band,
    task2Band,
  };
}

function compareAdminSummaryRows(a, b, field, direction) {
  const dir = String(direction || "desc").toLowerCase() === "asc" ? 1 : -1;
  let av = a?.[field];
  let bv = b?.[field];

  if (field === "submittedAt") {
    av = toTimestamp(av);
    bv = toTimestamp(bv);
  } else if (["listeningTotal", "readingTotal", "task1Words", "task2Words", "finalWritingBand", "task1Band", "task2Band", "speakingBand", "overallBand"].includes(field)) {
    av = toSortableNumber(av);
    bv = toSortableNumber(bv);
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

function toNullableNumber(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

function toNullableBand(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

function toSortableNumber(value) {
  const n = toNullableNumber(value);
  return n === null ? -1 : n;
}

function toEffectiveWritingBand(row) {
  const finalBand = toNullableBand(row?.finalWritingBand);
  const task1Words = toNullableNumber(row?.task1Words);
  const task2Words = toNullableNumber(row?.task2Words);
  const task1Band = toNullableBand(row?.task1Band);
  const task2Band = toNullableBand(row?.task2Band);
  const hasTask1 = task1Words !== null && task1Words > 0;
  const hasTask2 = task2Words !== null && task2Words > 0;

  if (!hasTask1 && !hasTask2) return null;
  if (hasTask1 && hasTask2) {
    if (finalBand !== null) return finalBand;
    if (task1Band !== null && task2Band !== null) {
      return Math.round(((task1Band + task2Band) / 2) * 2) / 2;
    }
    return task1Band ?? task2Band ?? null;
  }
  if (hasTask1) return task1Band;
  if (hasTask2) return task2Band;
  return null;
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
