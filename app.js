console.log("JS is running");

/* =========================================================
   0) GLOBAL EXAM SETTINGS
========================================================= */

/**
 * To actually "send to admin", set ADMIN_ENDPOINT to your webhook URL.
 * Examples:
 * - Google Apps Script Web App
 * - Make.com webhook
 * - Your own server endpoint
 */
const ADMIN_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbymOQ_8EAh0KkEUQ5wOIf7BvONW309z8GTZizqXX98tvla5oqKNzX6Lv8HFCRFHDGS16w/exec";

const EXAM = {
  id: "ielts-full-001",
  keys: {
    finalSubmission: "IELTS:EXAM:finalSubmission",
    finalSubmitted: "IELTS:EXAM:finalSubmitted",
  },
};
// Modal mode: "confirm" (no name) | "final" (name required)
let MODAL_MODE = "confirm";
let MODAL_ONCONFIRM = null;
let MODAL_ONCANCEL = null;

function $(id) {
  return document.getElementById(id);
}
function hideModal() {
  const m = $("modal");
  if (m) m.classList.add("hidden");
}
// ================= HOME / ROUTING =================
const HOME_KEY = "IELTS:HOME:lastView";
const EXAM_STARTED_KEY = "IELTS:EXAM:started";

function isExamStarted() {
  return localStorage.getItem(EXAM_STARTED_KEY) === "true";
}

function setExamStarted(v) {
  localStorage.setItem(EXAM_STARTED_KEY, v ? "true" : "false");
}

function updateHomeStatusLine() {
  const line = document.getElementById("homeStatusLine");
  if (!line) return;

  const finalDone = localStorage.getItem(EXAM.keys.finalSubmitted) === "true";
  const listeningDone = localStorage.getItem("IELTS:LISTENING:submitted") === "true";
  const readingDone = localStorage.getItem("ielts-reading-3parts-001:submitted") === "true";
  const writingStarted = localStorage.getItem("IELTS:WRITING:started") === "true";

  if (finalDone) {
    line.textContent = "Status: Submitted (Review mode available)";
    return;
  }
  if (!isExamStarted()) {
    line.textContent = "Status: Ready";
    return;
  }
  if (!listeningDone) {
    line.textContent = "Status: In progress — Listening";
    return;
  }
  if (!readingDone) {
    line.textContent = "Status: In progress — Reading";
    return;
  }
  if (!writingStarted) {
    line.textContent = "Status: Ready — Writing unlocked";
    return;
  }
  line.textContent = "Status: In progress — Writing";
}
/* =========================================================
   HIGHLIGHTING SYSTEM (Listening + Reading + Writing)
   - Safe for inputs/selects
   - Persists via localStorage (node paths + offsets)
========================================================= */
(function initGlobalHighlighting() {
  if (window.__IELTS_HIGHLIGHT_INIT__) return;
  window.__IELTS_HIGHLIGHT_INIT__ = true;

  const STORAGE_KEY = "IELTS:HIGHLIGHTS:v1";

  const ROOTS = []; // { key, el }

  // ---------- Toolbar ----------
  let toolbar = null;
  let btnHL = null;
  let btnRemove = null;
  let btnClear = null;

  function ensureToolbar() {
    if (toolbar) return;

    toolbar = document.createElement("div");
    toolbar.id = "hlToolbar";
    toolbar.className = "hl-toolbar";
    toolbar.innerHTML = `
      <button type="button" class="hl-toolbtn primary" id="hlDo">Highlight</button>
      <button type="button" class="hl-toolbtn" id="hlRm">Remove</button>
      <button type="button" class="hl-toolbtn danger" id="hlClear">Clear section</button>
    `;
    document.body.appendChild(toolbar);

    btnHL = toolbar.querySelector("#hlDo");
    btnRemove = toolbar.querySelector("#hlRm");
    btnClear = toolbar.querySelector("#hlClear");

    btnHL.addEventListener("click", () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;

      const range = sel.getRangeAt(0);
      const rootInfo = findRootInfo(range.commonAncestorContainer);
      if (!rootInfo) return;

      if (isInsideForbidden(range.commonAncestorContainer)) return;
      if (range.collapsed) return;

      const hl = applyHighlightToRange(range, rootInfo.el);
      if (hl.length) saveHighlightsFromDOM(rootInfo);

      hideToolbar();
      sel.removeAllRanges();
    });

    btnRemove.addEventListener("click", () => {
      const sel = window.getSelection();
      const node =
        sel && sel.rangeCount ? sel.getRangeAt(0).commonAncestorContainer : document.activeElement;
      const rootInfo = findRootInfo(node);
      if (!rootInfo) return;

      const mark = findClosestMark(node);
      if (mark) {
        unwrapMark(mark);
        saveHighlightsFromDOM(rootInfo);
      }
      hideToolbar();
      sel?.removeAllRanges?.();
    });

    btnClear.addEventListener("click", () => {
      const sel = window.getSelection();
      const node =
        sel && sel.rangeCount ? sel.getRangeAt(0).commonAncestorContainer : document.activeElement;
      const rootInfo = findRootInfo(node);
      if (!rootInfo) return;

      const ok = confirm("Clear ALL highlights in this section?");
      if (!ok) return;

      clearAllHighlightsInRoot(rootInfo.el);
      saveHighlightsFromDOM(rootInfo);

      hideToolbar();
      sel?.removeAllRanges?.();
    });
  }

  function showToolbarAt(x, y, mode) {
    ensureToolbar();
    toolbar.style.left = `${x}px`;
    toolbar.style.top = `${y}px`;
    toolbar.style.display = "flex";

    if (mode === "selection") {
      btnHL.style.display = "";
      btnRemove.style.display = "none";
    } else {
      btnHL.style.display = "none";
      btnRemove.style.display = "";
    }
  }

  function hideToolbar() {
    if (!toolbar) return;
    toolbar.style.display = "none";
  }

  // ---------- Storage ----------
  function readStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function writeStore(obj) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch {}
  }

  // ---------- Root detection ----------
  function registerRoot(key, el) {
    if (!el) return;
    el.dataset.hlRootKey = key;
    ROOTS.push({ key, el });
  }

  function findRootInfo(node) {
    if (!node) return null;
    const el = node.nodeType === 1 ? node : node.parentElement;
    if (!el) return null;

    const rootEl = el.closest("[data-hl-root-key]");
    if (!rootEl) return null;

    const key = rootEl.dataset.hlRootKey;
    const match = ROOTS.find((r) => r.key === key);
    return match || null;
  }

  // ---------- Forbidden areas ----------
  function isInsideForbidden(node) {
    const el = node.nodeType === 1 ? node : node.parentElement;
    if (!el) return false;
    return !!el.closest("input, select, textarea, button, audio, video");
  }

  // ---------- Mark helpers ----------
  function findClosestMark(node) {
    const el = node.nodeType === 1 ? node : node.parentElement;
    if (!el) return null;
    return el.closest("mark.hl");
  }

  function unwrapMark(mark) {
    if (!mark || !mark.parentNode) return;
    const parent = mark.parentNode;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    parent.normalize();
  }

  function clearAllHighlightsInRoot(rootEl) {
    rootEl.querySelectorAll("mark.hl").forEach(unwrapMark);
  }

  // ---------- Path encoding for text nodes ----------
  function getNodePath(root, node) {
    const path = [];
    let cur = node;
    while (cur && cur !== root) {
      const parent = cur.parentNode;
      if (!parent) break;
      const idx = Array.prototype.indexOf.call(parent.childNodes, cur);
      path.unshift(idx);
      cur = parent;
    }
    return path;
  }

  function resolveNodePath(root, path) {
    let cur = root;
    for (const idx of path) {
      if (!cur || !cur.childNodes || !cur.childNodes[idx]) return null;
      cur = cur.childNodes[idx];
    }
    return cur;
  }

  // ---------- Range highlight algorithm ----------
  function applyHighlightToRange(range, rootEl) {
    const marks = [];
    if (!rootEl.contains(range.commonAncestorContainer)) return marks;

    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, {
      acceptNode: (textNode) => {
        if (!textNode.nodeValue || !textNode.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (isInsideForbidden(textNode)) return NodeFilter.FILTER_REJECT;
        if (findClosestMark(textNode)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const textNodes = [];
    let n;
    while ((n = walker.nextNode())) {
      if (rangeIntersectsNode(range, n)) textNodes.push(n);
    }

    textNodes.forEach((textNode) => {
      const sub = document.createRange();
      sub.selectNodeContents(textNode);

      if (textNode === range.startContainer) sub.setStart(textNode, range.startOffset);
      if (textNode === range.endContainer) sub.setEnd(textNode, range.endOffset);

      if (sub.collapsed) return;

      const mark = document.createElement("mark");
      mark.className = "hl";
      try {
        sub.surroundContents(mark);
        marks.push(mark);
      } catch {
        manualWrapTextRange(sub, textNode, marks);
      }
    });

    mergeAdjacentMarks(rootEl);
    return marks;
  }

  function manualWrapTextRange(subRange, textNode, marks) {
    const start = subRange.startOffset;
    const end = subRange.endOffset;

    const after = textNode.splitText(end);
    const mid = textNode.splitText(start);

    const wrapMark = document.createElement("mark");
    wrapMark.className = "hl";
    wrapMark.appendChild(mid.cloneNode(true));

    mid.parentNode.replaceChild(wrapMark, mid);
    marks.push(wrapMark);

    void after;
  }

  function mergeAdjacentMarks(rootEl) {
    const marks = Array.from(rootEl.querySelectorAll("mark.hl"));
    marks.forEach((m) => {
      const next = m.nextSibling;
      if (next && next.nodeType === 1 && next.matches("mark.hl")) {
        while (next.firstChild) m.appendChild(next.firstChild);
        next.remove();
      }
    });
  }

  function rangeIntersectsNode(range, node) {
    const nodeRange = document.createRange();
    nodeRange.selectNodeContents(node);
    return (
      range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0 &&
      range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0
    );
  }

  // ---------- Save/Load highlights by reading DOM marks ----------
  function saveHighlightsFromDOM(rootInfo) {
    const rootEl = rootInfo.el;
    const key = rootInfo.key;

    const store = readStore();
    const records = [];

    rootEl.querySelectorAll("mark.hl").forEach((mark) => {
      const firstText = firstTextNode(mark);
      const lastText = lastTextNode(mark);
      if (!firstText || !lastText) return;

      const startPath = getNodePath(rootEl, firstText);
      const endPath = getNodePath(rootEl, lastText);

      const startOffset = 0;
      const endOffset = lastText.nodeValue ? lastText.nodeValue.length : 0;

      records.push({ startPath, startOffset, endPath, endOffset });
    });

    store[key] = records;
    writeStore(store);
  }

  function firstTextNode(el) {
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    return w.nextNode();
  }

  function lastTextNode(el) {
    let last = null;
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    let n;
    while ((n = w.nextNode())) last = n;
    return last;
  }

  function restoreHighlightsToRoot(rootInfo) {
    const rootEl = rootInfo.el;
    const key = rootInfo.key;

    clearAllHighlightsInRoot(rootEl);

    const store = readStore();
    const records = Array.isArray(store[key]) ? store[key] : [];
    if (!records.length) return;

    records.forEach((rec) => {
      const startNode = resolveNodePath(rootEl, rec.startPath);
      const endNode = resolveNodePath(rootEl, rec.endPath);
      if (!startNode || !endNode) return;
      if (startNode.nodeType !== 3 || endNode.nodeType !== 3) return;

      const r = document.createRange();
      try {
        r.setStart(startNode, Math.min(rec.startOffset || 0, startNode.nodeValue.length));
        r.setEnd(
          endNode,
          Math.min(rec.endOffset || endNode.nodeValue.length, endNode.nodeValue.length)
        );
        if (!r.collapsed) applyHighlightToRange(r, rootEl);
      } catch {}
    });

    mergeAdjacentMarks(rootEl);
  }

  // ---------- Selection UI ----------
  function onSelectionChange() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      hideToolbar();
      return;
    }

    const range = sel.getRangeAt(0);
    const node = range.commonAncestorContainer;

    if (isInsideForbidden(node)) {
      hideToolbar();
      return;
    }

    const rootInfo = findRootInfo(node);
    if (!rootInfo) {
      hideToolbar();
      return;
    }

    const mk = findClosestMark(node);
    if (mk && range.collapsed) {
      const rect = mk.getBoundingClientRect();
      showToolbarAt(Math.min(window.innerWidth - 220, rect.left), Math.max(10, rect.top - 52), "inside-mark");
      return;
    }

    if (!range.collapsed) {
      const rect = range.getBoundingClientRect();
      const x = Math.min(window.innerWidth - 260, rect.left);
      const y = Math.max(10, rect.top - 52);
      showToolbarAt(x, y, "selection");
      return;
    }

    hideToolbar();
  }

  // ---------- Bind + register roots + restore ----------
  document.addEventListener("DOMContentLoaded", () => {
    ensureToolbar();

    registerRoot("listening", document.getElementById("listeningSection"));
    registerRoot("readingPassage", document.getElementById("passage"));
    registerRoot("readingQuestions", document.getElementById("qCard"));
    registerRoot("writing", document.getElementById("writingSection"));

    ROOTS.forEach(restoreHighlightsToRoot);

    document.addEventListener("click", (e) => {
      const el = e.target;
      if (el && el.classList && el.classList.contains("partTab")) {
        setTimeout(() => {
          const p = ROOTS.find((r) => r.key === "readingPassage");
          const q = ROOTS.find((r) => r.key === "readingQuestions");
          if (p) restoreHighlightsToRoot(p);
          if (q) restoreHighlightsToRoot(q);
        }, 0);
      }
    });

    document.addEventListener("mouseup", () => setTimeout(onSelectionChange, 0));
    document.addEventListener("keyup", () => setTimeout(onSelectionChange, 0));

    window.addEventListener("scroll", hideToolbar, true);

    document.addEventListener(
      "mousedown",
      (e) => {
        if (toolbar && e.target && toolbar.contains(e.target)) return;
        if (e.target && e.target.closest && e.target.closest("mark.hl")) return;
        hideToolbar();
      },
      true
    );
  });
})();

function clearReadingLockStyles() {
  const c = $("container");
  if (c) {
    c.style.pointerEvents = "";
    c.style.filter = "";
    c.style.userSelect = "";
  }
}

/* =========================================================
   VIEW CONTROLLER + RESET (NEW)
========================================================= */

function setExamNavStatus(text) {
  const el = $("examNavStatus");
  if (el) el.textContent = text;
}
function lockWholeExamAfterFinalSubmit() {
  // 1) Update nav status
  setExamNavStatus("Status: Submitted (Review mode)");

  // 2) Lock all sections (view-only already disables pointer-events on inputs/selects/textareas)
  const ls = $("listeningSection");
  const rc = $("readingControls");
  const cont = $("container");
  const ws = $("writingSection");

  if (ls) ls.classList.add("view-only");
  if (rc) rc.classList.add("view-only");
  if (cont) cont.classList.add("view-only");
  if (ws) ws.classList.add("view-only");

  // 3) Stop any remaining timers visually (optional but clean)
  // Reading timer display freezes already because timer interval is cleared on submit/time end.
  // Writing timer is cleared inside submitFinalExam().

  // 4) Disable primary actions so student can’t “submit again”
  const submitReadingBtn = $("submitBtn");
  const endExamBtn = $("endExamBtn");

  if (submitReadingBtn) submitReadingBtn.disabled = true;
  if (endExamBtn) endExamBtn.disabled = true;

  // 5) Keep “New attempt” available (teacher/student can restart)
  // If you want to disable navigation too, uncomment:
  /*
  const toL = $("navToListeningBtn");
  const toR = $("navToReadingBtn");
  const toW = $("navToWritingBtn");
  if (toL) toL.disabled = true;
  if (toR) toR.disabled = true;
  if (toW) toW.disabled = true;
  */
}

function showOnly(target) {
  const home = $("homeSection");
  const listening = $("listeningSection");
  const readingControls = $("readingControls");
  const readingContainer = $("container");
  const writing = $("writingSection");
  const examNav = $("examNav");

  const isHome = target === "home";

  // Home
  if (home) home.style.display = isHome ? "" : "none";

  // Exam nav only for exam views
  if (examNav) examNav.style.display = isHome ? "none" : "flex";

  // Listening
  if (listening) {
    if (target === "listening") listening.classList.remove("hidden");
    else listening.classList.add("hidden");
  }

  // Reading
  const showReading = target === "reading";
  if (readingControls) readingControls.style.display = showReading ? "" : "none";
  if (readingContainer) readingContainer.style.display = showReading ? "" : "none";

  // Writing
  if (writing) {
    if (target === "writing") writing.classList.remove("hidden");
    else writing.classList.add("hidden");
  }

  try { localStorage.setItem(HOME_KEY, target); } catch {}

  window.scrollTo({ top: 0, behavior: "instant" });
}

function resetExamAttempt() {
  const keysToRemove = [
    EXAM.keys.finalSubmission,
    EXAM.keys.finalSubmitted,

    "IELTS:LISTENING:submitted",
    "IELTS:LISTENING:started",
    "IELTS:LISTENING:answers",
    "IELTS:LISTENING:lastSubmission",
    "IELTS:LISTENING:pageIndex",

    "IELTS:WRITING:started",
    "IELTS:WRITING:submitted",
    "IELTS:WRITING:remainingSeconds",
    "IELTS:WRITING:answers",
    "IELTS:WRITING:lastSubmission",
    "IELTS:WRITING:studentFullName",

    "ielts-reading-3parts-001:answers",
    "ielts-reading-3parts-001:remainingSeconds",
    "ielts-reading-3parts-001:submitted",
    "ielts-reading-3parts-001:lastSubmission",
  ];

  keysToRemove.forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {}
  });

  const prefixes = ["IELTS:LISTENING:", "IELTS:WRITING:", "ielts-reading-3parts-001:", "IELTS:EXAM:"];
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (prefixes.some((p) => k.startsWith(p))) localStorage.removeItem(k);
    }
  } catch {}

  window.location.href = window.location.href.split("#")[0];
}

/* =========================================================
   MODAL (fixed name-required flow)
========================================================= */

function showModal(title, text, opts = {}) {
  if ($("modalTitle")) $("modalTitle").textContent = title;
  if ($("modalText")) $("modalText").textContent = text;

MODAL_MODE = opts.mode === "final" ? "final" : "confirm";
const needName = MODAL_MODE === "final"; // name ONLY in final mode

  const nameWrap = $("modalNameWrap");
  const nameInput = $("modalFullName");
  const submitBtn = $("modalSubmitBtn");
  const cancelBtn = $("modalCancelBtn");

  // Name UI
  if (nameWrap) nameWrap.classList.toggle("hidden", !needName);

  // Button labels
  if (submitBtn) submitBtn.textContent = opts.submitText || (needName ? "Submit" : "OK");

  // Cancel button (only when requested)
  const showCancel = !!opts.showCancel;
  if (cancelBtn) {
    cancelBtn.classList.toggle("hidden", !showCancel);
    cancelBtn.textContent = opts.cancelText || "Cancel";
  }

  // Callbacks
  MODAL_ONCONFIRM = typeof opts.onConfirm === "function" ? opts.onConfirm : null;
  MODAL_ONCANCEL = typeof opts.onCancel === "function" ? opts.onCancel : null;

  // Prefill name if needed
  if (needName) {
    const existing = (localStorage.getItem("IELTS:WRITING:studentFullName") || "")
      .trim()
      .replace(/\s+/g, " ");
    if (nameInput) {
      if (!nameInput.value.trim() && existing) nameInput.value = existing;
      setTimeout(() => nameInput.focus(), 0);
    }
  }

  if ($("modal")) $("modal").classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  const submit = $("modalSubmitBtn");
  const cancel = $("modalCancelBtn");

  // Bind submit once
  if (submit && !submit.dataset.bound) {
    submit.dataset.bound = "1";

    submit.addEventListener("click", async () => {
      // ---------- CONFIRM MODE (no name) ----------
      if (MODAL_MODE === "confirm") {
        const fn = MODAL_ONCONFIRM;
        MODAL_ONCONFIRM = null;
        MODAL_ONCANCEL = null;
        hideModal();
        if (typeof fn === "function") fn();
        return;
      }

      // ---------- FINAL MODE (name required) ----------
      const nameInput = $("modalFullName");
      const fullName = (nameInput?.value || "").trim().replace(/\s+/g, " ");

      if (!isValidFullName(fullName)) {
        showModal(
          "Name required",
          "Please type your Name and Surname to submit the exam.",
          { requireName: true, mode: "final" }
        );
        setTimeout(() => nameInput?.focus?.(), 0);
        return;
      }

      localStorage.setItem("IELTS:WRITING:studentFullName", fullName);

      if (typeof window.__IELTS_SUBMIT_FINAL__ !== "function") {
        startWritingSystem();
      }

      if (typeof window.__IELTS_SUBMIT_FINAL__ === "function") {
        submit.disabled = true;
        submit.textContent = "Submitting...";
        await window.__IELTS_SUBMIT_FINAL__("Student submitted exam.");
        return;
      }

      showModal("Error", "Submit function is not ready. Please refresh and try again.", {
        requireName: true,
        mode: "final",
      });
    });
  }

  // Bind cancel once
  if (cancel && !cancel.dataset.bound) {
    cancel.dataset.bound = "1";
    cancel.addEventListener("click", () => {
      const fn = MODAL_ONCANCEL;
      MODAL_ONCONFIRM = null;
      MODAL_ONCANCEL = null;
      const m = document.getElementById("modal");
if (m) m.classList.add("hidden");
      if (typeof fn === "function") fn();
    });
  }
});

/* =========================================================
   HELPERS
========================================================= */

function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function wordCount(text) {
  const t = String(text || "").trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

function isValidFullName(fullName) {
  const cleaned = String(fullName || "").trim().replace(/\s+/g, " ");
  if (!cleaned) return false;
  const parts = cleaned.split(" ").filter(Boolean);
  return parts.length >= 2;
}

/* =========================================================
   1) LISTENING GATE (unchanged logic, kept working)
========================================================= */

function initListeningSystem() {
  if (window.__IELTS_LISTENING_INIT__) return;
  window.__IELTS_LISTENING_INIT__ = true;

  const L_KEYS = {
    submitted: "IELTS:LISTENING:submitted",
    started: "IELTS:LISTENING:started",
    answers: "IELTS:LISTENING:answers",
    lastSubmission: "IELTS:LISTENING:lastSubmission",
    pageIndex: "IELTS:LISTENING:pageIndex",
  };

  const sec = () => $("listeningSection");
  const modal = () => $("listenModal");
  const startBtn = () => $("startListeningBtn");
  const cancelBtn = () => $("cancelListeningBtn");
  const statusEl = () => $("listenStatus");
  const audio = () => $("listeningAudio");

  const prevBtn = () => $("listenPrevBtn");
  const nextBtn = () => $("listenNextBtn");
  const tabButtons = () => Array.from(document.querySelectorAll(".listenTab[data-listen-tab]"));

  const pages = () =>
    [$("listenSec1"), $("listenSec2"), $("listenSec3"), $("listenSec4")].filter(Boolean);

  const readingContainer = () => $("container");

  let submitted = localStorage.getItem(L_KEYS.submitted) === "true";
  let started = localStorage.getItem(L_KEYS.started) === "true";
  let strictActive = false;

  let currentPageIndex = Math.max(
    0,
    Math.min(3, parseInt(localStorage.getItem(L_KEYS.pageIndex) || "0", 10))
  );

  let lastGoodTime = 0;
  let ignoreSeekUntil = 0;

  function setStatus(t) {
    const el = statusEl();
    if (el) el.textContent = t;
  }

  function lockReading(lock) {
    const c = readingContainer();
    if (c) {
      c.style.pointerEvents = lock ? "none" : "";
      c.style.filter = lock ? "blur(2px)" : "";
      c.style.userSelect = lock ? "none" : "";
    }
  }

  function getListeningAnswers() {
    const out = {};
    document.querySelectorAll("[data-lq]").forEach((el) => {
      out[String(el.dataset.lq)] = (el.value || "").trim();
    });

    document.querySelectorAll("[data-lq-radio]").forEach((el) => {
      const q = String(el.dataset.lqRadio);
      if (el.checked) out[q] = el.value;
    });

    return out;
  }

  function saveListeningAnswers() {
    try {
      localStorage.setItem(L_KEYS.answers, JSON.stringify(getListeningAnswers()));
    } catch {}
    const a = $("listenAutosave");
    if (a) a.textContent = "Autosave: saved";
    setTimeout(() => {
      if (a) a.textContent = "Autosave: ready";
    }, 800);
  }

  function loadListeningAnswers() {
    const raw = localStorage.getItem(L_KEYS.answers);
    if (!raw) return;
    let a = {};
    try {
      a = JSON.parse(raw) || {};
    } catch {
      return;
    }

    document.querySelectorAll("[data-lq]").forEach((el) => {
      const k = String(el.dataset.lq);
      if (a[k] !== undefined) el.value = a[k];
    });

    document.querySelectorAll("[data-lq-radio]").forEach((el) => {
      const k = String(el.dataset.lqRadio);
      if (a[k] !== undefined) el.checked = String(a[k]) === String(el.value);
    });
  }

  function collectListeningPayload(reason) {
    return {
      type: "listening",
      submittedAt: new Date().toISOString(),
      reason,
      answers: getListeningAnswers(),
      pageIndex: currentPageIndex,
    };
  }

  function finishListening(reason) {
    if (submitted) return;
    const aud = audio();
    if (aud) {
      try {
        aud.pause();
      } catch {}
    }

    submitted = true;
    strictActive = false;
    saveListeningAnswers();

    const payload = collectListeningPayload(reason);
    try {
      localStorage.setItem(L_KEYS.lastSubmission, JSON.stringify(payload));
    } catch {}
    localStorage.setItem(L_KEYS.submitted, "true");

    const s = sec();
    if (s) {
      s.classList.add("view-only");
      s.classList.remove("hidden");
    }

    lockReading(false);

    document.dispatchEvent(new CustomEvent("listening:submitted"));
  }

  function renderNavUI(total, active) {
    const p = prevBtn();
    const n = nextBtn();
    if (p) p.disabled = active === 0;
    if (n) n.disabled = active === total - 1;

    tabButtons().forEach((btn) => {
      const idx = parseInt(btn.dataset.listenTab, 10);
      btn.classList.toggle("active", idx === active);
      btn.setAttribute("aria-selected", idx === active ? "true" : "false");
    });
  }

  function goToPage(index) {
    const list = pages();
    if (!list.length) return;

    const clamped = Math.max(0, Math.min(list.length - 1, index));
    currentPageIndex = clamped;
    localStorage.setItem(L_KEYS.pageIndex, String(clamped));

    list.forEach((p, i) => p.classList.toggle("hidden", i !== clamped));
    renderNavUI(list.length, clamped);
  }

  function setupNavHandlers() {
    const list = pages();
    if (!list.length) return;

    goToPage(currentPageIndex);

    const p = prevBtn();
    const n = nextBtn();
    if (p) p.onclick = () => goToPage(currentPageIndex - 1);
    if (n) n.onclick = () => goToPage(currentPageIndex + 1);

    tabButtons().forEach((btn) => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.listenTab, 10);
        if (!Number.isNaN(idx)) goToPage(idx);
      };
    });
  }

  function enableStrictAudio(aud) {
    if (!aud) return;
    strictActive = true;

    aud.controls = false;
    aud.setAttribute("controlsList", "nodownload noplaybackrate noremoteplayback");
    aud.disablePictureInPicture = true;

    lastGoodTime = aud.currentTime || 0;

    aud.addEventListener("pause", () => {
      if (!strictActive || submitted) return;
      if (aud.ended) return;
      aud.play().catch(() => {});
    });

    aud.addEventListener("seeking", () => {
      if (!strictActive || submitted) return;
      const now = Date.now();
      if (now < ignoreSeekUntil) return;
      ignoreSeekUntil = now + 200;
      try {
        aud.currentTime = lastGoodTime;
      } catch {}
    });

    aud.addEventListener("timeupdate", () => {
      if (!strictActive || submitted) return;
      const t = aud.currentTime || 0;

      if (Math.abs(t - lastGoodTime) > 1.25 && !aud.ended) {
        try {
          aud.currentTime = lastGoodTime;
        } catch {}
        return;
      }
      lastGoodTime = t;

      if (Math.floor(t) % 5 === 0) saveListeningAnswers();
    });

    aud.addEventListener("ended", () => {
      if (submitted) return;
      finishListening("Audio ended (auto-submitted).");
    });

    window.addEventListener(
      "keydown",
      (e) => {
        if (!strictActive || submitted) return;

        const t = e.target;
        if (
          t &&
          (t.tagName === "INPUT" ||
            t.tagName === "TEXTAREA" ||
            t.tagName === "SELECT" ||
            t.isContentEditable)
        )
          return;

        const k = (e.key || "").toLowerCase();

        const blocked =
          k === " " ||
          k === "k" ||
          k === "j" ||
          k === "l" ||
          k === "arrowleft" ||
          k === "arrowright" ||
          k === "mediarewind" ||
          k === "mediafastforward" ||
          k === "mediaplaypause";

        if (blocked) {
          e.preventDefault();
          e.stopPropagation();
          aud.play().catch(() => {});
        }
      },
      true
    );
  }

  function showListening() {
    const s = sec();
    if (!s) return;

    lockReading(true);
    s.classList.remove("hidden");

    started = false;
    localStorage.setItem(L_KEYS.started, "false");
    s.classList.remove("started");

    const m = modal();
    if (m) m.style.display = "flex";

    loadListeningAnswers();
    setupNavHandlers();

    setStatus("Status: Not started");

    s.addEventListener("input", (e) => {
      const t = e.target;
      if (t && (t.matches("input") || t.matches("select") || t.matches("textarea"))) {
        saveListeningAnswers();
      }
    });
  }

  async function startAudioFromUserGesture() {
    const s = sec();
    const m = modal();
    const aud = audio();
    if (!s || !aud) return;
    if (submitted) return;

    setStatus("Status: Loading audio...");

    try {
      aud.pause();
    } catch {}
    aud.muted = false;
    aud.volume = 1;

    try {
      aud.currentTime = 0;
    } catch {}
    aud.load();

    try {
      await aud.play();

      started = true;
      localStorage.setItem(L_KEYS.started, "true");

      s.classList.add("started");
      if (m) m.style.display = "none";

      setupNavHandlers();
      setStatus("Status: Playing (navigate Section 1–4 while audio continues)");
      enableStrictAudio(aud);
    } catch (err) {
      console.warn("Audio play failed:", err);

      started = false;
      localStorage.setItem(L_KEYS.started, "false");

      s.classList.remove("started");
      if (m) m.style.display = "flex";

      const code = aud.error?.code;
      const reason = !aud.currentSrc
        ? "No audio source loaded (check URL)"
        : code
        ? "Audio error code: " + code
        : "Audio blocked by browser. Student must click START.";

      setStatus("Status: " + reason);
    }
  }

  function setupListeningUI() {
    if (submitted) {
      const s = sec();
      if (s) s.classList.add("hidden");
      lockReading(false);
      document.dispatchEvent(new CustomEvent("listening:submitted"));
      return;
    }

    showListening();

    const sBtn = startBtn();
    if (sBtn) sBtn.onclick = startAudioFromUserGesture;

    const submitNow = $("submitListeningBtn");
    if (submitNow) {
      submitNow.onclick = () => {
        if (submitted) return;

        const ok = confirm(
          "Submit Listening now? You will NOT be able to change answers after submitting."
        );
        if (!ok) return;

        finishListening("Student submitted listening early.");

showModal(
  "Listening submitted",
  "Listening is submitted. Start Reading now?",
  {
    mode: "confirm",
    showCancel: true,
    submitText: "Start Reading",
    cancelText: "Stay here",
    onConfirm: () => {
      startReadingSystem();
      showOnly("reading");
      setExamNavStatus("Status: Reading in progress");
    },
    onCancel: () => {
      // Keep listening visible (view-only). Student can still review answers.
      showOnly("listening");
      setExamNavStatus("Status: Listening submitted (review)");
    }
  }
);
      };
    }

    const cBtn = cancelBtn();
    if (cBtn) {
      cBtn.onclick = () => {
        const m = modal();
        if (m) m.style.display = "flex";
        setStatus("Status: Not started");
      };
    }

    const dl = $("downloadListeningBtn");
    if (dl)
      dl.onclick = () => {
        const payload = collectListeningPayload("manual download");
        downloadJSON(payload, "listening-answers.json");
      };

    const cp = $("copyListeningBtn");
    if (cp) {
      cp.onclick = async () => {
        const payload = collectListeningPayload("manual copy");
        const ok = await copyToClipboard(JSON.stringify(payload, null, 2));
        setStatus(ok ? "Status: Copied answers." : "Status: Copy blocked by browser.");
      };
    }
  }
  // Run now if DOM is already loaded, otherwise wait for it
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupListeningUI);
  } else {
    setupListeningUI();
  }
}

/* =========================================================
   2) WRITING SYSTEM (starts only after Reading submit / time end)
   FIXED: "End exam" name modal now has real Submit button.
========================================================= */

function startWritingSystem() {
  const W = {
    TEST_ID: "ielts-writing-001",
    DURATION_MINUTES: 60,
    keys: {
      started: "IELTS:WRITING:started",
      submitted: "IELTS:WRITING:submitted",
      remaining: "IELTS:WRITING:remainingSeconds",
      answers: "IELTS:WRITING:answers",
      lastSubmission: "IELTS:WRITING:lastSubmission",
      studentName: "IELTS:WRITING:studentFullName",
    },
  };

  const writingSection = $("writingSection");
  if (!writingSection) return;

  // Switch view to writing
  showOnly("writing");

  let remainingSeconds = W.DURATION_MINUTES * 60;
  const savedRemaining = localStorage.getItem(W.keys.remaining);
  if (savedRemaining && !Number.isNaN(Number(savedRemaining))) {
    remainingSeconds = Math.max(0, Number(savedRemaining));
  }

  let hasSubmitted = localStorage.getItem(W.keys.submitted) === "true";
  let timer = null;

  const wt1 = $("writingTask1");
  const wt2 = $("writingTask2");
  const wt1Count = $("wt1Count");
  const wt2Count = $("wt2Count");
  const autosaveEl = $("writingAutosave");
  const timeEl = $("writingTimeLeft");

  // NOTE: Your HTML does not have a visible input in writing top for name,
  // so we only use the modal input for name.
  const modalNameInput = $("modalFullName");

  function setAutosave(text) {
    if (!autosaveEl) return;
    autosaveEl.textContent = text;
    setTimeout(() => {
      if (autosaveEl.textContent === text) autosaveEl.textContent = "Autosave: ready";
    }, 900);
  }

  function updateCounts() {
    if (wt1Count) wt1Count.textContent = `Word count: ${wordCount(wt1?.value || "")}`;
    if (wt2Count) wt2Count.textContent = `Word count: ${wordCount(wt2?.value || "")}`;
  }

  function loadWriting() {
    const raw = localStorage.getItem(W.keys.answers);
    if (raw) {
      try {
        const data = JSON.parse(raw) || {};
        if (wt1 && data.task1 !== undefined) wt1.value = String(data.task1);
        if (wt2 && data.task2 !== undefined) wt2.value = String(data.task2);
      } catch {}
    }
    updateCounts();
  }

  function saveWriting() {
    if (hasSubmitted) return;
    const payload = {
      task1: wt1 ? wt1.value : "",
      task2: wt2 ? wt2.value : "",
    };
    try {
      localStorage.setItem(W.keys.answers, JSON.stringify(payload));
    } catch {}
    try {
      localStorage.setItem(W.keys.remaining, String(remainingSeconds));
    } catch {}
    setAutosave("Autosave: saved");
    updateCounts();
  }

  function getStudentFullNameFromStorageOrModal() {
  const fromStore = (localStorage.getItem(W.keys.studentName) || "").trim().replace(/\s+/g, " ");
  return fromStore;
}

  function collectWritingPayload(reason) {
    const fullName = getStudentFullNameFromStorageOrModal();

    const answersRaw = localStorage.getItem(W.keys.answers);
    let answers = { task1: wt1?.value || "", task2: wt2?.value || "" };
    if (answersRaw) {
      try {
        const parsed = JSON.parse(answersRaw) || {};
        answers = { task1: String(parsed.task1 || ""), task2: String(parsed.task2 || "") };
      } catch {}
    }

    return {
      type: "writing",
      testId: W.TEST_ID,
      submittedAt: new Date().toISOString(),
      reason,
      studentFullName: fullName,
      durationMinutes: W.DURATION_MINUTES,
      remainingSeconds,
      answers,
      wordCount: {
        task1: wordCount(answers.task1),
        task2: wordCount(answers.task2),
      },
    };
  }

  async function submitFinalExam(reason) {
    if (hasSubmitted) return;

  let fullName = getStudentFullNameFromStorageOrModal();

if (!isValidFullName(fullName)) {
  const typed = prompt("Type your Name and Surname to submit the exam:");
  fullName = (typed || "").trim().replace(/\s+/g, " ");
  if (!isValidFullName(fullName)) {
    showModal("Name required", "Submission cancelled. You must type Name and Surname to submit.", { mode: "confirm" });
    return;
  }
  localStorage.setItem(W.keys.studentName, fullName);
}

    localStorage.setItem(W.keys.studentName, fullName);

    hasSubmitted = true;
    localStorage.setItem(W.keys.submitted, "true");
    if (timer) clearInterval(timer);

    // one last save
    saveWriting();

    const writingPayload = collectWritingPayload(reason);
    localStorage.setItem(W.keys.lastSubmission, JSON.stringify(writingPayload));

    // Build FINAL payload (Listening + Reading + Writing)
    let listening = null;
    let reading = null;

    const lRaw = localStorage.getItem("IELTS:LISTENING:lastSubmission");
    if (lRaw) {
      try {
        listening = JSON.parse(lRaw);
      } catch {}
    }

    const rRaw = localStorage.getItem("ielts-reading-3parts-001:lastSubmission");
    if (rRaw) {
      try {
        reading = JSON.parse(rRaw);
      } catch {}
    }

    const finalPayload = {
      examId: EXAM.id,
      submittedAt: new Date().toISOString(),
      studentFullName: fullName,
      listening,
      reading,
      writing: writingPayload,
    };

    localStorage.setItem(EXAM.keys.finalSubmission, JSON.stringify(finalPayload));
localStorage.setItem(EXAM.keys.finalSubmitted, "true");
lockWholeExamAfterFinalSubmit();

// Send to admin if endpoint is set
if (ADMIN_ENDPOINT) {
      try {
        await fetch(ADMIN_ENDPOINT, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(finalPayload),
        });

        showModal("Exam submitted", "Submitted and sent to Google Sheets.");
        return;
      } catch {
        showModal(
          "Submitted (local only)",
          "Could not send to admin endpoint. Saved locally. Use Copy/Download buttons."
        );
        return;
      }
    }

    showModal(
      "Submitted (local only)",
      "ADMIN_ENDPOINT is not set. The exam is saved locally. Use Copy/Download buttons."
    );
  }

  // Expose submit function for modal Submit button + backup end button
  window.__IELTS_SUBMIT_FINAL__ = submitFinalExam;

  function startTimer() {
    if (timeEl) timeEl.textContent = formatTime(remainingSeconds);

    timer = setInterval(() => {
      if (hasSubmitted) return;

      remainingSeconds = Math.max(0, remainingSeconds - 1);
      if (timeEl) timeEl.textContent = formatTime(remainingSeconds);

      if (remainingSeconds % 5 === 0) saveWriting();

      if (remainingSeconds === 0) {
        clearInterval(timer);
        timer = null;
        submitFinalExam("Writing time is up. Auto-submitted.");
      }
    }, 1000);
  }

  writingSection.addEventListener("input", (e) => {
    const t = e.target;
    if (!t) return;

    if (t === wt1 || t === wt2) saveWriting();
  });

  const dl = $("downloadWritingBtn");
  if (dl)
    dl.onclick = () => {
      const p = collectWritingPayload("manual download");
      downloadJSON(p, `writing-${Date.now()}.json`);
    };

  const cp = $("copyWritingBtn");
  if (cp)
    cp.onclick = async () => {
      const p = collectWritingPayload("manual copy");
      const ok = await copyToClipboard(JSON.stringify(p, null, 2));
      setAutosave(ok ? "Copied." : "Copy blocked by browser.");
    };

  const endBtn = $("endExamBtn");
  if (endBtn)
    endBtn.onclick = () => {
      const ok = confirm("Are you sure you want to end the exam and submit?");
      if (!ok) return;
      submitFinalExam("Student ended the exam.");
    };

  // init
  loadWriting();
  localStorage.setItem(W.keys.started, "true");

  // If already submitted, lock view
  if (hasSubmitted) {
    writingSection.classList.add("view-only");
    if (timeEl) timeEl.textContent = formatTime(remainingSeconds);
  } else {
    startTimer();
  }

  window.addEventListener("beforeunload", (e) => {
    if (!hasSubmitted) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
}

/* =========================================================
   3) READING SYSTEM
   FIXED:
   - On Submit: truly locks controls (disabled + view-only + localStorage submitted=true)
   - After submit: immediately goes to Writing (as requested)
   - Even if user navigates back: reading stays locked
========================================================= */

function startReadingSystem() {
  if (window.__IELTS_READING_INIT__) return;
  window.__IELTS_READING_INIT__ = true;

  // ========== SETTINGS ==========
  const TEST_ID = "ielts-reading-3parts-001";
  const DURATION_MINUTES = 60;
  const SUBMIT_ENDPOINT = null;

  // ========== TIMER/STATE ==========
  let remainingSeconds = DURATION_MINUTES * 60;
  let timerInterval = null;

  const storageKey = (suffix) => `${TEST_ID}:${suffix}`;

  let hasSubmittedReading = localStorage.getItem(storageKey("submitted")) === "true";
  let hasTransitionedToWriting = false;

  // ===== Part switching =====
  const PARTS = ["part1", "part2", "part3"];
  let activePart = "part1";

  let PART1_PASSAGE_HTML = "";

  // =====================================================
  // PART 1 / PART 2 / PART 3 configs (UNCHANGED)
  // =====================================================

  const PART1 = {
    id: "part1",
    title: "Part 1",
    renderQuestions: (answers) => {
      const HEADINGS_TASK = {
        title: "Questions 1–6",
        instructions: [
          "The text has seven paragraphs labelled A–G.",
          "Choose the correct headings for paragraphs B–G from the list of headings below.",
          "Write the correct number, i–ix, in the gaps.",
        ],
        listTitle: "List of Headings",
        headings: [
          { value: "i", label: "Continued breakthroughs in research" },
          { value: "ii", label: "Competing claims of originality" },
          { value: "iii", label: "The early years of Sir Isaac Newton" },
          { value: "iv", label: "The legacy of an exceptional mind" },
          { value: "v", label: "Routine life at a 17th century university" },
          { value: "vi", label: "Heated academic disputes" },
          { value: "vii", label: "A new venture" },
          { value: "viii", label: "His crowning achievement" },
          { value: "ix", label: "A controversial theory about planets" },
        ],
        example: { paragraph: "Paragraph A", value: "iii" },
        questions: [
          { q: 1, paragraph: "Paragraph B" },
          { q: 2, paragraph: "Paragraph C" },
          { q: 3, paragraph: "Paragraph D" },
          { q: 4, paragraph: "Paragraph E" },
          { q: 5, paragraph: "Paragraph F" },
          { q: 6, paragraph: "Paragraph G" },
        ],
      };

      const SHORT_Q = {
        title: "Questions 7–8",
        instructions: [
          "Answer the questions below.",
          "Choose NO MORE THAN TWO WORDS from the passage for each answer.",
          "Write your answers in the gaps.",
        ],
        questions: [
          { q: 7, text: "With which scientific organization was Newton associated for much of his career?" },
          { q: 8, text: "With whom did Newton live as he got older?" },
        ],
      };

      const NOTES = {
        title: "Questions 9–13",
        instructions: [
          "Complete the notes below.",
          "Choose ONE WORD from the passage for each answer.",
          "Write your answers in the gaps.",
        ],
        boxTitle: "Sir Isaac Newton’s achievements",
      };

      const wrap = document.createElement("div");
      wrap.appendChild(renderHeadingsTask(HEADINGS_TASK, answers));
      wrap.appendChild(renderShortAnswerBlock(SHORT_Q, answers));
      wrap.appendChild(renderNotesBlock(NOTES, answers));
      return wrap;
    },
  };

  const PART2_PASSAGE_TEXT = `
The Geography of Antarctica

The continent of Antarctica makes up most of the Antarctic region. The Antarctic is a cold, remote area in the Southern Hemisphere encompassed by the Antarctic Convergence, an uneven line of latitude where cold, northward-flowing Antarctic waters meet the warmer waters of the world’s oceans. The whole Antarctic region covers approximately 20 percent of the Southern Hemisphere. Antarctica is the fifth-largest continent in terms of total area, larger than both Oceania and Europe. It is unique in that it does not have a native population. There are no countries in Antarctica, although seven nations claim different parts of it: New Zealand, Australia, France, Norway, the United Kingdom, Chile, and Argentina.

The Antarctic Ice Sheet dominates the region. It is the single piece of ice on Earth covering the greatest area. This ice sheet even extends beyond the continent when snow and ice are at their most extreme. The ice surface dramatically expands from about 3 million square kilometers (1.2 million square miles) at the end of summer to about 19 million square kilometers (7.3 million square miles) by winter. Ice sheet growth mainly occurs at the coastal ice shelves, primarily the Ross Ice Shelf and the Ronne Ice Shelf. Ice shelves are floating sheets of ice that are connected to the continent. Glacial ice moves from the continent’s interior to these lower-elevation ice shelves at rates of 10 to 1,000 meters (33-32,808 feet) per year.

Antarctica has numerous mountain summits, including the Transantarctic Mountains, which divide the continent into eastern and western regions. A few of these summits reach altitudes of more than 4,500 meters (14,764 feet). The elevation of the Antarctic Ice Sheet itself is about 2,000 meters (6,562 feet) and reaches 4,000 meters (13,123 feet) above sealevel near the center of the continent.

Without any ice, the continent would emerge as two distinct areas: a giant peninsula and archipelago of mountainous islands, known as Lesser Antarctica, and a single large landmass about the size of Australia, known as Greater Antarctica. These regions have different geologies; Greater Antarctica, or East Antarctica, is composed of older, igneous rocks whereas Lesser Antarctica, or West Antarctica, is made up of younger, volcanic rock. Lesser Antarctica, in fact, is part of the “Ring of Fire,” a tectonically active area around the Pacific Ocean. Tectonic activity is the interaction of plates on Earth’s crust, often resulting in earthquakes and volcanoes. Mount Erebus, located on Antarctica’s Ross Island, is the southernmost active volcano on Earth.

Antarctica has an extremely cold, dry climate. Winter temperatures along Antarctica’s coast generally range from -10° Celsius to -30° Celsius (14° Fahrenheit to -22° Fahrenheit). During the summer, coastal areas hover around 0°C (32°F) but can reach temperatures as high as 9°C (48°F). In the mountainous, interior regions, temperatures are much colder, dropping below -60°C (-76°F) in winter and -20°C (-4°F) in summer. In 1983, Russia’s Vostok Research Station measured the coldest temperature ever recorded on Earth: -89.2°C (-128.6°F). An even lower temperature was measured using satellite data taken in 2010: -93.2°C (-135.8°F)

Precipitation in the Antarctic is hard to measure. It always falls as snow. Antarctica’s interior is believed to receive only 50 to 100 millimeters (2-4 inches) of water (in the form of snow) every year. The Antarctic desert is one of the driest deserts in the world. The oceans surrounding Antarctica provide an important physical component of the Antarctic region. The waters surrounding Antarctica are relatively deep, reaching 4,000 to 5,000 meters (13,123 to 16,404 feet) in depth.

The Antarctic region has an important role in global climate processes. It is an integral part of the Earth’s heat balance. This balance, also called the energy balance, is the relationship between the amount of solar heat absorbed by Earth’s atmosphere and the amount deflected back into space. Antarctica has a larger role than most continents in maintaining Earth’s heat balance and ice is more reflective than land or water surfaces. As a result, the massive Antarctic Ice Sheet reflects a large amount of solar radiation away from Earth’s surface. As global ice cover (ice sheets and glaciers) decreases, the reflectivity of Earth’s surface also diminishes. This allows more incoming solar radiation to be absorbed by the Earth’s surface, causing an unequal heat balance linked to global warming, the current period of climate change.

Interestingly, NASA scientists have found that climate change has caused more ice to form in some parts of Antarctica. They say this is happening because of new climate patterns caused by this change, which in turn create a strong wind pattern called the ‘polar vortex.’ These kinds of polar winds lower temperatures in the Antarctic and have been building in strength in recent decades—as much as 15 percent since 1980. This effect is not seen throughout the Antarctic, however, and some parts are experiencing ice melt
`;

  const PART2 = {
    id: "part2",
    title: "Part 2",
    renderQuestions: (answers) => {
      const wrap = document.createElement("div");

      wrap.appendChild(
        renderSentenceGapsBlock(
          {
            title: "Questions 14–17",
            instructions: [
              "Answer the questions below.",
              "Choose NO MORE THAN TWO WORDS from the passage for each answer.",
              "Write your answers in the gaps.",
            ],
            items: [
              { q: 14, text: "Antarctica’s location far from other continents means that it is very", tail: "." },
              { q: 15, text: "Antarctica is alone among the continents in having no", tail: "." },
              { q: 16, text: "The Antarctic ice sheet holds the record as the largest", tail: " ice sheet on Earth." },
              { q: 17, leadingBlank: true, text2: "are blocks of ice connected to the Antarctic ice sheet." },
            ],
          },
          answers
        )
      );

      wrap.appendChild(
        renderTFNGBlock(
          {
            title: "Questions 18–21",
            instructions: [
              "Do the following statements agree with the information in the passage?",
              "Choose TRUE / FALSE / NOT GIVEN.",
              "Write your answers in the gaps.",
            ],
            items: [
              { q: 18, text: "Some of Antarctica’s mountains are popular with climbers." },
              { q: 19, text: "The temperature in Antarctica never rises above 0°C." },
              { q: 20, text: "Antarctica constitutes around one-fifth of the southern half of the world." },
              { q: 21, text: "Rain in Antarctica is rare but falls occasionally." },
            ],
          },
          answers
        )
      );

      wrap.appendChild(
        renderSummarySelectBlock(
          {
            title: "Questions 22–26",
            instructions: [
              "Complete the summary using the list of words, A–G, below.",
              "Choose the correct letter for each answer.",
              "Write your answers in the gaps.",
            ],
            summaryTitle: "Antarctica and the Changing Climate",
            summaryLines: [
              { text: "Antarctica plays an important role in regulating the Earth’s climate through the process of", blankQ: 22, tail: "." },
              { text: "", blankQ: 23, before: "", after: " is diverted away from the Earth by the huge Antarctic ice sheet." },
              { text: "As the size and", blankQ: 24, tail: " of the ice sheet have decreased," },
              { text: "", blankQ: 25, before: "", after: " has caused melting in some parts of the continent." },
              { text: "However, other areas of Antarctica have experienced falling temperatures in recent years, due to", blankQ: 26, tail: ", climate patterns leading to reduced temperatures." },
            ],
            optionsTitle: "List of Words",
            options: [
              { letter: "A", word: "reflectivity" },
              { letter: "B", word: "ice melt" },
              { letter: "C", word: "solar radiation" },
              { letter: "D", word: "polar vortex winds" },
              { letter: "E", word: "heat balance" },
              { letter: "F", word: "water surfaces" },
              { letter: "G", word: "global warming" },
            ],
          },
          answers
        )
      );

      return wrap;
    },
  };

  const PART3_PASSAGE_TEXT = `
Thinking, Fast and Slow

The idea that we are ignorant of our true selves surged in the 20th century and became common. It's still a commonplace, but it’s changing shape. These days, the bulk of the explanation is done by something else: the ‘dual-process’ model of the brain. We now know that we apprehend the world in two radically opposed ways, employing two fundamentally different modes of thought: ‘System 1’ and ‘System 2’. System 1 is fast; it's intuitive, associative and automatic and it can't be switched off. Its operations involve no sense of intentional control, but it's the "secret author of many of the choices and judgments you make" and it's the hero of Daniel Kahneman's alarming, intellectually stimulating book Thinking, Fast and Slow.

System 2 is slow, deliberate and effortful. Its operations require attention. (To set it going now, ask yourself the question "What is 13 x 27?"). System 2 takes over, rather unwillingly, when things get tricky. It's "the conscious being you call 'I'", and one of Kahneman's main points is that this is a mistake. You're wrong to identify with System 2, for you are also and equally and profoundly System 1. Kahneman compares System 2 to a supporting character who believes herself to be the lead actor and often has little idea of what's going on.

System 2 is slothful, and tires easily (a process called ‘ego depletion’) – so it usually accepts what System 1 tells it. It's often right to do so, because System 1 is for the most part pretty good at what it does; it's highly sensitive to subtle environmental cues, signs of danger, and so on. It does, however, pay a high price for speed. It loves to simplify, to assume WYSIATI (‘what you see is all there is’). It's hopelessly bad at the kind of statistical thinking often required for good decisions, it jumps wildly to conclusions and it's subject to a fantastic range of irrational cognitive biases and interference effects, such as confirmation bias and hindsight bias, to name but two.

The general point about our self-ignorance extends beyond the details of Systems 1 and 2. We're astonishingly susceptible to being influenced by features of our surroundings. One famous (pre-mobile phone) experiment centred on a New York City phone booth. Each time a person came out of the booth after having made a call, an accident was staged – someone dropped all her papers on the pavement. Sometimes a dime had been placed in the phone booth, sometimes not (a dime was then enough to make a call). If there was no dime in the phone booth, only 4% of the exiting callers helped to pick up the papers. If there was a dime, no fewer than 88% helped.

Since then, thousands of other experiments have been conducted, all to the same general effect. We don't know who we are or what we're like, we don't know what we're really doing and we don't know why we're doing it. For example, Judges think they make considered decisions about parole based strictly on the facts of the case. It turns out (to simplify only slightly) that it is their blood-sugar levels really sitting in judgment. If you hold a pencil between your teeth, forcing your mouth into the shape of a smile, you'll find a cartoon funnier than if you hold the pencil pointing forward, by pursing your lips round it in a frown-inducing way.

In an experiment designed to test the ‘anchoring effect’, highly experienced judges were given a description of a shoplifting offence. They were then ‘anchored’ to different numbers by being asked to roll a pair of dice that had been secretly loaded to produce only two totals – three or nine. Finally, they were asked whether the prison sentence for the shoplifting offence should be greater or fewer, in months, than the total showing on the dice. Normally the judges would have made extremely similar judgments, but those who had just rolled nine proposed an average of eight months while those who had rolled three proposed an average of only five months. All were unaware of the anchoring effect.

The same goes for all of us, almost all the time. We think we're smart; we're confident we won't be unconsciously swayed by the high list price of a house. We're wrong. (Kahneman admits his own inability to counter some of these effects.) For example, another systematic error involves ‘duration neglect’ and the ‘peak-end rule’. Looking back on our experience of pain, we prefer a larger, longer amount to a shorter, smaller amount, just so long as the closing stages of the greater pain were easier to bear than the closing stages of the lesser one.
`;

  const PART3 = {
    id: "part3",
    title: "Part 3",
    renderQuestions: (answers) => {
      const wrap = document.createElement("div");

      wrap.appendChild(
        renderMCQBlock(
          {
            title: "Questions 27–31",
            instructions: ["Choose the correct letter, A, B, C or D.", "Write your answers in the gaps."],
            items: [
              {
                q: 27,
                text: "The dual process model of the brain is",
                choices: {
                  A: "The common practice of thinking about two things at the same time.",
                  B: "The conflicting impulses pushing the brain to make both more and less effort.",
                  C: "The feeling of liking and not liking something simultaneously.",
                  D: "The natural tendency to make sense of the world in two different ways.",
                },
              },
              {
                q: 28,
                text: "System 2 takes charge of decision-making when",
                choices: {
                  A: "When the brain needs a rest.",
                  B: "When more mental effort is required.",
                  C: "When a person feels excessively confident.",
                  D: "When a dangerous situation is developing.",
                },
              },
              {
                q: 29,
                text: "‘Confirmation bias’ is an example of",
                choices: {
                  A: "System 1 rushing to judgment.",
                  B: "System 1 making a careful judgment.",
                  C: "System 1 making a brave judgment.",
                  D: "System 1 judging a situation based on facts.",
                },
              },
              {
                q: 30,
                text: "The main conclusion of the phone booth experiment was that",
                choices: {
                  A: "People are more likely to help someone that they are attracted to.",
                  B: "People are more responsive to their environment than they realize.",
                  C: "People are more likely to be helpful if they think they will be rewarded.",
                  D: "People are generally selfish and will always do what is best for themselves.",
                },
              },
              {
                q: 31,
                text: "The ‘anchoring effect’ is the process by which",
                choices: {
                  A: "Decisions are made using a numerical system.",
                  B: "A subconscious factor may strongly influence our decision-making.",
                  C: "Decisions about prison sentences are made by rolling a dice.",
                  D: "We may emphasize certain factor too much in our decision-making.",
                },
              },
            ],
          },
          answers
        )
      );

      wrap.appendChild(
        renderTFNGBlock(
          {
            title: "Questions 32–36",
            instructions: [
              "Do the following statements agree with the claims of the writer?",
              "Choose TRUE / NO / NOT GIVEN.",
              "Write your answers in the gaps.",
            ],
            customChoices: ["TRUE", "NO", "NOT GIVEN"],
            items: [
              { q: 32, text: "In general, humans have become less rational over the last 100 years." },
              { q: 33, text: "Most people lack a clear sense of their own personal identity." },
              { q: 34, text: "A person can train themselves to use System 2 most of the time." },
              { q: 35, text: "People who make important decisions should be made aware of the dual-process model." },
              { q: 36, text: "In most everyday situations, people are capable of making calm and rational decisions." },
            ],
          },
          answers
        )
      );

      wrap.appendChild(
        renderEndingsMatchBlock(
          {
            title: "Questions 37–39",
            instructions: [
              "Complete each sentence with the correct ending, A–E, below.",
              "Choose the correct letter for each answer.",
              "Write your answers in the gaps.",
            ],
            endings: {
              A: "feeling a certain way at the conclusion of an experience decides how we remember it.",
              B: "decision-making and judgments are made too quickly.",
              C: "having less energy means we are more likely to succumb to an irrational bias.",
              D: "being sensitive to one’s surroundings is a useful survival skill.",
              E: "wanting more food or drink may distract us from the decision we are making.",
            },
            items: [
              { q: 37, text: "In the course of evolutionary history System 1 has served humans well because" },
              { q: 38, text: "Low blood sugar or tiredness may be factors in decision making because" },
              { q: 39, text: "The ‘peak-end rule’ shows us that" },
            ],
          },
          answers
        )
      );

      wrap.appendChild(
        renderMCQBlock(
          {
            title: "Question 40",
            instructions: ["Choose the correct letter, A, B, C or D.", "Write your answer in the gap."],
            items: [
              {
                q: 40,
                text: "What is the writer’s primary purpose in writing this article?",
                choices: {
                  A: "to introduce their own research to the general reader",
                  B: "to summarize and review a recently published book",
                  C: "to argue against a commonly-held theory",
                  D: "to encourage readers to question their own decision-making processes",
                },
              },
            ],
          },
          answers
        )
      );

      return wrap;
    },
  };

  // =====================================================
  // UI RENDER HELPERS (same as your code; keep all)
  // =====================================================
  function injectStyles() {
    if (document.getElementById("readingStylesInjected")) return;
    const style = document.createElement("style");
    style.id = "readingStylesInjected";
    style.textContent = `
      .panel{border:1px solid var(--border);border-radius:16px;padding:14px;background:#fff;box-shadow:var(--shadow);margin-bottom:16px;}
      .task-title{font-weight:800;margin:0 0 10px;font-size:16px;}
      .task-instructions{color:var(--muted);font-size:13px;line-height:1.4;white-space:pre-line;margin:0 0 14px;}
      .headings-list-title{font-weight:800;margin:0 0 8px;}
      .headings-list{margin:0;padding-left:18px;line-height:1.55;}
      .headings-list li{margin:4px 0;}
      .answer-example{margin-top:10px;padding-top:10px;border-top:1px solid var(--border);font-size:14px;line-height:1.45;}
      .answer-example b{font-weight:900;}
      .qrows{margin-top:14px;display:flex;flex-direction:column;gap:12px;}
      .qrow{display:grid;grid-template-columns:38px 1fr 180px;gap:10px;align-items:center;}
      .qbox{width:34px;height:34px;border:1px solid var(--border);border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;background:#fff;flex:0 0 auto;}
      .qtext{font-weight:600;line-height:1.35;}
      .qselect{width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:12px;background:#fff;font-size:14px;}
      .sentenceRow{display:flex;gap:10px;align-items:flex-start;margin:10px 0 14px;}
      .sentenceLine{flex:1;line-height:1.6;font-weight:600;}
      .gapInput{width:220px;max-width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:12px;font-size:14px;background:#fff;}
      .gapInline{display:inline-block;vertical-align:baseline;margin:0 6px;}
      .gapInline input{width:220px;max-width:100%;padding:7px 9px;border:1px solid var(--border);border-radius:10px;font-size:14px;background:#fff;}
      .mcqItem{margin:12px 0 14px;}
      .mcqPrompt{display:flex;gap:10px;align-items:flex-start;margin-bottom:10px;}
      .mcqChoices{display:flex;flex-direction:column;gap:10px;}
      .choiceRow{display:flex;gap:10px;padding:10px;border:1px solid var(--border);border-radius:14px;cursor:pointer;user-select:none;}
      .choiceRow input{margin-top:3px;}
      .optionsBox{border:1px solid var(--border);border-radius:14px;padding:10px;background:#fff;margin-top:10px;line-height:1.55;font-size:14px;}
      .optionsGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;margin-top:8px;}
      .optCell b{display:inline-block;width:18px;}
      .partTabs{display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap;}
      .partTab{padding:6px 10px;border:1px solid var(--border);border-radius:999px;background:#fff;cursor:pointer;font-weight:800;font-size:13px;}
      .partTab.active{border-color:#111;background:#111;color:#fff;}
    `;
    document.head.appendChild(style);
  }

  function renderPanel(title, instructions) {
    const panel = document.createElement("div");
    panel.className = "panel";

    const t = document.createElement("div");
    t.className = "task-title";
    t.textContent = title;

    const inst = document.createElement("div");
    inst.className = "task-instructions";
    inst.textContent = Array.isArray(instructions) ? instructions.join("\n") : instructions || "";

    panel.appendChild(t);
    panel.appendChild(inst);
    return panel;
  }

  function saveAnswers(answers) {
    if (hasSubmittedReading) return;
    localStorage.setItem(storageKey("answers"), JSON.stringify(answers));
    localStorage.setItem(storageKey("remainingSeconds"), String(remainingSeconds));
    if ($("autosaveStatus"))
      $("autosaveStatus").textContent = `Autosave: saved at ${new Date().toLocaleTimeString()}`;
  }

  function loadState() {
    const saved = localStorage.getItem(storageKey("answers"));
    const answers = saved ? JSON.parse(saved) : {};
    const savedRemaining = localStorage.getItem(storageKey("remainingSeconds"));
    if (savedRemaining && !Number.isNaN(Number(savedRemaining))) {
      remainingSeconds = Math.max(0, Number(savedRemaining));
    }
    return { answers };
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // === Lock helpers (NEW: real disable, not only CSS)
  function lockReadingUI() {
    const rc = $("readingControls");
    const c = $("container");

    if (rc) rc.classList.add("view-only");
    if (c) c.classList.add("view-only");

    // Hard-disable every control inside reading container
    if (c) {
      c.querySelectorAll("input, select, textarea, button").forEach((el) => {
        // keep download/copy buttons enabled? they are outside container anyway
        el.disabled = true;
      });
    }

    // Also disable Submit/Focus buttons
    if ($("submitBtn")) $("submitBtn").disabled = true;
    if ($("focusBtn")) $("focusBtn").disabled = true;
  }

  // ---- Rendering blocks (same logic, BUT now set disabled when submitted) ----
  function renderHeadingsTask(cfg, answers) {
    const panel = renderPanel(cfg.title, cfg.instructions);

    const listTitle = document.createElement("div");
    listTitle.className = "headings-list-title";
    listTitle.textContent = cfg.listTitle;
    panel.appendChild(listTitle);

    const ul = document.createElement("ol");
    ul.className = "headings-list";
    ul.style.listStyleType = "lower-roman";
    cfg.headings.forEach((h) => {
      const li = document.createElement("li");
      li.textContent = h.label;
      ul.appendChild(li);
    });
    panel.appendChild(ul);

    const ex = document.createElement("div");
    ex.className = "answer-example";
    ex.innerHTML = `<b>Answer Example</b><br><b>${cfg.example.paragraph} - ${cfg.example.value}</b>`;
    panel.appendChild(ex);

    const rows = document.createElement("div");
    rows.className = "qrows";

    cfg.questions.forEach((q) => {
      const row = document.createElement("div");
      row.className = "qrow";

      const qbox = document.createElement("div");
      qbox.className = "qbox";
      qbox.textContent = String(q.q);

      const qtext = document.createElement("div");
      qtext.className = "qtext";
      qtext.textContent = q.paragraph;

      const select = document.createElement("select");
      select.className = "qselect";

      const opt0 = document.createElement("option");
      opt0.value = "";
      opt0.textContent = "Select…";
      select.appendChild(opt0);

      cfg.headings.forEach((h) => {
        const opt = document.createElement("option");
        opt.value = h.value;
        opt.textContent = h.value;
        select.appendChild(opt);
      });

      select.value = answers[q.q] || "";
      select.disabled = hasSubmittedReading;

      select.addEventListener("change", () => {
        if (hasSubmittedReading) return;
        answers[q.q] = select.value;
        saveAnswers(answers);
      });

      row.appendChild(qbox);
      row.appendChild(qtext);
      row.appendChild(select);
      rows.appendChild(row);
    });

    panel.appendChild(rows);
    return panel;
  }

  function renderShortAnswerBlock(cfg, answers) {
    const panel = renderPanel(cfg.title, cfg.instructions);

    cfg.questions.forEach((item) => {
      const row = document.createElement("div");
      row.className = "sentenceRow";

      const qbox = document.createElement("div");
      qbox.className = "qbox";
      qbox.textContent = String(item.q);

      const right = document.createElement("div");
      right.style.flex = "1";

      const line = document.createElement("div");
      line.className = "sentenceLine";
      line.textContent = item.text;

      const input = document.createElement("input");
      input.className = "gapInput";
      input.type = "text";
      input.placeholder = "Type your answer";
      input.value = answers[item.q] ?? "";
      input.disabled = hasSubmittedReading;

      input.addEventListener("input", () => {
        if (hasSubmittedReading) return;
        const v = input.value.trim().replace(/\s+/g, " ");
        answers[item.q] = v;
        saveAnswers(answers);
      });

      right.appendChild(line);
      right.appendChild(input);

      row.appendChild(qbox);
      row.appendChild(right);
      panel.appendChild(row);
    });

    return panel;
  }

  function renderNotesBlock(cfg, answers) {
    const panel = renderPanel(cfg.title, cfg.instructions);

    const box = document.createElement("div");
    box.className = "optionsBox";

    const boxTitle = document.createElement("div");
    boxTitle.style.textAlign = "center";
    boxTitle.style.fontWeight = "900";
    boxTitle.style.marginBottom = "10px";
    boxTitle.textContent = cfg.boxTitle;

    box.appendChild(boxTitle);

    const addBullet = (htmlParts) => {
      const p = document.createElement("div");
      p.style.margin = "10px 0";
      p.style.lineHeight = "1.55";

      htmlParts.forEach((part) => {
        if (typeof part === "string") p.appendChild(document.createTextNode(part));
        else p.appendChild(part);
      });

      box.appendChild(p);
    };

    const blank = (q) => {
      const span = document.createElement("span");
      span.className = "gapInline";
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "__________";
      input.value = answers[q] ?? "";
      input.disabled = hasSubmittedReading;
      input.addEventListener("input", () => {
        if (hasSubmittedReading) return;
        answers[q] = input.value.trim().replace(/\s+/g, " ");
        saveAnswers(answers);
      });
      span.appendChild(input);
      return span;
    };

    addBullet(["• Created first reflecting ", blank(9), ", subsequently made a professor at Cambridge at the age of 25."]);
    addBullet(["• Helped develop the scientific method with his experiments in ", blank(10), ", the study of light; showed that it is ", blank(11), ", not waves, that constitute light."]);
    addBullet(["• Worked out the laws of the movement of bodies in space (planets etc.), published Principia Mathematica with laws of gravity and ", blank(12), "."]);
    addBullet(["• Joint founder (with Leibniz) of ", blank(13), ", a new branch of mathematics."]);

    panel.appendChild(box);
    return panel;
  }

  function renderSentenceGapsBlock(cfg, answers) {
    const panel = renderPanel(cfg.title, cfg.instructions);

    cfg.items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "sentenceRow";

      const qbox = document.createElement("div");
      qbox.className = "qbox";
      qbox.textContent = String(item.q);

      const line = document.createElement("div");
      line.className = "sentenceLine";

      const input = document.createElement("input");
      input.className = "gapInput";
      input.type = "text";
      input.placeholder = "Type your answer";
      input.value = answers[item.q] ?? "";
      input.disabled = hasSubmittedReading;

      input.addEventListener("input", () => {
        if (hasSubmittedReading) return;
        answers[item.q] = input.value.trim().replace(/\s+/g, " ");
        saveAnswers(answers);
      });

      if (item.leadingBlank) {
        line.appendChild(input);
        line.appendChild(document.createTextNode(" " + (item.text2 || "")));
        row.appendChild(qbox);
        row.appendChild(line);
        panel.appendChild(row);
        return;
      }

      line.textContent = `${item.text} ________${item.tail || ""}`;

      row.appendChild(qbox);

      const right = document.createElement("div");
      right.style.flex = "1";
      right.appendChild(line);
      right.appendChild(input);

      row.appendChild(right);
      panel.appendChild(row);
    });

    return panel;
  }

  function renderTFNGBlock(cfg, answers) {
    const panel = renderPanel(cfg.title, cfg.instructions);
    const choices = cfg.customChoices || ["TRUE", "FALSE", "NOT GIVEN"];

    cfg.items.forEach((item) => {
      const block = document.createElement("div");
      block.className = "mcqItem";

      const prompt = document.createElement("div");
      prompt.className = "mcqPrompt";

      const qbox = document.createElement("div");
      qbox.className = "qbox";
      qbox.textContent = String(item.q);

      const text = document.createElement("div");
      text.className = "qtext";
      text.textContent = item.text;

      prompt.appendChild(qbox);
      prompt.appendChild(text);

      const choicesWrap = document.createElement("div");
      choicesWrap.className = "mcqChoices";

      const selected = answers[item.q] ?? "";

      choices.forEach((c) => {
        const label = document.createElement("label");
        label.className = "choiceRow";

        const input = document.createElement("input");
        input.type = "radio";
        input.name = `q_${item.q}`;
        input.value = c;
        input.checked = selected === c;
        input.disabled = hasSubmittedReading;

        input.addEventListener("change", () => {
          if (hasSubmittedReading) return;
          answers[item.q] = c;
          saveAnswers(answers);
        });

        const t = document.createElement("div");
        t.textContent = c;

        label.appendChild(input);
        label.appendChild(t);
        choicesWrap.appendChild(label);
      });

      block.appendChild(prompt);
      block.appendChild(choicesWrap);
      panel.appendChild(block);
    });

    return panel;
  }

  function renderMCQBlock(cfg, answers) {
    const panel = renderPanel(cfg.title, cfg.instructions);

    cfg.items.forEach((item) => {
      const block = document.createElement("div");
      block.className = "mcqItem";

      const prompt = document.createElement("div");
      prompt.className = "mcqPrompt";

      const qbox = document.createElement("div");
      qbox.className = "qbox";
      qbox.textContent = String(item.q);

      const text = document.createElement("div");
      text.className = "qtext";
      text.textContent = `${item.q}. ${item.text}`;

      prompt.appendChild(qbox);
      prompt.appendChild(text);

      const choicesWrap = document.createElement("div");
      choicesWrap.className = "mcqChoices";

      const selected = answers[item.q] ?? "";

      Object.entries(item.choices).forEach(([letter, choiceText]) => {
        const label = document.createElement("label");
        label.className = "choiceRow";

        const input = document.createElement("input");
        input.type = "radio";
        input.name = `q_${item.q}`;
        input.value = letter;
        input.checked = selected === letter;
        input.disabled = hasSubmittedReading;

        input.addEventListener("change", () => {
          if (hasSubmittedReading) return;
          answers[item.q] = letter;
          saveAnswers(answers);
        });

        const t = document.createElement("div");
        t.innerHTML = `<b style="display:inline-block;width:18px">${letter}</b> ${escapeHtml(choiceText)}`;

        label.appendChild(input);
        label.appendChild(t);
        choicesWrap.appendChild(label);
      });

      block.appendChild(prompt);
      block.appendChild(choicesWrap);
      panel.appendChild(block);
    });

    return panel;
  }

  function renderEndingsMatchBlock(cfg, answers) {
    const panel = renderPanel(cfg.title, cfg.instructions);

    const box = document.createElement("div");
    box.className = "optionsBox";
    const grid = document.createElement("div");
    grid.className = "optionsGrid";

    Object.entries(cfg.endings).forEach(([letter, txt]) => {
      const cell = document.createElement("div");
      cell.className = "optCell";
      cell.innerHTML = `<b>${letter}.</b> ${escapeHtml(txt)}`;
      grid.appendChild(cell);
    });

    box.appendChild(grid);
    panel.appendChild(box);

    const rows = document.createElement("div");
    rows.className = "qrows";

    cfg.items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "qrow";

      const qbox = document.createElement("div");
      qbox.className = "qbox";
      qbox.textContent = String(item.q);

      const qtext = document.createElement("div");
      qtext.className = "qtext";
      qtext.textContent = `${item.q}. ${item.text}`;

      const select = document.createElement("select");
      select.className = "qselect";

      const opt0 = document.createElement("option");
      opt0.value = "";
      opt0.textContent = "Select…";
      select.appendChild(opt0);

      Object.keys(cfg.endings).forEach((letter) => {
        const opt = document.createElement("option");
        opt.value = letter;
        opt.textContent = letter;
        select.appendChild(opt);
      });

      select.value = answers[item.q] || "";
      select.disabled = hasSubmittedReading;

      select.addEventListener("change", () => {
        if (hasSubmittedReading) return;
        answers[item.q] = select.value;
        saveAnswers(answers);
      });

      row.appendChild(qbox);
      row.appendChild(qtext);
      row.appendChild(select);
      rows.appendChild(row);
    });

    panel.appendChild(rows);
    return panel;
  }

  function renderSummarySelectBlock(cfg, answers) {
    const panel = renderPanel(cfg.title, cfg.instructions);

    const st = document.createElement("div");
    st.style.fontWeight = "900";
    st.style.textAlign = "center";
    st.style.marginBottom = "10px";
    st.textContent = cfg.summaryTitle;
    panel.appendChild(st);

    const summaryBox = document.createElement("div");
    summaryBox.className = "optionsBox";

    cfg.summaryLines.forEach((line) => {
      const p = document.createElement("div");
      p.style.lineHeight = "1.65";
      p.style.margin = "10px 0";

      const select = document.createElement("select");
      select.className = "qselect";
      select.style.width = "120px";
      select.style.display = "inline-block";
      select.style.verticalAlign = "baseline";
      select.style.margin = "0 6px";

      const opt0 = document.createElement("option");
      opt0.value = "";
      opt0.textContent = "—";
      select.appendChild(opt0);

      cfg.options.forEach((o) => {
        const opt = document.createElement("option");
        opt.value = o.letter;
        opt.textContent = o.letter;
        select.appendChild(opt);
      });

      select.value = answers[line.blankQ] || "";
      select.disabled = hasSubmittedReading;

      select.addEventListener("change", () => {
        if (hasSubmittedReading) return;
        answers[line.blankQ] = select.value;
        saveAnswers(answers);
      });

      const qLabel = document.createElement("b");
      qLabel.textContent = `${line.blankQ}. `;

      if (line.text) {
        p.appendChild(qLabel);
        p.appendChild(document.createTextNode(line.text + " "));
        p.appendChild(select);
        p.appendChild(document.createTextNode(line.tail || ""));
      } else {
        p.appendChild(qLabel);
        p.appendChild(document.createTextNode(line.before || ""));
        p.appendChild(select);
        p.appendChild(document.createTextNode(line.after || ""));
      }

      summaryBox.appendChild(p);
    });

    panel.appendChild(summaryBox);

    const optionsBox = document.createElement("div");
    optionsBox.className = "optionsBox";
    optionsBox.style.marginTop = "12px";

    const ot = document.createElement("div");
    ot.style.fontWeight = "900";
    ot.textContent = cfg.optionsTitle;
    optionsBox.appendChild(ot);

    const grid = document.createElement("div");
    grid.className = "optionsGrid";
    cfg.options.forEach((o) => {
      const cell = document.createElement("div");
      cell.className = "optCell";
      cell.innerHTML = `<b>${o.letter}</b> ${escapeHtml(o.word)}`;
      grid.appendChild(cell);
    });
    optionsBox.appendChild(grid);

    panel.appendChild(optionsBox);
    return panel;
  }

  // =====================================================
  // PART NAV + PASSAGE SWITCHING
  // =====================================================
  function buildPartTabs() {
    const controls = $("readingControls") || document.querySelector(".controls");
    if (!controls) return;

    if (controls.querySelector(".partTabs")) return;

    const tabs = document.createElement("div");
    tabs.className = "partTabs";

    const makeBtn = (id, label) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "partTab";
      b.textContent = label;
      b.disabled = false; // allowed for review even if submitted
      b.addEventListener("click", () => switchPart(id));
      return b;
    };

    tabs.appendChild(makeBtn("part1", "Part 1"));
    tabs.appendChild(makeBtn("part2", "Part 2"));
    tabs.appendChild(makeBtn("part3", "Part 3"));

    controls.appendChild(tabs);
    refreshTabUI();
  }

  function refreshTabUI() {
    const tabs = document.querySelectorAll(".partTab");
    tabs.forEach((btn) => {
      const txt = (btn.textContent || "").toLowerCase();
      const id = txt.includes("1") ? "part1" : txt.includes("2") ? "part2" : "part3";
      btn.classList.toggle("active", id === activePart);
    });
  }

  function switchPart(partId) {
    if (!PARTS.includes(partId)) return;
    if (partId === activePart) return;

    activePart = partId;
    refreshTabUI();

    renderPassageForActivePart();

answers = loadState().answers; // refresh shared answers from storage
renderQuestionsForActivePart(answers);
    

    // if already submitted, re-lock newly rendered inputs
    if (hasSubmittedReading) lockReadingUI();
  }

  function renderPassageForActivePart() {
    const passageEl = $("passage");
    if (!passageEl) return;

    if (activePart === "part1") {
      passageEl.innerHTML = PART1_PASSAGE_HTML;
      return;
    }

    const text = activePart === "part2" ? PART2_PASSAGE_TEXT : PART3_PASSAGE_TEXT;

    const html = text
      .trim()
      .split("\n\n")
      .map((para, i) => {
        const p = para.trim();
        if (!p) return "";
        if (i === 0) return `<h2>${escapeHtml(p)}</h2>`;
        return `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`;
      })
      .join("");

    passageEl.innerHTML = html;
  }

  function renderQuestionsForActivePart(answers) {
    const card = $("qCard");
    if (!card) return;
    card.innerHTML = "";

    if (activePart === "part1") card.appendChild(PART1.renderQuestions(answers));
    if (activePart === "part2") card.appendChild(PART2.renderQuestions(answers));
    if (activePart === "part3") card.appendChild(PART3.renderQuestions(answers));
  }

  // =====================================================
  // TIMER / SUBMIT
  // =====================================================
  function collectPayload(answers, reason) {
    return {
      type: "reading",
      testId: TEST_ID,
      submittedAt: new Date().toISOString(),
      reason,
      durationMinutes: DURATION_MINUTES,
      remainingSeconds,
      activePart,
      answers,
    };
  }

  async function submitReading(reason, answers) {
    if (hasSubmittedReading) return;

    hasSubmittedReading = true;

    // ✅ FIX #1: persist submitted flag (your nav gate depends on it)
    localStorage.setItem(storageKey("submitted"), "true");

    // save final reading payload + last remaining time
    localStorage.setItem(storageKey("remainingSeconds"), String(remainingSeconds));

    const payload = collectPayload(answers, reason);
    localStorage.setItem(storageKey("lastSubmission"), JSON.stringify(payload));

    // hard lock UI immediately
    lockReadingUI();

    if ($("autosaveStatus")) $("autosaveStatus").textContent = "Reading submitted.";

    // optional server submit
    if (SUBMIT_ENDPOINT) {
      try {
        await fetch(SUBMIT_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {}
    }
  }

  function transitionToWritingOnce() {
    if (hasTransitionedToWriting) return;
    hasTransitionedToWriting = true;
    startWritingSystem();
  }

  function startTimer() {
    if ($("timeLeft")) $("timeLeft").textContent = formatTime(remainingSeconds);

    // If already submitted from previous session, do NOT run timer.
    if (hasSubmittedReading) {
      if ($("autosaveStatus")) $("autosaveStatus").textContent = "Reading submitted (locked).";
      lockReadingUI();
      return;
    }

    timerInterval = setInterval(() => {
      remainingSeconds = Math.max(0, remainingSeconds - 1);

      if ($("timeLeft")) $("timeLeft").textContent = formatTime(remainingSeconds);

      if (!hasSubmittedReading && remainingSeconds % 5 === 0) {
  saveAnswers(answers);
}

if (remainingSeconds === 0) {
  clearInterval(timerInterval);
  timerInterval = null;

  // reload latest answers before submitting
  answers = loadState().answers;

  if (!hasSubmittedReading) submitReading("Reading time ended. Auto-submitted.", answers);
  transitionToWritingOnce();
}
    }, 1000);
  }

  // =====================================================
  // BUTTONS
  // =====================================================
  function toggleFocus() {
    document.body.classList.toggle("focus");
    const isFocus = document.body.classList.contains("focus");
    if ($("focusBtn")) $("focusBtn").textContent = isFocus ? "Exit focus" : "Focus mode";
  }

  function downloadReading(answers) {
    const payload = collectPayload(answers, "manual download");
    downloadJSON(payload, `${TEST_ID}-reading.json`);
  }

  async function copyReading(answers) {
    const payload = collectPayload(answers, "manual copy");
    const ok = await copyToClipboard(JSON.stringify(payload, null, 2));
    if ($("autosaveStatus"))
      $("autosaveStatus").textContent = ok ? "Copied to clipboard." : "Copy failed (browser blocked).";
  }

  // =====================================================
  // INIT
  // =====================================================
  injectStyles();

  PART1_PASSAGE_HTML = $("passage")?.innerHTML || "";

  let answers = loadState().answers;

  buildPartTabs();
  renderPassageForActivePart();
  renderQuestionsForActivePart(answers);

  // If already submitted, lock immediately (including newly rendered questions)
  if (hasSubmittedReading) {
    lockReadingUI();
  }

  if ($("submitBtn")) {
    $("submitBtn").addEventListener("click", async () => {
      if (hasSubmittedReading) return;

      const ok = confirm("Submit Reading now and start Writing?");
      if (!ok) return;

      await submitReading("Student submitted reading early.", answers);

      // stop timer + go to writing immediately
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      transitionToWritingOnce();
    });
  }

  if ($("focusBtn")) $("focusBtn").addEventListener("click", toggleFocus);

  if ($("downloadBtn")) $("downloadBtn").addEventListener("click", () => downloadReading(answers));
  if ($("copyBtn")) $("copyBtn").addEventListener("click", () => copyReading(answers));

  window.addEventListener("beforeunload", (e) => {
    const finalDone = localStorage.getItem(EXAM.keys.finalSubmitted) === "true";
    if (!finalDone) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

startTimer();
}

/* =========================================================
   4) START READING ONLY AFTER LISTENING SUBMITTED
   - NAV wiring unchanged
   - FIXED: Writing nav gate now works because Reading sets :submitted
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const toHome = $("navToHomeBtn");
const toL = $("navToListeningBtn");
const toR = $("navToReadingBtn");
const toW = $("navToWritingBtn");
const resetBtn = $("resetExamBtn");

  // Backup end button binding (kept)
  const endBtnBackup = $("endExamBtn");
  if (endBtnBackup && !endBtnBackup.dataset.bound) {
    endBtnBackup.dataset.bound = "1";

    endBtnBackup.addEventListener("click", async () => {
      const ok = confirm("Are you sure you want to end the exam and submit?");
      if (!ok) return;

      if (typeof window.__IELTS_SUBMIT_FINAL__ !== "function") {
        startWritingSystem();
      }

      if (typeof window.__IELTS_SUBMIT_FINAL__ === "function") {
        await window.__IELTS_SUBMIT_FINAL__("Student ended the exam.");
      } else {
        showModal("Error", "Submit function is not ready. Please refresh and try again.");
      }
    });
  }

  if (toL)
    toL.onclick = () => {
      showOnly("listening");
      setExamNavStatus("Status: Viewing Listening");
    };

  if (toR)
    toR.onclick = () => {
      const listeningDone = localStorage.getItem("IELTS:LISTENING:submitted") === "true";

      if (!listeningDone) {
        showOnly("listening");
        showModal("Reading locked", "You must finish Listening before opening Reading.", { mode: "confirm" });
        return;
      }

      startReadingSystem();
      clearReadingLockStyles();

      showOnly("reading");
      setExamNavStatus("Status: Viewing Reading");
    };

  if (toW)
    toW.onclick = () => {
      const writingStarted = localStorage.getItem("IELTS:WRITING:started") === "true";
      const readingSubmitted = localStorage.getItem("ielts-reading-3parts-001:submitted") === "true";

      if (!writingStarted && !readingSubmitted) {
        showModal("Writing locked", "You must submit Reading before opening Writing.", { mode: "confirm" });
        showOnly("reading");
        setExamNavStatus("Status: Viewing Reading");
        return;
      }

      if (!writingStarted) startWritingSystem();
      else showOnly("writing");

      setExamNavStatus("Status: Viewing Writing");
    };

  if (resetBtn)
    resetBtn.onclick = () => {
      const ok = confirm("Start a new attempt? This will clear saved answers on this browser.");
      if (!ok) return;
      resetExamAttempt();
    };

  const finalDone = localStorage.getItem(EXAM.keys.finalSubmitted) === "true";

  if (finalDone) {
    setExamNavStatus("Status: Submitted (Review mode)");

    const ls = $("listeningSection");
    if (ls) ls.classList.add("view-only");

    const rc = $("readingControls");
    const cont = $("container");
    if (rc) rc.classList.add("view-only");
    if (cont) cont.classList.add("view-only");

    const ws = $("writingSection");
    if (ws) ws.classList.add("view-only");

    showOnly("writing");

    showModal(
      "Submitted (Review mode)",
      "You can review Listening/Reading/Writing using the top buttons. Click 'New attempt' for a fresh exam."
    );
    return;
  }

  const listeningDone = localStorage.getItem("IELTS:LISTENING:submitted") === "true";

  if (listeningDone) {
    startReadingSystem();
    showOnly("reading");
    setExamNavStatus("Status: Reading in progress");
    return;
  }

// ---------- HOME first ----------
showOnly("home");
updateHomeStatusLine();

// Home buttons
const startBtn = $("startIelts1Btn");
const startBtn2 = $("cardStartIelts1Btn");
const contBtn = $("homeContinueBtn");
const resetHomeBtn = $("homeNewAttemptBtn");
const resetCardBtn = $("cardResetBtn");
const howBtn = $("homeHowItWorksBtn");

function startOrContinueExam() {
  setExamStarted(true);

// Init listening system only now
initListeningSystem();

  const finalDone = localStorage.getItem(EXAM.keys.finalSubmitted) === "true";
  const listeningDone = localStorage.getItem("IELTS:LISTENING:submitted") === "true";

  if (finalDone) {
    showOnly("writing");
    setExamNavStatus("Status: Submitted (Review mode)");
    return;
  }

  if (listeningDone) {
    startReadingSystem();
    showOnly("reading");
    setExamNavStatus("Status: Reading in progress");
    return;
  }

  showOnly("listening");
  setExamNavStatus("Status: Listening in progress");
}

if (startBtn) startBtn.onclick = startOrContinueExam;
if (startBtn2) startBtn2.onclick = startOrContinueExam;
if (contBtn) contBtn.onclick = startOrContinueExam;

if (howBtn) {
  howBtn.onclick = () => {
    const el = $("homeHowItWorks");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
}

function clearAttemptFromHome() {
  const ok = confirm("Start a new attempt? This will clear saved answers on this browser.");
  if (!ok) return;
  setExamStarted(false);
  resetExamAttempt(); // your existing function (already clears + reload)
}

if (resetHomeBtn) resetHomeBtn.onclick = clearAttemptFromHome;
if (resetCardBtn) resetCardBtn.onclick = clearAttemptFromHome;
});
