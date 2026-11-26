// Deterministic IELTS HTML -> neutral exam structure. No AI, no network, no script execution.
// Works in the browser (DOMParser) and in Node tests (inject `parseHtml`, e.g. from jsdom).

const IN = "\u27E6IN\u27E7";
const CK = "\u27E6CK\u27E7";
// Source files sometimes use Cyrillic capitals that look like Latin option letters.
const CYRILLIC_LOOKALIKES = { "\u0410": "A", "\u0412": "B", "\u0421": "C", "\u0415": "E", "\u041D": "H", "\u041A": "K", "\u041C": "M", "\u041E": "O", "\u0420": "P", "\u0422": "T", "\u0425": "X" };
const BLOCK_TAGS = new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "PRE", "BLOCKQUOTE", "FIGURE"]);
const CONTAINER_TAGS = new Set(["DIV", "SECTION", "ARTICLE", "MAIN", "BODY", "UL", "OL", "FIGURE"]);
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "NOSCRIPT", "BUTTON", "SELECT", "TEXTAREA", "AUDIO", "SVG"]);
const INLINE_KEEP = { STRONG: "strong", B: "strong", EM: "em", I: "em", U: "u", SUB: "sub", SUP: "sup" };
const NUM_WORDS = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 };
const INSTR_RE = /^(questions?\b|part\s*\d|section\s*\d|choose|write|complete|label|do the following|which|in boxes|nb\b|reading passage|listen|look at|answer|match|use the|(yes|no|true|false|not given)\b.*\bif\b)/i;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const textOf = (html) =>
  String(html)
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
const plain = (html) => textOf(String(html).replace(new RegExp(`${IN}|${CK}|\u27E6IMG:\\d+\u27E7`, "g"), " "));

function defaultParseHtml(html) {
  if (typeof DOMParser === "undefined") throw new Error("No DOMParser available; pass opts.parseHtml.");
  return new DOMParser().parseFromString(html, "text/html");
}

// ---------- inline -> lines ----------
function inlineToLines(nodes) {
  const lines = [];
  const open = [];
  const openers = () => open.map((t) => `<${t}>`).join("");
  let cur = { html: openers(), imgs: [], textLen: 0, boldLen: 0 };
  const flush = () => {
    const closers = [...open].reverse().map((t) => `</${t}>`).join("");
    const html = (cur.html + closers).replace(/(<(strong|em|u|sub|sup)>)\s*(<\/\2>)/g, "").replace(/\s+/g, " ").trim();
    if (html && (textOf(html) || /\u27E6/.test(html))) {
      lines.push({ html, imgs: cur.imgs, boldAll: cur.textLen > 0 && cur.boldLen / cur.textLen > 0.9 });
    }
    cur = { html: openers(), imgs: [], textLen: 0, boldLen: 0 };
  };
  const walk = (node, bold) => {
    if (node.nodeType === 3) {
      const text = String(node.nodeValue || "").replace(/[\u00a0\s]+/g, " ").replace(/(^|\s)([\u0410\u0412\u0421\u0415\u041D\u041A\u041C\u041E\u0420\u0422\u0425])(?=[\s.)\u2014\u2013-]|$)/g, (m, lead, ch) => lead + CYRILLIC_LOOKALIKES[ch]);
      if (!text.trim() && !cur.html) return;
      cur.html += esc(text);
      const n = text.replace(/\s/g, "").length;
      cur.textLen += n;
      if (bold) cur.boldLen += n;
      return;
    }
    if (node.nodeType !== 1) return;
    const tag = node.tagName.toUpperCase();
    if (SKIP_TAGS.has(tag)) return;
    if (tag === "BR") return flush();
    if (tag === "INPUT") {
      const type = String(node.getAttribute("type") || "text").toLowerCase();
      if (type === "checkbox" || type === "radio") cur.html += CK;
      else if (type !== "hidden") cur.html += IN;
      return;
    }
    if (tag === "IMG") {
      const src = String(node.getAttribute("data-src") || node.getAttribute("src") || "").trim();
      if (src) {
        cur.html += `\u27E6IMG:${cur.imgs.length}\u27E7`;
        cur.imgs.push({ src, alt: String(node.getAttribute("alt") || "") });
      }
      return;
    }
    const keep = INLINE_KEEP[tag];
    const isBold = bold || tag === "STRONG" || tag === "B";
    if (keep) {
      cur.html += `<${keep}>`;
      open.push(keep);
    }
    node.childNodes.forEach((child) => walk(child, isBold));
    if (keep) {
      open.pop();
      cur.html += `</${keep}>`;
    }
  };
  nodes.forEach((n) => walk(n, false));
  flush();
  return lines;
}

function tableBlock(el) {
  const rows = [];
  el.querySelectorAll("tr").forEach((tr) => {
    const cells = [];
    tr.querySelectorAll("th,td").forEach((cell) => {
      cells.push({ html: inlineToLines(Array.from(cell.childNodes)).map((l) => l.html).join("<br>"), header: cell.tagName === "TH" });
    });
    if (cells.length) rows.push(cells);
  });
  return { kind: "table", rows, lines: rows.flat().flatMap((c) => c.html.split("<br>").map((html) => ({ html, imgs: [], boldAll: false }))) };
}

function collectBlocks(root) {
  const blocks = [];
  let run = [];
  const flushRun = () => {
    if (!run.length) return;
    const lines = inlineToLines(run);
    if (lines.length) blocks.push({ kind: "text", lines });
    run = [];
  };
  const visit = (parent) => {
    parent.childNodes.forEach((node) => {
      if (node.nodeType !== 1) {
        run.push(node);
        return;
      }
      const tag = node.tagName.toUpperCase();
      if (SKIP_TAGS.has(tag)) return;
      if (tag === "TABLE") {
        flushRun();
        const t = tableBlock(node);
        if (t.rows.length) blocks.push(t);
        return;
      }
      if (tag !== "TABLE" && node.querySelector && node.querySelector("table")) {
        flushRun();
        visit(node);
        return;
      }
      const hasBlockChild = node.querySelector && node.querySelector("p,h1,h2,h3,h4,h5,h6,table,ul,ol,div,li");
      if (CONTAINER_TAGS.has(tag) && tag !== "FIGURE" && hasBlockChild) {
        flushRun();
        visit(node);
        return;
      }
      if (BLOCK_TAGS.has(tag) || CONTAINER_TAGS.has(tag)) {
        flushRun();
        const lines = inlineToLines(Array.from(node.childNodes));
        if (lines.length) {
          const heading = /^H[1-6]$/.test(tag) ? { kind: "heading", level: Number(tag[1]) } : { kind: "text" };
          blocks.push({ ...heading, lines });
        }
        return;
      }
      run.push(node);
    });
  };
  visit(root);
  flushRun();
  return blocks;
}

// ---------- answers ----------
export function parseAnswerLines(answersFragment, parseHtml) {
  const prepared = String(answersFragment)
    .replace(/addtoany_share_save_container[\s\S]*$/i, "")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr)>/gi, "\n");
  const doc = parseHtml(`<body>${prepared}</body>`);
  const text = String(doc.body?.textContent || "").replace(/\u00a0/g, " ");
  const answers = {};
  const issues = [];
  const listAnswers = () => {
    const found = {};
    let n = 0;
    doc.body.querySelectorAll("ol").forEach((ol) => {
      const start = Number(ol.getAttribute("start"));
      if (Number.isInteger(start) && start > 0) n = start - 1;
      ol.querySelectorAll(":scope > li").forEach((li) => {
        n += 1;
        const t = String(li.textContent || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
        if (t) found[n] = t;
      });
    });
    return found;
  };
  for (const rawLine of text.split(/\n+/)) {
    const line = rawLine.trim();
    if (!line) continue;
    let m = line.match(/^(\d{1,2})\s*[-\u2013]\s*(\d{1,2})\s*[.):]?\s+(.+)$/);
    if (m) {
      for (let q = Number(m[1]); q <= Number(m[2]); q += 1) answers[q] = m[3].trim();
      continue;
    }
    m = line.match(/^(\d{1,2})\s*[.):]\s*(.+)$/);
    if (!m) continue;
    const q = Number(m[1]);
    if (answers[q] !== undefined && answers[q] !== m[2].trim()) {
      issues.push({ severity: "warning", code: "answer_conflict", q, message: `Question ${q} has two different answers in the key.` });
      continue;
    }
    answers[q] = m[2].trim();
  }
  if (Object.keys(answers).length < 5) {
    const list = listAnswers();
    if (Object.keys(list).length >= 5) return { answers: list, issues };
  }
  return { answers, issues };
}

export function normalizeAnswer(raw, kind) {
  const text = String(raw || "").replace(/\s+/g, " ").replace(/[.;]+$/, "").trim();
  if (kind === "tfng" || kind === "yng") {
    const t = text.toLowerCase();
    const map = { true: "TRUE", false: "FALSE", yes: "YES", no: "NO", "not given": "NOT GIVEN", ng: "NOT GIVEN", t: "TRUE", f: "FALSE", y: "YES", n: "NO" };
    return { value: map[t] || text.toUpperCase(), alternatives: [map[t] || text.toUpperCase()] };
  }
  if (kind === "roman") {
    const v = text.toLowerCase().replace(/[^ivxlc]/g, "");
    return { value: v, alternatives: [v], letters: [v] };
  }
  if (kind === "letter") {
    const letters = text.toUpperCase().match(/\b[A-O]\b/g) || [];
    return { value: letters.join(", "), alternatives: letters, letters };
  }
  const alts = [];
  text.split("/").forEach((part) => {
    const p = part.trim();
    if (!p) return;
    alts.push(p.replace(/\s*\(([^)]*)\)\s*/g, " ").trim());
    if (/\(/.test(p)) alts.push(p.replace(/[()]/g, "").replace(/\s+/g, " ").trim());
  });
  const unique = [...new Set(alts.filter(Boolean))];
  return { value: unique.join(" / "), alternatives: unique };
}

// ---------- blanks ----------
const BLANK_RE = /(?:(?:\((\d{1,2})\)|\b(\d{1,2})\b)\s*)?(⟦IN⟧|[….]{3,}|_{3,})/g;

function extractBlanks(html, range) {
  const blanks = [];
  let out = "";
  let last = 0;
  let prefixNum = null;
  const lead = textOf(html).match(/^(\d{1,2})\s*[.)]?\s/);
  if (lead) prefixNum = Number(lead[1]);
  const matches = [...html.matchAll(BLANK_RE)];
  matches.forEach((m) => {
    const num = Number(m[1] || m[2] || 0) || 0;
    out += html.slice(last, m.index);
    last = m.index + m[0].length;
    let q = num;
    if (!q && prefixNum && !blanks.some((b) => b.q === prefixNum)) q = prefixNum;
    if (q && range && (q < range[0] || q > range[1]) && !(m[1] || m[2])) q = 0;
    if (q) {
      const existing = blanks.find((b) => b.q === q);
      if (existing) {
        existing.gaps += 1;
        out += `{{q:${q}.${existing.gaps}}}`;
      } else {
        blanks.push({ q, gaps: 1 });
        out += `{{q:${q}}}`;
      }
    } else if (blanks.length && m[3] !== IN) {
      const prev = blanks[blanks.length - 1];
      prev.gaps += 1;
      out += `{{q:${prev.q}.${prev.gaps}}}`;
    } else {
      out += m[0];
    }
  });
  out += html.slice(last);
  return { html: out, blanks };
}

// ---------- group handling ----------
const HEADER_RE = /^\s*(?:(?:part|section)\s*(\d)\s*[:.\-]?\s*)?questions?\s+(\d{1,2})(?:\s*(?:[-\u2013\u2014]|to|and|&)\s*(\d{1,2}))?/i;
const PART_RE = /^\s*(?:part|section)\s*(\d)\b/i;
const OPTION_RE = /^\s*(?:\u27E6CK\u27E7\s*)?([A-O])(?:\s*[.)]\s*|\s+)(\S.*)$/;
// "28. text", "28) text", "28 text" and also "28.text" with no space (reading test 313 dropped Q28-29 that way);
// a letter or quote must follow a bare "28." so decimals such as "1.5 million" are not read as question 1.
const NUMBERED_RE = /^\s*(?:\u27E6CK\u27E7\s*)?(\d{1,2})(?:\s*[.)]?\s+|\s*[.)](?=[A-Za-z"'\u2018\u201C(]))(\S.*)$/;

function letterRange(text) {
  const m = String(text).match(/\b([A-O])\s*[-\u2013\u2014]\s*([A-Ol])\b/);
  if (!m) return [];
  const from = m[1].charCodeAt(0);
  const to = (m[2] === "l" ? "I" : m[2]).charCodeAt(0);
  const out = [];
  for (let c = from; c <= to; c += 1) out.push(String.fromCharCode(c));
  return out;
}

const ROMAN = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii", "xiii", "xiv", "xv"];
function romanRun(lines) {
  const found = [];
  lines.forEach((line, idx) => {
    const m = textOf(line.html).match(/^([ivxIVX]{1,4})\s*[.)]?\s+(\S.*)$/);
    if (m && m[1].toLowerCase() === ROMAN[found.length]) found.push({ letter: m[1].toLowerCase(), html: stripRoman(line.html), idx });
  });
  return found.length >= 3 ? found : [];
}
const stripRoman = (html) => html.replace(/^(\s*<(strong|em|u)>)?\s*[ivx]{1,4}\s*[.)]?(<\/\2>)?\s+/i, "").trim();

function optionRuns(lines) {
  const runs = [];
  let run = null;
  lines.forEach((line, idx) => {
    const m = textOf(line.html.replace(new RegExp(CK, "g"), "")).match(OPTION_RE);
    const letter = m ? m[1] : null;
    const next = run ? String.fromCharCode(run.letters[run.letters.length - 1].charCodeAt(0) + 1) : "A";
    if (letter && letter === next) {
      if (!run) {
        run = { letters: [], idx: [] };
        runs.push(run);
      }
      run.letters.push(letter);
      run.idx.push(idx);
    } else if (letter === "A") {
      run = { letters: ["A"], idx: [idx] };
      runs.push(run);
    } else {
      run = null;
    }
  });
  return runs.filter((r) => r.letters.length >= 2);
}

function stripLead(html) {
  return html
    .replace(new RegExp(CK, "g"), "")
    .replace(/^(\s*<(strong|em|u)>)?\s*(\d{1,2}|[A-O])(?:\s*[.)]?(<\/\2>)?\s+|[.)](<\/\2>)?(?=[A-Za-z"'\u2018\u201C(]))/, "")
    .trim();
}

function detectType(instrText, ctx) {
  const t = instrText.toLowerCase();
  const rules = [
    [/true\b.*\bfalse\b.*not given/, "true_false_not_given", "tfng"],
    [/yes\b.*\bno\b.*not given/, "yes_no_not_given", "yng"],
    [/which (paragraph|section)|paragraph.*contains|information.*paragraph/, "matching_information", "letter"],
    [/list of headings|matching headings|choose the correct heading/, "matching_headings", "roman"],
    [/sentence endings|complete each (sentence|statement|of the following)[a-z ]* with the (correct|best|appropriate) ending|with the best ending/, "matching_sentence_endings", "letter"],
    [/label the (map|plan)/, ctx.skill === "listening" && /plan/.test(t) ? "plan_labelling" : "map_labelling", ctx.letterAnswers ? "letter" : "text"],
    [/label the diagram|label the (flow|figure|chart)/, "diagram_labelling", ctx.letterAnswers ? "letter" : "text"],
    [/flow-?\s?chart/, "flow_chart_completion", "text"],
  ];
  for (const [re, type, kind] of rules) if (re.test(t)) return { type, kind, confidence: "high" };
  if (/choose the correct letter|choose (a|b|c|d)\b|choose the best/.test(t)) return { type: "multiple_choice", kind: "letter", confidence: "high" };
  if ((ctx.hasItems || ctx.hasBody) && ctx.hasOptions && /look at the following|classify the following|match each|match the (statements|features|solutions|names)|choose (two|three|four|five|six|\d) answers from the box|from the box/.test(t)) {
    return { type: "matching_features", kind: "letter", confidence: "high" };
  }
  if (ctx.hasItems && ctx.hasOptions && /(choose|write the correct letter|from the list|match)/.test(t)) {
    return { type: "matching_features", kind: "letter", confidence: "high" };
  }
  if (/choose\s+(two|three|four|five|six|2|3|4|5|6)\s+(letters|answers)/.test(t) && ctx.hasOptions) {
    return { type: "multiple_answer", kind: "letter", confidence: "high" };
  }
  if (/using the list of words|from the list.*(complete|summary)|complete the summary.*list/.test(t) && ctx.hasOptions) {
    return { type: "summary_completion_wordbank", kind: "letter", confidence: "high" };
  }
  if (ctx.hasImage && /\blabel(s|led)?\b/.test(t)) return { type: "diagram_labelling", kind: "text", confidence: "high" };
  if (ctx.hasTable || /(complete|choose|fill in|use) the table|the table below/.test(t)) return { type: "table_completion", kind: "text", confidence: "high" };
  const completion = [
    [/summary/, "summary_completion"],
    [/\bnotes?\b/, "note_completion"],
    [/\bform\b/, "form_completion"],
    [/sentences?/, "sentence_completion"],
    [/short.?answer|answer the questions|answer the following questions/, "short_answer"],
  ];
  for (const [re, type] of completion) if (re.test(t)) return { type, kind: "text", confidence: "high" };
  if (ctx.hasBlanks) return { type: "note_completion", kind: "text", confidence: "review" };
  if (ctx.hasOptions) return { type: "multiple_choice", kind: "letter", confidence: "review" };
  return { type: "unknown", kind: "text", confidence: "review" };
}

function buildGroup(raw, skill, partLabels) {
  const [a, b] = raw.range;
  const issues = [];
  const lines = raw.blocks.flatMap((blk) => blk.lines.map((l) => ({ ...l, table: blk.kind === "table" })));
  const tableBlk = raw.blocks.find((blk) => blk.kind === "table");
  const imgs = [];
  lines.forEach((l) => l.imgs.forEach((img) => imgs.push(img)));

  const inRange = (q) => q >= a && q <= b;
  const runs = optionRuns(lines);
  const bestRun = runs.sort((x, y) => y.letters.length - x.letters.length)[0] || null;
  const optionIdx = new Set(runs.flatMap((r) => r.idx));
  const isNumbered = (l) => {
    const m = textOf(l.html.replace(new RegExp(`${CK}|\u27E6IMG:\\d+\u27E7`, "g"), "")).match(NUMBERED_RE);
    return m && inRange(Number(m[1])) ? Number(m[1]) : 0;
  };
  const hasBlank = (l) => BLANK_RE.test(l.html) && ((BLANK_RE.lastIndex = 0), true);
  BLANK_RE.lastIndex = 0;

  const instrText = lines
    .filter((l, i) => i < 3 || INSTR_RE.test(plain(l.html)))
    .slice(0, 8)
    .map((l) => plain(l.html))
    .join(" ");
  const firstItem = lines.findIndex((l, i) => i > 0 && (isNumbered(l) || hasBlank(l) || optionIdx.has(i) || l.imgs.length || l.table));
  const itemStart = firstItem === -1 ? lines.length : firstItem;
  let instrEnd = 0;
  lines.forEach((l, i) => {
    if (i < itemStart && INSTR_RE.test(plain(l.html))) instrEnd = i;
  });
  const instructionLines = lines.slice(0, instrEnd + 1);
  const preamble = lines.slice(instrEnd + 1, itemStart);
  const instructionsText = instructionLines.map((l) => plain(l.html)).join(" ");

  const numberedLines = lines.filter((l) => isNumbered(l));
  const ctx = {
    skill,
    hasItems: numberedLines.length > 0,
    hasOptions: !!bestRun,
    hasBlanks: lines.some((l) => hasBlank(l)),
    hasBody: lines.length > 4,
    hasImage: imgs.length > 0,
    hasTable: !!tableBlk && !(bestRun && bestRun.letters.length >= 4 && tableBlk.rows.flat().some((c) => /^<strong>A<\/strong>/.test(c.html))),
    letterAnswers: /write the correct letter|choose .*letters?|letter[s]? [a-j]/i.test(instructionsText) && !/words? (and|or)|one word|no more than/i.test(instructionsText),
  };
  const det = detectType(`${instructionsText} ${instrText}`.trim(), ctx);
  if (det.confidence === "review") issues.push({ severity: "warning", code: "type_uncertain", message: `Questions ${a}-${b}: question type was guessed (${det.type}). Check it.` });

  const wl = instructionsText.match(/no more than\s+(one|two|three|four|1|2|3|4)\s+words?(\s+and\/?or\s+a\s+number)?|(one|two|three)\s+words?\s+(only|and\/?or\s+a\s+number)?/i);
  const wordMap = { one: 1, two: 2, three: 3, four: 4, 1: 1, 2: 2, 3: 3, 4: 4 };
  const wordLimit = wl ? { words: wordMap[String(wl[1] || wl[3]).toLowerCase()] || null, orNumber: /number/i.test(wl[0]) } : null;

  const group = {
    range: [a, b],
    type: det.type,
    answerKind: det.kind,
    confidence: det.confidence,
    instructionsHtml: instructionLines.map((l) => l.html.replace(new RegExp(`${IN}|${CK}`, "g"), "")),
    title: null,
    wordLimit,
    options: [],
    items: [],
    bodyLines: [],
    table: null,
    media: [],
    multi: null,
    issues,
  };

  let usedTitleLine = null;
  const titleLine = preamble[0];
  if (titleLine && titleLine.boldAll && plain(titleLine.html).length < 100 && !/\{\{|\u27E6/.test(titleLine.html)) {
    group.title = titleLine.html;
    usedTitleLine = titleLine;
    preamble.shift();
  }

  const addItems = (qs) => qs.forEach((q) => !group.items.some((i) => i.q === q) && group.items.push({ q }));
  const letters = bestRun ? bestRun.letters : letterRange(instructionsText);
  const optLine = (i) => ({ letter: lines[i] ? textOf(lines[i].html.replace(new RegExp(CK, "g"), "")).match(OPTION_RE)[1] : "", html: stripLead(lines[i].html) });
  const options = bestRun ? bestRun.idx.map(optLine) : letters.map((letter) => ({ letter, html: "" }));
  const completionTypes = new Set(["summary_completion", "note_completion", "form_completion", "sentence_completion", "table_completion", "flow_chart_completion", "short_answer", "summary_completion_wordbank"]);

  if (det.type === "matching_headings") {
    group.options = romanRun(lines).map((r) => ({ letter: r.letter, html: r.html }));
    numberedLines.forEach((l) => group.items.push({ q: isNumbered(l), html: stripLead(l.html) }));
    const example = lines.find((l) => /^example\b/i.test(plain(l.html)));
    if (example) group.example = plain(example.html);
    if (!group.options.length) issues.push({ severity: "error", code: "headings_not_found", message: `Questions ${a}-${b}: the list of headings (i, ii, iii...) was not found.` });
    if (!group.items.length) issues.push({ severity: "error", code: "headings_items_not_found", message: `Questions ${a}-${b}: no paragraph lines were found for the headings questions.` });
  } else if (["true_false_not_given", "yes_no_not_given", "matching_information", "matching_headings", "matching_sentence_endings", "matching_features", "map_labelling", "plan_labelling", "diagram_labelling"].includes(det.type)) {
    numberedLines.forEach((l) => {
      const q = isNumbered(l);
      const { html } = extractBlanks(stripLead(l.html), group.range);
      group.items.push({ q, html: html.replace(/\s*\{\{q:\d+\}\}\s*$/, "").trim() });
    });
    if (det.type.startsWith("matching") || det.type.endsWith("labelling")) group.options = options;
    if (!group.items.length) {
      for (let q = a; q <= b; q += 1) group.items.push({ q, html: "", generated: true });
      issues.push({ severity: "warning", code: "items_inferred", message: `Questions ${a}-${b}: no question lines in the HTML; items were inferred from the range (labels are probably inside the image).` });
    }
  } else if (det.type === "multiple_choice") {
    let cur = null;
    const stems = [];
    lines.forEach((l, i) => {
      const q = isNumbered(l);
      if (q) {
        cur = { q, stemHtml: stripLead(l.html), options: [] };
        stems.push(cur);
        return;
      }
      if (optionIdx.has(i) && cur) cur.options.push(optLine(i));
      else if (optionIdx.has(i) && !cur) {
        cur = { q: a, stemHtml: preamble.map((p) => p.html).join(" "), options: [] };
        stems.push(cur);
        cur.options.push(optLine(i));
      }
    });
    group.items = stems.map((s) => ({ q: s.q, html: s.stemHtml, options: s.options }));
    if (!stems.length) issues.push({ severity: "warning", code: "mc_no_stems", message: `Questions ${a}-${b}: no multiple-choice questions found.` });
  } else if (det.type === "multiple_answer") {
    const word = (instructionsText.match(/choose\s+(two|three|four|five|six|2|3|4|5|6)\s+(letters|answers)/i) || [])[1];
    const count = NUM_WORDS[String(word).toLowerCase()] || b - a + 1;
    group.multi = { count };
    group.options = options;
    addItems(Array.from({ length: b - a + 1 }, (_, i) => a + i));
    if (count !== b - a + 1) issues.push({ severity: "warning", code: "multi_count_mismatch", message: `Questions ${a}-${b}: instruction says choose ${count} but the range covers ${b - a + 1}.` });
  } else if (completionTypes.has(det.type) || det.type === "unknown") {
    if (det.type === "summary_completion_wordbank") group.options = options;
    const bodySource = tableBlk && ctx.hasTable ? [] : [...preamble, ...lines.slice(itemStart).filter((_, i) => !optionIdx.has(i + itemStart))];
    bodySource.forEach((l) => {
      const { html, blanks } = extractBlanks(l.html.replace(new RegExp(CK, "g"), ""), group.range);
      group.bodyLines.push({ html: html.replace(/\u27E6IMG:\d+\u27E7/g, ""), blanks, bold: l.boldAll });
      blanks.forEach((bl) => !group.items.some((i) => i.q === bl.q) && group.items.push({ q: bl.q, gaps: bl.gaps }));
    });
    if (tableBlk && ctx.hasTable) {
      group.table = {
        rows: tableBlk.rows.map((row) =>
          row.map((cell) => {
            const { html, blanks } = extractBlanks(cell.html, group.range);
            blanks.forEach((bl) => !group.items.some((i) => i.q === bl.q) && group.items.push({ q: bl.q, gaps: bl.gaps }));
            return { html, header: cell.header };
          })
        ),
      };
    }
    group.items.forEach((it) => it.gaps > 1 && issues.push({ severity: "warning", code: "multi_gap", q: it.q, message: `Question ${it.q} has ${it.gaps} gaps but a single answer-key entry. Check how it should be marked.` }));
  }

  if (["table_completion", "diagram_labelling", "map_labelling", "plan_labelling"].includes(det.type)) {
    const kept = lines.filter((l, i) => i === 0 || (l !== usedTitleLine && !l.table && !l.imgs.length && !/\u27E6IN\u27E7|[\u2026.]{3,}|_{3,}|\(\d{1,2}\)/.test(l.html) && !isNumbered(l)));
    group.instructionsHtml = kept.map((l) => l.html.replace(new RegExp(`${IN}|${CK}`, "g"), ""));
  }

  group.items.sort((x, y) => x.q - y.q);
  group.media = imgs.map((img) => ({ kind: "image", original: img.src, alt: img.alt, groupRange: [a, b] }));
  group.options = group.options.length ? group.options : [];
  return group;
}

// ---------- main ----------
export function resolveMediaUrl(url, base) {
  const src = String(url || "").trim();
  if (!src) return { resolved: null, status: "missing" };
  const strip = (u) => u.replace(/([?&])_=\d+&?/, "$1").replace(/[?&]$/, "");
  if (/^https?:\/\//i.test(src)) return { resolved: strip(src), status: "unchecked" };
  if (!base) return { resolved: null, clean: strip(src), status: "needs_source_url" };
  try {
    return { resolved: strip(new URL(src, base).href), status: "unchecked" };
  } catch {
    return { resolved: null, clean: strip(src), status: "needs_source_url" };
  }
}

const BLANKISH = /\u27E6IN\u27E7|[\u2026.]{3,}|_{3,}|\(\d{1,2}\)/;
const proseLine = (l) => {
  const t = plain(l.html);
  return t.length >= 300 && !BLANKISH.test(l.html) && !/^\d{1,2}\s*[.)]?\s/.test(t);
};
// A short, plain text block that could be a passage title or lead-in rather than question content.
const passageLike = (blk) => {
  if (blk.kind !== "text") return false;
  const total = blk.lines.reduce((n, l) => n + plain(l.html).length, 0);
  if (!total || total > 700) return false;
  return blk.lines.every((l) => {
    const t = plain(l.html);
    return !BLANKISH.test(l.html) && !INSTR_RE.test(t) && !/^\d{1,2}\s*[.)]?\s/.test(t) && !/^([B-O][.)]?|A[.)])\s/.test(t) && !/^[ivx]{1,4}[.)]?\s/.test(t) && !l.imgs.length;
  });
};
const titleLike = (blk) => {
  if (blk.kind !== "text" || blk.lines.length !== 1) return false;
  const t = plain(blk.lines[0].html);
  return t.length > 0 && t.length <= 100 && !BLANKISH.test(blk.lines[0].html) && !INSTR_RE.test(t) && !/^\d{1,2}\s*[.)]?\s/.test(t) && !/^([B-O][.)]?|A[.)])\s/.test(t) && !/^[ivx]{1,4}\s/.test(t) && !/[.!?]$/.test(t);
};

function labelParagraphs(passage) {
  let expected = 0;
  const picks = [];
  passage.forEach((p) => {
    if (p.label) { expected = p.label.charCodeAt(0) - 64; return; }
    const m = p.html && p.html.match(/^([A-H])\s+(?=[A-Z0-9\u201C\u2018"'(])/);
    if (m && m[1].charCodeAt(0) - 65 === expected) {
      picks.push([p, m[1], m[0].length]);
      expected += 1;
    }
  });
  if (picks.length >= 3) picks.forEach(([p, letter, len]) => { p.label = letter; p.html = p.html.slice(len); });
}

// Bump when parsing output changes in a way that makes older saved exams worth re-importing.
export const CONVERTER_VERSION = 3;

export function parseExamHtml(html, opts = {}) {
  const parseHtml = opts.parseHtml || defaultParseHtml;
  const raw = String(html || "");
  const issues = [];

  const a2a = raw.match(/data-a2a-title="([^"]+)"/i);
  const docTitle = raw.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = (a2a?.[1] || docTitle?.[1] || String(opts.filename || "").replace(/\.html?$/i, "").replace(/[-_]+/g, " ")).replace(/\s+/g, " ").trim();

  let cut = raw.search(/<input[^>]*bg_collapse_expand/i);
  if (cut === -1) {
    const heading = [...raw.matchAll(/>\s*(answers?|answer key)\s*:?\s*</gi)].pop();
    cut = heading ? heading.index : -1;
  }
  const examHtml = cut === -1 ? raw : raw.slice(0, cut);
  const answersHtml = cut === -1 ? "" : raw.slice(cut);
  if (cut === -1) issues.push({ severity: "error", code: "no_answer_key", message: "No answer key section was found in the file." });

  const doc = parseHtml(`<body>${examHtml}</body>`);
  const root = doc.body;
  const audioEl = root.querySelector("audio");
  const audioSrc = audioEl ? audioEl.querySelector("source")?.getAttribute("src") || audioEl.getAttribute("src") || audioEl.querySelector("a")?.getAttribute("href") || "" : "";
  const skill = opts.skill || (audioEl ? "listening" : "reading");

  const blocks = collectBlocks(root).flatMap((blk) => {
    if (blk.kind !== "text" || blk.lines.length < 2) return [blk];
    const cuts = blk.lines.map((l, i) => (i > 0 && (HEADER_RE.test(plain(l.html)) || (skill === "listening" && PART_RE.test(plain(l.html)))) ? i : -1)).filter((i) => i > 0);
    if (!cuts.length) return [blk];
    const pieces = [];
    let from = 0;
    [...cuts, blk.lines.length].forEach((to) => { pieces.push({ ...blk, lines: blk.lines.slice(from, to) }); from = to; });
    return pieces;
  });
  const parts = [];
  let part = null;
  let group = null;
  const newPart = (extra = {}) => {
    part = { number: parts.length + 1, title: "", passage: [], groups: [], ...extra };
    parts.push(part);
    group = null;
  };
  blocks.forEach((blk) => {
    const first = plain(blk.lines[0].html);
    if (blk.kind === "heading" && first && skill === "listening") {
      if (group) group.blocks.push({ ...blk, kind: "text" });
      return;
    }
    if (blk.kind === "heading" && first) {
      if (!part || part.groups.length) {
        newPart({ title: first });
      } else {
        part.passage.push({ heading: first, level: blk.level });
      }
      return;
    }
    if (skill === "reading" && blk.lines.length === 1 && /^reading passage \d$/i.test(first)) {
      newPart({ title: first });
      return;
    }
    const partMatch = first.match(PART_RE);
    const header = first.match(HEADER_RE);
    if (partMatch && skill === "listening") newPart({ number: Number(partMatch[1]) });
    if (header) {
      if (!part) newPart();
      const from = Number(header[2]);
      const to = header[3] ? Number(header[3]) : from;
      group = { range: [from, Math.max(from, to)], blocks: [blk] };
      part.groups.push(group);
      return;
    }
    if (partMatch && skill === "listening") return;
    const addPassage = () =>
      blk.lines.forEach((l) => {
        const lab = l.html.match(/^<strong>([A-Z])<\/strong>\s*(.*)$/);
        part.passage.push({ label: lab ? lab[1] : null, html: lab ? lab[2] : l.html });
      });
    if (group && skill === "reading" && blk.kind === "text" && blk.lines.some(proseLine)) {
      const trailing = [];
      while (group.blocks.length > 1 && trailing.length < 4 && passageLike(group.blocks[group.blocks.length - 1])) trailing.unshift(group.blocks.pop());
      const boiler = (t) => /^cambridge ielts tests?\b/i.test(plain(t.lines[0].html));
      trailing.filter(boiler).forEach((t) => issues.push({ severity: "warning", code: "ignored_line", message: `Ignored a line between passages: "${plain(t.lines[0].html)}".` }));
      const kept = trailing.filter((t) => !boiler(t));
      const titleBlock = kept.length && titleLike(kept[0]) ? kept.shift() : null;
      newPart({ title: titleBlock ? plain(titleBlock.lines[0].html) : "" });
      kept.forEach((t) => t.lines.forEach((l) => part.passage.push({ label: null, html: l.html })));
      addPassage();
    } else if (group) group.blocks.push(blk);
    else if (part) addPassage();
    else if (skill === "reading") {
      newPart({});
      if (titleLike(blk)) part.title = first;
      else addPassage();
    }
  });

  parts.forEach((p) => labelParagraphs(p.passage));

  parts.forEach((p) => {
    p.groups = p.groups.filter((g, i) => {
      const next = p.groups[i + 1];
      const lineCount = g.blocks.reduce((n, b) => n + (b.kind === "text" ? b.lines.length : 99), 0);
      const hasMedia = g.blocks.some((b) => b.lines.some((l) => l.imgs.length));
      return !(next && lineCount <= 3 && !hasMedia && next.range[0] >= g.range[0] && next.range[1] <= g.range[1] && (g.range[0] !== next.range[0] || g.range[1] !== next.range[1]));
    });
  });

  const built = parts.map((p) => ({
    number: p.number,
    title: p.title,
    passage: p.passage,
    groups: p.groups.map((g) => buildGroup(g, skill, p.passage.filter((x) => x.label).map((x) => x.label))),
  }));

  const KIND_FOR = { matching_headings: "roman", true_false_not_given: "tfng", yes_no_not_given: "yng", matching_information: "letter", matching_features: "letter", matching_sentence_endings: "letter" };
  built.forEach((p, pi) =>
    p.groups.forEach((g, gi) => {
      const override = opts.typeOverrides?.[`${pi}-${gi}`];
      if (!override) return;
      g.type = override;
      g.answerKind = KIND_FOR[override] || "text";
      g.confidence = "manual";
      g.issues = g.issues.filter((i) => i.code !== "type_uncertain");
    })
  );

  const { answers: rawAnswers, issues: answerIssues } = parseAnswerLines(answersHtml, parseHtml);
  issues.push(...answerIssues);
  const answerKeys = {};
  const answerDetail = {};
  const covered = new Map();

  built.forEach((p) =>
    p.groups.forEach((g) => {
      issues.push(...g.issues);
      for (let q = g.range[0]; q <= g.range[1]; q += 1) covered.set(q, (covered.get(q) || 0) + 1);
      const optionLetters = new Set(g.options.map((o) => o.letter).concat(g.items.flatMap((i) => (i.options || []).map((o) => o.letter))));
      const setLetters = new Set();
      for (let q = g.range[0]; q <= g.range[1]; q += 1) {
        const rawAnswer = rawAnswers[q];
        if (rawAnswer === undefined || rawAnswer === "") {
          issues.push({ severity: "warning", code: "missing_answer", q, message: `Question ${q} has no answer in the key.` });
          continue;
        }
        const norm = normalizeAnswer(rawAnswer, g.answerKind);
        answerKeys[q] = norm.value;
        answerDetail[q] = { raw: rawAnswer, alternatives: norm.alternatives, letters: norm.letters || null };
        (norm.letters || []).forEach((l) => setLetters.add(l));
        if (g.answerKind === "tfng" && !["TRUE", "FALSE", "NOT GIVEN"].includes(norm.value)) {
          issues.push({ severity: "warning", code: "bad_answer_value", q, message: `Question ${q}: "${rawAnswer}" is not TRUE / FALSE / NOT GIVEN.` });
        }
        if (g.answerKind === "yng" && !["YES", "NO", "NOT GIVEN"].includes(norm.value)) {
          issues.push({ severity: "warning", code: "bad_answer_value", q, message: `Question ${q}: "${rawAnswer}" is not YES / NO / NOT GIVEN.` });
        }
        if (g.answerKind === "roman" && optionLetters.size && !(norm.letters || []).every((l) => optionLetters.has(l))) {
          issues.push({ severity: "warning", code: "answer_not_in_options", q, message: `Question ${q}: answer "${rawAnswer}" is not one of the listed headings.` });
        }
        if (g.answerKind === "letter" && optionLetters.size && !(norm.letters || []).every((l) => optionLetters.has(l))) {
          issues.push({ severity: "warning", code: "answer_not_in_options", q, message: `Question ${q}: answer "${rawAnswer}" is not one of the listed options.` });
        }
        const limit = g.wordLimit?.words;
        const gaps = g.items.find((i) => i.q === q)?.gaps || 1;
        if (g.answerKind === "text" && limit && gaps === 1 && norm.alternatives.every((alt) => alt.split(/\s+/).length > limit)) {
          issues.push({ severity: "warning", code: "word_limit", q, message: `Question ${q}: answer "${rawAnswer}" is longer than the ${limit}-word limit.` });
        }
      }
      if (g.multi) {
        g.multi.answerSet = [...setLetters].sort();
        if (g.multi.answerSet.length !== g.multi.count) {
          issues.push({ severity: "warning", code: "multi_answer_set", message: `Questions ${g.range[0]}-${g.range[1]}: expected ${g.multi.count} distinct answers but the key gives ${g.multi.answerSet.length}.` });
        }
      }
    })
  );

  const expected = Number(opts.expectedQuestions) || 40;
  for (let q = 1; q <= expected; q += 1) {
    if (!covered.has(q)) issues.push({ severity: "warning", code: "question_not_found", q, message: `Question ${q} was not found in the HTML.` });
    else if (covered.get(q) > 1) issues.push({ severity: "warning", code: "question_duplicated", q, message: `Question ${q} appears in more than one question group.` });
  }
  const expectedParts = skill === "listening" ? 4 : 3;
  if (built.length !== expectedParts) issues.push({ severity: "warning", code: "part_count", message: `Found ${built.length} ${skill === "listening" ? "parts" : "passages"}; expected ${expectedParts}.` });
  if (!built.some((p) => p.groups.length)) issues.push({ severity: "error", code: "no_questions", message: "No question groups were recognised." });
  if (skill === "reading") {
    built.forEach((p) => {
      if (!p.passage.some((x) => x.html && x.html.length > 200)) issues.push({ severity: "warning", code: "short_passage", message: `Passage ${p.number} has no long text.` });
    });
  }

  const originMatch = raw.match(/data-a2a-url="(https?:\/\/[^"\/]+)/i) || raw.match(/<link[^>]+rel=["']canonical["'][^>]+href=["'](https?:\/\/[^"'\/]+)/i);
  const inferredBase = originMatch ? originMatch[1] : "";
  const imageBase = opts.sourceBaseUrl || inferredBase;
  const media = [];
  if (skill === "listening") {
    if (!audioSrc) issues.push({ severity: "error", code: "missing_audio", message: "No audio reference was found. Upload the recording before publishing." });
    else {
      const r = resolveMediaUrl(audioSrc, opts.sourceBaseUrl);
      media.push({ kind: "audio", original: audioSrc, ...r });
      if (r.status !== "unchecked") issues.push({ severity: "warning", code: "media_needs_source", message: `Audio "${audioSrc}" is relative. Enter the source site URL or upload the MP3.` });
    }
  }
  built.forEach((p) =>
    p.groups.forEach((g) =>
      g.media.forEach((m) => {
        const r = resolveMediaUrl(m.original, imageBase);
        Object.assign(m, r, { inferredBase: !opts.sourceBaseUrl && !!inferredBase });
        media.push({ ...m });
        if (r.status !== "unchecked") issues.push({ severity: "warning", code: "media_needs_source", message: `Image "${m.original}" (questions ${g.range[0]}-${g.range[1]}) is relative. Enter the source site URL or upload the image.` });
      })
    )
  );

  return {
    ok: !issues.some((i) => i.severity === "error"),
    skill,
    module: opts.module === "general" ? "general" : "academic",
    title,
    inferredBase,
    converterVersion: CONVERTER_VERSION,
    audioSrc: audioSrc ? (() => { const r = resolveMediaUrl(audioSrc, opts.sourceBaseUrl); return r.resolved || r.clean || audioSrc; })() : "",
    parts: built,
    answerKeys,
    answerDetail,
    media,
    issues,
    stats: {
      parts: built.length,
      groups: built.reduce((n, p) => n + p.groups.length, 0),
      questionsCovered: covered.size,
      answersFound: Object.keys(answerKeys).length,
      types: built.flatMap((p) => p.groups.map((g) => g.type)),
    },
  };
}

// ---------- Writing ----------
const TASK_RE = /^\s*(?:<[^>]+>)*\s*(?:task|test|question)\s*([12])\b\s*(?:<\/[^>]+>)*\s*[:.\-–—]?\s*(?:<\/[^>]+>)*\s*/i;

export function parseWritingHtml(html, opts = {}) {
  const parseHtml = opts.parseHtml || defaultParseHtml;
  const raw = String(html || "");
  const issues = [];
  const cut = raw.search(/addtoany_share_save_container|<input[^>]*bg_collapse_expand/i);
  const doc = parseHtml(`<body>${cut === -1 ? raw : raw.slice(0, cut)}</body>`);
  const a2a = raw.match(/data-a2a-title="([^"]+)"/i);
  const title = (a2a?.[1] || String(opts.filename || "").replace(/\.html?$/i, "").replace(/[-_]+/g, " ")).replace(/\s+/g, " ").trim();
  const origin = (raw.match(/data-a2a-url="(https?:\/\/[^"\/]+)/i) || [])[1] || "";
  const base = opts.sourceBaseUrl || origin;

  const tasks = { 1: { lines: [], images: [] }, 2: { lines: [], images: [] } };
  let current = null;
  collectBlocks(doc.body).forEach((blk) => {
    blk.lines.forEach((line) => {
      const text = plain(line.html);
      if (!text && !line.imgs.length) return;
      if (/^cambridge ielts tests?\b/i.test(text)) return;
      const m = line.html.match(TASK_RE) && (text.match(/^task\s*([12])\b/i) || text.match(/^(?:test|question)\s*([12])\s*[:.]/i));
      if (m) {
        current = tasks[m[1]];
        const rest = line.html.replace(TASK_RE, "").trim();
        if (plain(rest)) current.lines.push(rest);
        line.imgs.forEach((img) => current.images.push(img));
        return;
      }
      if (!current) return;
      if (plain(line.html)) current.lines.push(line.html);
      line.imgs.forEach((img) => current.images.push(img));
    });
  });

  if (!tasks[1].lines.length || !tasks[2].lines.length) {
    const flat = [];
    collectBlocks(doc.body).forEach((blk) => blk.lines.forEach((line) => {
      const text = plain(line.html);
      if ((text || line.imgs.length) && !/^cambridge ielts tests?\b/i.test(text)) flat.push(line);
    }));
    const split = flat.findIndex((l) => /write at least\s+\d+\s+words/i.test(plain(l.html)));
    const second = split >= 0 ? flat.slice(split + 1) : [];
    let cut = 0;
    while (cut < second.length && !plain(second[cut].html) && second[cut].imgs.length) cut += 1;
    const t1Lines = flat.slice(0, split + 1 + cut);
    const t2Lines = second.slice(cut);
    if (split >= 0 && t2Lines.some((l) => /write at least\s+\d+\s+words/i.test(plain(l.html)))) {
      [1, 2].forEach((n) => { tasks[n] = { lines: [], images: [] }; });
      t1Lines.forEach((l) => { if (plain(l.html)) tasks[1].lines.push(l.html); l.imgs.forEach((i) => tasks[1].images.push(i)); });
      t2Lines.forEach((l) => { if (plain(l.html)) tasks[2].lines.push(l.html); l.imgs.forEach((i) => tasks[2].images.push(i)); });
      issues.push({ severity: "warning", code: "task_labels_guessed", message: "The Task 1 / Task 2 labels were not found, so the two tasks were split by position. Check both." });
    }
  }
  [1, 2].forEach((n) => {
    if (!tasks[n].lines.length) issues.push({ severity: "error", code: `task${n}_missing`, message: `Task ${n} was not found. The file should contain a line starting "Task ${n}:".` });
  });
  const t1Text = tasks[1].lines.map(plain).join(" ");
  if (tasks[1].lines.length && !tasks[1].images.length && /\b(graph|chart|table|diagram|map|plan|process|pie|bar)\b/i.test(t1Text)) {
    issues.push({ severity: "warning", code: "task1_image_missing", message: "Task 1 mentions a chart or diagram but the file has no image. Upload it under Audio and images." });
  }

  const media = tasks[1].images.map((img) => ({ kind: "image", original: img.src, alt: img.alt, ...resolveMediaUrl(img.src, base), inferredBase: !opts.sourceBaseUrl && !!origin }));
  media.filter((m) => m.status !== "unchecked").forEach((m) => issues.push({ severity: "warning", code: "media_needs_source", message: `Image "${m.original}" is relative. Enter the source site URL or upload the image.` }));
  if (tasks[2].images.length) issues.push({ severity: "warning", code: "task2_image_ignored", message: "Task 2 contains an image, which the writing page cannot show." });

  return {
    ok: !issues.some((i) => i.severity === "error"),
    skill: "writing",
    module: opts.module === "general" ? "general" : "academic",
    title,
    inferredBase: origin,
    converterVersion: CONVERTER_VERSION,
    task1: { lines: tasks[1].lines, minWords: Number((t1Text.match(/at least\s+(\d{2,3})\s+words/i) || [])[1]) || 150 },
    task2: { lines: tasks[2].lines, minWords: Number((tasks[2].lines.map(plain).join(" ").match(/at least\s+(\d{2,3})\s+words/i) || [])[1]) || 250 },
    media,
    issues,
    answerKeys: {},
    stats: { parts: 2, groups: 0, questionsCovered: 0, answersFound: 0, types: [] },
  };
}
