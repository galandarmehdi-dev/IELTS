// Parsed exam (examParser.mjs) -> the content shapes the existing Reading and Listening players consume.
// Reading: { parts: [{ id, passageText, blocks }] }. Listening: { audioSrc, html }.

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const plain = (html) =>
  String(html ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
const HEAD_PREFIX = /^(?:(?:part|section)\s*\d\s*[:.\-]?\s*)?questions?\s+\d{1,2}(?:\s*(?:[-\u2013\u2014]|to|and|&)\s*\d{1,2})?\s*[:.\-]?\s*/i;
const TOKEN = /(\{\{q:\d+(?:\.\d+)?\}\})/;
const UNSUPPORTED = new Set(["matching_headings", "unknown"]);

const rangeTitle = (g) => (g.range[0] === g.range[1] ? `Question ${g.range[0]}` : `Questions ${g.range[0]}-${g.range[1]}`);

function instructionLines(g) {
  const strip = new RegExp(`^((?:<[^>]+>)*)${HEAD_PREFIX.source.slice(1)}`, "i");
  return g.instructionsHtml.map((html, i) => (i === 0 ? html.replace(strip, "$1") : html)).filter((html) => plain(html));
}

function finalUrl(original, parsed, mediaMap) {
  if (mediaMap?.[original]) return mediaMap[original];
  const m = parsed.media.find((x) => x.original === original);
  return m?.resolved || original;
}
// Keep in sync with img-src / media-src in the Worker's Content-Security-Policy (src/worker.mjs).
export const IMAGE_HOSTS = ["audio.ieltsmock.org", "static.wixstatic.com", "www.ieltsbuddy.com", "ieltscity.vn", "practicepteonline.com", "bgujwyknnszwborgbkxq.supabase.co", "lh3.googleusercontent.com"];
export const AUDIO_HOSTS = ["audio.ieltsmock.org", "bgujwyknnszwborgbkxq.supabase.co"];
function urlProblem(url, hosts) {
  if (/^\/media\//.test(url)) return "";
  let u;
  try { u = new URL(url); } catch { return "unresolved"; }
  if (u.protocol !== "https:") return "unresolved";
  return hosts.includes(u.hostname) ? "" : "blocked";
}
const isUsableUrl = (url, hosts = IMAGE_HOSTS) => !urlProblem(url, hosts);
function mediaIssue(kind, original, url, where, hosts) {
  const problem = urlProblem(url, hosts);
  if (!problem) return null;
  const label = kind === "audio" ? "recording" : `image "${original}"`;
  if (problem === "blocked") {
    return { severity: "error", code: "media_host_blocked", message: `${where}: the ${label} is on ${new URL(url).hostname}, which the site's security policy blocks. Upload the file instead.` };
  }
  return { severity: "error", code: kind === "audio" ? "audio_unresolved" : "media_unresolved", message: `${where}: the ${label} has no usable URL. Upload it or set the source site URL.` };
}

export function gapItems(bodyLines) {
  const items = [];
  let pending = "";
  bodyLines.forEach((line) => {
    let buf = pending;
    pending = "";
    let last = null;
    line.html.split(TOKEN).forEach((seg) => {
      const m = seg.match(/^\{\{q:(\d+)(\.\d+)?\}\}$/);
      if (!m) {
        buf += (buf && !/\s$/.test(buf) ? " " : "") + plain(seg);
        return;
      }
      if (m[2]) {
        buf += " \u2026 ";
        return;
      }
      last = { q: Number(m[1]), text: buf.trim() };
      items.push(last);
      buf = "";
    });
    if (last) last.tail = buf.trim();
    else pending = buf.trim() ? `${buf.trim()} ` : "";
  });
  return items;
}

function multiAnswerKeys(g, keys) {
  const set = g.multi?.answerSet || [];
  if (!set.length) return;
  for (let i = 0; i < g.range[1] - g.range[0] + 1; i += 1) keys[g.range[0] + i] = set[i] || "";
}

// ---------- Reading ----------
function readingBlock(g, parsed, mediaMap, issues) {
  const base = { title: rangeTitle(g), instructions: instructionLines(g).map(plain) };
  const items = g.items;
  switch (g.type) {
    case "true_false_not_given":
    case "yes_no_not_given":
      return { type: g.type === "yes_no_not_given" ? "ynng" : "tfng", ...base, items: items.map((i) => ({ q: i.q, text: plain(i.html) })) };
    case "multiple_choice":
      return { type: "mcq", ...base, items: items.map((i) => ({ q: i.q, text: plain(i.html), choices: Object.fromEntries((i.options || []).map((o) => [o.letter, plain(o.html)])) })) };
    case "multiple_answer":
      issues.push({ severity: "warning", code: "multi_answer_order", message: `Questions ${g.range[0]}-${g.range[1]}: the Reading player marks each box separately, so students must enter the letters in ascending order.` });
      return { type: "multiTextChoices", ...base, choices: g.options.map((o) => ({ letter: o.letter, text: plain(o.html) })), items: items.map((i) => ({ q: i.q, text: "Choose one" })) };
    case "matching_information":
      return { type: "endingsMatch", ...base, endings: Object.fromEntries(g.options.map((o) => [o.letter, plain(o.html) || `Paragraph ${o.letter}`])), items: items.map((i) => ({ q: i.q, text: plain(i.html) })) };
    case "matching_features":
    case "matching_sentence_endings":
      return { type: "endingsMatch", ...base, endings: Object.fromEntries(g.options.map((o) => [o.letter, plain(o.html)])), items: items.map((i) => ({ q: i.q, text: plain(i.html) })) };
    case "summary_completion_wordbank": {
      const lines = gapItems(g.bodyLines).map((i) => ({ blankQ: i.q, text: i.text, ...(i.tail ? { tail: i.tail } : {}) }));
      return { type: "summarySelect", ...base, summaryTitle: plain(g.title || ""), summaryLines: lines, optionsTitle: "Options", options: g.options.map((o) => ({ letter: o.letter, word: plain(o.html) })) };
    }
    case "matching_headings":
      return {
        type: "headings",
        ...base,
        instructions: g.example ? [...base.instructions, g.example] : base.instructions,
        listTitle: "List of Headings",
        headings: g.options.map((o) => ({ value: o.letter, label: plain(o.html) })),
        questions: items.map((i) => ({ q: i.q, paragraph: plain(i.html).replace(/^(passage|section)\b/i, "Paragraph") })),
      };
    case "short_answer":
      return { type: "shortAnswer", ...base, questions: gapItems(g.bodyLines).map((i) => ({ q: i.q, text: i.text })) };
    case "diagram_labelling":
    case "map_labelling":
    case "plan_labelling":
    case "note_completion":
    case "summary_completion":
    case "sentence_completion":
    case "flow_chart_completion":
    case "form_completion":
    case "table_completion": {
      const block = { type: "sentenceGaps", ...base };
      if (g.title) block.instructions = [...base.instructions, plain(g.title)];
      const gaps = g.table ? g.table.rows.map((row) => ({ html: row.filter((c) => !c.header).map((c) => c.html).join(" ") })).filter((r) => r.html.trim()) : g.bodyLines;
      block.items = g.bodyLines.length || g.table ? gapItems(gaps) : [];
      if (!block.items.length) block.items = items.map((i) => ({ q: i.q, text: plain(i.html || ""), tail: "" }));
      const img = g.media[0];
      if (img) {
        const src = finalUrl(img.original, parsed, mediaMap);
        block.imageSrc = src;
        block.imageAlt = img.alt || g.title ? plain(g.title || img.alt) : "Diagram";
        const issue = mediaIssue("image", img.original, src, `Questions ${g.range[0]}-${g.range[1]}`, IMAGE_HOSTS);
        if (issue) issues.push(issue);
      }
      return block;
    }
    default:
      issues.push({ severity: "error", code: "unsupported_type", message: `Questions ${g.range[0]}-${g.range[1]}: ${g.type} cannot be converted automatically. Edit this group manually.` });
      return { type: "shortAnswer", ...base, questions: items.map((i) => ({ q: i.q, text: plain(i.html || "") })) };
  }
}

function passageText(part, edit) {
  // The Reading player styles the first paragraph as the passage title, so there must always be one.
  if (edit && typeof edit.text === "string") return `${(edit.title || "").trim() || `Reading Passage ${part.number}`}\n\n${edit.text.trim()}`;
  const lines = [part.title || `Reading Passage ${part.number}`];
  part.passage.forEach((p) => {
    if (p.heading) lines.push(p.heading);
    else if (plain(p.html)) lines.push(p.label ? `${p.label} ${plain(p.html)}` : plain(p.html));
  });
  return lines.join("\n\n");
}

// ---------- Listening ----------
const qnum = (q) => `<span class="qnum">${q}</span>`;
const input = (q, cls = "l-input ") => `${qnum(q)} <input data-lq="${q}" class="${cls}">`;

function fillBlanks(html) {
  return html.split(TOKEN).map((seg) => {
    const m = seg.match(/^\{\{q:(\d+)(\.\d+)?\}\}$/);
    if (!m) return seg;
    return m[2] ? " \u2026 " : input(Number(m[1]));
  }).join("");
}

function selectFor(q, letters) {
  return `${qnum(q)} <select data-lq="${q}" class="l-select"><option value=""></option>${letters.map((l) => `<option value="${l}">${l}</option>`).join("")}</select>`;
}

function listeningCard(g, parsed, mediaMap, issues) {
  const inst = instructionLines(g).join("<br>");
  const head = `<div class="listen-card"><div class="listen-card-title">${rangeTitle(g)}</div>${inst ? `<div class="listen-inst">${inst}</div>` : ""}`;
  const title = g.title ? `<div class="listen-card-title">${esc(plain(g.title))}</div>` : "";
  const letters = g.options.map((o) => o.letter);
  const optionsBox = g.options.length && g.options.some((o) => plain(o.html))
    ? `<div class="people-box">${g.options.map((o) => `<div><b>${o.letter}</b> ${o.html}</div>`).join("")}</div>`
    : "";
  const images = g.media.map((m) => {
    const src = finalUrl(m.original, parsed, mediaMap);
    const issue = mediaIssue("image", m.original, src, `Questions ${g.range[0]}-${g.range[1]}`, IMAGE_HOSTS);
    if (issue) issues.push(issue);
    return `<div class="img-wrap"><img src="${esc(src)}" alt="${esc(m.alt || rangeTitle(g))}" style="max-width:100%;height:auto;display:block;border-radius:10px;"></div>`;
  }).join("");

  switch (g.type) {
    case "multiple_choice":
      return `${head}${g.items.map((i) => `<div class="mcq"><div class="mcq-q">${qnum(i.q)} ${i.html}</div>${(i.options || []).map((o) => `<label class="mcq-opt"><input type="radio" name="q${i.q}" value="${o.letter}" data-lq-radio="${i.q}"> ${o.letter}) ${o.html}</label>`).join("")}</div>`).join("")}</div>`;
    case "multiple_answer": {
      const start = g.range[0];
      const boxes = g.options.map((o) => `<label class="mcq-opt" for="lq${start}${o.letter}"><input id="lq${start}${o.letter}" name="lq${start}group" type="checkbox" data-lq-check="${start}" data-lq-count="${g.multi.count}" value="${o.letter}" autocomplete="off"> ${o.letter}) ${o.html}</label>`).join("");
      return `${head}${boxes}</div>`;
    }
    case "matching_features":
    case "matching_sentence_endings":
    case "matching_information":
    case "map_labelling":
    case "plan_labelling":
    case "diagram_labelling":
      if (g.answerKind !== "letter") return `${head}${title}${images}${g.items.map((i) => `<div class="note-row">${input(i.q)} ${i.html || ""}</div>`).join("")}</div>`;
      return `${head}${title}${images}${optionsBox}${g.items.map((i) => `<div class="note-row">${i.html || ""} ${selectFor(i.q, letters)}</div>`).join("")}</div>`;
    case "table_completion":
      if (g.table) {
        return `${head}${title}<div class="listen-table-wrap"><table class="listen-table">${g.table.rows.map((row) => `<tr>${row.map((c) => `<${c.header ? "th" : "td"}>${fillBlanks(c.html)}</${c.header ? "th" : "td"}>`).join("")}</tr>`).join("")}</table></div></div>`;
      }
    // falls through
    default: {
      if (UNSUPPORTED.has(g.type)) issues.push({ severity: "error", code: "unsupported_type", message: `Questions ${g.range[0]}-${g.range[1]}: ${g.type} cannot be converted automatically. Edit this group manually.` });
      const rows = g.bodyLines.map((l) => `<div class="note-row">${l.bold ? `<b>${fillBlanks(l.html)}</b>` : fillBlanks(l.html)}</div>`).join("");
      return `${head}${title}${images}${rows}</div>`;
    }
  }
}

function listeningHtml(parsed, mediaMap, issues) {
  return parsed.parts
    .map((p, idx) => {
      const first = p.groups[0]?.range[0];
      const last = p.groups[p.groups.length - 1]?.range[1];
      const heading = first ? `PART ${p.number} Questions ${first}-${last}` : `PART ${p.number}`;
      return `<div class="listen-page${idx ? " hidden" : ""}" id="listenSec${p.number}">\n<div class="listen-block">\n<div class="listen-h">${heading}</div>\n${p.groups.map((g) => listeningCard(g, parsed, mediaMap, issues)).join("\n")}\n</div>\n</div>`;
    })
    .join("\n");
}

// ---------- entry ----------
export function convertToEngineContent(parsed, opts = {}) {
  const issues = [];
  const answerKeys = { ...parsed.answerKeys };
  parsed.parts.forEach((p) => p.groups.forEach((g) => g.multi && multiAnswerKeys(g, answerKeys)));

  if (parsed.skill === "listening") {
    const audioMedia = parsed.media.find((m) => m.kind === "audio");
    const audio = opts.mediaMap?.[audioMedia?.original] || opts.mediaMap?.[parsed.audioSrc] || audioMedia?.resolved || parsed.audioSrc;
    const audioIssue = mediaIssue("audio", parsed.audioSrc, audio, "Listening", AUDIO_HOSTS);
    if (audioIssue) issues.push(audioIssue);
    return { content: { listening: { audioSrc: audio, html: listeningHtml(parsed, opts.mediaMap, issues) } }, answerKeys, issues };
  }

  const parts = parsed.parts.map((p) => ({
    id: `part${p.number}`,
    passageText: passageText(p, opts.passageEdits?.[p.number - 1]),
    blocks: p.groups.map((g) => readingBlock(g, parsed, opts.mediaMap, issues)),
  }));
  return { content: { reading: { parts } }, answerKeys, issues };
}

// ---------- Writing ----------
function task1TypeOf(text) {
  const t = text.toLowerCase();
  if (/pie chart/.test(t)) return "Pie chart";
  if (/bar (chart|graph)/.test(t)) return "Bar chart";
  if (/line graph|graph/.test(t) && !/bar/.test(t)) return /line/.test(t) ? "Line graph" : "Graph";
  if (/\btable\b/.test(t)) return "Table";
  if (/\bmap\b/.test(t)) return "Map";
  if (/process|stages|steps|cycle/.test(t)) return "Process";
  if (/diagram/.test(t)) return "Diagram";
  if (/\bletter\b/.test(t)) return "Letter";
  if (/chart/.test(t)) return "Chart";
  return "Report";
}

function task2TypeOf(text) {
  const t = text.toLowerCase();
  if (/discuss both|both (of )?(these |the )?(views|opinions|sides)/.test(t)) return "Discussion essay";
  if (/advantages and disadvantages|advantages outweigh|positive or (a )?negative|positive development|negative development/.test(t)) return "Advantages and disadvantages";
  if (/problems?.*(solution|solve)|causes?.*(solution|solve)|what (can|should) be done|what measures/.test(t)) return "Problem and solution";
  if (/agree or disagree|to what extent|do you agree/.test(t)) return "Opinion essay";
  return "Essay";
}

export const TASK1_TYPES = ["Bar chart", "Pie chart", "Line graph", "Graph", "Chart", "Table", "Map", "Process", "Diagram", "Letter", "Report"];
export const TASK2_TYPES = ["Opinion essay", "Discussion essay", "Advantages and disadvantages", "Problem and solution", "Essay"];

export function convertWritingToEngineContent(parsed, opts = {}) {
  const issues = [];
  const lead = (n, mins, lines) => {
    const body = lines.join("<br/>");
    return /^you should spend about/i.test(plain(lines[0] || "")) ? body : `You should spend about ${mins} minutes on this task.<br/>${body}`;
  };
  const t1 = lead(1, 20, parsed.task1.lines);
  const t2 = lead(2, 40, parsed.task2.lines);
  const writing = {
    task1Type: opts.types?.task1Type || task1TypeOf(parsed.task1.lines.map(plain).join(" ")),
    task2Type: opts.types?.task2Type || task2TypeOf(parsed.task2.lines.map(plain).join(" ")),
    task1Html: t1,
    task2Html: t2,
  };
  const img = parsed.media[0];
  if (img) {
    const src = opts.mediaMap?.[img.original] || img.resolved || img.original;
    const issue = mediaIssue("image", img.original, src, "Writing Task 1", IMAGE_HOSTS);
    if (issue) issues.push(issue);
    writing.task1ImageSrc = src;
  }
  return { content: { writing }, answerKeys: {}, issues };
}

// ---------- Full exam ----------
// parts: { listening, reading, writing } each { parsed, out } where `out` came from the matching convert function.
export function assembleFullExam(parts, { title = "" } = {}) {
  const issues = [];
  const content = {};
  const answerKeys = {};
  const labels = { listening: "Listening", reading: "Reading", writing: "Writing" };
  ["listening", "reading", "writing"].forEach((skill) => {
    const part = parts[skill];
    if (!part) {
      issues.push({ severity: "error", code: "part_missing", message: `${labels[skill]} file has not been added.` });
      return;
    }
    if (part.parsed.skill !== skill) {
      issues.push({ severity: "error", code: "part_wrong_skill", message: `The ${labels[skill]} slot holds a ${part.parsed.skill} file.` });
      return;
    }
    content[skill] = part.out.content[skill];
    if (skill !== "writing") answerKeys[skill] = part.answerKeys || part.out.answerKeys;
    [...part.parsed.issues, ...part.out.issues].forEach((i) => issues.push({ ...i, message: `${labels[skill]}: ${i.message}` }));
  });
  const cleanTitle = String(title || "").replace(/\s+/g, " ").trim();
  if (!cleanTitle) issues.push({ severity: "error", code: "title_missing", message: "Give the full exam a title." });
  const seen = new Set();
  const unique = issues.filter((i) => {
    const k = `${i.code}|${i.message}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return { content, answerKeys, issues: unique, title: cleanTitle };
}
