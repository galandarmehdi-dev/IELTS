export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/admin") {
      return handleAdminApi(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

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

  if (request.method === "GET" && action === "writingSamples") {
    const backendUrl = new URL(env.ADMIN_BACKEND_URL);
    backendUrl.searchParams.set("action", "results");
    backendUrl.searchParams.set("adminPasscode", String(env.ADMIN_RESULTS_PASSCODE || ""));
    backendUrl.searchParams.set("t", String(Date.now()));

    const response = await fetch(backendUrl.toString(), { method: "GET" });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data || data.ok !== true || !Array.isArray(data.results)) {
      return json(response.ok ? 502 : response.status, {
        ok: false,
        error: (data && data.error) || "Could not load writing samples.",
      });
    }

    const samples = data.results.flatMap((row) => buildWritingSamplesFromRow(row));
    return json(200, { ok: true, samples });
  }

  if (request.method === "GET" && action === "studentResult") {
    const auth = await authenticateUser(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });

    const backendUrl = new URL(env.ADMIN_BACKEND_URL);
    backendUrl.search = url.search;
    return proxy(request, backendUrl.toString());
  }

  if (request.method === "POST") {
    return proxy(request, String(env.ADMIN_BACKEND_URL || ""));
  }

  return json(405, { ok: false, error: "Method not allowed." });
}

async function authenticateAdmin(request, env) {
  const auth = await authenticateUser(request, env);
  if (!auth.ok) return auth;

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

  return { ok: true, status: 200, user };
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

function buildWritingSamplesFromRow(row) {
  const testId = normalizeTestId(row?.examId || row?.activeTestId || row?.active_test_id || "");
  if (!testId) return [];

  const samples = [];
  const task1 = String(row?.writingTask1 || row?.writing_task1 || "").trim();
  const task2 = String(row?.writingTask2 || row?.writing_task2 || "").trim();

  if (task1) {
    samples.push({
      testId,
      taskKey: "task1",
      label: formatSampleLabel(row?.task1Band || row?.task1_band, row?.submittedAt || row?.submitted_at),
      bandScore: formatBand(row?.task1Band || row?.task1_band),
      explanation: plainText(row?.task1Feedback || row?.task1_feedback || row?.task1Breakdown || row?.task1_breakdown || row?.overallFeedback || row?.overall_feedback || "Stored student essay from a past submission."),
      sampleAnswer: task1,
      correctedForm: "",
    });
  }

  if (task2) {
    samples.push({
      testId,
      taskKey: "task2",
      label: formatSampleLabel(row?.task2Band || row?.task2_band, row?.submittedAt || row?.submitted_at),
      bandScore: formatBand(row?.task2Band || row?.task2_band),
      explanation: plainText(row?.task2Feedback || row?.task2_feedback || row?.task2Breakdown || row?.task2_breakdown || row?.overallFeedback || row?.overall_feedback || "Stored student essay from a past submission."),
      sampleAnswer: task2,
      correctedForm: "",
    });
  }

  return samples;
}

function normalizeTestId(value) {
  const text = String(value || "").trim().toLowerCase();
  const match = text.match(/ielts\s*test\s*(\d+)/i) || text.match(/ielts[-_\s]?(\d+)/i);
  if (match) return `ielts${match[1]}`;
  return text;
}

function formatBand(value) {
  const text = String(value || "").trim();
  if (!text) return "Student sample";
  return /^band\s+/i.test(text) ? text : `Band ${text}`;
}

function formatSampleLabel(band, submittedAt) {
  const parts = [formatBand(band)];
  const stamp = formatDateLabel(submittedAt);
  if (stamp) parts.push(stamp);
  return parts.join(" · ");
}

function formatDateLabel(value) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function plainText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
