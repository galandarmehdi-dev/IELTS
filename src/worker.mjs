import { EmailMessage } from "cloudflare:email";
import { OBJECTIVE_ANSWER_KEYS } from "./objectiveAnswerKeys.mjs";
import { getProtectedTestContent } from "./protectedTestContent.mjs";

const OBJECTIVE_DETAIL_CACHE = new Map();
const OBJECTIVE_DETAIL_TTL_MS = 5 * 60 * 1000;
const ADMIN_RESULTS_SUMMARY_CACHE = new Map();
const ADMIN_RESULTS_SUMMARY_TTL_MS = 5 * 60 * 1000;
const ADMIN_RESULTS_SUMMARY_FETCH_TIMEOUT_MS = 30 * 1000;
const ADMIN_RESULT_DETAIL_FETCH_TIMEOUT_MS = 20 * 1000;
const DEFAULT_PRIMARY_ORGANIZATION_ID = "ieltsmock";
const DEFAULT_PRIMARY_TENANT_HOST = "ieltsmock.org";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const unknownTenantResponse = rejectUnknownTenant(request, env);
    if (unknownTenantResponse) return unknownTenantResponse;

    if (url.pathname === "/api/contact") {
      return handleContactApi(request, env);
    }

    if (url.pathname === "/api/auth/shared-login") {
      return handleSharedStudentLogin(request, env);
    }

    if (url.pathname === "/api/auth/shared-bypass") {
      return handleSharedStudentBypass(request, env);
    }

    if (url.pathname === "/api/auth/student-id-login") {
      return handleStudentIdLogin(request, env);
    }

    if (url.pathname === "/api/auth/student-profile") {
      return handleStudentProfileApi(request, env);
    }

    if (url.pathname === "/api/auth/student-link") {
      return handleStudentLinkApi(request, env);
    }

    if (url.pathname === "/api/auth/shared-setup") {
      return handleSharedStudentSetup(request, env);
    }

    if (url.pathname === "/api/test-password/verify") {
      return handleTestPasswordVerify(request, env);
    }

    if (url.pathname === "/api/test-content") {
      return handleProtectedTestContentApi(request, env);
    }

    if (url.pathname === "/api/test-content-script") {
      return handleProtectedTestContentScriptApi(request, env);
    }

    if (url.pathname === "/api/admin") {
      return handleAdminApi(request, env);
    }

    const response = await env.ASSETS.fetch(request);
    return applyDocumentSecurityHeaders(response);
  },
};

function normalizeOrganizationId(value, fallback = "") {
  return String(value || fallback || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseJsonEnvObject(value) {
  if (!String(value || "").trim()) return {};
  try {
    const parsed = JSON.parse(String(value || ""));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (e) {
    return {};
  }
}

function getPrimaryTenantHost(env) {
  return oneLine(env?.PRIMARY_TENANT_HOST || DEFAULT_PRIMARY_TENANT_HOST).toLowerCase();
}

function getPrimaryOrganizationId(env) {
  return normalizeOrganizationId(env?.PRIMARY_ORGANIZATION_ID, DEFAULT_PRIMARY_ORGANIZATION_ID);
}

function getTenantHostMap(env) {
  const configured = parseJsonEnvObject(env?.TENANT_HOST_MAP);
  const out = {};
  Object.entries(configured).forEach(([host, raw]) => {
    const hostname = oneLine(host || "").toLowerCase();
    if (!hostname) return;
    const organizationId =
      typeof raw === "string"
        ? normalizeOrganizationId(raw)
        : normalizeOrganizationId(raw?.organizationId || raw?.organization_id || "");
    if (!organizationId) return;
    out[hostname] = {
      organizationId,
      name: oneLine(raw?.name || "") || organizationId,
      logoUrl: oneLine(raw?.logoUrl || raw?.logo_url || ""),
    };
  });
  const primaryHost = getPrimaryTenantHost(env);
  if (primaryHost && !out[primaryHost]) {
    out[primaryHost] = {
      organizationId: getPrimaryOrganizationId(env),
      name: "IELTS Mock Practice Portal",
      logoUrl: "",
    };
  }
  if (primaryHost && primaryHost.startsWith("www.") && !out[primaryHost.slice(4)]) {
    out[primaryHost.slice(4)] = out[primaryHost];
  } else if (primaryHost && !primaryHost.startsWith("www.") && !out[`www.${primaryHost}`]) {
    out[`www.${primaryHost}`] = out[primaryHost];
  }
  return out;
}

function resolveTenantContext(request, env) {
  const url = new URL(request.url);
  const hostname = oneLine(url.hostname || "").toLowerCase();
  const hostMap = getTenantHostMap(env);
  const primaryHost = getPrimaryTenantHost(env);
  const primaryOrganizationId = getPrimaryOrganizationId(env);
  const workersFallbackHosts = new Set(["localhost", "127.0.0.1"]);

  const mapped = hostMap[hostname]
    || (hostname.startsWith("www.") ? hostMap[hostname.slice(4)] : null)
    || ((!hostname || workersFallbackHosts.has(hostname) || hostname.endsWith(".workers.dev"))
      ? hostMap[primaryHost] || {
        organizationId: primaryOrganizationId,
        name: "IELTS Mock Practice Portal",
        logoUrl: "",
      }
      : null);

  const organizationId = normalizeOrganizationId(mapped?.organizationId || "");
  return {
    hostname,
    organizationId,
    name: oneLine(mapped?.name || "") || organizationId || "Tenant",
    logoUrl: oneLine(mapped?.logoUrl || ""),
    isConfigured: !!organizationId,
    isPrimaryTenant: organizationId === primaryOrganizationId,
  };
}

function rejectUnknownTenant(request, env) {
  const tenant = resolveTenantContext(request, env);
  if (tenant.isConfigured) return null;
  return json(404, {
    ok: false,
    error: "This tenant domain is not configured.",
    hostname: tenant.hostname,
  });
}

function getTenantAdminMap(env) {
  const configured = parseJsonEnvObject(env?.TENANT_ADMIN_MAP);
  const out = {};
  Object.entries(configured).forEach(([email, raw]) => {
    const normalizedEmail = normalizeEmail(email);
    const organizationId =
      typeof raw === "string"
        ? normalizeOrganizationId(raw)
        : normalizeOrganizationId(raw?.organizationId || raw?.organization_id || "");
    if (!normalizedEmail || !organizationId) return;
    out[normalizedEmail] = organizationId;
  });
  return out;
}

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

async function handleProtectedTestContentApi(request, env) {
  if (request.method !== "GET") {
    return json(405, { ok: false, error: "Method not allowed." });
  }

  const auth = await authenticateUser(request, env);
  if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });

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

async function handleProtectedTestContentScriptApi(request, env) {
  if (request.method !== "GET") {
    return json(405, { ok: false, error: "Method not allowed." });
  }

  const auth = await authenticateUser(request, env);
  if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });

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

  const tenant = resolveTenantContext(request, env);
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
  const linkedProfile = hasPersonalPassword
    ? null
    : await getStudentProfileByLinkedEmail(env, email, tenant.organizationId).catch(() => null);
  const hasLinkedProfilePassword = !!(
    linkedProfile &&
    String(linkedProfile.personal_password_hash || "").trim() &&
    String(linkedProfile.personal_password_salt || "").trim()
  );

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
  } else if (hasLinkedProfilePassword) {
    const matches = await verifyStudentProfilePassword(
      linkedProfile,
      oneLine(linkedProfile?.student_id_code || ""),
      password,
      email
    );
    if (!matches) {
      await logSecurityEvent(env, request, "shared_login_wrong_linked_profile_password", { email });
      return json(401, { ok: false, error: "Wrong email or password." });
    }
  } else if (!password || password !== expectedPassword) {
    await logSecurityEvent(env, request, "shared_login_wrong_password", { email });
    return json(401, { ok: false, error: "Wrong shared password." });
  }

  const linkedPublicProfile = linkedProfile ? publicStudentProfile(linkedProfile) : (current?.studentProfile || null);
  const displayName = oneLine(
    linkedPublicProfile?.fullName ||
    current?.fullName ||
    deriveNameFromEmail(email)
  );
  const setupCompleted = !!(
    hasPersonalPassword ||
    hasLinkedProfilePassword ||
    (linkedPublicProfile && oneLine(linkedPublicProfile.fullName || ""))
  );
  const token = await issueSharedStudentToken(email, env, {
    mode: setupCompleted ? "student" : "setup",
    organizationId: tenant.organizationId,
  });
  const user = buildSharedStudentUser(email, {
    fullName: displayName,
    firstName: current?.firstName || "",
    lastName: current?.lastName || "",
    setupCompleted,
    organizationId: tenant.organizationId,
    studentProfile: linkedPublicProfile || null,
  });

  await upsertStudentRegistry(env, {
    email,
    fullName: displayName,
    firstName: current?.firstName || "",
    lastName: current?.lastName || "",
    provider: "shared-password",
    isSharedPassword: true,
    organizationId: tenant.organizationId,
    studentProfile: linkedPublicProfile || null,
  });

  return json(200, { ok: true, token, user, setupCompleted, requiresSetup: !setupCompleted });
}

async function handleSharedStudentBypass(request, env) {
  if (request.method !== "POST") {
    return json(405, { ok: false, error: "Method not allowed." });
  }

  const tenant = resolveTenantContext(request, env);
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
  const token = await issueSharedStudentToken(email, env, {
    mode: "setup",
    bypass: true,
    organizationId: tenant.organizationId,
  });
  const user = buildSharedStudentUser(email, {
    fullName: displayName,
    firstName: current?.firstName || "",
    lastName: current?.lastName || "",
    setupCompleted: false,
    organizationId: tenant.organizationId,
    studentProfile: current?.studentProfile || null,
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

async function handleStudentIdLogin(request, env) {
  if (request.method !== "POST") {
    return json(405, { ok: false, error: "Method not allowed." });
  }

  const tenant = resolveTenantContext(request, env);
  const payload = await request.json().catch(() => null);
  const studentIdCode = oneLine(payload?.studentIdCode || payload?.student_id_code || "");
  const rate = await consumeRateLimit(
    env,
    `rate:student-id-login:${buildRateLimitScope(request, studentIdCode)}`,
    { limit: 8, windowMs: 10 * 60 * 1000 }
  );
  if (!rate.allowed) {
    await logSecurityEvent(env, request, "student_id_login_rate_limited", { studentIdCode });
    return json(429, { ok: false, error: "Too many sign-in attempts. Please wait and try again." });
  }
  if (!studentIdCode) {
    return json(400, { ok: false, error: "Please enter the Student ID." });
  }

  const profile = await getStudentProfileByCode(env, studentIdCode, tenant.organizationId);
  if (!profile) {
    await logSecurityEvent(env, request, "student_id_login_missing_profile", { studentIdCode });
    return json(404, { ok: false, error: "Student ID not found. Please check it or contact your teacher." });
  }
  if (profile.is_active === false) {
    return json(403, { ok: false, error: "This Student ID is not active. Please contact your teacher/admin." });
  }

  const publicProfile = publicStudentProfile(profile);
  const loginEmail = buildStudentProfileLoginEmail(publicProfile);
  const token = await issueSharedStudentToken(loginEmail, env, {
    mode: "student",
    organizationId: tenant.organizationId,
    studentIdCode: publicProfile.studentIdCode,
  });
  const user = buildSharedStudentUser(loginEmail, {
    fullName: publicProfile.fullName,
    firstName: publicProfile.name,
    lastName: publicProfile.surname,
    setupCompleted: true,
    organizationId: tenant.organizationId,
    studentProfile: publicProfile,
  });

  await upsertStudentRegistry(env, {
    email: loginEmail,
    fullName: publicProfile.fullName,
    firstName: publicProfile.name,
    lastName: publicProfile.surname,
    provider: "student-id",
    isSharedPassword: true,
    organizationId: publicProfile.organizationId || tenant.organizationId,
    studentProfile: publicProfile,
    setupCompleted: true,
  });

  return json(200, { ok: true, token, user, setupCompleted: true, requiresSetup: false });
}

async function handleStudentProfileApi(request, env) {
  if (request.method !== "GET") return json(405, { ok: false, error: "Method not allowed." });
  const auth = await authenticateUser(request, env);
  if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });
  const url = new URL(request.url);
  const studentIdCode = oneLine(url.searchParams.get("studentIdCode") || "");
  const organizationId = getActorOrganizationId(auth) || resolveTenantContext(request, env).organizationId;
  const identity = buildAuthLinkIdentity(auth);

  if (studentIdCode) {
    const profile = await getStudentProfileByCode(env, studentIdCode, organizationId);
    if (!profile) return json(404, { ok: false, error: "Student ID not found." });
    return json(200, { ok: true, profile: publicStudentProfile(profile) });
  }

  let profile = await getStudentProfileByAuth(env, identity, organizationId);
  if (!profile && identity.email) {
    profile = await getStudentProfileByLinkedEmail(env, identity.email, organizationId);
    if (profile) {
      profile = await updateStudentProfileById(env, profile.id, {
        linked_auth_user_id: identity.userId || null,
        linked_auth_identity: identity.identity,
        linked_auth_email: identity.email || null,
        linked_at: profile.linked_at || new Date().toISOString(),
      }).catch(() => profile);
    }
  }
  if (!profile && auth.kind === "shared" && auth.user?.student_id_code) {
    profile = await getStudentProfileByCode(env, auth.user.student_id_code, organizationId);
  }
  return json(200, {
    ok: true,
    profile: profile ? publicStudentProfile(profile) : null,
    required: String(env.CLASSROOM_IDENTITY_REQUIRED || "").trim().toLowerCase() === "true",
  });
}

async function handleStudentLinkApi(request, env) {
  if (request.method !== "POST") return json(405, { ok: false, error: "Method not allowed." });
  const auth = await authenticateUser(request, env);
  if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });
  const payload = await request.json().catch(() => null);
  const studentIdCode = oneLine(payload?.studentIdCode || payload?.student_id_code || "");
  const password = String(payload?.password || "");
  if (!studentIdCode) return json(400, { ok: false, error: "Student ID is required." });
  if (!password || password.length < 6) return json(400, { ok: false, error: "Enter your student password with at least 6 characters." });

  const organizationId = getActorOrganizationId(auth) || resolveTenantContext(request, env).organizationId;
  const profile = await getStudentProfileByCode(env, studentIdCode, organizationId);
  if (!profile) return json(404, { ok: false, error: "Student ID not found. Please check it or contact your teacher." });
  if (profile.is_active === false) return json(403, { ok: false, error: "This Student ID is not active. Please contact your teacher/admin." });

  const identity = buildAuthLinkIdentity(auth);
  const hasExistingStudentPassword =
    String(profile.personal_password_hash || "").trim() &&
    String(profile.personal_password_salt || "").trim();

  if (hasExistingStudentPassword) {
    const passwordOk = await verifyStudentProfilePassword(profile, studentIdCode, password, identity.email || "");
    if (!passwordOk) {
      return json(401, { ok: false, error: "Student ID or student password is incorrect." });
    }
  }

  const previouslyLinkedProfile = await getStudentProfileByAuth(env, identity, organizationId);
  if (previouslyLinkedProfile?.id && previouslyLinkedProfile.id !== profile.id) {
    await updateStudentProfileById(env, previouslyLinkedProfile.id, {
      linked_auth_user_id: null,
      linked_auth_identity: null,
      linked_auth_email: null,
      linked_at: null,
    });
  }

  const salt = generateStudentPasswordSalt();
  const passwordHash = await hashStudentPassword(studentIdCode, password, salt);
  const updated = await updateStudentProfileById(env, profile.id, {
    personal_password_hash: passwordHash,
    personal_password_salt: salt,
    linked_auth_user_id: identity.userId || null,
    linked_auth_identity: identity.identity,
    linked_auth_email: identity.email || null,
    linked_at: new Date().toISOString(),
  });
  const publicProfile = publicStudentProfile(updated || profile);
  await upsertStudentRegistry(env, {
    email: identity.email,
    fullName: publicProfile.fullName,
    provider: auth.kind === "shared" ? "shared-password" : oneLine(auth?.user?.app_metadata?.provider || "email"),
    isSharedPassword: auth.kind === "shared",
    organizationId: publicProfile.organizationId || organizationId,
    studentProfile: publicProfile,
    setupCompleted: true,
    passwordHash,
    passwordSalt: salt,
  });
  return json(200, {
    ok: true,
    profile: publicProfile,
    message: hasExistingStudentPassword
      ? "Student account verified and linked to this sign-in."
      : "Student ID linked successfully.",
  });
}

async function getLinkedPublicProfileForAuth(env, auth, organizationId = "") {
  const resolvedOrganizationId = organizationId || getActorOrganizationId(auth);
  const identity = buildAuthLinkIdentity(auth);
  let profile = await getStudentProfileByAuth(env, identity, resolvedOrganizationId);
  if (!profile && identity.email) {
    profile = await getStudentProfileByLinkedEmail(env, identity.email, resolvedOrganizationId);
  }
  if (!profile && auth?.kind === "shared" && auth?.user?.student_id_code) {
    profile = await getStudentProfileByCode(env, auth.user.student_id_code, resolvedOrganizationId);
  }
  return profile ? publicStudentProfile(profile) : null;
}

async function applyStudentProfileToSubmissionPayload(env, auth, payload, organizationId = "") {
  if (!payload || typeof payload !== "object") return payload;
  const profile = await getLinkedPublicProfileForAuth(env, auth, organizationId).catch(() => null);
  if (!profile) return payload;
  const loginEmail = normalizeEmail(auth?.user?.email || payload.loginEmail || payload.studentEmail || "");
  const fullName = profile.fullName || oneLine(payload.studentFullName || "");
  payload.studentProfileId = profile.id || payload.studentProfileId || "";
  payload.studentIdCode = profile.studentIdCode || payload.studentIdCode || "";
  payload.classroomId = profile.classroomId || payload.classroomId || "";
  payload.classroomName = profile.classroomName || payload.classroomName || "";
  payload.officialEmail = profile.officialEmail || payload.officialEmail || "";
  payload.loginEmail = loginEmail || payload.loginEmail || "";
  payload.studentFullName = fullName || payload.studentFullName || "";
  // Apps Script result emails use studentEmail. For linked classroom students, send to the teacher-preassigned official email.
  payload.studentEmail = profile.officialEmail || normalizeEmail(payload.studentEmail || loginEmail);
  if (payload.writing && typeof payload.writing === "object") {
    payload.writing.studentFullName = payload.studentFullName;
    payload.writing.studentProfileId = payload.studentProfileId;
    payload.writing.studentIdCode = payload.studentIdCode;
    payload.writing.classroomId = payload.classroomId;
    payload.writing.classroomName = payload.classroomName;
    payload.writing.officialEmail = payload.officialEmail;
  }
  return payload;
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
    organizationId: auth.organizationId || current.organizationId || getPrimaryOrganizationId(env),
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

  const token = await issueSharedStudentToken(email, env, {
    mode: "student",
    organizationId: auth.organizationId,
  });
  const user = buildSharedStudentUser(email, {
    fullName,
    firstName,
    lastName,
    setupCompleted: true,
    organizationId: auth.organizationId,
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

  const configuredPassword = String(env.TEST_ENTRY_PASSWORD || "").trim();
  if (!configuredPassword) {
    return json(503, { ok: false, error: "Test password is not configured yet." });
  }

  const payload = await request.json().catch(() => null);
  const password = String(payload?.password || "").trim();

  if (!password) {
    return json(400, { ok: false, error: "Please enter the test password." });
  }

  if (password === configuredPassword) {
    return json(200, { ok: true });
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

  await logSecurityEvent(env, request, "test_password_wrong", {});
  return json(401, { ok: false, error: "Wrong password. Please try again." });
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
    return json(200, {
      ok: true,
      authorized: true,
      email: auth.user.email || "",
      role: auth.role || "super_admin",
      organizationId: getActorOrganizationId(auth),
      tenant: auth.tenant || resolveTenantContext(request, env),
      isSuperAdmin: auth.isSuperAdmin === true,
    });
  }

  if (request.method === "GET" && action === "tenantBootstrap") {
    const tenant = resolveTenantContext(request, env);
    return json(200, {
      ok: true,
      tenant,
    });
  }

  if (request.method === "GET" && action === "classroomStudents") {
    const auth = await authenticateAdmin(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });
    return handleAdminClassroomStudents(request, env, auth);
  }

  if (request.method === "GET" && action === "classroomProgress") {
    const auth = await authenticateAdmin(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });
    return handleAdminClassroomProgress(request, env, auth);
  }

  if (request.method === "GET" && action === "classroomStudentProgress") {
    const auth = await authenticateAdmin(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });
    return handleAdminClassroomStudentProgress(request, env, auth);
  }

  if (request.method === "POST" && action === "backfillStudentHistory") {
    const auth = await authenticateAdmin(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });
    return handleAdminBackfillStudentHistory(request, env, auth);
  }

  if (request.method === "POST" && action === "saveClassroom") {
    const auth = await authenticateAdmin(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });
    return handleAdminSaveClassroom(request, env, auth);
  }

  if (request.method === "POST" && action === "saveStudentProfile") {
    const auth = await authenticateAdmin(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });
    return handleAdminSaveStudentProfile(request, env, auth);
  }

  if (request.method === "POST" && action === "assignStudentCodeFromResult") {
    const auth = await authenticateAdmin(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });
    return handleAdminAssignStudentCodeFromResult(request, env, auth);
  }

  if (request.method === "POST" && action === "resetStudentProfileLink") {
    const auth = await authenticateAdmin(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });
    return handleAdminResetStudentProfileLink(request, env, auth);
  }

  if (request.method === "GET" && action === "results") {
    const auth = await authenticateAdmin(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });
    if (!auth.isSuperAdmin) {
      return json(403, { ok: false, error: "Tenant admins must use the filtered results summary flow." });
    }

    const backendUrl = new URL(env.ADMIN_BACKEND_URL);
    backendUrl.searchParams.set("action", "results");
    backendUrl.searchParams.set("t", String(Date.now()));
    return proxy(request, backendUrl.toString(), env);
  }

  if (request.method === "GET" && action === "resultsSummary") {
    const auth = await authenticateAdmin(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });
    const forceRefresh = url.searchParams.get("refresh") === "1";

    const cacheUrl = buildAdminResultsSummaryCacheUrl(url, auth);
    const cache = caches.default;
    const cacheRequest = new Request(cacheUrl.toString(), { method: "GET" });
    const cachedResponse = await cache.match(cacheRequest);
    if (cachedResponse) {
      if (!forceRefresh) return cachedResponse;
    }

    const search = normalizeMatchString(url.searchParams.get("q") || "");
    const examFilter = oneLine(url.searchParams.get("examId") || "");
    const monthFilter = oneLine(url.searchParams.get("month") || "");
    const yearFilter = oneLine(url.searchParams.get("year") || "");
    const sortValue = oneLine(url.searchParams.get("sort") || "submittedAt_desc");
    const limitValue = Number(url.searchParams.get("limit") || 0);

    let summaries;
    try {
      summaries = await getAdminResultsSummary(env, {
        forceRefresh,
        actor: auth,
      });
    } catch (error) {
      const staleSummaries = getAnyCachedAdminResultsSummary(auth?.isSuperAdmin ? "all:super" : `all:${getActorOrganizationId(auth) || "public"}`);
      if (staleSummaries?.length) {
        summaries = staleSummaries;
      } else if (cachedResponse) {
        return cachedResponse;
      } else {
        return json(502, { ok: false, error: error?.message || "Could not load admin results summary." });
      }
    }
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
    await cache.put(cacheRequest, response.clone()).catch(() => null);
    return response;
  }

  if (request.method === "GET" && action === "practiceResultsSummary") {
    const auth = await authenticateAdmin(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });
    const rows = await getPracticeResultsSummary(env, {
      forceRefresh: url.searchParams.get("refresh") === "1",
      actor: auth,
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
    const submissionLookup = {
      submittedAt: oneLine(url.searchParams.get("submittedAt") || ""),
      studentFullName: oneLine(url.searchParams.get("studentFullName") || ""),
      examId: oneLine(url.searchParams.get("examId") || ""),
      reason: oneLine(url.searchParams.get("reason") || ""),
    };
    const submissionOrganizationId = await inferSubmissionOrganizationId(env, submissionLookup, getActorOrganizationId(auth));
    if (!canActorAccessOrganization(auth, submissionOrganizationId)) {
      return json(403, { ok: false, error: "This result does not belong to the current tenant." });
    }

    const backendUrl = new URL(env.ADMIN_BACKEND_URL);
    backendUrl.searchParams.set("action", "studentResult");
    backendUrl.searchParams.set("submittedAt", submissionLookup.submittedAt);
    backendUrl.searchParams.set("studentFullName", submissionLookup.studentFullName);
    backendUrl.searchParams.set("examId", submissionLookup.examId);
    backendUrl.searchParams.set("reason", submissionLookup.reason);
    backendUrl.searchParams.set("t", String(Date.now()));
    const signedBackendUrl = await buildSignedAppsScriptUrl(backendUrl.toString(), "GET", "", env);
    const { data } = await fetchAppsScriptJsonWithRetry(signedBackendUrl, {
      method: "GET",
      headers: await filteredProxyHeaders(request, env, signedBackendUrl),
      retries: 2,
      timeoutMs: ADMIN_RESULT_DETAIL_FETCH_TIMEOUT_MS,
    });
    const scoreMeta = await readSubmissionScoreMeta(env, submissionLookup);
    const mergedResult = data.result ? mergeSummaryWithScoreMeta(data.result, scoreMeta) : data.result;
    return json(200, { ...data, result: mergedResult });
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
    const scopedStudents = auth.isSuperAdmin
      ? students
      : students.filter((value) => {
        const actorOrganizationId = getActorOrganizationId(auth);
        const orgs = Array.isArray(value?.organizationIds)
          ? value.organizationIds.map((entry) => normalizeOrganizationId(entry)).filter(Boolean)
          : [normalizeOrganizationId(value?.organizationId || "")].filter(Boolean);
        return orgs.includes(actorOrganizationId);
      });
    scopedStudents.sort((a, b) => Date.parse(String(b?.lastSeenAt || "")) - Date.parse(String(a?.lastSeenAt || "")));
    return json(200, { ok: true, students: scopedStudents });
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

    const submissionLookup = {
      submittedAt: oneLine(url.searchParams.get("submittedAt") || ""),
      studentFullName: oneLine(url.searchParams.get("studentFullName") || ""),
      examId: oneLine(url.searchParams.get("examId") || ""),
      reason: oneLine(url.searchParams.get("reason") || ""),
    };
    const owned = await authorizeStudentSubmissionAccess(submissionLookup, auth, request, env);
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
    const scoreMeta = await readSubmissionScoreMeta(env, submissionLookup);
    const mergedResult = data.result ? mergeSummaryWithScoreMeta(data.result, scoreMeta) : data.result;
    return json(200, { ...data, result: mergedResult });
  }

  if (request.method === "GET" && action === "studentResultBundle") {
    const auth = await authenticateUser(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });

    const submissionLookup = {
      submittedAt: oneLine(url.searchParams.get("submittedAt") || ""),
      studentFullName: oneLine(url.searchParams.get("studentFullName") || ""),
      examId: oneLine(url.searchParams.get("examId") || ""),
      reason: oneLine(url.searchParams.get("reason") || ""),
    };
    const owned = await authorizeStudentSubmissionAccess(submissionLookup, auth, request, env);
    if (!owned.ok) return json(owned.status, { ok: false, error: owned.error });

    const resultBackendUrl = new URL(env.ADMIN_BACKEND_URL);
    resultBackendUrl.search = url.search;
    resultBackendUrl.searchParams.set("action", "studentResult");
    const signedResultUrl = await buildSignedAppsScriptUrl(resultBackendUrl.toString(), "GET", "", env);

    const objectiveBackendUrl = new URL(env.ADMIN_BACKEND_URL);
    objectiveBackendUrl.search = url.search;
    objectiveBackendUrl.searchParams.set("action", "studentObjectiveDetail");
    const signedObjectiveUrl = await buildSignedAppsScriptUrl(objectiveBackendUrl.toString(), "GET", "", env);

    const [resultResponse, objectiveResponse] = await Promise.all([
      fetch(signedResultUrl, {
        method: "GET",
        headers: await filteredProxyHeaders(request, env, signedResultUrl),
      }).catch(() => null),
      fetch(signedObjectiveUrl, {
        method: "GET",
        headers: await filteredProxyHeaders(request, env, signedObjectiveUrl),
      }).catch(() => null),
    ]);

    const resultData = await resultResponse?.json?.().catch(() => null);
    if (!resultResponse?.ok || !resultData || resultData.ok !== true) {
      return json(resultResponse?.ok ? 502 : (resultResponse?.status || 502), {
        ok: false,
        error: resultData?.error || "Could not load student result bundle.",
      });
    }

    const objectiveData = await objectiveResponse?.json?.().catch(() => null);
    const scoreMeta = await readSubmissionScoreMeta(env, submissionLookup);
    const mergedResult = resultData.result ? mergeSummaryWithScoreMeta(resultData.result, scoreMeta) : resultData.result;
    const objectiveResult = objectiveResponse?.ok && objectiveData?.ok === true && objectiveData?.result
      ? objectiveData.result
      : null;

    if (objectiveResult) {
      setCachedObjectiveDetail(buildObjectiveDetailCacheKey(url.searchParams), objectiveResult);
    }

    return json(200, {
      ok: true,
      graded: resultData.graded === true,
      result: mergedResult,
      objective: objectiveResult,
    });
  }

  if (request.method === "GET" && action === "studentResultsSummary") {
    const auth = await authenticateUser(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });

    const email = normalizeEmail(auth?.user?.email || "");
    if (!email) return json(400, { ok: false, error: "Missing student email." });

  const tenant = resolveTenantContext(request, env);
  const linkedProfile = await getLinkedPublicProfileForAuth(env, auth, tenant.organizationId).catch(() => null);
  const summaries = await getAdminResultsSummary(env, {
    forceRefresh: url.searchParams.get("refresh") === "1",
    actor: { isSuperAdmin: false, organizationId: tenant.organizationId, tenant },
  });
  const fullRows = summaries.filter((row) => !isPracticeExamId(row?.examId));
  const owned = [];
  for (const row of fullRows) {
      if (await studentOwnsSubmission(row, email, env, tenant.organizationId, linkedProfile)) owned.push(row);
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

    const submissionLookup = {
      submittedAt: url.searchParams.get("submittedAt") || "",
      studentFullName: url.searchParams.get("studentFullName") || "",
      examId: url.searchParams.get("examId") || "",
      reason: url.searchParams.get("reason") || "",
    };
    const keys = buildSubmissionLookupKeys(submissionLookup, getActorOrganizationId(auth));
    if (!keys.length) return json(400, { ok: false, error: "Missing submission lookup fields." });

    let record = null;
    for (const key of keys) {
      record = await readJsonKv(env.STUDENT_REGISTRY, `submission:${key}`);
      if (record) break;
    }
    const submissionOrganizationId = normalizeOrganizationId(record?.organizationId || getActorOrganizationId(auth));
    if (record && !canActorAccessOrganization(auth, submissionOrganizationId)) {
      return json(403, { ok: false, error: "This result does not belong to the current tenant." });
    }
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
    const submissionOrganizationId = await inferSubmissionOrganizationId(
      env,
      { submittedAt, studentFullName, examId, reason },
      getActorOrganizationId(auth)
    );
    if (!canActorAccessOrganization(auth, submissionOrganizationId)) {
      return json(403, { ok: false, error: "This result does not belong to the current tenant." });
    }
    const meta = await writeSubmissionScoreMeta(
      env,
      { submittedAt, studentFullName, examId, reason, organizationId: submissionOrganizationId },
      { speakingBand, organizationId: submissionOrganizationId }
    );
    try { ADMIN_RESULTS_SUMMARY_CACHE.clear(); } catch (e) {}
    return json(200, { ok: true, speakingBand, meta });
  }

  if (request.method === "POST" && action === "adminResultWritingScore") {
    const auth = await authenticateAdmin(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });
    const payload = await request.json().catch(() => null);
    const submittedAt = oneLine(payload?.submittedAt || "");
    const studentFullName = oneLine(payload?.studentFullName || "");
    const examId = oneLine(payload?.examId || "");
    const reason = oneLine(payload?.reason || "");
    if (!submittedAt || !studentFullName || !examId) {
      return json(400, { ok: false, error: "Missing result lookup fields." });
    }

    const submissionLookup = { submittedAt, studentFullName, examId, reason };
    const backendUrl = new URL(env.ADMIN_BACKEND_URL);
    backendUrl.searchParams.set("action", "studentResult");
    backendUrl.searchParams.set("submittedAt", submittedAt);
    backendUrl.searchParams.set("studentFullName", studentFullName);
    backendUrl.searchParams.set("examId", examId);
    backendUrl.searchParams.set("reason", reason);
    backendUrl.searchParams.set("t", String(Date.now()));
    const signedBackendUrl = await buildSignedAppsScriptUrl(backendUrl.toString(), "GET", "", env);
    const { data } = await fetchAppsScriptJsonWithRetry(signedBackendUrl, {
      method: "GET",
      headers: await filteredProxyHeaders(request, env, signedBackendUrl),
      retries: 1,
      timeoutMs: ADMIN_RESULT_DETAIL_FETCH_TIMEOUT_MS,
    });
    const existing = data?.result || {};
    const backendHasWritingGrade =
      toNullableBand(existing?.task1Band) !== null ||
      toNullableBand(existing?.task2Band) !== null ||
      toNullableBand(existing?.finalWritingBand) !== null;
    if (backendHasWritingGrade) {
      return json(409, {
        ok: false,
        error: "Writing grades already exist for this submission and cannot be edited here.",
      });
    }

    const task1Band = toNullableBand(payload?.task1Band);
    const task2Band = toNullableBand(payload?.task2Band);
    const finalWritingBand =
      toNullableBand(payload?.finalWritingBand) ??
      toRoundedOverallBand([task1Band, task2Band]);
    if (task1Band === null && task2Band === null && finalWritingBand === null) {
      return json(400, { ok: false, error: "Enter at least one writing band." });
    }

    const meta = await writeSubmissionScoreMeta(env, submissionLookup, {
      task1Band,
      task2Band,
      finalWritingBand,
    });
    try { ADMIN_RESULTS_SUMMARY_CACHE.delete("all"); } catch (e) {}
    return json(200, {
      ok: true,
      task1Band,
      task2Band,
      finalWritingBand,
      meta,
    });
  }

  if (request.method === "GET" && action === "objectiveDetailAdmin") {
    const auth = await authenticateAdmin(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });
    const submissionLookup = {
      submittedAt: oneLine(url.searchParams.get("submittedAt") || ""),
      studentFullName: oneLine(url.searchParams.get("studentFullName") || ""),
      examId: oneLine(url.searchParams.get("examId") || ""),
      reason: oneLine(url.searchParams.get("reason") || ""),
    };
    const submissionOrganizationId = await inferSubmissionOrganizationId(env, submissionLookup, getActorOrganizationId(auth));
    if (!canActorAccessOrganization(auth, submissionOrganizationId)) {
      return json(403, { ok: false, error: "This result does not belong to the current tenant." });
    }

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

    const tenant = resolveTenantContext(request, env);
    const provider = oneLine(payload?.provider || auth.user?.app_metadata?.provider || "email");
    const fullName = oneLine(payload?.fullName || auth.user?.user_metadata?.name || auth.user?.user_metadata?.preferred_name || deriveNameFromEmail(email));
    const record = await upsertStudentRegistry(env, {
      email,
      fullName,
      provider,
      isSharedPassword: provider === "shared-password",
      organizationId: tenant.organizationId,
    });
    return json(200, { ok: true, record });
  }

  if (request.method === "POST" && action === "recordSubmissionMeta") {
    const auth = await authenticateUser(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });

    const tenant = resolveTenantContext(request, env);
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

    const organizationId = normalizeOrganizationId(payload?.organizationId || tenant.organizationId);
    const profile = await getLinkedPublicProfileForAuth(env, auth, organizationId).catch(() => null);
    const key = buildSubmissionMetaKeyWithOrganization({ submittedAt, studentFullName, examId, reason, organizationId });
    const record = {
      email,
      loginEmail: normalizeEmail(payload?.loginEmail || auth.user?.email || email),
      provider,
      studentFullName: profile?.fullName || studentFullName,
      examId,
      submittedAt,
      reason,
      organizationId,
      studentProfileId: profile?.id || oneLine(payload?.studentProfileId || ""),
      studentIdCode: profile?.studentIdCode || oneLine(payload?.studentIdCode || ""),
      classroomId: profile?.classroomId || oneLine(payload?.classroomId || ""),
      classroomName: profile?.classroomName || oneLine(payload?.classroomName || ""),
      officialEmail: profile?.officialEmail || normalizeEmail(payload?.officialEmail || ""),
      updatedAt: new Date().toISOString(),
    };
    await writeJsonKv(env.STUDENT_REGISTRY, `submission:${key}`, record);
    await upsertStudentRegistry(env, {
      email: auth.user?.email || email,
      fullName: record.studentFullName,
      provider,
      isSharedPassword: provider === "shared-password",
      organizationId,
      studentProfile: profile || null,
    });
    return json(200, { ok: true, record });
  }

  if (request.method === "POST" && action === "recordSubmissionBackup") {
    const auth = await authenticateUser(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });

    const payload = await request.json().catch(() => null);
    const finalPayload = payload?.finalPayload || payload?.payload || payload;
    const saved = await writeSubmissionBackup(env, request, auth, finalPayload, {
      source: oneLine(payload?.source || "pre-sheets-backup"),
    });
    if (!saved.ok) return json(saved.status || 400, { ok: false, error: saved.error || "Could not save submission backup." });
    return json(200, { ok: true, backup: saved.record });
  }

  if (request.method === "GET" && action === "submissionBackups") {
    const auth = await authenticateAdmin(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });
    if (!env.STUDENT_REGISTRY) return json(200, { ok: true, backups: [] });

    const actorOrganizationId = getActorOrganizationId(auth);
    const prefix = auth.isSuperAdmin ? "submission-backup:" : `submission-backup:${actorOrganizationId}::`;
    const listed = await env.STUDENT_REGISTRY.list({ prefix, limit: 1000 });
    const backups = [];
    for (const key of listed.keys || []) {
      const record = await readJsonKv(env.STUDENT_REGISTRY, key.name);
      if (!record) continue;
      const organizationId = normalizeOrganizationId(record?.organizationId || "");
      if (!canActorAccessOrganization(auth, organizationId)) continue;
      backups.push({
        key: key.name,
        email: normalizeEmail(record?.email || ""),
        provider: oneLine(record?.provider || ""),
        studentFullName: oneLine(record?.studentFullName || ""),
        examId: oneLine(record?.examId || ""),
        submittedAt: oneLine(record?.submittedAt || ""),
        reason: oneLine(record?.reason || ""),
        organizationId,
        backupSource: oneLine(record?.backupSource || ""),
        backedUpAt: oneLine(record?.backedUpAt || ""),
        payloadBytes: Number(record?.payloadBytes || 0),
      });
    }
    backups.sort((a, b) => Date.parse(b.backedUpAt || b.submittedAt || "") - Date.parse(a.backedUpAt || a.submittedAt || ""));
    return json(200, { ok: true, backups });
  }

  if (request.method === "GET" && action === "submissionBackup") {
    const auth = await authenticateAdmin(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });
    if (!env.STUDENT_REGISTRY) return json(503, { ok: false, error: "Student registry is not configured." });

    const requestedKey = oneLine(url.searchParams.get("key") || "");
    let keys = [];
    if (requestedKey) {
      keys = [requestedKey];
    } else {
      const lookup = {
        submittedAt: oneLine(url.searchParams.get("submittedAt") || ""),
        studentFullName: oneLine(url.searchParams.get("studentFullName") || ""),
        examId: oneLine(url.searchParams.get("examId") || ""),
        reason: oneLine(url.searchParams.get("reason") || ""),
        organizationId: normalizeOrganizationId(url.searchParams.get("organizationId") || getActorOrganizationId(auth)),
      };
      keys = buildSubmissionLookupKeys(lookup, lookup.organizationId).map((key) => `submission-backup:${key}`);
    }

    for (const key of keys) {
      const record = await readJsonKv(env.STUDENT_REGISTRY, key);
      if (!record) continue;
      const organizationId = normalizeOrganizationId(record?.organizationId || "");
      if (!canActorAccessOrganization(auth, organizationId)) {
        return json(403, { ok: false, error: "This backup does not belong to the current tenant." });
      }
      return json(200, { ok: true, key, backup: record });
    }

    return json(404, { ok: false, error: "Submission backup not found." });
  }

  if (request.method === "GET" && action === "studentObjectiveDetail") {
    const auth = await authenticateUser(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });

    const submissionLookup = {
      submittedAt: oneLine(url.searchParams.get("submittedAt") || ""),
      studentFullName: oneLine(url.searchParams.get("studentFullName") || ""),
      examId: oneLine(url.searchParams.get("examId") || ""),
      reason: oneLine(url.searchParams.get("reason") || ""),
    };
    const owned = await authorizeStudentSubmissionAccess(submissionLookup, auth, request, env);
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
    const recordOrganizationId = normalizeOrganizationId(record?.organizationId || resolveTenantContext(request, env).organizationId);
    if (adminAuth.ok && !canActorAccessOrganization(adminAuth, recordOrganizationId)) {
      return json(403, { ok: false, error: "This practice result does not belong to the current tenant." });
    }
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
    const tenant = resolveTenantContext(request, env);

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
    const visibleResults = await filterRowsForAdminActor(data.results, {
      isSuperAdmin: false,
      organizationId: tenant.organizationId,
      tenant,
    }, env);

    const matches = await Promise.all(ownedRows
      .map((row) => {
        const match = matchStudentResultRow(row, visibleResults);
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

  if (request.method === "POST" && action === "uploadSpeaking") {
    const auth = await authenticateUser(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });
    const tenant = resolveTenantContext(request, env);
    const payload = await request.json().catch(() => null);
    if (!payload || typeof payload !== "object") {
      return json(400, { ok: false, error: "Missing speaking upload payload." });
    }
    const studentEmail = normalizeEmail(auth?.user?.email || payload?.studentEmail || "");
    const signInMethod = oneLine(payload?.signInMethod || auth?.user?.app_metadata?.provider || "email");
    const nextPayload = {
      ...payload,
      studentEmail,
      signInMethod,
      organizationId: tenant.organizationId,
    };
    const backendUrl = new URL(String(env.ADMIN_BACKEND_URL || ""));
    const bodyText = JSON.stringify(nextPayload);
    const signedUrl = await buildSignedAppsScriptUrl(backendUrl.toString(), "POST", bodyText, env);
    const response = await fetch(signedUrl, {
      method: "POST",
      headers: await buildAppsScriptHeaders(
        new Request(request.url, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8", Accept: "application/json" },
        }),
        env,
        signedUrl,
        bodyText
      ),
      body: bodyText,
    });
    const text = await response.text();
    return new Response(text, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") || "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  if (request.method === "GET" && action === "studentPracticeResults") {
    const auth = await authenticateUser(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });
    const tenant = resolveTenantContext(request, env);
    const rows = await getStudentPracticeRows(env, normalizeEmail(auth?.user?.email || ""), tenant.organizationId);
    return json(200, { ok: true, results: rows });
  }

  if (request.method === "POST") {
    const auth = await authenticateUser(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });
    const tenant = resolveTenantContext(request, env);
    const bodyText = await request.clone().text().catch(() => "");
    const contentType = String(request.headers.get("Content-Type") || "").toLowerCase();
    let nextBodyText = bodyText;
    let parsedSubmissionPayload = null;
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const params = new URLSearchParams(bodyText);
      const payloadText = params.get("payload");
      if (payloadText) {
        try {
          const parsed = JSON.parse(payloadText);
          parsed.organizationId = normalizeOrganizationId(parsed?.organizationId || tenant.organizationId);
          parsed.studentEmail = normalizeEmail(parsed?.studentEmail || auth?.user?.email || "");
          parsed.signInMethod = oneLine(parsed?.signInMethod || auth?.user?.app_metadata?.provider || "email");
          await applyStudentProfileToSubmissionPayload(env, auth, parsed, parsed.organizationId);
          parsedSubmissionPayload = parsed;
          params.set("payload", JSON.stringify(parsed));
          nextBodyText = params.toString();
        } catch (e) {}
      }
    } else if (contentType.includes("application/json")) {
      try {
        const parsed = JSON.parse(bodyText);
        if (parsed && typeof parsed === "object") {
          parsed.organizationId = normalizeOrganizationId(parsed?.organizationId || tenant.organizationId);
          parsed.studentEmail = normalizeEmail(parsed?.studentEmail || auth?.user?.email || "");
          parsed.signInMethod = oneLine(parsed?.signInMethod || auth?.user?.app_metadata?.provider || "email");
          await applyStudentProfileToSubmissionPayload(env, auth, parsed, parsed.organizationId);
          parsedSubmissionPayload = parsed;
          nextBodyText = JSON.stringify(parsed);
        }
      } catch (e) {}
    }
    if (parsedSubmissionPayload) {
      const savedBackup = await writeSubmissionBackup(env, request, auth, parsedSubmissionPayload, {
        source: `apps-script-proxy:${action || "post"}`,
      });
      if (!savedBackup.ok) {
        await logSecurityEvent(env, request, "submission_backup_failed_before_proxy", {
          error: savedBackup.error || "",
          examId: parsedSubmissionPayload?.examId || "",
          organizationId: parsedSubmissionPayload?.organizationId || "",
        });
      }
    }
    const backendUrl = String(env.ADMIN_BACKEND_URL || "");
    const signedUrl = await buildSignedAppsScriptUrl(backendUrl, request.method, nextBodyText, env);
    return fetch(signedUrl, {
      method: request.method,
      headers: await buildAppsScriptHeaders(request, env, signedUrl, nextBodyText),
      body: nextBodyText,
    });
  }

  return json(405, { ok: false, error: "Method not allowed." });
}

async function authenticateAdmin(request, env) {
  const auth = await authenticateUser(request, env);
  if (!auth.ok) return auth;
  if (auth.kind === "shared") {
    return { ok: false, status: 403, error: "Shared-password student sign-in cannot use admin tools." };
  }

  const tenant = resolveTenantContext(request, env);
  const allowedEmails = String(env.ADMIN_ALLOWED_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const tenantAdminMap = getTenantAdminMap(env);

  if (!allowedEmails.length && !Object.keys(tenantAdminMap).length) {
    return { ok: false, status: 503, error: "Admin access is not configured." };
  }

  const email = String(auth.user?.email || "").trim().toLowerCase();
  const isSuperAdmin = allowedEmails.includes(email);
  const tenantAdminOrg = tenantAdminMap[email] || "";
  if (!isSuperAdmin && !tenantAdminOrg) {
    return { ok: false, status: 403, error: "Your account is not allowed to use admin tools." };
  }

  if (!isSuperAdmin && tenant.organizationId && tenantAdminOrg !== tenant.organizationId) {
    return { ok: false, status: 403, error: "This admin account is not allowed to use this tenant domain." };
  }

  return {
    ...auth,
    role: isSuperAdmin ? "super_admin" : "tenant_admin",
    isSuperAdmin,
    organizationId: isSuperAdmin ? null : tenantAdminOrg,
    tenant,
  };
}

async function authenticateUser(request, env) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Missing access token." };
  }

  const tenant = resolveTenantContext(request, env);
  const token = String(authHeader.slice("Bearer ".length) || "").trim();
  if (token.startsWith("shared.")) {
    const payload = await verifySharedStudentToken(token, env);
    if (!payload?.email) {
      return { ok: false, status: 401, error: "Invalid shared sign-in token." };
    }
    const tokenOrganizationId = normalizeOrganizationId(payload.organizationId || "");
    if (tokenOrganizationId && tenant.organizationId && tokenOrganizationId !== tenant.organizationId) {
      return { ok: false, status: 403, error: "This shared sign-in token is not valid for the current organization." };
    }
    return {
      ok: true,
      status: 200,
      kind: "shared",
      organizationId: tokenOrganizationId || tenant.organizationId,
      tenant,
    user: {
        email: payload.email,
        app_metadata: {
          provider: "shared-password",
          is_shared_student_login: true,
          organization_id: tokenOrganizationId || tenant.organizationId,
          student_id_code: oneLine(payload.studentIdCode || ""),
        },
        user_metadata: {
          name: deriveNameFromEmail(payload.email),
          preferred_name: deriveNameFromEmail(payload.email),
        },
        shared_mode: payload.mode || "student",
        shared_bypass: payload.bypass === true,
        student_id_code: oneLine(payload.studentIdCode || ""),
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

  return { ok: true, status: 200, kind: "supabase", organizationId: tenant.organizationId, tenant, user };
}

function getActorOrganizationId(actor) {
  return normalizeOrganizationId(actor?.organizationId || actor?.tenant?.organizationId || "");
}

function canActorAccessOrganization(actor, organizationId) {
  const normalizedOrganizationId = normalizeOrganizationId(organizationId);
  if (!normalizedOrganizationId) return !!actor?.isSuperAdmin;
  if (actor?.isSuperAdmin) return true;
  return getActorOrganizationId(actor) === normalizedOrganizationId;
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
    organizationId: normalizeOrganizationId(options?.organizationId || ""),
    studentIdCode: oneLine(options?.studentIdCode || ""),
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
  const studentProfile = options?.studentProfile || null;
  return {
    id: `shared:${email}`,
    email,
    created_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {
      provider: "shared-password",
      is_shared_student_login: true,
      setup_completed: options?.setupCompleted === true,
      organization_id: normalizeOrganizationId(options?.organizationId || ""),
      student_id_code: oneLine(studentProfile?.studentIdCode || ""),
    },
    user_metadata: {
      full_name: fullName,
      name: fullName,
      preferred_name: fullName,
      first_name: firstName,
      last_name: lastName,
    },
    studentProfile,
  };
}

function generateStudentPasswordSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return toBase64UrlFromBytes(bytes);
}

function normalizePasswordSubject(value) {
  return String(value || "").trim().toLowerCase();
}

async function hashStudentPassword(subject, password, salt) {
  const raw = `${String(salt || "").trim()}::${normalizePasswordSubject(subject)}::${String(password || "")}`;
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

async function verifyStudentProfilePassword(profile, studentIdCode, password, currentEmail = "") {
  const expected = String(profile?.personal_password_hash || "").trim();
  const salt = String(profile?.personal_password_salt || "").trim();
  if (!expected || !salt || !password) return false;
  const subjects = [
    studentIdCode,
    profile?.linked_auth_email || "",
    currentEmail,
  ].map((value) => normalizePasswordSubject(value)).filter(Boolean);
  for (const subject of new Set(subjects)) {
    const actual = await hashStudentPassword(subject, password, salt);
    if (actual === expected) return true;
  }
  return false;
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

function buildSubmissionMetaKeyWithOrganization(row) {
  const organizationId = normalizeOrganizationId(row?.organizationId || row?.organization_id || "");
  const base = buildSubmissionMetaKey(row);
  if (!base) return "";
  return organizationId ? `${organizationId}::${base}` : base;
}

function buildSubmissionLookupKeys(row, preferredOrganizationId = "") {
  const base = buildSubmissionMetaKey(row);
  const organizationId = normalizeOrganizationId(
    row?.organizationId || row?.organization_id || preferredOrganizationId || ""
  );
  const keys = [];
  if (base && organizationId) keys.push(`${organizationId}::${base}`);
  if (base) keys.push(base);
  return Array.from(new Set(keys.filter(Boolean)));
}

function buildSubmissionScoreKey(row) {
  const key = buildSubmissionMetaKeyWithOrganization(row);
  return key ? `score:${key}` : "";
}

function extractFinalPayloadSummary(finalPayload, auth, tenant) {
  const writing = finalPayload?.writing || {};
  const listening = finalPayload?.listening || {};
  const reading = finalPayload?.reading || {};
  const organizationId = normalizeOrganizationId(finalPayload?.organizationId || tenant?.organizationId || "");
  const submittedAt = oneLine(finalPayload?.submittedAt || writing?.submittedAt || reading?.submittedAt || listening?.submittedAt || "");
  const studentFullName = oneLine(
    finalPayload?.studentFullName ||
    writing?.studentFullName ||
    auth?.user?.user_metadata?.name ||
    auth?.user?.user_metadata?.preferred_name ||
    deriveNameFromEmail(auth?.user?.email || "")
  );
  const examId = oneLine(finalPayload?.examId || writing?.examId || reading?.examId || listening?.examId || "");
  const reason = oneLine(finalPayload?.reason || writing?.reason || reading?.reason || listening?.reason || "");
  const loginEmail = normalizeEmail(finalPayload?.loginEmail || auth?.user?.email || finalPayload?.email || "");
  const email = loginEmail || normalizeEmail(finalPayload?.studentEmail || finalPayload?.email || auth?.user?.email || "");
  const provider = oneLine(finalPayload?.signInMethod || auth?.user?.app_metadata?.provider || "email") || "email";
  return {
    organizationId,
    submittedAt,
    studentFullName,
    examId,
    reason,
    email,
    provider,
    loginEmail,
    studentProfileId: oneLine(finalPayload?.studentProfileId || ""),
    studentIdCode: oneLine(finalPayload?.studentIdCode || ""),
    classroomId: oneLine(finalPayload?.classroomId || ""),
    classroomName: oneLine(finalPayload?.classroomName || ""),
    officialEmail: normalizeEmail(finalPayload?.officialEmail || ""),
  };
}

function buildSubmissionBackupRecord(finalPayload, auth, tenant, options = {}) {
  const summary = extractFinalPayloadSummary(finalPayload, auth, tenant);
  if (!summary.organizationId || !summary.submittedAt || !summary.studentFullName || !summary.examId || !summary.email) {
    return { ok: false, status: 400, error: "Missing submission backup fields." };
  }
  const payloadJson = stableStringify(finalPayload || {});
  return {
    ok: true,
    key: buildSubmissionMetaKeyWithOrganization(summary),
    record: {
      ...summary,
      backupSource: oneLine(options?.source || "submission-backup"),
      backedUpAt: new Date().toISOString(),
      payloadBytes: new TextEncoder().encode(payloadJson).length,
      finalPayload,
    },
  };
}

async function writeSubmissionBackup(env, request, auth, finalPayload, options = {}) {
  if (!env?.STUDENT_REGISTRY) {
    return { ok: false, status: 503, error: "Student registry is not configured." };
  }
  if (!finalPayload || typeof finalPayload !== "object") {
    return { ok: false, status: 400, error: "Missing submission backup payload." };
  }
  const tenant = resolveTenantContext(request, env);
  await applyStudentProfileToSubmissionPayload(env, auth, finalPayload, tenant.organizationId).catch(() => finalPayload);
  const built = buildSubmissionBackupRecord(finalPayload, auth, tenant, options);
  if (!built.ok) return built;

  await writeJsonKv(env.STUDENT_REGISTRY, `submission-backup:${built.key}`, built.record);
  await upsertStudentRegistry(env, {
    email: built.record.email,
    fullName: built.record.studentFullName,
    provider: built.record.provider,
    isSharedPassword: built.record.provider === "shared-password",
    organizationId: built.record.organizationId,
  });

  const metaRecord = {
    email: built.record.email,
    provider: built.record.provider,
    studentFullName: built.record.studentFullName,
    examId: built.record.examId,
    submittedAt: built.record.submittedAt,
    reason: built.record.reason,
    organizationId: built.record.organizationId,
    updatedAt: built.record.backedUpAt,
    backupAvailable: true,
  };
  await writeJsonKv(env.STUDENT_REGISTRY, `submission:${built.key}`, metaRecord);

  const { finalPayload: _omitted, ...publicRecord } = built.record;
  return { ok: true, key: built.key, record: publicRecord };
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
  if (!env?.STUDENT_REGISTRY) return {};
  const keys = buildSubmissionLookupKeys(row).map((key) => `score:${key}`);
  const submissionKeys = buildSubmissionLookupKeys(row).map((key) => `submission:${key}`);
  let submissionRecord = {};
  for (const key of submissionKeys) {
    const record = await readJsonKv(env.STUDENT_REGISTRY, key);
    if (record && typeof record === "object") {
      submissionRecord = record;
      break;
    }
  }
  for (const key of keys) {
    const record = await readJsonKv(env.STUDENT_REGISTRY, key);
    if (record && typeof record === "object") return { ...submissionRecord, ...record };
  }
  return submissionRecord;
}

async function writeSubmissionScoreMeta(env, row, patch = {}) {
  const key = buildSubmissionScoreKey(row);
  if (!env?.STUDENT_REGISTRY || !key) return null;
  const current = (await readJsonKv(env.STUDENT_REGISTRY, key)) || {};
  const next = {
    ...current,
    ...patch,
    organizationId:
      normalizeOrganizationId(
        patch?.organizationId || patch?.organization_id || row?.organizationId || row?.organization_id || current?.organizationId || ""
      ) || undefined,
    updatedAt: new Date().toISOString(),
  };
  await writeJsonKv(env.STUDENT_REGISTRY, key, next);
  return next;
}

function mergeSummaryWithScoreMeta(summary, scoreMeta) {
  const task1Band = toNullableBand(scoreMeta?.task1Band ?? summary?.task1Band);
  const task2Band = toNullableBand(scoreMeta?.task2Band ?? summary?.task2Band);
  const finalWritingBand = toEffectiveWritingBand({
    finalWritingBand: scoreMeta?.finalWritingBand ?? summary?.finalWritingBand,
    task1Words: summary?.task1Words,
    task2Words: summary?.task2Words,
    task1Band,
    task2Band,
  });
  const speakingBand = toNullableBand(scoreMeta?.speakingBand ?? summary?.speakingBand);
  const overallBand = toRoundedOverallBand([
    summary?.listeningBand,
    summary?.readingBand,
    finalWritingBand,
    speakingBand,
  ]);
  return {
    ...summary,
    organizationId: normalizeOrganizationId(scoreMeta?.organizationId || summary?.organizationId || summary?.organization_id || ""),
    studentProfileId: scoreMeta?.studentProfileId || summary?.studentProfileId || "",
    studentIdCode: scoreMeta?.studentIdCode || summary?.studentIdCode || "",
    classroomId: scoreMeta?.classroomId || summary?.classroomId || "",
    classroomName: scoreMeta?.classroomName || summary?.classroomName || "",
    officialEmail: scoreMeta?.officialEmail || summary?.officialEmail || "",
    loginEmail: scoreMeta?.loginEmail || summary?.loginEmail || "",
    task1Band,
    task2Band,
    finalWritingBand,
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
  try {
    await writeJsonKv(env.STUDENT_REGISTRY, key, {
      attempts,
      updatedAt: new Date(now).toISOString(),
    });
  } catch (error) {
    if (!isKvQuotaExceededError(error)) throw error;
    console.warn("[IELTS] KV rate-limit write skipped:", error?.message || error);
  }
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
  const nextOrganizationId = normalizeOrganizationId(payload?.organizationId || current.organizationId || "");
  const organizationIds = new Set(
    Array.isArray(current.organizationIds)
      ? current.organizationIds.map((value) => normalizeOrganizationId(value)).filter(Boolean)
      : []
  );
  if (nextOrganizationId) organizationIds.add(nextOrganizationId);

  const next = {
    email,
    organizationId: nextOrganizationId || undefined,
    organizationIds: Array.from(organizationIds),
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
    passwordChangedAt: payload?.passwordHash ? now : (current.passwordChangedAt || ""),
    studentProfile: payload?.studentProfile || current.studentProfile || null,
  };
  if (payload?.passwordHash && payload?.passwordSalt) {
    next.passwordHash = payload.passwordHash;
    next.passwordSalt = payload.passwordSalt;
    next.setupCompleted = true;
  }

  try {
    await writeJsonKv(env.STUDENT_REGISTRY, key, next);
  } catch (error) {
    if (!isKvQuotaExceededError(error)) throw error;
    console.warn("[IELTS] KV student registry write skipped:", error?.message || error);
  }
  return next;
}

function isKvQuotaExceededError(error) {
  const message = String(error?.message || error || "");
  return /KV put\(\) limit exceeded for the day/i.test(message);
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

  const tenant = resolveTenantContext(request, env);
  const organizationId = normalizeOrganizationId(
    rowLike?.organizationId || rowLike?.organization_id || tenant.organizationId
  );
  const lookupRow = {
    ...rowLike,
    organizationId,
  };
  const keys = buildSubmissionLookupKeys(lookupRow, organizationId);
  if (!keys.length) {
    await logSecurityEvent(env, request, "student_submission_missing_lookup_fields", { email });
    return { ok: false, status: 400, error: "Missing submission lookup fields." };
  }

  let record = null;
  for (const key of keys) {
    record = await readJsonKv(env.STUDENT_REGISTRY, `submission:${key}`);
    if (record) break;
  }
  const linkedProfile = await getLinkedPublicProfileForAuth(env, auth, organizationId).catch(() => null);
  if (record?.email) {
    const recordOrganizationId = normalizeOrganizationId(record.organizationId || organizationId);
    if (organizationId && recordOrganizationId && recordOrganizationId !== organizationId) {
      await logSecurityEvent(env, request, "student_submission_org_mismatch", {
        email,
        organizationId,
        recordOrganizationId,
      });
      return { ok: false, status: 403, error: "This submission is not available for the current account." };
    }
    const recordProfileId = oneLine(record.studentProfileId || "");
    const recordStudentIdCode = oneLine(record.studentIdCode || "");
    const ownsByProfile =
      !!linkedProfile &&
      (
        (!!recordProfileId && recordProfileId === linkedProfile.id) ||
        (!!recordStudentIdCode && recordStudentIdCode === linkedProfile.studentIdCode)
      );
    if (normalizeEmail(record.email) !== email && !ownsByProfile) {
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
      organizationId,
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
  if (organizationId) verifyUrl.searchParams.set("organization_id", `eq.${organizationId}`);
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
      organizationId,
    });
    return { ok: false, status: 403, error: "This submission is not available for the current account." };
  }

  return { ok: true, status: 200, record: null };
}

async function studentOwnsSubmission(rowLike, email, env, organizationId = "", linkedProfile = null) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !env?.STUDENT_REGISTRY) return false;

  const normalizedOrganizationId = normalizeOrganizationId(organizationId);
  const resolvedProfile =
    linkedProfile ||
    await getStudentProfileByLinkedEmail(env, normalizedEmail, normalizedOrganizationId).catch(() => null);
  const keys = buildSubmissionLookupKeys(rowLike, normalizedOrganizationId);
  if (!keys.length) return false;

  for (const key of keys) {
    const record = await readJsonKv(env.STUDENT_REGISTRY, `submission:${key}`);
    if (record?.email) {
      const recordOrganizationId = normalizeOrganizationId(record.organizationId || normalizedOrganizationId);
      if (normalizedOrganizationId && recordOrganizationId && recordOrganizationId !== normalizedOrganizationId) {
        return false;
      }
      if (normalizeEmail(record.email) === normalizedEmail) return true;
      const recordProfileId = oneLine(record.studentProfileId || "");
      const recordStudentIdCode = oneLine(record.studentIdCode || "");
      if (resolvedProfile) {
        const resolvedPublicProfile = publicStudentProfile(resolvedProfile) || resolvedProfile;
        if (recordProfileId && recordProfileId === oneLine(resolvedPublicProfile.id || "")) return true;
        if (recordStudentIdCode && recordStudentIdCode === oneLine(resolvedPublicProfile.studentIdCode || resolvedProfile.student_id_code || "")) return true;
      }
      return false;
    }
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
  if (normalizedOrganizationId) verifyUrl.searchParams.set("organization_id", `eq.${normalizedOrganizationId}`);
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

function getSupabaseServiceKey(env) {
  return String(env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || "").trim();
}

async function supabaseServiceRequest(env, path, options = {}) {
  const base = String(env?.SUPABASE_URL || "").replace(/\/$/, "");
  const key = getSupabaseServiceKey(env);
  if (!base || !key) {
    return { ok: false, status: 503, error: "Supabase service access is not configured.", data: null };
  }
  const url = new URL(`${base}${path}`);
  Object.entries(options.query || {}).forEach(([name, value]) => {
    if (value !== undefined && value !== null && String(value) !== "") url.searchParams.set(name, String(value));
  });
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
    ...(options.headers || {}),
  };
  let body;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }
  const response = await fetch(url.toString(), {
    method: options.method || "GET",
    headers,
    body,
  }).catch((error) => ({ ok: false, status: 0, json: async () => ({ error: error?.message || "Network error" }) }));
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    return { ok: false, status: response.status || 500, error: data?.message || data?.error || `Supabase HTTP ${response.status}`, data };
  }
  return { ok: true, status: response.status, data };
}

function buildAuthLinkIdentity(auth) {
  const email = normalizeEmail(auth?.user?.email || "");
  const rawId = oneLine(auth?.user?.id || "");
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(rawId);
  return {
    userId: isUuid ? rawId : "",
    identity: isUuid ? `supabase:${rawId}` : `shared:${email}`,
    email,
  };
}

function publicStudentProfile(row) {
  if (!row) return null;
  const classroom = row.classroom || null;
  const name = oneLine(row.name || "");
  const surname = oneLine(row.surname || "");
  return {
    id: oneLine(row.id || ""),
    organizationId: normalizeOrganizationId(row.organization_id || ""),
    studentIdCode: oneLine(row.student_id_code || ""),
    name,
    surname,
    fullName: `${name} ${surname}`.replace(/\s+/g, " ").trim(),
    classroomId: oneLine(row.classroom_id || classroom?.id || ""),
    classroomName: oneLine(row.classroom_name || classroom?.name || ""),
    officialEmail: normalizeEmail(row.official_email || ""),
    linkedAuthUserId: oneLine(row.linked_auth_user_id || ""),
    linkedAuthIdentity: oneLine(row.linked_auth_identity || ""),
    linkedAuthEmail: normalizeEmail(row.linked_auth_email || ""),
    isActive: row.is_active !== false,
  };
}

function normalizeStudentNameForMatch(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(oglu|oğlu|qizi|qızı)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeStudentNameForMatch(value) {
  return normalizeStudentNameForMatch(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
}

function levenshteinDistance(a, b) {
  const left = String(a || "");
  const right = String(b || "");
  if (!left) return right.length;
  if (!right) return left.length;
  const matrix = Array.from({ length: left.length + 1 }, () => new Array(right.length + 1).fill(0));
  for (let i = 0; i <= left.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= right.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[left.length][right.length];
}

function scoreStudentNameMatch(leftValue, rightValue) {
  const left = normalizeStudentNameForMatch(leftValue);
  const right = normalizeStudentNameForMatch(rightValue);
  if (!left || !right) return 0;
  if (left === right) return 1;

  const leftTokens = tokenizeStudentNameForMatch(left);
  const rightTokens = tokenizeStudentNameForMatch(right);
  const leftSet = new Set(leftTokens);
  const rightSet = new Set(rightTokens);
  const shared = leftTokens.filter((token) => rightSet.has(token)).length;
  const tokenScore = shared / Math.max(leftSet.size || 1, rightSet.size || 1);
  const editScore = 1 - (levenshteinDistance(left, right) / Math.max(left.length, right.length, 1));
  const sameLast = leftTokens.at(-1) && rightTokens.at(-1) && leftTokens.at(-1) === rightTokens.at(-1) ? 0.16 : 0;
  const sameFirst = leftTokens[0] && rightTokens[0] && leftTokens[0] === rightTokens[0] ? 0.1 : 0;
  const sortedMatch =
    leftTokens.slice().sort().join(" ") === rightTokens.slice().sort().join(" ") ? 0.14 : 0;
  const containsBonus = left.includes(right) || right.includes(left) ? 0.12 : 0;
  return Math.max(0, Math.min(1, (tokenScore * 0.55) + (editScore * 0.35) + sameLast + sameFirst + sortedMatch + containsBonus));
}

function pickMostLikelyStudentName(record) {
  if (!record?.nameCounts || !(record.nameCounts instanceof Map)) return "";
  const ranked = Array.from(record.nameCounts.entries())
    .map(([name, count]) => ({ name, count: Number(count || 0), normalized: normalizeStudentNameForMatch(name) }))
    .filter((entry) => entry.normalized)
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.normalized.length - a.normalized.length;
    });
  return ranked[0]?.name || "";
}

function buildStudentProfileMatchIndexes(profiles) {
  const byId = new Map();
  const byCode = new Map();
  const byOfficialEmail = new Map();
  const byLinkedEmail = new Map();
  const byExactName = new Map();
  const rows = Array.isArray(profiles) ? profiles.map((row) => publicStudentProfile(row)).filter(Boolean) : [];
  rows.forEach((profile) => {
    if (profile.id) byId.set(profile.id, profile);
    if (profile.studentIdCode) byCode.set(profile.studentIdCode, profile);
    if (profile.officialEmail) byOfficialEmail.set(profile.officialEmail, profile);
    if (profile.linkedAuthEmail) byLinkedEmail.set(profile.linkedAuthEmail, profile);
    const normalizedName = normalizeStudentNameForMatch(profile.fullName);
    if (!normalizedName) return;
    const bucket = byExactName.get(normalizedName) || [];
    bucket.push(profile);
    byExactName.set(normalizedName, bucket);
  });
  return { rows, byId, byCode, byOfficialEmail, byLinkedEmail, byExactName };
}

function buildStudentProfileLoginEmail(profile) {
  const linkedEmail = normalizeEmail(profile?.linkedAuthEmail || "");
  if (linkedEmail) return linkedEmail;
  const officialEmail = normalizeEmail(profile?.officialEmail || "");
  if (officialEmail) return officialEmail;
  const studentIdCode = oneLine(profile?.studentIdCode || "").toLowerCase();
  return studentIdCode ? `${studentIdCode}@student-id.local` : "student@student-id.local";
}

async function getStudentProfileByCode(env, studentIdCode, organizationId = "") {
  const query = {
    select: "*,classroom:classrooms(id,name)",
    student_id_code: `eq.${studentIdCode}`,
    limit: "1",
  };
  if (organizationId) query.organization_id = `eq.${normalizeOrganizationId(organizationId)}`;
  const res = await supabaseServiceRequest(env, "/rest/v1/student_profiles", { query });
  if (!res.ok) return null;
  return Array.isArray(res.data) ? res.data[0] || null : null;
}

async function getStudentProfileByAuth(env, identity, organizationId = "") {
  if (!identity?.identity && !identity?.userId) return null;
  const query = {
    select: "*,classroom:classrooms(id,name)",
    limit: "1",
  };
  if (identity.userId) query.linked_auth_user_id = `eq.${identity.userId}`;
  else query.linked_auth_identity = `eq.${identity.identity}`;
  if (organizationId) query.organization_id = `eq.${normalizeOrganizationId(organizationId)}`;
  const res = await supabaseServiceRequest(env, "/rest/v1/student_profiles", { query });
  if (!res.ok) return null;
  return Array.isArray(res.data) ? res.data[0] || null : null;
}

async function getStudentProfileByLinkedEmail(env, email, organizationId = "") {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;
  const query = {
    select: "*,classroom:classrooms(id,name)",
    linked_auth_email: `eq.${normalizedEmail}`,
    limit: "1",
  };
  if (organizationId) query.organization_id = `eq.${normalizeOrganizationId(organizationId)}`;
  const res = await supabaseServiceRequest(env, "/rest/v1/student_profiles", { query });
  if (!res.ok) return null;
  return Array.isArray(res.data) ? res.data[0] || null : null;
}

async function getStudentProfileByOfficialEmail(env, email, organizationId = "") {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;
  const query = {
    select: "*,classroom:classrooms(id,name)",
    official_email: `eq.${normalizedEmail}`,
    limit: "1",
  };
  if (organizationId) query.organization_id = `eq.${normalizeOrganizationId(organizationId)}`;
  const res = await supabaseServiceRequest(env, "/rest/v1/student_profiles", { query });
  if (!res.ok) return null;
  return Array.isArray(res.data) ? res.data[0] || null : null;
}

function buildStudentProfileMetaPatch(profile) {
  const publicProfile = publicStudentProfile(profile);
  return {
    organizationId: publicProfile.organizationId || "",
    studentProfileId: publicProfile.id || "",
    studentIdCode: publicProfile.studentIdCode || "",
    classroomId: publicProfile.classroomId || "",
    classroomName: publicProfile.classroomName || "",
    officialEmail: publicProfile.officialEmail || "",
  };
}

async function attachStudentProfileToStoredHistory(env, organizationId, email, profile) {
  const normalizedEmail = normalizeEmail(email);
  if (!env?.STUDENT_REGISTRY || !normalizedEmail || !profile) return;
  const patch = buildStudentProfileMetaPatch(profile);
  const registryRecord = (await readJsonKv(env.STUDENT_REGISTRY, `student:${normalizedEmail}`)) || {};
  await writeJsonKv(env.STUDENT_REGISTRY, `student:${normalizedEmail}`, {
    ...registryRecord,
    email: normalizedEmail,
    organizationId: patch.organizationId || registryRecord.organizationId || "",
    fullName: profile.fullName || registryRecord.fullName || deriveNameFromEmail(normalizedEmail),
    firstName: profile.name || registryRecord.firstName || "",
    lastName: profile.surname || registryRecord.lastName || "",
    studentProfile: publicStudentProfile(profile),
    updatedAt: new Date().toISOString(),
  });

  const submissions = await listJsonByPrefix(env.STUDENT_REGISTRY, "submission:", 1000);
  for (const record of submissions) {
    const recordOrg = normalizeOrganizationId(record?.organizationId || "");
    const recordEmail = normalizeEmail(record?.email || record?.loginEmail || "");
    if (recordEmail !== normalizedEmail) continue;
    if (organizationId && recordOrg && recordOrg !== normalizeOrganizationId(organizationId)) continue;
    const nextRecord = {
      ...record,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    const key = buildSubmissionMetaKeyWithOrganization(nextRecord);
    if (!key) continue;
    await writeJsonKv(env.STUDENT_REGISTRY, `submission:${key}`, nextRecord);
    const currentScore = (await readJsonKv(env.STUDENT_REGISTRY, `score:${key}`)) || {};
    await writeJsonKv(env.STUDENT_REGISTRY, `score:${key}`, {
      ...currentScore,
      ...patch,
      updatedAt: new Date().toISOString(),
    });
  }

  const backups = await listJsonByPrefix(env.STUDENT_REGISTRY, "submission-backup:", 1000);
  for (const record of backups) {
    const recordOrg = normalizeOrganizationId(record?.organizationId || "");
    const recordEmail = normalizeEmail(record?.email || record?.loginEmail || "");
    if (recordEmail !== normalizedEmail) continue;
    if (organizationId && recordOrg && recordOrg !== normalizeOrganizationId(organizationId)) continue;
    const nextRecord = {
      ...record,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    const key = buildSubmissionMetaKeyWithOrganization(nextRecord);
    if (!key) continue;
    await writeJsonKv(env.STUDENT_REGISTRY, `submission-backup:${key}`, nextRecord);
  }

  const practiceRows = await listJsonByPrefix(env.STUDENT_REGISTRY, `practice-user:${normalizedEmail}:`, 1000);
  for (const record of practiceRows) {
    const nextRecord = {
      ...record,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    const practiceId = oneLine(record?.id || "");
    if (!practiceId) continue;
    await writeJsonKv(env.STUDENT_REGISTRY, `practice-user:${normalizedEmail}:${practiceId}`, nextRecord);
    await writeJsonKv(env.STUDENT_REGISTRY, `practice-result:${practiceId}`, nextRecord);
  }
}

async function updateStudentProfileById(env, id, patch) {
  const res = await supabaseServiceRequest(env, "/rest/v1/student_profiles", {
    method: "PATCH",
    query: { id: `eq.${id}`, select: "*,classroom:classrooms(id,name)" },
    headers: { Prefer: "return=representation" },
    body: patch,
  });
  if (!res.ok) throw new Error(res.error || "Could not update student profile.");
  return Array.isArray(res.data) ? res.data[0] || null : null;
}

function studentRecordBelongsToOrganization(record, organizationId = "") {
  const target = normalizeOrganizationId(organizationId);
  if (!target) return true;
  const orgs = new Set(
    (Array.isArray(record?.organizationIds) ? record.organizationIds : [record?.organizationId])
      .map((value) => normalizeOrganizationId(value))
      .filter(Boolean)
  );
  return orgs.has(target);
}

async function loadScopedClassroomData(env, auth) {
  const organizationId = getActorOrganizationId(auth);
  const classroomQuery = { select: "*", order: "created_at.desc" };
  const studentQuery = { select: "*,classroom:classrooms(id,name)", order: "created_at.desc" };
  if (!auth.isSuperAdmin && organizationId) {
    classroomQuery.organization_id = `eq.${organizationId}`;
    studentQuery.organization_id = `eq.${organizationId}`;
  }
  const [classroomsRes, studentsRes] = await Promise.all([
    supabaseServiceRequest(env, "/rest/v1/classrooms", { query: classroomQuery }),
    supabaseServiceRequest(env, "/rest/v1/student_profiles", { query: studentQuery }),
  ]);
  if (!classroomsRes.ok) return { ok: false, status: classroomsRes.status, error: classroomsRes.error, classrooms: [], students: [] };
  if (!studentsRes.ok) return { ok: false, status: studentsRes.status, error: studentsRes.error, classrooms: [], students: [] };
  return {
    ok: true,
    status: 200,
    classrooms: Array.isArray(classroomsRes.data) ? classroomsRes.data : [],
    students: Array.isArray(studentsRes.data) ? studentsRes.data : [],
  };
}

async function handleAdminClassroomStudents(request, env, auth) {
  const loaded = await loadScopedClassroomData(env, auth);
  if (!loaded.ok) return json(loaded.status, { ok: false, error: loaded.error });
  return json(200, {
    ok: true,
    classrooms: loaded.classrooms,
    students: loaded.students.map(publicStudentProfile),
  });
}

async function collectHistoricalIdentityCandidates(env, organizationId = "") {
  const candidates = new Map();
  const observe = (emailValue, fullNameValue, source, seenAt, extra = {}) => {
    const email = normalizeEmail(emailValue);
    const fullName = oneLine(fullNameValue || "");
    if (!email || email.endsWith("@student-id.local")) return;
    const key = email;
    const current = candidates.get(key) || {
      email,
      nameCounts: new Map(),
      sources: new Set(),
      latestSeenAt: "",
      organizationId: normalizeOrganizationId(extra.organizationId || organizationId || ""),
    };
    if (fullName) {
      current.nameCounts.set(fullName, Number(current.nameCounts.get(fullName) || 0) + 1);
    }
    if (source) current.sources.add(source);
    const nextSeenAt = oneLine(seenAt || "");
    if (nextSeenAt && (!current.latestSeenAt || Date.parse(nextSeenAt) > Date.parse(current.latestSeenAt || ""))) {
      current.latestSeenAt = nextSeenAt;
    }
    candidates.set(key, current);
  };

  const registryRows = await listJsonByPrefix(env?.STUDENT_REGISTRY, "student:", 1000);
  registryRows
    .filter((record) => studentRecordBelongsToOrganization(record, organizationId))
    .forEach((record) => {
      observe(record?.email, record?.fullName, "registry", record?.lastSeenAt || record?.updatedAt, { organizationId });
    });

  const submissionRows = await listJsonByPrefix(env?.STUDENT_REGISTRY, "submission:", 1000);
  submissionRows
    .filter((record) => {
      const recordOrg = normalizeOrganizationId(record?.organizationId || "");
      return !organizationId || !recordOrg || recordOrg === normalizeOrganizationId(organizationId);
    })
    .forEach((record) => {
      observe(record?.email, record?.studentFullName, "submission", record?.submittedAt || record?.updatedAt, record);
      observe(record?.loginEmail, record?.studentFullName, "submission-login", record?.submittedAt || record?.updatedAt, record);
    });

  const backupRows = await listJsonByPrefix(env?.STUDENT_REGISTRY, "submission-backup:", 1000);
  backupRows
    .filter((record) => {
      const recordOrg = normalizeOrganizationId(record?.organizationId || "");
      return !organizationId || !recordOrg || recordOrg === normalizeOrganizationId(organizationId);
    })
    .forEach((record) => {
      observe(record?.email, record?.studentFullName, "backup", record?.submittedAt || record?.backedUpAt, record);
      observe(record?.loginEmail, record?.studentFullName, "backup-login", record?.submittedAt || record?.backedUpAt, record);
    });

  const practiceRows = await listJsonByPrefix(env?.STUDENT_REGISTRY, "practice-result:", 1000);
  practiceRows
    .filter((record) => {
      const recordOrg = normalizeOrganizationId(record?.organizationId || "");
      return !organizationId || !recordOrg || recordOrg === normalizeOrganizationId(organizationId);
    })
    .forEach((record) => {
      observe(record?.email, record?.studentFullName, "practice", record?.submittedAt || record?.updatedAt, record);
      observe(record?.loginEmail, record?.studentFullName, "practice-login", record?.submittedAt || record?.updatedAt, record);
    });

  return Array.from(candidates.values()).map((candidate) => ({
    ...candidate,
    fullName: pickMostLikelyStudentName(candidate),
    sources: Array.from(candidate.sources),
  }));
}

function chooseBestStudentProfileForCandidate(indexes, candidate) {
  if (!candidate) return { profile: null, confidence: 0, matchType: "none", alternatives: [] };
  const email = normalizeEmail(candidate.email || "");
  if (email) {
    const byLinked = indexes.byLinkedEmail.get(email);
    if (byLinked) return { profile: byLinked, confidence: 1, matchType: "linked-email", alternatives: [] };
    const byOfficial = indexes.byOfficialEmail.get(email);
    if (byOfficial) return { profile: byOfficial, confidence: 1, matchType: "official-email", alternatives: [] };
  }

  const normalizedName = normalizeStudentNameForMatch(candidate.fullName);
  if (!normalizedName) return { profile: null, confidence: 0, matchType: "none", alternatives: [] };

  const exactProfiles = indexes.byExactName.get(normalizedName) || [];
  if (exactProfiles.length === 1) {
    return { profile: exactProfiles[0], confidence: 0.99, matchType: "exact-name", alternatives: [] };
  }
  if (exactProfiles.length > 1) {
    return { profile: null, confidence: 0, matchType: "ambiguous-exact-name", alternatives: exactProfiles.slice(0, 5) };
  }

  const scored = indexes.rows
    .map((profile) => ({
      profile,
      score: scoreStudentNameMatch(candidate.fullName, profile.fullName),
    }))
    .filter((entry) => entry.score >= 0.75)
    .sort((a, b) => b.score - a.score);
  const best = scored[0];
  const second = scored[1];
  if (best && best.score >= 0.9 && (!second || best.score - second.score >= 0.08)) {
    return { profile: best.profile, confidence: best.score, matchType: "fuzzy-name", alternatives: scored.slice(1, 5).map((entry) => entry.profile) };
  }
  return { profile: null, confidence: best?.score || 0, matchType: "no-safe-match", alternatives: scored.slice(0, 5).map((entry) => entry.profile) };
}

async function backfillHistoricalStudentProfiles(env, auth) {
  const loaded = await loadScopedClassroomData(env, auth);
  if (!loaded.ok) throw new Error(loaded.error || "Could not load classroom data.");
  const organizationId = getActorOrganizationId(auth);
  const indexes = buildStudentProfileMatchIndexes(loaded.students);
  const candidates = await collectHistoricalIdentityCandidates(env, organizationId);

  const attachPlan = new Map();
  const unmatched = [];
  const matched = [];
  for (const candidate of candidates) {
    const decision = chooseBestStudentProfileForCandidate(indexes, candidate);
    if (!decision.profile) {
      if (candidate.fullName || candidate.email) {
        unmatched.push({
          email: candidate.email,
          fullName: candidate.fullName || "",
          confidence: Number(decision.confidence || 0),
          matchType: decision.matchType,
          alternatives: (decision.alternatives || []).map((profile) => profile.fullName || profile.studentIdCode).filter(Boolean),
        });
      }
      continue;
    }
    const current = attachPlan.get(candidate.email);
    if (!current || Number(decision.confidence || 0) > Number(current.confidence || 0)) {
      attachPlan.set(candidate.email, {
        email: candidate.email,
        fullName: candidate.fullName || "",
        confidence: Number(decision.confidence || 0),
        matchType: decision.matchType,
        profile: decision.profile,
      });
    }
  }

  for (const match of attachPlan.values()) {
    await attachStudentProfileToStoredHistory(env, organizationId, match.email, match.profile).catch(() => null);
    matched.push({
      email: match.email,
      fullName: match.fullName,
      studentIdCode: match.profile.studentIdCode || "",
      studentFullName: match.profile.fullName || "",
      classroomName: match.profile.classroomName || "",
      confidence: match.confidence,
      matchType: match.matchType,
    });
  }

  return {
    organizationId,
    scannedCandidates: candidates.length,
    attachedEmailCount: matched.length,
    unmatchedCount: unmatched.length,
    matched,
    unmatched: unmatched.slice(0, 50),
  };
}

function averageNullable(values) {
  const nums = (Array.isArray(values) ? values : []).map((value) => toNullableNumber(value)).filter((value) => value !== null);
  if (!nums.length) return null;
  return Math.round((nums.reduce((sum, value) => sum + value, 0) / nums.length) * 10) / 10;
}

function resolveAttemptStudentProfile(indexes, row) {
  if (!row) return null;
  const byId = indexes.byId.get(oneLine(row.studentProfileId || ""));
  if (byId) return byId;
  const byCode = indexes.byCode.get(oneLine(row.studentIdCode || ""));
  if (byCode) return byCode;
  const loginEmail = normalizeEmail(row.loginEmail || row.studentEmail || "");
  if (loginEmail) {
    const byLinked = indexes.byLinkedEmail.get(loginEmail);
    if (byLinked) return byLinked;
    const byOfficial = indexes.byOfficialEmail.get(loginEmail);
    if (byOfficial) return byOfficial;
  }
  const officialEmail = normalizeEmail(row.officialEmail || "");
  if (officialEmail) {
    const byOfficial = indexes.byOfficialEmail.get(officialEmail);
    if (byOfficial) return byOfficial;
  }
  const normalizedName = normalizeStudentNameForMatch(row.studentFullName || "");
  const exactProfiles = indexes.byExactName.get(normalizedName) || [];
  if (exactProfiles.length === 1) return exactProfiles[0];
  const decision = chooseBestStudentProfileForCandidate(indexes, {
    email: loginEmail || officialEmail,
    fullName: row.studentFullName || "",
  });
  return decision.profile || null;
}

function summarizeAttemptsForProfile(profile, attempts) {
  const rows = Array.isArray(attempts) ? attempts : [];
  const fullAttempts = rows.filter((row) => !isPracticeExamId(row?.examId));
  const practiceAttempts = rows.filter((row) => isPracticeExamId(row?.examId));
  const latest = rows[0] || null;
  return {
    studentIdCode: profile.studentIdCode || "",
    studentProfileId: profile.id || "",
    fullName: profile.fullName || "",
    classroomId: profile.classroomId || "",
    classroomName: profile.classroomName || "",
    officialEmail: profile.officialEmail || "",
    linkedAuthEmail: profile.linkedAuthEmail || "",
    attemptCount: rows.length,
    fullAttemptCount: fullAttempts.length,
    practiceAttemptCount: practiceAttempts.length,
    latestSubmittedAt: latest?.submittedAt || "",
    latestOverallBand: toNullableBand(latest?.overallBand),
    avgOverallBand: averageNullable(rows.map((row) => row.overallBand)),
    avgListeningBand: averageNullable(rows.map((row) => row.listeningBand)),
    avgReadingBand: averageNullable(rows.map((row) => row.readingBand)),
    avgWritingBand: averageNullable(rows.map((row) => row.finalWritingBand)),
    avgSpeakingBand: averageNullable(rows.map((row) => row.speakingBand)),
    lastAttempts: rows.slice(0, 8).map((row) => ({
      submittedAt: row.submittedAt || "",
      overallBand: toNullableBand(row.overallBand),
      examId: row.examId || "",
    })),
  };
}

async function buildClassroomProgressPayload(env, auth) {
  const loaded = await loadScopedClassroomData(env, auth);
  if (!loaded.ok) throw new Error(loaded.error || "Could not load classroom data.");
  const indexes = buildStudentProfileMatchIndexes(loaded.students);
  const fullRows = await getAdminResultsSummary(env, { actor: auth }).catch(() => []);
  const practiceRows = await getPracticeResultsSummary(env, { actor: auth }).catch(() => []);
  const attemptRows = [...fullRows, ...practiceRows]
    .map((row) => ({ ...row }))
    .sort((a, b) => Date.parse(String(b?.submittedAt || "")) - Date.parse(String(a?.submittedAt || "")));

  const attemptsByProfileId = new Map();
  attemptRows.forEach((row) => {
    const profile = resolveAttemptStudentProfile(indexes, row);
    if (!profile?.id) return;
    const nextRow = {
      ...row,
      studentProfileId: profile.id,
      studentIdCode: row.studentIdCode || profile.studentIdCode || "",
      classroomId: row.classroomId || profile.classroomId || "",
      classroomName: row.classroomName || profile.classroomName || "",
      officialEmail: row.officialEmail || profile.officialEmail || "",
    };
    const bucket = attemptsByProfileId.get(profile.id) || [];
    bucket.push(nextRow);
    attemptsByProfileId.set(profile.id, bucket);
  });

  const studentSummaries = indexes.rows.map((profile) => {
    const attempts = (attemptsByProfileId.get(profile.id) || []).slice().sort((a, b) => Date.parse(String(b?.submittedAt || "")) - Date.parse(String(a?.submittedAt || "")));
    return summarizeAttemptsForProfile(profile, attempts);
  });

  const classroomSummaries = (Array.isArray(loaded.classrooms) ? loaded.classrooms : []).map((classroom) => {
    const students = studentSummaries
      .filter((student) => student.classroomId === oneLine(classroom.id || ""))
      .sort((a, b) => {
        const attemptDelta = Number(b.attemptCount || 0) - Number(a.attemptCount || 0);
        if (attemptDelta) return attemptDelta;
        return (a.fullName || "").localeCompare(b.fullName || "");
      });
    const allAttempts = students.flatMap((student) => attemptsByProfileId.get(student.studentProfileId) || []);
    return {
      id: oneLine(classroom.id || ""),
      name: oneLine(classroom.name || ""),
      teacherName: oneLine(classroom.teacher_name || ""),
      teacherEmail: normalizeEmail(classroom.teacher_email || ""),
      studentCount: students.length,
      activeStudentCount: students.filter((student) => student.attemptCount > 0).length,
      linkedStudentCount: students.filter((student) => student.linkedAuthEmail).length,
      attemptCount: allAttempts.length,
      fullAttemptCount: allAttempts.filter((row) => !isPracticeExamId(row?.examId)).length,
      practiceAttemptCount: allAttempts.filter((row) => isPracticeExamId(row?.examId)).length,
      avgOverallBand: averageNullable(allAttempts.map((row) => row.overallBand)),
      avgListeningBand: averageNullable(allAttempts.map((row) => row.listeningBand)),
      avgReadingBand: averageNullable(allAttempts.map((row) => row.readingBand)),
      avgWritingBand: averageNullable(allAttempts.map((row) => row.finalWritingBand)),
      avgSpeakingBand: averageNullable(allAttempts.map((row) => row.speakingBand)),
      latestSubmittedAt: allAttempts[0]?.submittedAt || "",
      students,
    };
  }).sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  const allAttempts = classroomSummaries.flatMap((classroom) =>
    classroom.students.flatMap((student) => attemptsByProfileId.get(student.studentProfileId) || [])
  );
  return {
    summary: {
      classroomCount: classroomSummaries.length,
      studentCount: studentSummaries.length,
      activeStudentCount: studentSummaries.filter((student) => student.attemptCount > 0).length,
      linkedStudentCount: studentSummaries.filter((student) => student.linkedAuthEmail).length,
      attemptCount: allAttempts.length,
      avgOverallBand: averageNullable(allAttempts.map((row) => row.overallBand)),
      avgListeningBand: averageNullable(allAttempts.map((row) => row.listeningBand)),
      avgReadingBand: averageNullable(allAttempts.map((row) => row.readingBand)),
      avgWritingBand: averageNullable(allAttempts.map((row) => row.finalWritingBand)),
      avgSpeakingBand: averageNullable(allAttempts.map((row) => row.speakingBand)),
      latestSubmittedAt: allAttempts[0]?.submittedAt || "",
    },
    classrooms: classroomSummaries,
    students: studentSummaries,
    attemptsByProfileId,
  };
}

async function handleAdminBackfillStudentHistory(request, env, auth) {
  try {
    const report = await backfillHistoricalStudentProfiles(env, auth);
    try { ADMIN_RESULTS_SUMMARY_CACHE.clear(); } catch (error) {}
    return json(200, { ok: true, report });
  } catch (error) {
    return json(500, { ok: false, error: error?.message || "Could not backfill student history." });
  }
}

async function handleAdminClassroomProgress(request, env, auth) {
  try {
    const payload = await buildClassroomProgressPayload(env, auth);
    return json(200, {
      ok: true,
      summary: payload.summary,
      classrooms: payload.classrooms,
    });
  } catch (error) {
    return json(500, { ok: false, error: error?.message || "Could not load classroom progress." });
  }
}

async function handleAdminClassroomStudentProgress(request, env, auth) {
  const url = new URL(request.url);
  const studentIdCode = oneLine(url.searchParams.get("studentIdCode") || "");
  if (!studentIdCode) return json(400, { ok: false, error: "Student ID is required." });

  try {
    const payload = await buildClassroomProgressPayload(env, auth);
    const student = payload.students.find((row) => row.studentIdCode === studentIdCode);
    if (!student) return json(404, { ok: false, error: "Student not found." });
    const attempts = (payload.attemptsByProfileId.get(student.studentProfileId) || []).map((row) => ({
      ...row,
      source: isPracticeExamId(row?.examId) ? "practice" : "full",
    }));
    return json(200, {
      ok: true,
      student,
      classroom: payload.classrooms.find((row) => row.id === student.classroomId) || null,
      attempts,
    });
  } catch (error) {
    return json(500, { ok: false, error: error?.message || "Could not load student progress." });
  }
}

async function handleAdminSaveClassroom(request, env, auth) {
  const payload = await request.json().catch(() => null);
  const name = oneLine(payload?.name || "");
  if (!name) return json(400, { ok: false, error: "Classroom name is required." });
  const organizationId = auth.isSuperAdmin
    ? normalizeOrganizationId(payload?.organizationId || getActorOrganizationId(auth) || getPrimaryOrganizationId(env))
    : getActorOrganizationId(auth);
  const body = {
    organization_id: organizationId,
    name,
    teacher_name: oneLine(payload?.teacherName || ""),
    teacher_email: normalizeEmail(payload?.teacherEmail || "") || null,
  };
  const res = await supabaseServiceRequest(env, "/rest/v1/classrooms", {
    method: "POST",
    query: { select: "*" },
    headers: { Prefer: "return=representation" },
    body,
  });
  if (!res.ok) return json(res.status, { ok: false, error: res.error });
  return json(200, { ok: true, classroom: Array.isArray(res.data) ? res.data[0] || null : null });
}

async function handleAdminSaveStudentProfile(request, env, auth) {
  const payload = await request.json().catch(() => null);
  const studentIdCode = oneLine(payload?.studentIdCode || payload?.student_id_code || "");
  const name = oneLine(payload?.name || "");
  if (!studentIdCode || !name) return json(400, { ok: false, error: "Student ID and name are required." });
  const organizationId = auth.isSuperAdmin
    ? normalizeOrganizationId(payload?.organizationId || getActorOrganizationId(auth) || getPrimaryOrganizationId(env))
    : getActorOrganizationId(auth);
  const existing = await getStudentProfileByCode(env, studentIdCode, organizationId);
  const body = {
    organization_id: organizationId,
    student_id_code: studentIdCode,
    name,
    surname: oneLine(payload?.surname || ""),
    classroom_id: oneLine(payload?.classroomId || payload?.classroom_id || "") || null,
    linked_auth_email: normalizeEmail(payload?.linkedAuthEmail || payload?.linked_auth_email || "") || null,
    official_email: normalizeEmail(payload?.officialEmail || payload?.official_email || "") || null,
    is_active: payload?.isActive !== false,
  };
  const res = existing?.id
    ? await supabaseServiceRequest(env, "/rest/v1/student_profiles", {
        method: "PATCH",
        query: { id: `eq.${existing.id}`, select: "*,classroom:classrooms(id,name)" },
        headers: { Prefer: "return=representation" },
        body,
      })
    : await supabaseServiceRequest(env, "/rest/v1/student_profiles", {
        method: "POST",
        query: { select: "*,classroom:classrooms(id,name)" },
        headers: { Prefer: "return=representation" },
        body,
      });
  if (!res.ok) return json(res.status, { ok: false, error: res.error });
  const row = Array.isArray(res.data) ? res.data[0] || null : null;
  const linkedAuthEmail = normalizeEmail(body.linked_auth_email || "");
  const officialEmail = normalizeEmail(body.official_email || "");
  if (linkedAuthEmail) {
    await attachStudentProfileToStoredHistory(env, organizationId, linkedAuthEmail, row).catch(() => null);
  }
  if (officialEmail && officialEmail !== linkedAuthEmail) {
    await attachStudentProfileToStoredHistory(env, organizationId, officialEmail, row).catch(() => null);
  }
  try { ADMIN_RESULTS_SUMMARY_CACHE.clear(); } catch (error) {}
  return json(200, { ok: true, student: publicStudentProfile(row) });
}

function splitStudentFullName(fullName) {
  const cleaned = String(fullName || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return { name: "", surname: "" };
  const parts = cleaned.split(" ");
  if (parts.length === 1) return { name: parts[0], surname: "" };
  return {
    name: parts.slice(0, -1).join(" ").trim(),
    surname: parts.slice(-1).join(" ").trim(),
  };
}

async function handleAdminAssignStudentCodeFromResult(request, env, auth) {
  const payload = await request.json().catch(() => null);
  const organizationId = auth.isSuperAdmin
    ? normalizeOrganizationId(payload?.organizationId || getActorOrganizationId(auth) || getPrimaryOrganizationId(env))
    : getActorOrganizationId(auth);
  const studentIdCode = oneLine(payload?.studentIdCode || payload?.student_id_code || "");
  const fullName = oneLine(payload?.studentFullName || "");
  if (!studentIdCode) return json(400, { ok: false, error: "Student sign-in code is required." });
  if (!fullName) return json(400, { ok: false, error: "Student name is required." });
  const linkedAuthEmail = normalizeEmail(payload?.studentEmail || "") || null;
  const officialEmail = normalizeEmail(payload?.officialEmail || payload?.studentEmail || "") || null;
  const splitName = splitStudentFullName(fullName);
  if (!splitName.name) return json(400, { ok: false, error: "Could not determine the student name." });

  let existing = null;
  if (linkedAuthEmail) existing = await getStudentProfileByLinkedEmail(env, linkedAuthEmail, organizationId);
  if (!existing && officialEmail) existing = await getStudentProfileByOfficialEmail(env, officialEmail, organizationId);

  let targetProfile = existing || null;
  const sameCodeProfile = await getStudentProfileByCode(env, studentIdCode, organizationId);
  if (sameCodeProfile?.id) {
    targetProfile = sameCodeProfile;
  }

  if (targetProfile?.student_id_code) {
    const nextLinkedEmail = normalizeEmail(targetProfile.linked_auth_email || linkedAuthEmail || "") || null;
    const nextOfficialEmail = normalizeEmail(targetProfile.official_email || officialEmail || "") || null;
    const updatedExisting = await updateStudentProfileById(env, targetProfile.id, {
      name: targetProfile.name || splitName.name,
      surname: targetProfile.surname || splitName.surname || "",
      linked_auth_email: nextLinkedEmail,
      official_email: nextOfficialEmail,
      is_active: true,
    }).catch(() => targetProfile);
    if (linkedAuthEmail) {
      await attachStudentProfileToStoredHistory(
        env,
        organizationId,
        linkedAuthEmail,
        updatedExisting || targetProfile
      ).catch(() => null);
    }
    if (officialEmail && officialEmail !== linkedAuthEmail) {
      await attachStudentProfileToStoredHistory(
        env,
        organizationId,
        officialEmail,
        updatedExisting || targetProfile
      ).catch(() => null);
    }
    return json(200, {
      ok: true,
      student: publicStudentProfile(updatedExisting || targetProfile),
      reused: true,
      attachedExistingAttempts: true,
    });
  }

  const body = {
    organization_id: organizationId,
    student_id_code: studentIdCode,
    name: existing?.name || splitName.name,
    surname: existing?.surname || splitName.surname || "",
    classroom_id: oneLine(existing?.classroom_id || "") || null,
    linked_auth_email: linkedAuthEmail,
    official_email: officialEmail,
    is_active: true,
  };
  const res = existing?.id
    ? await supabaseServiceRequest(env, "/rest/v1/student_profiles", {
        method: "PATCH",
        query: { id: `eq.${existing.id}`, select: "*,classroom:classrooms(id,name)" },
        headers: { Prefer: "return=representation" },
        body,
      })
    : await supabaseServiceRequest(env, "/rest/v1/student_profiles", {
        method: "POST",
        query: { select: "*,classroom:classrooms(id,name)" },
        headers: { Prefer: "return=representation" },
        body,
      });
  if (!res.ok) return json(res.status, { ok: false, error: res.error || "Could not assign Student ID." });
  const row = Array.isArray(res.data) ? res.data[0] || null : null;
  if (linkedAuthEmail) {
    await attachStudentProfileToStoredHistory(env, organizationId, linkedAuthEmail, row).catch(() => null);
  }
  if (officialEmail && officialEmail !== linkedAuthEmail) {
    await attachStudentProfileToStoredHistory(env, organizationId, officialEmail, row).catch(() => null);
  }
  return json(200, { ok: true, student: publicStudentProfile(row), reused: false, attachedExistingAttempts: true });
}

async function handleAdminResetStudentProfileLink(request, env, auth) {
  const payload = await request.json().catch(() => null);
  const studentIdCode = oneLine(payload?.studentIdCode || "");
  if (!studentIdCode) return json(400, { ok: false, error: "Student ID is required." });
  const organizationId = auth.isSuperAdmin
    ? normalizeOrganizationId(payload?.organizationId || getActorOrganizationId(auth) || getPrimaryOrganizationId(env))
    : getActorOrganizationId(auth);
  const profile = await getStudentProfileByCode(env, studentIdCode, organizationId);
  if (!profile) return json(404, { ok: false, error: "Student not found." });
  const updated = await updateStudentProfileById(env, profile.id, {
    linked_auth_user_id: null,
    linked_auth_identity: null,
    linked_auth_email: null,
    linked_at: null,
  });
  return json(200, { ok: true, student: publicStudentProfile(updated || profile) });
}

async function inferSubmissionOrganizationId(env, rowLike, preferredOrganizationId = "") {
  const direct = normalizeOrganizationId(
    rowLike?.organizationId || rowLike?.organization_id || ""
  );
  if (direct) return direct;
  const keys = buildSubmissionLookupKeys(rowLike, preferredOrganizationId);
  for (const key of keys) {
    const record = await readJsonKv(env?.STUDENT_REGISTRY, `submission:${key}`);
    const recordOrganizationId = normalizeOrganizationId(record?.organizationId || "");
    if (recordOrganizationId) return recordOrganizationId;
    const scoreRecord = await readJsonKv(env?.STUDENT_REGISTRY, `score:${key}`);
    const scoreOrganizationId = normalizeOrganizationId(scoreRecord?.organizationId || "");
    if (scoreOrganizationId) return scoreOrganizationId;
  }
  return "";
}

async function filterRowsForAdminActor(rows, actor, env) {
  if (actor?.isSuperAdmin) return Array.isArray(rows) ? rows : [];
  const organizationId = getActorOrganizationId(actor);
  const filtered = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    const rowOrganizationId = await inferSubmissionOrganizationId(env, row, organizationId);
    if (rowOrganizationId && rowOrganizationId === organizationId) {
      filtered.push({
        ...row,
        organizationId: rowOrganizationId,
      });
    }
  }
  return filtered;
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
    studentProfileId: record?.studentProfileId || "",
    studentIdCode: record?.studentIdCode || "",
    classroomId: record?.classroomId || "",
    classroomName: record?.classroomName || "",
    officialEmail: record?.officialEmail || "",
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
    loginEmail: normalizeEmail(record?.loginEmail || record?.email || ""),
    organizationId: normalizeOrganizationId(record?.organizationId || ""),
    studentProfileId: oneLine(record?.studentProfileId || ""),
    studentIdCode: oneLine(record?.studentIdCode || ""),
    classroomId: oneLine(record?.classroomId || ""),
    classroomName: oneLine(record?.classroomName || ""),
    officialEmail: normalizeEmail(record?.officialEmail || ""),
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
    organization_id: summary.organizationId || null,
    student_full_name: summary.studentFullName || "",
    student_profile_id: summary.studentProfileId || null,
    student_id_code: summary.studentIdCode || null,
    classroom_id: summary.classroomId || null,
    official_email: summary.officialEmail || null,
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
  const tenant = resolveTenantContext(request, env);
  const organizationId = tenant.organizationId;
  const profile = await getLinkedPublicProfileForAuth(env, auth, organizationId).catch(() => null);
  const academicName = profile?.fullName || studentFullName;
  const officialEmail = profile?.officialEmail || "";

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
    studentFullName: academicName,
    email,
    loginEmail: email,
    studentProfileId: profile?.id || oneLine(payload?.studentProfileId || ""),
    studentIdCode: profile?.studentIdCode || oneLine(payload?.studentIdCode || ""),
    classroomId: profile?.classroomId || oneLine(payload?.classroomId || ""),
    classroomName: profile?.classroomName || oneLine(payload?.classroomName || ""),
    officialEmail,
    organizationId,
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

async function getStudentPracticeRows(env, email, organizationId = "") {
  if (!env?.STUDENT_REGISTRY || !email) return [];
  const records = await listJsonByPrefix(env.STUDENT_REGISTRY, `practice-user:${email}:`, 500);
  const rows = await Promise.all(records.map(async (record) => {
    const recordOrganizationId = normalizeOrganizationId(record?.organizationId || "");
    if (organizationId && recordOrganizationId !== normalizeOrganizationId(organizationId)) {
      return null;
    }
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
    .filter(Boolean)
    .sort((a, b) => Date.parse(String(b?.submitted_at || "")) - Date.parse(String(a?.submitted_at || "")));
}

async function getPracticeResultsSummary(env, options = {}) {
  const actor = options?.actor || null;
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

  const scopedRows = actor
    ? await filterRowsForAdminActor([...backendRows, ...objectiveRows], actor, env)
    : [...backendRows, ...objectiveRows];
  const merged = await Promise.all(scopedRows.map(async (row) => {
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

function buildAdminResultsSummaryCacheUrl(url, actor = null) {
  const cacheUrl = new URL(url.toString());
  cacheUrl.searchParams.delete("t");
  const scope = actor?.isSuperAdmin ? "super" : getActorOrganizationId(actor) || "public";
  cacheUrl.searchParams.set("_tenantScope", scope);
  return cacheUrl;
}

function setCachedAdminResultsSummary(key, value) {
  if (!key || !Array.isArray(value)) return;
  ADMIN_RESULTS_SUMMARY_CACHE.set(key, {
    value,
    expiresAt: Date.now() + ADMIN_RESULTS_SUMMARY_TTL_MS,
  });
}

function getAnyCachedAdminResultsSummary(key) {
  if (!key) return null;
  const entry = ADMIN_RESULTS_SUMMARY_CACHE.get(key);
  return entry && Array.isArray(entry.value) ? entry.value : null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}

async function fetchAppsScriptJsonWithRetry(url, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const retries = Math.max(0, Number(options.retries ?? 2));
  const timeoutMs = Math.max(1000, Number(options.timeoutMs ?? 12000));
  const headers = options.headers || {};
  const body = options.body;
  let lastError = null;
  let lastStatus = 0;
  let lastData = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: AbortSignal.timeout(timeoutMs),
      });
      const data = await response.json().catch(() => null);
      if (response.ok && data && data.ok === true) {
        return { response, data };
      }
      lastStatus = response.status;
      lastData = data;
      if (!(attempt < retries && (response.status >= 500 || !data))) break;
    } catch (error) {
      lastError = error;
      if (attempt >= retries) break;
    }
    await sleep(250 * (attempt + 1));
  }

  throw new Error(
    lastData?.error ||
    (lastStatus ? `Apps Script request failed with HTTP ${lastStatus}.` : "") ||
    (String(lastError?.name || "") === "TimeoutError" || String(lastError?.name || "") === "AbortError"
      ? `The upstream results service took too long to respond (${Math.round(timeoutMs / 1000)}s timeout).`
      : "") ||
    lastError?.message ||
    "Apps Script request failed."
  );
}

async function getAdminResultsSummary(env, options = {}) {
  const actor = options?.actor || null;
  const cacheKey = actor?.isSuperAdmin ? "all:super" : `all:${getActorOrganizationId(actor) || "public"}`;
  const forceRefresh = options?.forceRefresh === true;
  const cached = forceRefresh ? null : getCachedAdminResultsSummary(cacheKey);
  if (cached) return cached;

  const backendUrl = new URL(env.ADMIN_BACKEND_URL);
  backendUrl.searchParams.set("action", "resultsSummary");
  backendUrl.searchParams.set("t", String(Date.now()));

  try {
    const signedBackendUrl = await buildSignedAppsScriptUrl(backendUrl.toString(), "GET", "", env);
    const { data } = await fetchAppsScriptJsonWithRetry(signedBackendUrl, {
      method: "GET",
      retries: forceRefresh ? 1 : 2,
      timeoutMs: ADMIN_RESULTS_SUMMARY_FETCH_TIMEOUT_MS,
    });
    if (!Array.isArray(data.results)) {
      throw new Error("Could not load admin results summary.");
    }

    const visibleRows = await filterRowsForAdminActor(data.results, actor || { isSuperAdmin: true }, env);
    const summaries = visibleRows.map((row) => summarizeAdminResultRow(row));
    setCachedAdminResultsSummary(cacheKey, summaries);
    return summaries;
  } catch (error) {
    const stale = getAnyCachedAdminResultsSummary(cacheKey);
    if (stale?.length) return stale;
    throw error;
  }
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
    organizationId: normalizeOrganizationId(row?.organizationId || row?.organization_id || ""),
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
