// Content + key audit for one test. Self-contained (runs in Node with jsdom and in the browser).
// model: { id, reading: [{ id, blocks }], listeningHtml, keys: { reading: {q: key}, listening: {q: key} }, types: { reading: {q: type} } }
// parse(html) -> Document
function auditTest(model, parse) {
  const issues = [];
  const add = (sec, q, msg) => issues.push({ test: model.id, sec, q, msg });
  const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
  const alts = (key) => {
    // top-level "/" outside brackets
    const out = []; let depth = 0, cur = "";
    for (const ch of String(key ?? "")) { if (ch === "(") depth++; if (ch === ")") depth--; if (ch === "/" && depth === 0) { out.push(cur); cur = ""; } else cur += ch; }
    out.push(cur);
    return out.map((s) => s.trim()).filter(Boolean);
  };
  const minimal = (alt) => alt.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
  const letters = (key) => alts(key).map((a) => a.toUpperCase());
  const isLetterKey = (key) => alts(key).every((a) => /^[A-Za-z]$/.test(a) || /^[ivxlc]+$/i.test(a));
  const WORDNUM = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4 };
  const limitFrom = (text) => {
    const t = norm(text).toUpperCase();
    let m = t.match(/NO MORE THAN (ONE|TWO|THREE|FOUR) WORDS?/) || t.match(/\b(ONE|TWO|THREE|FOUR) WORDS? (?:ONLY|AND\/OR|OR)/) || t.match(/\b(ONE|TWO|THREE|FOUR) WORDS?\b/);
    if (!m && /A NUMBER ONLY|ONE NUMBER/.test(t)) return { words: 0, number: true };
    if (!m) return null;
    return { words: WORDNUM[m[1]], number: /NUMBER/.test(t) };
  };
  const NUMBER_WORDS = /^(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|and|half|quarter)$/i;
  const isNumberToken = (w) => NUMBER_WORDS.test(w) || /^[£$€]?[\d.,:/%]+(st|nd|rd|th|am|pm|kg|km|m|cm|ml|%)?$/i.test(w);
  const checkLimit = (sec, q, key, limit) => {
    if (!limit || !key) return;
    alts(key).forEach((a) => {
      const words = minimal(a).split(/\s+/).filter(Boolean);
      const wordCount = words.filter((w) => !(limit.number && isNumberToken(w))).length;
      const numCount = words.length - wordCount;
      if (wordCount > limit.words || (limit.words === 0 && numCount > 1)) add(sec, q, `key "${a}" breaks the word limit (${limit.words} word(s)${limit.number ? " and/or a number" : ""})`);
    });
  };

  // ---------------- Reading ----------------
  const rq = {};
  const seenR = (q, info) => { q = Number(q); if (rq[q]) add("reading", q, `question appears twice (${rq[q].type} and ${info.type})`); rq[q] = info; };
  (model.reading || []).forEach((part) => (part.blocks || []).forEach((b) => {
    const inst = [].concat(b.instructions || []).join(" ") + " " + (b.title || "");
    const limit = limitFrom(inst);
    const t = b.type;
    if (t === "headings") (b.questions || []).forEach((it) => seenR(it.q, { type: t, text: it.paragraph, options: (b.headings || []).map((h) => String(h.value).toLowerCase()), letterCase: "lower" }));
    else if (t === "shortAnswer") (b.questions || []).forEach((it) => seenR(it.q, { type: t, text: it.text, limit }));
    else if (t === "sentenceGaps" && Array.isArray(b.inlineSections) && !(b.items || []).length) b.inlineSections.forEach((sec) => (sec.lines || []).forEach((line) => {
      const segs = line.segments || [];
      const words = segs.filter((x) => typeof x === "string").join(" ");
      segs.filter((x) => x && typeof x === "object" && x.q).forEach((x) => seenR(x.q, { type: t, text: norm(words || sec.heading), limit }));
    }));
    else if (t === "sentenceGaps") (b.items || []).forEach((it) => seenR(it.q, { type: t, text: [it.text, it.text2, it.tail].map(norm).join(" ").trim(), limit, allowEmpty: !!it.inlineWithPrevious }));
    else if (t === "tfng" || t === "ynng") (b.items || []).forEach((it) => seenR(it.q, { type: "tfng", text: it.text, custom: b.customChoices, instText: [].concat(b.instructions || []).join(" ") }));
    else if (t === "mcq") (b.items || []).forEach((it) => seenR(it.q, { type: t, text: it.text, options: Object.keys(it.choices || {}).map((x) => x.toUpperCase()), optionText: it.choices }));
    else if (t === "multiTextChoices") (b.items || []).forEach((it, idx, arr) => seenR(it.q, { type: t, groupQs: /\b(TWO|THREE)\b/.test(inst) ? arr.map((x) => x.q) : null, text: it.text, options: (Array.isArray(b.choices) ? b.choices.map((c) => String(c.letter ?? c.value ?? c).toUpperCase()) : Object.keys(b.choices || {}).map((x) => x.toUpperCase())) }));
    else if (t === "endingsMatch") (b.items || []).forEach((it) => seenR(it.q, { type: t, text: it.text, options: (Array.isArray(b.endings) ? b.endings.map((c) => String(c.letter ?? c.value).toUpperCase()) : Object.keys(b.endings || {}).map((x) => x.toUpperCase())) }));
    else if (t === "summarySelect") (b.summaryLines || []).filter((l) => l.blankQ).forEach((l) => seenR(l.blankQ, { type: t, text: [l.text, l.before, l.after, l.tail].map(norm).join(" ").trim(), options: (b.options || []).map((o) => String(o.letter ?? o.value ?? o).toUpperCase()) }));
    else if (t === "notesHtml" || t === "html") {
      const doc = parse(b.html || "");
      doc.querySelectorAll("[data-q],[data-rq]").forEach((el) => seenR(el.getAttribute("data-q") || el.getAttribute("data-rq"), { type: t, text: norm(el.closest("li,tr,p,div")?.textContent), limit }));
    } else add("reading", 0, `unknown block type "${t}" in ${part.id}`);
  }));
  const rKeys = model.keys?.reading || {};
  for (let q = 1; q <= 40; q++) {
    const info = rq[q]; const key = rKeys[q];
    if (!info) { add("reading", q, "question is not on the page"); continue; }
    if (!key || !String(key).trim()) { add("reading", q, "no answer key"); continue; }
    if (!info.allowEmpty && !norm(info.text) && info.type !== "summarySelect") add("reading", q, `question text is empty (${info.type})`);
    if (info.options) {
      if (!info.options.length) add("reading", q, `no options shown (${info.type})`);
      const ks = info.letterCase === "lower" ? alts(key).map((a) => a.toLowerCase()) : letters(key);
      ks.forEach((k) => { if (!info.options.includes(k)) add("reading", q, `key "${k}" is not one of the options [${info.options.join(",")}]`); });
      const sameAsNeighbour = [q - 2, q - 1, q + 1, q + 2].some((n) => rKeys[n] && String(rKeys[n]).replace(/\s/g, "").toUpperCase() === String(key).replace(/\s/g, "").toUpperCase());
      if (ks.length > 1 && !sameAsNeighbour && !info.groupQs) add("reading", q, `single-answer question accepts several letters: "${key}"`);
      if (info.groupQs && q === Math.min(...info.groupQs)) {
        const gk = info.groupQs.map((n) => String(rKeys[n] || "").replace(/\s/g, "").toUpperCase());
        // groups of 4 = two separate pairs (e.g. two advantages + two disadvantages)
        if (new Set(gk).size !== 1) add("reading", q, `choose-several group Q${info.groupQs.join(",")} has separate keys ${gk.join(" | ")} (answers typed in a different order are marked wrong)`);
      }
      if (info.optionText) Object.entries(info.optionText).forEach(([l, txt]) => { if (!norm(txt)) add("reading", q, `option ${l} has no text`); });
    } else if (info.type === "tfng" || info.type === "ynng") {
      // Same rule as readingEngine.js resolveTFNGChoices: the instructions decide YES/NO vs TRUE/FALSE.
      const it = String(info.instText || "").toLowerCase();
      const writerMode = /\b(views?|claims?)\s+of\s+the\s+writer\b/.test(it) || /\bwhat\s+the\s+writer\s+thinks\b/.test(it) || /\byes\s+if\s+the\s+statement\s+agrees\b/.test(it);
      let allowed = info.custom && info.custom.length ? [].concat(info.custom).map((c) => String(c).trim().toUpperCase()) : (writerMode ? ["YES", "NO", "NOT GIVEN"] : ["TRUE", "FALSE", "NOT GIVEN"]);
      if (writerMode) allowed = allowed.map((c) => (c === "TRUE" ? "YES" : c === "FALSE" ? "NO" : c));
      info.type = allowed.includes("YES") ? "ynng" : "tfng";
      alts(key).forEach((k) => { if (!allowed.includes(k.toUpperCase())) add("reading", q, `key "${k}" is not one of ${allowed.join("/")}`); });
      const tType = model.types?.reading?.[q];
      if (tType && tType !== info.type) add("reading", q, `page shows ${info.type.toUpperCase()} but questionTypes says ${tType}`);
    } else {
      if (isLetterKey(key) && /^[A-H]$/.test(String(key).trim())) add("reading", q, `gap-fill question has a single-letter key "${key}"`);
      checkLimit("reading", q, key, info.limit);
    }
  }
  Object.keys(rKeys).forEach((q) => { if (!rq[Number(q)]) {} });

  // ---------------- Listening ----------------
  const lKeys = model.keys?.listening || {};
  const doc = parse(model.listeningHtml || "");
  const lq = {};
  const seenL = (q, info) => { q = Number(q); if (!q) return; if (lq[q] && !(lq[q].kind === info.kind && info.kind !== "input" && info.kind !== "select")) add("listening", q, `question has two controls (${lq[q].kind} and ${info.kind})`); if (!lq[q]) lq[q] = info; };
  const cardOf = (el) => el.closest(".listen-card") || el.closest("table") || el.parentElement;
  const instOf = (el) => norm(cardOf(el)?.querySelector(".listen-inst")?.textContent || "") + " " + norm(cardOf(el)?.querySelector(".listen-card-title")?.textContent || "");
  doc.querySelectorAll("input[data-lq],textarea[data-lq]").forEach((el) => {
    const row = el.closest(".note-row,tr,li,p,.mcq,.form-row,.l-row") || el.parentElement;
    const text = norm((row?.textContent || "").replace(/^\s*\d+\s*/, ""));
    seenL(el.getAttribute("data-lq"), { kind: "input", text, limit: limitFrom(instOf(el)), inst: instOf(el) });
  });
  doc.querySelectorAll("select[data-lq]").forEach((el) => {
    const row = el.closest(".note-row,tr,li,p,.mcq,.form-row,.l-row") || el.parentElement;
    const clone = row.cloneNode(true); clone.querySelectorAll("select,.qnum").forEach((n) => n.remove());
    const options = [...el.querySelectorAll("option")].map((o) => norm(o.getAttribute("value") ?? o.textContent).toUpperCase()).filter(Boolean);
    const card = cardOf(el); const cardText = norm(card?.textContent || "");
    const unlabeled = options.filter((l) => !new RegExp(`(^|[\\s(>])${l}[\\s).:–-]+\\S`).test(cardText.replace(/<[^>]+>/g, " ")) && !(card?.querySelector(".people-box,.options-box,table") && new RegExp(`\\b${l}\\b`).test(norm(card.querySelector(".people-box,.options-box,table")?.textContent || ""))));
    seenL(el.getAttribute("data-lq"), { kind: "select", text: norm(clone.textContent), options, unlabeled });
  });
  const radios = {};
  doc.querySelectorAll("input[data-lq-radio]").forEach((el) => { const q = el.getAttribute("data-lq-radio"); (radios[q] = radios[q] || []).push(el); });
  Object.entries(radios).forEach(([q, els]) => {
    const block = els[0].closest(".mcq") || els[0].closest(".listen-card");
    const stem = norm(block?.querySelector(".mcq-q")?.textContent || "").replace(/^\d+\s*/, "");
    const opts = els.map((e) => ({ v: String(e.value).toUpperCase(), t: norm(e.closest("label")?.textContent || "").replace(/^[A-Z][).]\s*/, "") }));
    seenL(q, { kind: "radio", text: stem, options: opts.map((o) => o.v), emptyOpts: opts.filter((o) => !o.t).map((o) => o.v) });
  });
  const checks = {};
  doc.querySelectorAll("input[data-lq-check]").forEach((el) => { const q = el.getAttribute("data-lq-check"); (checks[q] = checks[q] || []).push(el); });
  Object.entries(checks).forEach(([q, els]) => {
    const count = Number(els[0].getAttribute("data-lq-count")) || 2;
    const card = cardOf(els[0]);
    const stem = norm(card?.querySelector(".mcq-q")?.textContent || card?.querySelector(".listen-inst")?.textContent || "");
    const opts = els.map((e) => ({ v: String(e.value).toUpperCase(), t: norm(e.closest("label")?.textContent || "").replace(/^[A-Z][).]\s*/, "") }));
    const inst = norm(card?.querySelector(".listen-inst")?.textContent || "").toUpperCase();
    const instCount = /\bTHREE\b/.test(inst) ? 3 : /\bTWO\b/.test(inst) ? 2 : null;
    if (instCount && instCount !== count) add("listening", Number(q), `checkbox group picks ${count} but the instruction says ${instCount}`);
    for (let i = 0; i < count; i++) seenL(Number(q) + i, { kind: "check", text: stem, options: opts.map((o) => o.v), emptyOpts: opts.filter((o) => !o.t).map((o) => o.v), groupStart: Number(q), count });
  });
  for (let q = 1; q <= 40; q++) {
    const info = lq[q]; const key = lKeys[q];
    if (!info) { add("listening", q, "question is not on the page"); continue; }
    if (!key || !String(key).trim()) { add("listening", q, "no answer key"); continue; }
    if (info.kind === "select" || info.kind === "radio" || info.kind === "check") {
      letters(key).forEach((k) => { if (!info.options.includes(k)) add("listening", q, `key "${k}" is not one of the options [${info.options.join(",")}]`); });
      if (!info.text && info.kind !== "check") add("listening", q, `${info.kind} has no question text`);
      if (info.unlabeled?.length) add("listening", q, `dropdown letters ${info.unlabeled.join(",")} have no text on the page`);
      if (info.emptyOpts?.length) add("listening", q, `options ${info.emptyOpts.join(",")} have no text`);
      const sameL = [q - 2, q - 1, q + 1, q + 2].some((n) => lKeys[n] && String(lKeys[n]).replace(/\s/g, "").toUpperCase() === String(key).replace(/\s/g, "").toUpperCase());
      if (info.kind !== "check" && letters(key).length > 1 && !sameL) add("listening", q, `single-answer question accepts several letters: "${key}"`);
      if (info.kind === "check") {
        const groupKeys = []; for (let i = 0; i < info.count; i++) groupKeys.push(String(lKeys[info.groupStart + i] || "").replace(/\s/g, "").toUpperCase());
        if (new Set(groupKeys).size !== 1 && q === info.groupStart) add("listening", q, `choose-${info.count} group Q${info.groupStart}-${info.groupStart + info.count - 1} keys differ: ${groupKeys.join(" | ")} (expected one shared key like "A / C")`);
        else if (q === info.groupStart && letters(lKeys[q]).length < info.count) add("listening", q, `choose-${info.count} group key "${lKeys[q]}" has fewer than ${info.count} letters`);
      }
    } else {
      if (!info.text) add("listening", q, "gap has no surrounding text");
      if (/^[A-Z]$/i.test(String(key).trim()) && !/letter/i.test(info.inst || "")) add("listening", q, `typed-answer question has a single-letter key "${key}" but the instructions do not ask for a letter`);
      checkLimit("listening", q, key, info.limit);
    }
  }
  Object.keys(lKeys).forEach((q) => { if (Number(q) > 40) add("listening", Number(q), "key for a question number above 40"); });
  return issues;
}
if (typeof module !== "undefined") module.exports = { auditTest };
