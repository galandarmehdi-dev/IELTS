/* assets/js/highlighting.js */
(function () {
  "use strict";

  if (window.__IELTS_HIGHLIGHT_INIT__) return;
  window.__IELTS_HIGHLIGHT_INIT__ = true;

  const S = () => window.IELTS?.Storage;

  const STORAGE_KEY = "IELTS:HIGHLIGHTS:v2";
  const ROOTS = [];

  let toolbar = null;
  let btnHL = null;
  let btnRemove = null;
  let btnClear = null;

  function readStore() {
    return S()?.getJSON?.(STORAGE_KEY, {}) || {};
  }

  function writeStore(obj) {
    try { S()?.setJSON?.(STORAGE_KEY, obj || {}); } catch {}
  }

  function getActiveReadingPart() {
    try {
      const active = document.querySelector(".partTab.active");
      const partId =
        active?.dataset?.part ||
        active?.getAttribute?.("data-part") ||
        active?.dataset?.partId ||
        active?.getAttribute?.("data-part-id");
      if (partId) return String(partId);
    } catch {}
    return "part1";
  }

  function getStoreKey(baseKey) {
    const key = String(baseKey || "");
    if (key === "readingPassage" || key === "readingQuestions") {
      return `${key}:${getActiveReadingPart()}`;
    }
    return key;
  }

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

      const marks = applyHighlightToRange(range, rootInfo.el);
      if (marks.length) saveHighlightsFromDOM(rootInfo);

      hideToolbar();
      try { sel.removeAllRanges(); } catch {}
    });

    btnRemove.addEventListener("click", () => {
      const sel = window.getSelection();
      const node = sel && sel.rangeCount ? sel.getRangeAt(0).commonAncestorContainer : document.activeElement;
      const rootInfo = findRootInfo(node);
      if (!rootInfo) return;

      const mark = findClosestMark(node);
      if (mark) {
        unwrapMark(mark);
        saveHighlightsFromDOM(rootInfo);
      }

      hideToolbar();
      try { sel?.removeAllRanges?.(); } catch {}
    });

    btnClear.addEventListener("click", () => {
      const sel = window.getSelection();
      const node = sel && sel.rangeCount ? sel.getRangeAt(0).commonAncestorContainer : document.activeElement;
      const rootInfo = findRootInfo(node);
      if (!rootInfo) return;

      if (!window.confirm("Clear ALL highlights in this section?")) return;

      clearAllHighlightsInRoot(rootInfo.el);
      saveHighlightsFromDOM(rootInfo);

      hideToolbar();
      try { sel?.removeAllRanges?.(); } catch {}
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
    if (toolbar) toolbar.style.display = "none";
  }

  function registerRoot(key, el) {
    if (!el) return;
    el.dataset.hlRootKey = key;
    const existing = ROOTS.find((r) => r.key === key);
    if (existing) {
      existing.el = el;
    } else {
      ROOTS.push({ key, el });
    }
  }

  function findRootInfo(node) {
    if (!node) return null;
    const el = node.nodeType === 1 ? node : node.parentElement;
    if (!el) return null;
    const rootEl = el.closest("[data-hl-root-key]");
    if (!rootEl) return null;
    const key = rootEl.dataset.hlRootKey;
    return ROOTS.find((r) => r.key === key) || null;
  }

  function isInsideForbidden(node) {
    const el = node?.nodeType === 1 ? node : node?.parentElement;
    if (!el) return false;
    return !!el.closest("input, select, textarea, button, audio, video");
  }

  function findClosestMark(node) {
    const el = node?.nodeType === 1 ? node : node?.parentElement;
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
    rootEl?.querySelectorAll?.("mark.hl").forEach(unwrapMark);
  }

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
    for (const idx of path || []) {
      if (!cur || !cur.childNodes || !cur.childNodes[idx]) return null;
      cur = cur.childNodes[idx];
    }
    return cur;
  }

  function rangeIntersectsNode(range, node) {
    const nodeRange = document.createRange();
    nodeRange.selectNodeContents(node);
    return (
      range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0 &&
      range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0
    );
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

  function applyHighlightToRange(range, rootEl) {
    const marks = [];
    if (!rootEl || !rootEl.contains(range.commonAncestorContainer)) return marks;

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

  function saveHighlightsFromDOM(rootInfo) {
    if (!rootInfo?.el) return;

    const rootEl = rootInfo.el;
    const store = readStore();
    const saveKey = getStoreKey(rootInfo.key);
    const records = [];

    rootEl.querySelectorAll("mark.hl").forEach((mark) => {
      const first = firstTextNode(mark);
      const last = lastTextNode(mark);
      if (!first || !last) return;

      records.push({
        startPath: getNodePath(rootEl, first),
        startOffset: 0,
        endPath: getNodePath(rootEl, last),
        endOffset: String(last.nodeValue || "").length,
      });
    });

    store[saveKey] = records;
    writeStore(store);
  }

  function restoreHighlightsToRoot(rootInfo) {
    if (!rootInfo?.el) return;

    const rootEl = rootInfo.el;
    const store = readStore();
    const saveKey = getStoreKey(rootInfo.key);
    const records = Array.isArray(store[saveKey]) ? store[saveKey] : [];

    clearAllHighlightsInRoot(rootEl);
    if (!records.length) return;

    records.forEach((rec) => {
      const startNode = resolveNodePath(rootEl, rec.startPath);
      const endNode = resolveNodePath(rootEl, rec.endPath);
      if (!startNode || !endNode) return;

      try {
        const range = document.createRange();
        range.setStart(startNode, Math.max(0, Math.min(Number(rec.startOffset) || 0, startNode.nodeValue?.length || 0)));
        range.setEnd(endNode, Math.max(0, Math.min(Number(rec.endOffset) || 0, endNode.nodeValue?.length || 0)));
        if (range.collapsed) return;
        applyHighlightToRange(range, rootEl);
      } catch {}
    });
  }

  function restoreReadingRootsSoon() {
    setTimeout(() => {
      const p = ROOTS.find((r) => r.key === "readingPassage");
      const q = ROOTS.find((r) => r.key === "readingQuestions");
      if (p) restoreHighlightsToRoot(p);
      if (q) restoreHighlightsToRoot(q);
    }, 0);
  }

  function persistCurrentReadingRoots() {
    const p = ROOTS.find((r) => r.key === "readingPassage");
    const q = ROOTS.find((r) => r.key === "readingQuestions");
    if (p) saveHighlightsFromDOM(p);
    if (q) saveHighlightsFromDOM(q);
  }

  function onSelectionChange() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      hideToolbar();
      return;
    }

    const range = sel.getRangeAt(0);
    const node = range.commonAncestorContainer;
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

  document.addEventListener("DOMContentLoaded", () => {
    ensureToolbar();

    registerRoot("listening", document.getElementById("listeningSection"));
    registerRoot("readingPassage", document.getElementById("passage"));
    registerRoot("readingQuestions", document.getElementById("qCard"));
    registerRoot("writing", document.getElementById("writingSection"));

    ROOTS.forEach(restoreHighlightsToRoot);

    document.addEventListener("mousedown", (e) => {
      const tab = e.target?.closest?.(".partTab");
      if (!tab) return;
      persistCurrentReadingRoots();
    }, true);

    document.addEventListener("click", (e) => {
      const tab = e.target?.closest?.(".partTab");
      if (!tab) return;
      restoreReadingRootsSoon();
    });

    document.addEventListener("mouseup", () => setTimeout(onSelectionChange, 0));
    document.addEventListener("keyup", () => setTimeout(onSelectionChange, 0));
    window.addEventListener("scroll", hideToolbar, true);

    document.addEventListener("mousedown", (e) => {
      if (toolbar && e.target && toolbar.contains(e.target)) return;
      if (e.target?.closest?.("mark.hl")) return;
      hideToolbar();
    }, true);
  });

  window.IELTS = window.IELTS || {};
  window.IELTS.Highlighting = {
    restoreReadingRootsSoon,
    persistCurrentReadingRoots,
  };
})();
