/* assets/js/highlighting.js */
(function () {
  "use strict";

  // One-time global init guard
  if (window.__IELTS_HIGHLIGHT_INIT__) return;
  window.__IELTS_HIGHLIGHT_INIT__ = true;

  const UI = () => window.IELTS.UI;
  const S = () => window.IELTS.Storage;

  const STORAGE_KEY = "IELTS:HIGHLIGHTS:v1";
  const ROOTS = []; // { key, el }

  let toolbar = null;
  let btnHL = null;
  let btnRemove = null;
  let btnClear = null;

  function readStore() {
    return S().getJSON(STORAGE_KEY, {}) || {};
  }
  function writeStore(obj) {
    S().setJSON(STORAGE_KEY, obj);
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
    return ROOTS.find((r) => r.key === key) || null;
  }

  function isInsideForbidden(node) {
    const el = node.nodeType === 1 ? node : node.parentElement;
    if (!el) return false;
    return !!el.closest("input, select, textarea, button, audio, video");
  }

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

  function rangeIntersectsNode(range, node) {
    const nodeRange = document.createRange();
    nodeRange.selectNodeContents(node);
    return (
      range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0 &&
      range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0
    );
  }

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
        r.setEnd(endNode, Math.min(rec.endOffset || endNode.nodeValue.length, endNode.nodeValue.length));
        if (!r.collapsed) applyHighlightToRange(r, rootEl);
      } catch {}
    });

    mergeAdjacentMarks(rootEl);
  }

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

  document.addEventListener("DOMContentLoaded", () => {
    ensureToolbar();

    // register highlight roots
    registerRoot("listening", document.getElementById("listeningSection"));
    registerRoot("readingPassage", document.getElementById("passage"));
    registerRoot("readingQuestions", document.getElementById("qCard"));
    registerRoot("writing", document.getElementById("writingSection"));

    ROOTS.forEach(restoreHighlightsToRoot);

    // restore after part switch
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
