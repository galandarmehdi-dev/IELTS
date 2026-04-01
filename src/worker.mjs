import { EmailMessage } from "cloudflare:email";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/contact") {
      return handleContactApi(request, env);
    }

    if (url.pathname === "/api/admin") {
      return handleAdminApi(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

const WRITING_SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1ZTBc4uMJ3ZAA5yG7r7i4RhTz4Eo8onnzVNNJoF1m8iU/export?format=csv&gid=1669784116";

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

  if (request.method === "GET" && action === "writingSamples") {
    const response = await fetch(WRITING_SHEET_CSV_URL, { method: "GET" });
    const csvText = await response.text();
    if (!response.ok || !csvText) {
      return json(response.ok ? 502 : response.status, { ok: false, error: "Could not load writing sheet." });
    }

    const samples = buildWritingSamplesFromSheet(csvText);
    return json(200, { ok: true, samples });
  }

  if (request.method === "GET" && action === "studentResult") {
    const auth = await authenticateUser(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });

    const backendUrl = new URL(env.ADMIN_BACKEND_URL);
    backendUrl.search = url.search;
    return proxy(request, backendUrl.toString());
  }

  if (request.method === "POST" && action === "studentResults") {
    const auth = await authenticateUser(request, env);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });

    const payload = await request.json().catch(() => null);
    const rows = Array.isArray(payload?.rows) ? payload.rows : [];
    if (!rows.length) return json(200, { ok: true, results: [] });

    const backendUrl = new URL(env.ADMIN_BACKEND_URL);
    backendUrl.searchParams.set("action", "results");
    backendUrl.searchParams.set("adminPasscode", String(env.ADMIN_RESULTS_PASSCODE || ""));
    backendUrl.searchParams.set("t", String(Date.now()));

    const response = await fetch(backendUrl.toString(), { method: "GET" });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data || data.ok !== true || !Array.isArray(data.results)) {
      return json(response.ok ? 502 : response.status, { ok: false, error: "Could not load student result matches." });
    }

    const wanted = new Set(rows.map((row) => buildResultMatchKey(row)));
    const matches = data.results.filter((row) => wanted.has(buildResultMatchKey(row)));
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

function oneLine(value) {
  return String(value || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeMessage(value) {
  return String(value || "").replace(/\r/g, "").trim();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
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
