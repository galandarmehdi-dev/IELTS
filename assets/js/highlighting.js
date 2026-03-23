
/* assets/js/highlighting.js */
(function () {
  "use strict";

  if (window.__IELTS_HIGHLIGHT_INIT__) return;
  window.__IELTS_HIGHLIGHT_INIT__ = true;

  const S = () => window.IELTS?.Storage;

  const STORAGE_KEY = "IELTS:HIGHLIGHTS:v2";
  const ROOTS = []; // { key, el }

  let toolbar = null;
  let btnHL = null;
  let btnRemove = null;
  let btnClear = null;

  function readStore() {
    return S()?.getJSON(STORAGE_KEY, {}) || {};
  }

  function writeStore(obj) {
    S()?.setJSON(STORAGE_KEY, obj);
  }

  function getCurrentReadingPartId() {
    const active =
      document.querySelector(".partTab.active") ||
      document.querySelector('.partTab[aria-selected="true"]') ||
      document.querySelector('.partTab[aria-pressed="true"]');

    const txt = String(active?.textContent || "").toLowerCase();
    if (txt.includes("1")) return "part1";
    if (txt.includes("2")) return "part2";
    if (txt.includes("3")) return "part3";
    return "part1";
  }

  function effectiveKey(rawKey) {
    if (rawKey === "readingPassage" || rawKey === "readingQuestions") {
      return `${rawKey}::${getCurrentReadingPartId()}`;
    }
    return rawKey;
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

      const created = applyHighlightToRange(range, rootInfo.el);
      if (created.length) saveHighlightsFromDOM(rootInfo);

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
    if (!rootEl) return;
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

  function getNodeByPath(root, path) {
    let cur = root;
    for (const idx of path || []) {
      if (!cur || !cur.childNodes || !cur.childNodes[idx]) return null;
      cur = cur.childNodes[idx];
    }
    return cur;
  }

  function saveHighlightsFromDOM(rootInfo) {
    if (!rootInfo?.el) return;
    const store = readStore();
    const key = effectiveKey(rootInfo.key);

    store[key] = Array.from(rootInfo.el.querySelectorAll("mark.hl")).map((mark) => ({
      startPath: getNodePath(rootInfo.el, mark.firstChild || mark),
      endPath: getNodePath(rootInfo.el, mark.lastChild || mark),
      text: mark.textContent || ""
    }));

    writeStore(store);
  }

  function makeRangeForTextNode(node, startOffset, endOffset) {
    const range = document.createRange();
    range.setStart(node, Math.max(0, startOffset));
    range.setEnd(node, Math.max(startOffset, endOffset));
    return range;
  }

  function applyHighlightToRange(range, rootEl) {
    const created = [];
    if (!range || !rootEl || range.collapsed) return created;

    const walker = document.createTreeWalker(
      rootEl,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          if (parent.closest("mark.hl")) return NodeFilter.FILTER_REJECT;
          if (parent.closest("input, textarea, select, button, audio, video")) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    const intersecting = textNodes.filter((node) => {
      const nodeRange = document.createRange();
      nodeRange.selectNodeContents(node);
      return (
        range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0 &&
        range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0
      );
    });

    intersecting.forEach((node) => {
      const start = node === range.startContainer ? range.startOffset : 0;
      const end = node === range.endContainer ? range.endOffset : node.nodeValue.length;
      if (end <= start) return;

      const subRange = makeRangeForTextNode(node, start, end);
      const mark = document.createElement("mark");
      mark.className = "hl";
      try {
        subRange.surroundContents(mark);
        created.push(mark);
      } catch (e) {
        const frag = subRange.extractContents();
        mark.appendChild(frag);
        subRange.insertNode(mark);
        created.push(mark);
      }
    });

    return created;
  }

  function restoreHighlightsToRoot(rootInfo) {
    if (!rootInfo?.el) return;

    clearAllHighlightsInRoot(rootInfo.el);

    const store = readStore();
    const items = store[effectiveKey(rootInfo.key)] || [];
    if (!Array.isArray(items) || !items.length) return;

    items.forEach((item) => {
      try {
        const startNode = getNodeByPath(rootInfo.el, item.startPath);
        const endNode = getNodeByPath(rootInfo.el, item.endPath);

        if (
          startNode &&
          endNode &&
          startNode.nodeType === Node.TEXT_NODE &&
          endNode.nodeType === Node.TEXT_NODE &&
          startNode === endNode
        ) {
          const fullText = startNode.nodeValue || "";
          const target = String(item.text || "");
          const idx = target ? fullText.indexOf(target) : -1;
          if (idx >= 0) {
            applyHighlightToRange(makeRangeForTextNode(startNode, idx, idx + target.length), rootInfo.el);
            return;
          }
        }

        if (
          startNode &&
          endNode &&
          startNode.nodeType === Node.TEXT_NODE &&
          endNode.nodeType === Node.TEXT_NODE
        ) {
          const range = document.createRange();
          range.setStart(startNode, 0);
          range.setEnd(endNode, endNode.nodeValue.length);
          applyHighlightToRange(range, rootInfo.el);
        }
      } catch (e) {}
    });
  }

  function restoreReadingForCurrentPart() {
    const passage = ROOTS.find((r) => r.key === "readingPassage");
    const questions = ROOTS.find((r) => r.key === "readingQuestions");
    if (passage) restoreHighlightsToRoot(passage);
    if (questions) restoreHighlightsToRoot(questions);
  }

  function saveReadingForCurrentPart() {
    const passage = ROOTS.find((r) => r.key === "readingPassage");
    const questions = ROOTS.find((r) => r.key === "readingQuestions");
    if (passage) saveHighlightsFromDOM(passage);
    if (questions) saveHighlightsFromDOM(questions);
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

    const nonReadingRoots = ROOTS.filter((r) => r.key !== "readingPassage" && r.key !== "readingQuestions");
    nonReadingRoots.forEach(restoreHighlightsToRoot);
    restoreReadingForCurrentPart();

    document.addEventListener(
      "pointerdown",
      (e) => {
        const el = e.target;
        if (el && el.classList && el.classList.contains("partTab")) {
          saveReadingForCurrentPart();
        }
      },
      true
    );

    document.addEventListener("click", (e) => {
      const el = e.target;
      if (el && el.classList && el.classList.contains("partTab")) {
        setTimeout(() => {
          registerRoot("readingPassage", document.getElementById("passage"));
          registerRoot("readingQuestions", document.getElementById("qCard"));
          restoreReadingForCurrentPart();
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

  window.IELTS = window.IELTS || {};
  window.IELTS.Highlighting = {
    saveReadingForCurrentPart,
    restoreReadingForCurrentPart,
    getCurrentReadingPartId
  };
})();
