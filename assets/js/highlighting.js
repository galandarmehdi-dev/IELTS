/* assets/js/highlighting.js */
(function () {
  "use strict";

  if (window.__IELTS_HIGHLIGHT_INIT__) return;
  window.__IELTS_HIGHLIGHT_INIT__ = true;

  const S = () => window.IELTS?.Storage;
  const Modal = () => window.IELTS?.Modal;
  const STORAGE_KEY = "IELTS:HIGHLIGHTS:v3";
  const ROOTS = [];

  let toolbar = null;
  let btnHL = null;
  let btnRemove = null;
  let btnClear = null;

  function readStore() {
    return S()?.getJSON?.(STORAGE_KEY, {}) || {};
  }

  function writeStore(obj) {
    try { S()?.setJSON?.(STORAGE_KEY, obj || {}); } catch (e) {}
  }

  function ensureToolbar() {
    if (toolbar) return;

    toolbar = document.createElement("div");
    toolbar.id = "hlToolbar";
    toolbar.className = "hl-toolbar";

    const createButton = (id, className, text) => {
      const button = document.createElement("button");
      button.type = "button";
      button.id = id;
      button.className = className;
      button.textContent = text;
      return button;
    };

    toolbar.appendChild(createButton("hlDo", "hl-toolbtn primary", "Highlight"));
    toolbar.appendChild(createButton("hlRm", "hl-toolbtn", "Remove"));
    toolbar.appendChild(createButton("hlClear", "hl-toolbtn danger", "Clear section"));
    document.body.appendChild(toolbar);

    btnHL = toolbar.querySelector("#hlDo");
    btnRemove = toolbar.querySelector("#hlRm");
    btnClear = toolbar.querySelector("#hlClear");

    btnHL.addEventListener("click", () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;

      const range = sel.getRangeAt(0);
      const rootInfo = findRootInfo(range.commonAncestorContainer);
      if (!rootInfo || range.collapsed || isInsideForbidden(range.commonAncestorContainer)) return;

      const marks = applyHighlightToRange(range, rootInfo.el);
      if (marks.length) saveHighlightsFromDOM(rootInfo);

      hideToolbar();
      try { sel.removeAllRanges(); } catch (e) {}
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
      try { sel?.removeAllRanges?.(); } catch (e) {}
    });

    btnClear.addEventListener("click", () => {
      const sel = window.getSelection();
      const node = sel && sel.rangeCount ? sel.getRangeAt(0).commonAncestorContainer : document.activeElement;
      const rootInfo = findRootInfo(node);
      if (!rootInfo) return;
      if (Modal()?.showModal) {
        Modal().showModal("Clear highlights?", "Clear ALL highlights in this section?", {
          mode: "confirm",
          showCancel: true,
          submitText: "Clear section",
          cancelText: "Cancel",
          onConfirm: () => {
            clearAllHighlightsInRoot(rootInfo.el);
            saveHighlightsFromDOM(rootInfo);
            hideToolbar();
            try { sel?.removeAllRanges?.(); } catch (e) {}
          }
        });
        return;
      }

      clearAllHighlightsInRoot(rootInfo.el);
      saveHighlightsFromDOM(rootInfo);
      hideToolbar();
      try { sel?.removeAllRanges?.(); } catch (e) {}
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
    if (!key || !el) return null;
    el.dataset.hlRootKey = key;
    const existing = ROOTS.find((r) => r.key === key);
    if (existing) {
      existing.el = el;
      return existing;
    }
    const info = { key, el };
    ROOTS.push(info);
    return info;
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

  function getRootInfoByKey(key) {
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
    textNode.splitText(end);
    const mid = textNode.splitText(start);

    const wrapMark = document.createElement("mark");
    wrapMark.className = "hl";
    wrapMark.appendChild(mid.cloneNode(true));
    mid.parentNode.replaceChild(wrapMark, mid);
    marks.push(wrapMark);
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
      } catch (e) {
        manualWrapTextRange(sub, textNode, marks);
      }
    });

    mergeAdjacentMarks(rootEl);
    return marks;
  }

  function getTextOffsetWithin(rootEl, targetNode, localOffset) {
    let total = 0;
    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, {
      acceptNode: (textNode) => {
        if (!textNode.nodeValue) return NodeFilter.FILTER_REJECT;
        if (isInsideForbidden(textNode)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let n;
    while ((n = walker.nextNode())) {
      if (n === targetNode) return total + Math.min(localOffset || 0, n.nodeValue.length);
      total += n.nodeValue.length;
    }
    return total;
  }

  function resolveTextOffsetWithin(rootEl, absoluteOffset) {
    const target = Math.max(0, Number(absoluteOffset) || 0);
    let total = 0;
    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, {
      acceptNode: (textNode) => {
        if (!textNode.nodeValue) return NodeFilter.FILTER_REJECT;
        if (isInsideForbidden(textNode)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let n;
    while ((n = walker.nextNode())) {
      const nextTotal = total + n.nodeValue.length;
      if (target <= nextTotal) {
        return { node: n, offset: Math.max(0, Math.min(target - total, n.nodeValue.length)) };
      }
      total = nextTotal;
    }
    return null;
  }

  function saveHighlightsFromDOM(rootInfo) {
    if (!rootInfo?.el) return;
    const rootEl = rootInfo.el;
    const records = [];

    rootEl.querySelectorAll("mark.hl").forEach((mark) => {
      const walker = document.createTreeWalker(mark, NodeFilter.SHOW_TEXT, null);
      const firstText = walker.nextNode();
      let lastText = firstText;
      let n;
      while ((n = walker.nextNode())) lastText = n;
      if (!firstText || !lastText) return;

      const startOffset = getTextOffsetWithin(rootEl, firstText, 0);
      const endOffset = getTextOffsetWithin(rootEl, lastText, lastText.nodeValue ? lastText.nodeValue.length : 0);
      if (endOffset > startOffset) records.push({ startOffset, endOffset });
    });

    const store = readStore();
    store[rootInfo.key] = records;
    writeStore(store);
  }

  function restoreHighlightsToRoot(rootInfo) {
    if (!rootInfo?.el) return;
    const rootEl = rootInfo.el;
    clearAllHighlightsInRoot(rootEl);

    const store = readStore();
    const records = Array.isArray(store[rootInfo.key]) ? store[rootInfo.key] : [];
    if (!records.length) return;

    records.forEach((rec) => {
      try {
        const start = resolveTextOffsetWithin(rootEl, rec.startOffset);
        const end = resolveTextOffsetWithin(rootEl, rec.endOffset);
        if (!start || !end) return;
        const range = document.createRange();
        range.setStart(start.node, start.offset);
        range.setEnd(end.node, end.offset);
        if (!range.collapsed) applyHighlightToRange(range, rootEl);
      } catch (e) {}
    });

    mergeAdjacentMarks(rootEl);
  }

  function saveRootByKey(key) {
    const info = getRootInfoByKey(key);
    if (info) saveHighlightsFromDOM(info);
  }

  function restoreRootByKey(key) {
    const info = getRootInfoByKey(key);
    if (info) restoreHighlightsToRoot(info);
  }

  function registerReadingRoots(partId, passageEl, questionsEl) {
    const part = String(partId || "part1");
    registerRoot(`readingPassage::${part}`, passageEl);
    registerRoot(`readingQuestions::${part}`, questionsEl);
  }

  function saveReadingPartHighlights(partId) {
    const part = String(partId || "part1");
    saveRootByKey(`readingPassage::${part}`);
    saveRootByKey(`readingQuestions::${part}`);
  }

  function restoreReadingPartHighlights(partId) {
    const part = String(partId || "part1");
    restoreRootByKey(`readingPassage::${part}`);
    restoreRootByKey(`readingQuestions::${part}`);
  }

  function clearReadingPartHighlights(partId) {
    const part = String(partId || "part1");
    const store = readStore();
    delete store[`readingPassage::${part}`];
    delete store[`readingQuestions::${part}`];
    writeStore(store);
    restoreReadingPartHighlights(part);
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
      showToolbarAt(Math.min(window.innerWidth - 260, rect.left), Math.max(10, rect.top - 52), "selection");
      return;
    }

    hideToolbar();
  }

  document.addEventListener("DOMContentLoaded", () => {
    ensureToolbar();

    registerRoot("listening", document.getElementById("listenBody") || document.getElementById("listeningSection"));
    registerRoot("writing", document.getElementById("writingSection"));

    restoreRootByKey("listening");
    restoreRootByKey("writing");

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
    registerReadingRoots,
    saveReadingPartHighlights,
    restoreReadingPartHighlights,
    clearReadingPartHighlights,
  };
})();
