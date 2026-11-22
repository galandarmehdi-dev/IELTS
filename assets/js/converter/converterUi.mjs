import { parseExamHtml, parseWritingHtml, CONVERTER_VERSION } from "./examParser.mjs";
import { convertToEngineContent, convertWritingToEngineContent, assembleFullExam, TASK1_TYPES, TASK2_TYPES } from "./examAdapter.mjs";
import { readZipHtmlFiles } from "./zipReader.mjs";

const FAMILIES = [
  ["note_completion", "sentence_completion", "summary_completion", "form_completion", "table_completion", "flow_chart_completion", "short_answer"],
  ["true_false_not_given", "yes_no_not_given"],
  ["matching_information", "matching_features", "matching_sentence_endings"],
];
const LABELS = {
  note_completion: "Note completion", sentence_completion: "Sentence completion", summary_completion: "Summary completion", form_completion: "Form completion",
  table_completion: "Table completion", flow_chart_completion: "Flow-chart completion", short_answer: "Short answer", true_false_not_given: "True / False / Not Given",
  yes_no_not_given: "Yes / No / Not Given", matching_information: "Matching information", matching_features: "Matching features", matching_sentence_endings: "Matching sentence endings",
  summary_completion_wordbank: "Summary (word bank)", multiple_choice: "Multiple choice", multiple_answer: "Multiple answer", diagram_labelling: "Diagram labelling",
  map_labelling: "Map labelling", plan_labelling: "Plan labelling", matching_headings: "Matching headings", unknown: "Unknown",
};

const CSS = `
.xc{display:grid;gap:16px}.xc h2,.xc h3{margin:0}.xc .xc-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.xc .xc-drop{border:2px dashed var(--border,#cbd5e1);border-radius:14px;padding:26px;text-align:center;cursor:pointer;background:rgba(23,50,77,.03)}
.xc .xc-drop.over{border-color:#17324d;background:rgba(23,50,77,.08)}
.xc .xc-slot{border:2px dashed transparent;transition:border-color .15s,background .15s}
.xc .xc-slot.over{border-color:#17324d;background:rgba(23,50,77,.06)}
.xc input[type=text],.xc input[type=url],.xc select{min-height:36px;padding:0 10px;border:1px solid var(--border,#cbd5e1);border-radius:8px;font:inherit;background:#fff}
.xc table{width:100%;border-collapse:collapse;font-size:13px}.xc th,.xc td{text-align:left;padding:7px 8px;border-bottom:1px solid rgba(23,50,77,.1);vertical-align:top}
.xc .xc-tablewrap{overflow-x:auto}.xc .xc-bar{height:8px;border-radius:6px;background:rgba(23,50,77,.1);overflow:hidden}.xc .xc-bar>i{display:block;height:100%;background:#17324d;width:0}
.xc .xc-chip{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:700;background:rgba(23,50,77,.1)}
.xc .ok{background:#d9f3e3;color:#14532d}.xc .warn{background:#fdecc8;color:#7a4a00}.xc .bad{background:#fbd9d9;color:#8a1c1c}
.xc .xc-issue{margin:2px 0;font-size:13px}.xc .xc-issue.error{color:#8a1c1c}.xc .xc-issue.warning{color:#7a4a00}
.xc .xc-preview{border:1px solid var(--border,#cbd5e1);border-radius:12px;padding:12px;max-height:520px;overflow:auto;background:#fff}
.xc .xc-lpreview{position:static;max-width:100%;overflow-x:auto}.xc .xc-lpreview .listen-page{display:block!important}.xc .xc-lpreview .listen-block{margin-bottom:14px}
.xc input[type=file]{max-width:100%;min-width:0}.xc .xc-slot{flex:1 1 260px;min-width:0}
.xc .xc-passage{white-space:pre-wrap;font-size:13px;line-height:1.5;margin:0 0 12px}.xc .xc-answers{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px}
.xc .xc-answers label{display:flex;gap:6px;align-items:center;font-size:12px}.xc .xc-answers input{width:100%;min-width:0}
`;

const HINTS = {
  media_unresolved: "Fix: upload the image under Audio and images, or enter the source site URL at the top.",
  audio_unresolved: "Fix: upload the MP3 under Audio and images.",
  media_host_blocked: "Fix: upload the file under Audio and images. It is then stored on your own storage and plays reliably.",
  unsupported_type: "Fix: this question type needs manual editing. Try another type under Question groups.",
  headings_not_found: "Fix: the HTML needs a list of headings (i, ii, iii...) before the questions.",
  headings_items_not_found: "Fix: the HTML needs numbered lines such as '14 Paragraph A' under the heading list.",
  no_answer_key: "Fix: the file has no answers section. Add one and drop the file again.",
  no_questions: "Fix: no 'Questions 1-6' style headings were found in this file.",
  missing_audio: "Fix: this Listening file has no audio reference. Check that it really is a Listening test.",
};

function el(tag, attrs = {}, ...kids) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (v === undefined || v === null || v === false) return;
    if (k === "class") node.className = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? "" : v);
  });
  kids.flat().forEach((kid) => kid !== null && kid !== undefined && node.append(kid.nodeType ? kid : document.createTextNode(String(kid))));
  return node;
}

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeHtml(html) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  tpl.content.querySelectorAll("script,iframe,object,embed,link,meta,style,form").forEach((n) => n.remove());
  tpl.content.querySelectorAll("*").forEach((n) => [...n.attributes].forEach((a) => /^on/i.test(a.name) && n.removeAttribute(a.name)));
  return tpl.content;
}

export function mountExamConverter(root, { getToken }) {
  if (!document.getElementById("xcStyles")) document.head.append(el("style", { id: "xcStyles" }, CSS));
  const state = { editor: null, full: { items: {}, title: "", status: "", error: "", testId: "", publishedConflict: false }, items: [], library: [], selected: null, baseUrl: "", module: "academic", skill: "", busy: false, progress: null, message: "" };
  let nextId = 1;
  const parseHtml = (s) => new DOMParser().parseFromString(s, "text/html");

  async function api(action, { method = "GET", query = {}, json, raw, contentType } = {}) {
    const url = new URL("/api/admin", location.origin);
    url.searchParams.set("action", action);
    Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
    const token = await getToken();
    const headers = { Authorization: `Bearer ${token}` };
    let body;
    if (json !== undefined) { headers["Content-Type"] = "application/json"; body = JSON.stringify(json); }
    if (raw) { headers["Content-Type"] = contentType; body = raw; }
    const res = await fetch(url, { method, headers, body, credentials: "same-origin" });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok && data.ok !== false, data };
  }

  // ---------- conversion ----------
  function convert(item) {
    if (item.slot === "writing") {
      const parsed = parseWritingHtml(item.html, { parseHtml, filename: item.name, sourceBaseUrl: state.baseUrl, module: state.module });
      if (item.edits.title) parsed.title = item.edits.title;
      const we = item.edits.writing;
      const toLines = (text) => String(text).split(/\n+/).map((t) => t.trim()).filter(Boolean).map((t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
      if (typeof we.task1 === "string") parsed.task1.lines = toLines(we.task1);
      if (typeof we.task2 === "string") parsed.task2.lines = toLines(we.task2);
      ["task1", "task2"].forEach((k, i) => { if (!parsed[k].lines.length) parsed.issues.push({ severity: "error", code: `task${i + 1}_missing`, message: `Task ${i + 1} is empty.` }); });
      const out = convertWritingToEngineContent(parsed, { mediaMap: item.edits.media, types: { task1Type: we.task1Type, task2Type: we.task2Type } });
      item.parsed = parsed;
      item.out = out;
      item.answerKeys = {};
      item.issues = [...parsed.issues.filter((i) => i.code !== "media_needs_source" || !Object.keys(item.edits.media).length), ...out.issues];
      item.status = item.issues.some((i) => i.severity === "error") ? "needs_review" : "ready";
      return;
    }
    const parsed = parseExamHtml(item.html, {
      parseHtml, filename: item.name, sourceBaseUrl: state.baseUrl, module: state.module,
      skill: item.slot || state.skill || undefined, typeOverrides: item.edits.types,
    });
    if (item.edits.title) parsed.title = item.edits.title;
    const out = convertToEngineContent(parsed, { mediaMap: item.edits.media, passageEdits: item.edits.passages });
    const answerKeys = { ...out.answerKeys, ...item.edits.answers };
    const issues = [...parsed.issues.filter((i) => !["media_needs_source"].includes(i.code) || !Object.keys(item.edits.media).length), ...out.issues];
    item.parsed = parsed;
    item.out = out;
    item.answerKeys = answerKeys;
    item.issues = issues;
    item.status = item.status === "saved" ? "saved" : issues.some((i) => i.severity === "error") ? "needs_review" : "ready";
  }

  async function addFiles(fileList) {
    state.busy = true;
    const raw = [];
    try {
      for (const file of fileList) {
        if (/\.zip$/i.test(file.name)) {
          try {
            raw.push(...(await readZipHtmlFiles(await file.arrayBuffer())).map((f) => ({ ...f, name: `${file.name}/${f.name}` })));
          } catch (e) {
            raw.push({ name: file.name, error: e.message });
          }
        } else if (/\.html?$/i.test(file.name)) {
          raw.push({ name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) });
        } else raw.push({ name: file.name, error: "Only .html, .htm and .zip files are supported." });
      }
      const seen = new Set(state.items.map((i) => i.hash));
      state.progress = { done: 0, total: raw.length };
      render();
      for (const f of raw) {
        const item = { id: nextId++, name: f.name, status: "failed", error: "", html: "", hash: "", edits: { types: {}, answers: {}, media: {}, title: "", passages: {}, writing: {} }, issues: [] };
        try {
          if (f.error) throw new Error(f.error);
          item.hash = await sha256Hex(f.bytes);
          if (seen.has(item.hash)) { item.status = "duplicate"; item.error = "Same file already in this batch."; }
          else {
            seen.add(item.hash);
            item.html = new TextDecoder("utf-8").decode(f.bytes);
            convert(item);
          }
        } catch (e) {
          item.status = "failed";
          item.error = e.message || "Could not convert this file.";
        }
        state.items.push(item);
        state.progress.done += 1;
        if (state.progress.done % 5 === 0 && state.progress.done < raw.length) { render(); await new Promise((r) => setTimeout(r, 0)); }
      }
    } finally {
      state.busy = false;
      state.progress = null;
      render();
    }
  }

  function reconvertAll() {
    Object.values(state.full.items).forEach((item) => { try { convert(item); } catch (e) { item.status = "failed"; item.error = e.message; } });
    state.items.forEach((item) => { if (item.html && item.status !== "saved") { try { convert(item); } catch (e) { item.status = "failed"; item.error = e.message; } } });
    render();
  }

  function retryFailed() {
    state.items.filter((i) => i.status === "failed" && i.html).forEach((item) => { try { convert(item); item.error = ""; } catch (e) { item.error = e.message; } });
    render();
  }

  // ---------- full exam ----------
  async function loadSlot(skill, file) {
    const item = { id: nextId++, slot: skill, name: file.name, status: "failed", error: "", html: "", hash: "", edits: { types: {}, answers: {}, media: {}, title: "", passages: {}, writing: {} }, issues: [] };
    state.full.items[skill] = item;
    state.full.status = "";
    try {
      if (!/\.html?$/i.test(file.name)) throw new Error("Only .html files can be used here.");
      const bytes = new Uint8Array(await file.arrayBuffer());
      item.hash = await sha256Hex(bytes);
      item.html = new TextDecoder("utf-8").decode(bytes);
      convert(item);
      if (skill !== "writing" && item.parsed.skill !== skill) {
        item.status = "needs_review";
        item.issues.push({ severity: "error", code: "part_wrong_skill", message: `This looks like a ${item.parsed.skill} file, not ${skill}.` });
      }
      if (!state.full.title && skill === "reading") state.full.title = `Full Exam: ${item.parsed.title}`;
    } catch (e) {
      item.status = "failed";
      item.error = e.message || "Could not convert this file.";
    }
    render();
  }

  function fullAssembly() {
    const part = (skill) => {
      const item = state.full.items[skill];
      return item && item.parsed && item.out ? { parsed: item.parsed, out: item.out, answerKeys: item.answerKeys } : null;
    };
    return assembleFullExam({ listening: part("listening"), reading: part("reading"), writing: part("writing") }, { title: state.full.title });
  }

  async function saveFull(overwriteDraft = false, replacePublished = false) {
    const a = fullAssembly();
    const items = ["listening", "reading", "writing"].map((k) => state.full.items[k]);
    state.full.status = "saving";
    render();
    const hashBytes = new TextEncoder().encode(items.map((i) => i.hash).join("|"));
    const res = await api("importedExamSave", {
      method: "POST",
      json: {
        sourceHash: await sha256Hex(hashBytes), sourceName: items.map((i) => i.name).join(" + "), skill: "full", title: a.title, module: state.module,
        content: a.content, answerKeys: a.answerKeys, media: items.flatMap((i) => i.parsed.media), overwriteDraft, replacePublished, converterVersion: CONVERTER_VERSION,
      },
    });
    if (res.ok) { state.full.status = "saved"; state.full.testId = res.data.testId; state.full.publishedConflict = false; state.full.error = res.data.replaced ? "The published version was replaced. It is now a draft: publish it again when you are happy with it." : ""; }
    else if (res.status === 409 && res.data.published) { state.full.status = "duplicate"; state.full.publishedConflict = true; state.full.error = res.data.error; }
    else if (res.status === 409 && res.data.duplicate) { state.full.status = "duplicate"; state.full.error = "A draft of these three files already exists. Use Save changes to overwrite it."; }
    else { state.full.status = "error"; state.full.error = res.data.error || "Save failed."; }
    await loadLibrary();
  }

  // ---------- saving ----------
  async function saveItem(item, overwriteDraft = false, replacePublished = false) {
    item.status = "saving";
    render();
    const parsed = item.parsed;
    const res = await api("importedExamSave", {
      method: "POST",
      json: {
        sourceHash: item.hash, sourceName: item.name, skill: parsed.skill, title: parsed.title, module: parsed.module,
        content: item.out.content, answerKeys: item.answerKeys, media: parsed.media, overwriteDraft, replacePublished, converterVersion: CONVERTER_VERSION,
      },
    });
    if (res.ok) { item.status = "saved"; item.publishedConflict = false; item.testId = res.data.testId; item.error = res.data.replaced ? "The published version was replaced. It is now a draft: publish it again when you are happy with it." : ""; }
    else if (res.status === 409 && res.data.published) { item.status = "duplicate"; item.publishedConflict = true; item.testId = res.data.testId; item.error = res.data.error; }
    else if (res.status === 409 && res.data.duplicate) { item.status = "duplicate"; item.testId = res.data.testId; item.error = "A draft of this file already exists. Use Save changes in Review to overwrite it."; }
    else { item.status = "needs_review"; item.error = res.data.error || "Save failed."; }
    render();
  }

  async function saveAllReady() {
    const queue = state.items.filter((i) => i.status === "ready");
    state.busy = true;
    state.progress = { done: 0, total: queue.length };
    for (const item of queue) {
      await saveItem(item);
      state.progress.done += 1;
    }
    state.busy = false;
    state.progress = null;
    await loadLibrary();
  }

  async function loadLibrary() {
    const res = await api("importedExamList");
    state.library = res.ok ? res.data.exams || [] : [];
    if (!res.ok) state.message = res.data.error || "Could not load saved exams. Has the imported_exams SQL been run?";
    render();
  }

  async function libraryAction(action, exam, extra = {}) {
    const res = await api(action, { method: "POST", json: { testId: exam.test_id, ...extra } });
    state.message = res.ok ? "" : (res.data.error || "Action failed.") + (res.data.validation?.errors?.length ? ` ${res.data.validation.errors.join(" ")}` : "");
    await loadLibrary();
  }

  async function uploadMedia(item, original, file) {
    const res = await api("importedExamMediaUpload", { method: "POST", raw: file, contentType: file.type || "application/octet-stream" });
    if (!res.ok) { state.message = res.data.error || "Upload failed."; render(); return; }
    item.edits.media[original] = res.data.url;
    convert(item);
    state.message = "";
    render();
  }

  async function checkMedia(item) {
    const urls = (item.parsed?.media || []).map((m) => m.resolved || item.edits.media[m.original]).filter(Boolean);
    if (!urls.length) { state.message = "Set the source site URL or upload the files first."; render(); return; }
    const res = await api("importedExamCheckMedia", { method: "POST", json: { urls } });
    item.mediaCheck = Object.fromEntries((res.data.results || []).map((r) => [r.url, r]));
    render();
  }

  function exportReport() {
    const rows = [["file", "status", "skill", "title", "questions", "answers", "errors", "warnings", "message"]];
    state.items.forEach((i) => rows.push([i.name, i.status, i.parsed?.skill || "", i.parsed?.title || "", i.parsed?.stats.questionsCovered ?? "", Object.keys(i.answerKeys || {}).length, i.issues.filter((x) => x.severity === "error").map((x) => x.message).join(" | "), i.issues.filter((x) => x.severity === "warning").length, i.error]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = el("a", { href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })), download: "exam-converter-report.csv" });
    document.body.append(a); a.click(); a.remove();
  }

  // ---------- rendering ----------
  const chip = (status) => {
    const map = { ready: ["Ready", "ok"], needs_review: ["Needs review", "warn"], failed: ["Failed", "bad"], saved: ["Draft saved", "ok"], saving: ["Saving…", ""], duplicate: ["Duplicate", "warn"] };
    const [label, cls] = map[status] || [status, ""];
    return el("span", { class: `xc-chip ${cls}` }, label);
  };

  function previewNode(item) {
    const box = el("div", { class: "xc-preview" });
    const content = item.out.content;
    if (content.listening) {
      box.append(el("p", { class: "small" }, `Audio: ${content.listening.audioSrc || "missing"}`));
      if (/^https:\/\//.test(content.listening.audioSrc || "")) box.append(el("audio", { controls: true, src: content.listening.audioSrc, style: "width:100%;margin-bottom:10px" }));
      const wrap = el("div", { class: "xc-lpreview" });
      const holder = el("div");
      holder.append(safeHtml(content.listening.html));
      holder.querySelectorAll(".listen-page.hidden").forEach((p) => p.classList.remove("hidden"));
      holder.querySelectorAll("input,select").forEach((i) => { i.disabled = true; });
      wrap.append(holder);
      box.append(wrap);
    } else {
      (content.reading?.parts || []).forEach((part) => {
        box.append(el("h3", {}, `Passage ${part.id.replace("part", "")}`), el("p", { class: "xc-passage" }, part.passageText.length > 700 ? `${part.passageText.slice(0, 700)}…` : part.passageText));
        part.blocks.forEach((b) => {
          const rows = (b.items || b.questions || b.summaryLines || []).map((i) => {
            const q = i.q ?? i.blankQ;
            return el("div", { class: "small" }, `${q}. ${(i.text || "").slice(0, 120)}${i.tail ? ` ___ ${i.tail.slice(0, 60)}` : ""}  → `, el("b", {}, item.answerKeys[q] || "—"));
          });
          box.append(el("div", { style: "margin:0 0 12px" }, el("b", {}, `${b.title} · ${b.type}`), el("div", { class: "small" }, (b.instructions || []).join(" ")), b.imageSrc ? el("div", { class: "small" }, `Image: ${b.imageSrc}`) : null, ...rows));
        });
      });
    }
    return box;
  }

  function writingReviewPanel(item) {
    const w = item.out.content.writing;
    const media = item.parsed.media.map((m) => {
      const url = item.edits.media[m.original] || m.resolved;
      return el("tr", {}, el("td", { style: "word-break:break-all" }, m.original), el("td", { style: "word-break:break-all" }, url || "Not available yet"),
        el("td", {}, el("input", { type: "file", accept: "image/*", onchange: (e) => e.target.files[0] && uploadMedia(item, m.original, e.target.files[0]) })));
    });
    const plainLines = (lines) => lines.map((l) => { const t = document.createElement("div"); t.innerHTML = l; return t.textContent.trim(); }).join("\n");
    const editor = (n, key, lines, types, current) => el("div", {},
      el("h3", {}, `Task ${n}`),
      el("label", { class: "small", for: `xcW${n}Type` }, "Type "),
      el("select", { id: `xcW${n}Type`, onchange: (e) => { item.edits.writing[`task${n}Type`] = e.target.value; convert(item); render(); } }, (types.includes(current) ? types : [current, ...types]).map((t) => el("option", { value: t, selected: t === current }, t))),
      el("p", { class: "small" }, "Edit the question text below. Each line becomes its own line for the student. The time hint (\"You should spend about…\") is added automatically."),
      el("textarea", { id: `xcW${n}Text`, rows: 6, style: "width:100%;font:inherit;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:8px", onchange: (e) => { item.edits.writing[key] = e.target.value; convert(item); render(); } }, plainLines(lines)));
    const task = (label, html, type) => el("div", {}, el("h3", {}, `${label} preview (${type})`), (() => { const d = el("div", { class: "xc-preview" }); d.append(safeHtml(html)); return d; })());
    return el("div", { class: "admin-result-detail ui-panel xc" },
      el("div", { class: "xc-row" }, el("h3", {}, `Review: ${item.name}`), el("button", { class: "btn secondary", type: "button", onclick: () => { state.selected = null; render(); } }, "Close")),
      item.issues.length ? el("div", {}, ...item.issues.map((i) => el("div", { class: `xc-issue ${i.severity}` }, `${i.severity === "error" ? "Blocks publishing: " : ""}${i.message}`, i.severity === "error" && HINTS[i.code] ? el("div", { class: "small" }, HINTS[i.code]) : null))) : el("p", { class: "small" }, "No issues found."),
      editor(1, "task1", item.parsed.task1.lines, TASK1_TYPES, w.task1Type),
      task("Task 1", w.task1Html, w.task1Type),
      w.task1ImageSrc ? el("div", {}, el("p", { class: "small" }, `Task 1 image: ${w.task1ImageSrc}`), /^https:/.test(w.task1ImageSrc) ? el("img", { src: w.task1ImageSrc, alt: "Task 1", style: "max-width:420px;border-radius:8px" }) : null) : null,
      media.length ? el("div", { class: "xc-tablewrap" }, el("table", {}, el("thead", {}, el("tr", {}, ["In the HTML", "Using", "Upload replacement"].map((h) => el("th", {}, h)))), el("tbody", {}, ...media))) : null,
      editor(2, "task2", item.parsed.task2.lines, TASK2_TYPES, w.task2Type),
      task("Task 2", w.task2Html, w.task2Type),
      el("p", { class: "small" }, "This part is saved together with the other two from the Full exam panel."));
  }

  function fullPanel() {
    const slots = [["listening", "Listening", "HTML file with the audio link and answers"], ["reading", "Reading", "HTML file with the three passages and answers"], ["writing", "Writing", "HTML file with Task 1 and Task 2"]];
    const a = fullAssembly();
    const have = slots.filter(([k]) => state.full.items[k]).length;
    const blocking = a.issues.filter((i) => i.severity === "error");
    const slotNodes = slots.map(([skill, label, hint]) => {
      const item = state.full.items[skill];
      const input = el("input", { type: "file", accept: ".html,.htm", id: `xcFull-${skill}`, onchange: (e) => e.target.files[0] && loadSlot(skill, e.target.files[0]) });
      const pickHtml = (files) => [...files].find((f) => /\.html?$/i.test(f.name));
      const slot = el("div", { class: "admin-result-detail ui-panel xc-slot", "aria-label": `${label} file: choose or drop an HTML file`,
        ondragover: (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; slot.classList.add("over"); },
        ondragleave: (e) => { if (!slot.contains(e.relatedTarget)) slot.classList.remove("over"); },
        ondrop: (e) => {
          e.preventDefault(); slot.classList.remove("over");
          const file = pickHtml(e.dataTransfer.files);
          if (file) loadSlot(skill, file);
          else { const msg = slot.querySelector(".xc-slot-msg"); if (msg) msg.textContent = "Drop an .html file here."; }
        } },
        el("strong", {}, label), el("div", { class: "small" }, hint), input,
        el("div", { class: "small xc-slot-msg", style: "margin-top:4px" }, "or drop the HTML file here"),
        item ? el("div", { class: "small", style: "margin-top:6px;word-break:break-all" }, item.name, " ", chip(item.status), item.error ? el("div", { class: "xc-issue error" }, item.error) : null,
          item.parsed ? el("div", {}, skill === "writing" ? "2 tasks" : `${item.parsed.stats.questionsCovered}/40 questions · ${Object.keys(item.answerKeys).length} answers`, " ", el("button", { class: "btn secondary", type: "button", onclick: () => { state.selected = item.id; render(); } }, "Review")) : null) : null);
      return slot;
    });
    const saved = state.full.status === "saved";
    return el("div", { class: "admin-result-detail ui-panel xc" },
      el("h2", {}, "Full exam"),
      el("p", { class: "small" }, "Add one HTML file each for Listening, Reading and Writing. They are saved as one exam that students take in order, and each part also appears in the Listening, Reading and Writing lists."),
      el("div", { class: "xc-row", style: "align-items:stretch" }, ...slotNodes),
      have ? el("div", { class: "xc-row" }, el("label", { class: "small" }, "Exam title "), el("input", { type: "text", value: state.full.title, id: "xcFullTitle", style: "min-width:320px", onchange: (e) => { state.full.title = e.target.value.trim(); render(); } })) : null,
      have === 3 && blocking.length ? el("div", {}, ...blocking.map((i) => el("div", { class: "xc-issue error" }, `Blocks publishing: ${i.message}`, HINTS[i.code] ? el("div", { class: "small" }, HINTS[i.code]) : null))) : null,
      have === 3 ? el("div", { class: "xc-row" },
        el("button", { class: "btn", type: "button", disabled: state.full.status === "saving" || !state.full.title, onclick: () => saveFull(state.full.status === "saved" || (state.full.status === "duplicate" && !state.full.publishedConflict)) },
          saved || state.full.status === "duplicate" && !state.full.publishedConflict ? "Save changes to draft" : "Save full exam as draft"),
        state.full.publishedConflict ? el("button", { class: "btn secondary", type: "button", onclick: () => saveFull(true, true) }, "Unpublish and replace with this version") : null,
        el("span", { class: "small" }, state.full.status === "saving" ? "Saving…" : saved && !state.full.error ? "Saved as a draft. Publish it under Saved exams." : state.full.error || "Drafts are never visible to students.")) : null);
  }

  function passagesEditor(item) {
    const parts = item.out.content.reading.parts;
    return el("div", {},
      el("h3", {}, "Passages"),
      el("p", { class: "small" }, "Check each passage's title and text. Leave a blank line between paragraphs. The first line the student sees is the title."),
      ...parts.map((part, i) => {
        const [title, ...rest] = part.passageText.split("\n\n");
        const save = () => {
          item.edits.passages[i] = { title: document.getElementById(`xcPTitle${i}`).value.trim(), text: document.getElementById(`xcPText${i}`).value };
          convert(item);
          render();
        };
        return el("div", { style: "margin:0 0 14px" },
          el("label", { class: "small", for: `xcPTitle${i}` }, `Passage ${i + 1} title `),
          el("input", { type: "text", id: `xcPTitle${i}`, value: title, style: "min-width:320px", onchange: save }),
          el("textarea", { id: `xcPText${i}`, rows: 7, style: "width:100%;font:inherit;padding:8px;margin-top:6px;border:1px solid var(--border,#cbd5e1);border-radius:8px", onchange: save }, rest.join("\n\n")));
      }));
  }

  function reviewPanel(item) {
    if (item.slot === "writing") return writingReviewPanel(item);
    const p = item.parsed;
    const groupRows = p.parts.flatMap((part, pi) => part.groups.map((g, gi) => {
      const family = FAMILIES.find((f) => f.includes(g.type));
      const cell = family
        ? el("select", { onchange: (e) => { item.edits.types[`${pi}-${gi}`] = e.target.value; convert(item); render(); } }, family.map((t) => el("option", { value: t, selected: t === g.type }, LABELS[t])))
        : el("span", {}, LABELS[g.type] || g.type);
      return el("tr", {}, el("td", {}, `${part.number}`), el("td", {}, g.range[0] === g.range[1] ? `${g.range[0]}` : `${g.range[0]}–${g.range[1]}`), el("td", {}, cell), el("td", {}, g.confidence === "high" ? "Detected" : g.confidence === "manual" ? "Set by you" : "Guessed"));
    }));
    const mediaRows = p.media.map((m) => {
      const url = item.edits.media[m.original] || m.resolved;
      const chk = item.mediaCheck?.[url];
      return el("tr", {}, el("td", {}, m.kind), el("td", { style: "word-break:break-all" }, m.original), el("td", { style: "word-break:break-all" }, url || "Not available yet", chk ? ` — ${chk.ok ? "reachable" : `not reachable (${chk.status || "error"})`}` : ""),
        el("td", {}, el("input", { type: "file", accept: m.kind === "audio" ? "audio/*" : "image/*", onchange: (e) => e.target.files[0] && uploadMedia(item, m.original, e.target.files[0]) })));
    });
    const answers = el("div", { class: "xc-answers" });
    for (let q = 1; q <= 40; q += 1) {
      answers.append(el("label", {}, `${q}`, el("input", { type: "text", value: item.answerKeys[q] || "", placeholder: "missing", onchange: (e) => { item.edits.answers[q] = e.target.value.trim(); convert(item); render(); } })));
    }
    return el("div", { class: "admin-result-detail ui-panel xc" },
      el("div", { class: "xc-row" }, el("h3", {}, `Review: ${item.name}`), el("button", { class: "btn secondary", type: "button", onclick: () => { state.selected = null; render(); } }, "Close")),
      el("div", { class: "xc-row" }, el("label", { class: "small" }, "Title "), el("input", { type: "text", value: p.title, style: "min-width:320px", onchange: (e) => { item.edits.title = e.target.value.trim(); convert(item); render(); } }), chip(item.status), el("span", { class: "small" }, `${p.stats.questionsCovered} questions, ${Object.keys(item.answerKeys).length} answers`), p.inferredBase && !state.baseUrl ? el("span", { class: "small" }, `Images load from ${p.inferredBase.replace(/^https?:\/\//, "")} (found in the file)`) : null),
      item.issues.length ? el("div", {}, ...item.issues.map((i) => el("div", { class: `xc-issue ${i.severity}` }, `${i.severity === "error" ? "Blocks publishing: " : ""}${i.message}`, i.severity === "error" && HINTS[i.code] ? el("div", { class: "small" }, HINTS[i.code]) : null))) : el("p", { class: "small" }, "No issues found."),
      el("h3", {}, "Question groups"), el("div", { class: "xc-tablewrap" }, el("table", {}, el("thead", {}, el("tr", {}, ["Part", "Questions", "Type", "Source"].map((h) => el("th", {}, h)))), el("tbody", {}, ...groupRows))),
      mediaRows.length ? el("div", {}, el("h3", {}, "Audio and images"), el("div", { class: "xc-row" }, el("button", { class: "btn secondary", type: "button", onclick: () => checkMedia(item) }, "Check availability")), el("div", { class: "xc-tablewrap" }, el("table", {}, el("thead", {}, el("tr", {}, ["Type", "In the HTML", "Using", "Upload replacement"].map((h) => el("th", {}, h)))), el("tbody", {}, ...mediaRows)))) : null,
      item.out.content.reading ? passagesEditor(item) : null,
      el("h3", {}, "Answer key"), answers,
      el("h3", {}, "Preview"), previewNode(item),
      el("div", { class: "xc-row" },
        item.slot ? el("span", { class: "small" }, "This part is saved together with the other two from the Full exam panel.") : el("button", { class: "btn", type: "button", disabled: item.status === "saving" || !Object.keys(item.answerKeys).length, onclick: () => saveItem(item, item.status === "saved" || item.status === "duplicate") }, item.status === "saved" || item.status === "duplicate" ? "Save changes to draft" : "Save as draft"),
        item.publishedConflict ? el("button", { class: "btn secondary", type: "button", onclick: () => saveItem(item, true, true) }, "Unpublish and replace with this version") : null,
        el("span", { class: "small" }, item.error || "Drafts are never visible to students.")));
  }

  function itemsTable() {
    const rows = state.items.map((item) => {
      const errors = item.issues.filter((i) => i.severity === "error").length;
      const warnings = item.issues.filter((i) => i.severity === "warning").length;
      return el("tr", {}, el("td", { style: "word-break:break-all" }, item.name), el("td", {}, item.parsed?.skill || "—"), el("td", {}, item.parsed?.title || "—"),
        el("td", {}, item.parsed ? `${item.parsed.stats.questionsCovered}/40 · ${Object.keys(item.answerKeys).length} answers` : "—"),
        el("td", {}, chip(item.status), item.error ? el("div", { class: "small" }, item.error) : null, item.parsed ? el("div", { class: "small" }, `${errors} blocking, ${warnings} warnings`) : null),
        el("td", {}, item.parsed ? el("button", { class: "btn secondary", type: "button", onclick: () => { state.selected = item.id; render(); } }, "Review") : null, " ",
          item.status === "ready" ? el("button", { class: "btn", type: "button", onclick: async () => { await saveItem(item); loadLibrary(); } }, "Save draft") : null));
    });
    const counts = (s) => state.items.filter((i) => i.status === s).length;
    return el("div", { class: "admin-result-detail ui-panel xc" },
      el("div", { class: "xc-row" }, el("h3", {}, `This batch (${state.items.length})`), el("span", { class: "small" }, `${counts("ready")} ready · ${counts("needs_review")} need review · ${counts("saved")} saved · ${counts("duplicate")} duplicates · ${counts("failed")} failed`)),
      el("div", { class: "xc-row" },
        el("button", { class: "btn", type: "button", disabled: state.busy || !counts("ready"), onclick: saveAllReady }, `Save ${counts("ready")} ready as drafts`),
        el("button", { class: "btn secondary", type: "button", disabled: state.busy || !counts("failed"), onclick: retryFailed }, "Retry failed"),
        el("button", { class: "btn secondary", type: "button", onclick: exportReport }, "Download report (CSV)"),
        el("button", { class: "btn secondary", type: "button", onclick: () => { state.items = []; state.selected = null; render(); } }, "Clear batch")),
      el("div", { class: "xc-tablewrap" }, el("table", {}, el("thead", {}, el("tr", {}, ["File", "Skill", "Title", "Found", "Status", ""].map((h) => el("th", {}, h)))), el("tbody", {}, ...rows))));
  }

  // ---------- edit a saved exam ----------
  const TEXT_KEYS = new Set(["title", "text", "tail", "paragraph", "label", "word", "summaryTitle", "listTitle", "imageAlt", "imageSrc"]);
  function textFields(node, path = [], out = []) {
    if (Array.isArray(node)) node.forEach((v, i) => (typeof v === "string" ? out.push({ path: [...path, i], value: v }) : textFields(v, [...path, i], out)));
    else if (node && typeof node === "object") {
      Object.entries(node).forEach(([k, v]) => {
        if (typeof v === "string") { if (TEXT_KEYS.has(k) || path[path.length - 1] === "choices" || path[path.length - 1] === "endings") out.push({ path: [...path, k], value: v }); }
        else if (v && typeof v === "object") textFields(v, [...path, k], out);
      });
    }
    return out;
  }
  const setPath = (obj, path, value) => { let o = obj; path.slice(0, -1).forEach((k) => { o = o[k]; }); o[path[path.length - 1]] = value; };
  const htmlToText = (html) => { const d = document.createElement("div"); d.innerHTML = String(html || "").replace(/<br\s*\/?>/gi, "\n"); return d.textContent.trim(); };
  const textToHtml = (text) => String(text).split(/\n+/).map((t) => t.trim()).filter(Boolean).map((t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")).join("<br/>");

  async function openEditor(exam) {
    const res = await api("importedExamGet", { query: { testId: exam.test_id } });
    if (!res.ok) { state.message = res.data.error || "Could not open this exam."; render(); return; }
    const e = res.data.exam;
    state.editor = { testId: e.test_id, skill: e.skill, status: e.status, title: e.title, content: JSON.parse(JSON.stringify(e.content || {})), answerKeys: JSON.parse(JSON.stringify(e.answer_keys || {})), msg: "", saving: false };
    state.message = "";
    render();
    document.getElementById("xcEditor")?.scrollIntoView?.({ block: "start" });
  }

  async function saveEditor() {
    const ed = state.editor;
    ed.saving = true; ed.msg = ""; render();
    const res = await api("importedExamUpdate", { method: "POST", json: { testId: ed.testId, title: ed.title, content: ed.content, answerKeys: ed.answerKeys } });
    ed.saving = false;
    if (res.ok) ed.msg = ed.status === "published" ? "Saved. Students see the change within a few minutes." : "Saved.";
    else ed.msg = res.data.error || "Save failed.";
    await loadLibrary();
  }

  function editorPanel() {
    const ed = state.editor;
    const c = ed.content;
    const field = (value, onSet, long) => (long || String(value).length > 110
      ? el("textarea", { rows: Math.min(8, Math.max(2, Math.ceil(String(value).length / 90))), style: "width:100%;font:inherit;padding:6px;border:1px solid var(--border,#cbd5e1);border-radius:8px", onchange: (e) => onSet(e.target.value) }, value)
      : el("input", { type: "text", value, style: "width:100%", onchange: (e) => onSet(e.target.value) }));
    const section = [];
    if (c.listening) {
      section.push(el("h3", {}, "Listening"),
        el("label", { class: "small" }, "Audio URL"), field(c.listening.audioSrc || "", (v) => { c.listening.audioSrc = v.trim(); }),
        el("label", { class: "small" }, "Notes and questions (HTML). Change the wording only; keep the inputs and tags as they are."),
        el("textarea", { id: "xcEdListeningHtml", rows: 12, style: "width:100%;font:12px monospace;padding:6px;border:1px solid var(--border,#cbd5e1);border-radius:8px", onchange: (e) => { c.listening.html = e.target.value; } }, c.listening.html || ""));
    }
    if (c.reading) {
      section.push(el("h3", {}, "Reading"));
      c.reading.parts.forEach((part, i) => {
        const [title, ...rest] = String(part.passageText || "").split("\n\n");
        let t = title, b = rest.join("\n\n");
        const sync = () => { part.passageText = `${t.trim() || `Reading Passage ${i + 1}`}\n\n${b.trim()}`; };
        section.push(el("details", {}, el("summary", {}, `Passage ${i + 1}: ${title}`),
          el("label", { class: "small" }, "Title"), field(title, (v) => { t = v; sync(); }),
          el("label", { class: "small" }, "Text (blank line between paragraphs)"), field(b, (v) => { b = v; sync(); }, true)));
        (part.blocks || []).forEach((block) => {
          const rows = textFields(block).map((f) => el("div", { style: "margin:4px 0" }, el("div", { class: "small" }, f.path.join(" › ")), field(f.value, (v) => setPath(block, f.path, v))));
          const instr = (block.instructions || []).map((line, k) => el("div", { style: "margin:4px 0" }, el("div", { class: "small" }, `instruction ${k + 1}`), field(line, (v) => { block.instructions[k] = v; })));
          section.push(el("details", { style: "margin-left:14px" }, el("summary", {}, `${block.title || "Questions"} (${block.type})`), ...instr, ...rows));
        });
      });
    }
    if (c.writing) {
      const w = c.writing;
      section.push(el("h3", {}, "Writing"));
      [1, 2].forEach((n) => {
        section.push(el("label", { class: "small" }, `Task ${n} text (each line is its own line for the student)`),
          field(htmlToText(w[`task${n}Html`]), (v) => { w[`task${n}Html`] = textToHtml(v); }, true),
          el("label", { class: "small" }, `Task ${n} type`), field(w[`task${n}Type`] || "", (v) => { w[`task${n}Type`] = v; }));
      });
      section.push(el("label", { class: "small" }, "Task 1 image URL"), field(w.task1ImageSrc || "", (v) => { w.task1ImageSrc = v.trim(); }));
    }
    const grid = (label, keys) => el("div", {}, el("h3", {}, `Answer key${label ? `: ${label}` : ""}`),
      el("div", { class: "xc-answers" }, ...Array.from({ length: 40 }, (_, i) => el("label", {}, `${i + 1}`, el("input", { type: "text", value: keys[i + 1] || "", placeholder: "missing", onchange: (e) => { const v = e.target.value.trim(); if (v) keys[i + 1] = v; else delete keys[i + 1]; } })))));
    const grids = ed.skill === "full"
      ? [grid("Listening", (ed.answerKeys.listening ||= {})), grid("Reading", (ed.answerKeys.reading ||= {}))]
      : ed.skill === "writing" ? [] : [grid("", ed.answerKeys)];
    return el("div", { class: "admin-result-detail ui-panel xc", id: "xcEditor" },
      el("div", { class: "xc-row" }, el("h3", {}, `Edit: ${ed.title}`), el("button", { class: "btn secondary", type: "button", onclick: () => { state.editor = null; render(); } }, "Close")),
      ed.status === "published" ? el("p", { class: "xc-issue warning" }, "This exam is live. Saving updates it for students right away, and changes that would break it are refused.") : el("p", { class: "small" }, "This is a draft. Students cannot see it."),
      el("label", { class: "small", for: "xcEdTitle" }, "Exam title"), el("input", { type: "text", id: "xcEdTitle", value: ed.title, style: "min-width:320px", onchange: (e) => { ed.title = e.target.value.trim(); } }),
      ...section, ...grids,
      el("div", { class: "xc-row" }, el("button", { class: "btn", type: "button", disabled: ed.saving, onclick: saveEditor }, ed.saving ? "Saving…" : "Save changes"), el("span", { class: ed.msg && !/^Saved/.test(ed.msg) ? "xc-issue error" : "small" }, ed.msg)));
  }

  function libraryPanel() {
    const rows = state.library.map((exam) => {
      const published = exam.status === "published";
      const confirmId = `xcRights-${exam.test_id}`;
      const editBtn = el("button", { class: "btn secondary", type: "button", onclick: () => openEditor(exam) }, "Edit");
      const actions = published
        ? [editBtn, el("button", { class: "btn secondary", type: "button", onclick: () => libraryAction("importedExamUnpublish", exam) }, "Unpublish")]
        : [editBtn,
            el("label", { class: "small" }, el("input", { type: "checkbox", id: confirmId }), " I have the right to reuse this content "),
            el("button", { class: "btn", type: "button", onclick: () => { if (!document.getElementById(confirmId).checked) { state.message = "Tick the rights confirmation before publishing."; render(); return; } libraryAction("importedExamPublish", exam, { rightsConfirmed: true }); } }, "Publish"),
            el("button", { class: "btn secondary", type: "button", onclick: () => { if (exam._confirmDelete) libraryAction("importedExamDelete", exam); else { exam._confirmDelete = true; render(); } } }, exam._confirmDelete ? "Click again to delete" : "Delete"),
          ];
      const errs = exam.validation?.errors?.length || 0;
      const stale = (exam.validation?.converterVersion || 0) < CONVERTER_VERSION;
      return el("tr", {}, el("td", {}, el("input", { type: "text", value: exam.title, "aria-label": `Title of ${exam.title}`, style: "width:100%;min-width:200px", onchange: (e) => e.target.value.trim() && libraryAction("importedExamRename", exam, { title: e.target.value.trim() }) })), el("td", {}, exam.skill), el("td", {}, el("span", { class: `xc-chip ${published ? "ok" : ""}` }, published ? "Published" : "Draft"), errs ? el("div", { class: "small" }, `${errs} blocking issue${errs > 1 ? "s" : ""}`) : null, stale ? el("div", { class: "xc-issue warning" }, "Made with an older converter. Drop the original file again and replace it to get the latest fixes.") : null),
        el("td", { class: "small" }, new Date(exam.updated_at).toLocaleString()), el("td", { style: "min-width:260px" }, ...actions));
    });
    return el("div", { class: "admin-result-detail ui-panel xc" },
      el("div", { class: "xc-row" }, el("h3", {}, "Saved exams"), el("button", { class: "btn secondary", type: "button", onclick: loadLibrary }, "Refresh")),
      state.library.length ? el("div", { class: "xc-tablewrap" }, el("table", {}, el("thead", {}, el("tr", {}, ["Title", "Skill", "Status", "Updated", ""].map((h) => el("th", {}, h)))), el("tbody", {}, ...rows))) : el("p", { class: "small" }, "Nothing saved yet."));
  }

  function render() {
    const selected = [...state.items, ...Object.values(state.full.items)].find((i) => i.id === state.selected);
    const fileInput = el("input", { type: "file", multiple: true, accept: ".html,.htm,.zip", hidden: true, onchange: (e) => { addFiles([...e.target.files]); e.target.value = ""; } });
    const drop = el("div", { class: "xc-drop", tabindex: "0", role: "button", "aria-label": "Choose HTML or ZIP files", onclick: () => fileInput.click(),
      onkeydown: (e) => (e.key === "Enter" || e.key === " ") && fileInput.click(),
      ondragover: (e) => { e.preventDefault(); drop.classList.add("over"); }, ondragleave: () => drop.classList.remove("over"),
      ondrop: (e) => { e.preventDefault(); drop.classList.remove("over"); addFiles([...e.dataTransfer.files]); } },
      el("strong", {}, "Drop HTML or ZIP files here"), el("div", { class: "small" }, "or click to choose. A ZIP can hold hundreds of HTML files. Nothing is saved until you click Save."), fileInput);
    const settings = el("div", { class: "xc-row" },
      el("label", { class: "small" }, "Source site URL (for relative audio and images) "), el("input", { type: "url", placeholder: "https://example.com", value: state.baseUrl, style: "min-width:260px", onchange: (e) => { state.baseUrl = e.target.value.trim(); reconvertAll(); } }),
      el("label", { class: "small" }, "Module "), el("select", { onchange: (e) => { state.module = e.target.value; reconvertAll(); } }, el("option", { value: "academic", selected: state.module === "academic" }, "Academic"), el("option", { value: "general", selected: state.module === "general" }, "General Training")),
      el("label", { class: "small" }, "Skill "), el("select", { onchange: (e) => { state.skill = e.target.value; reconvertAll(); } }, el("option", { value: "", selected: !state.skill }, "Detect automatically"), el("option", { value: "reading", selected: state.skill === "reading" }, "Reading"), el("option", { value: "listening", selected: state.skill === "listening" }, "Listening")));
    const progress = state.progress ? el("div", {}, el("div", { class: "small" }, `Working… ${state.progress.done} of ${state.progress.total}`), el("div", { class: "xc-bar" }, el("i", { style: `width:${state.progress.total ? Math.round((state.progress.done / state.progress.total) * 100) : 0}%` }))) : null;
    root.replaceChildren(el("div", { class: "xc" },
      el("div", { class: "admin-result-detail ui-panel xc" }, el("h2", {}, "Single exams: Listening or Reading"),
        el("p", { class: "small" }, "Upload HTML exam files, check the result, save drafts, then publish. Only publish content you have the right to reuse."), settings, drop, progress),
      state.message ? el("p", { class: "xc-issue error", role: "alert" }, state.message) : null,
      selected?.parsed ? reviewPanel(selected) : null,
      state.editor ? editorPanel() : null,
      fullPanel(),
      state.items.length ? itemsTable() : null,
      libraryPanel()));
  }

  render();
  loadLibrary();
  return { refresh: loadLibrary };
}
