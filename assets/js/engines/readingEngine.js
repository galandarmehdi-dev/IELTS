/* assets/js/engines/readingEngine.js */
(function () {
  "use strict";

  const UI = () => window.IELTS.UI;
  const S = () => window.IELTS.Storage;
  const R = () => window.IELTS.Registry;
  const Modal = () => window.IELTS.Modal;

  function startReadingSystem() {
    if (window.__IELTS_READING_INIT__) return;
    window.__IELTS_READING_INIT__ = true;

    const $ = UI().$;

    // SETTINGS
    const ACTIVE_TEST_ID = R().getActiveTestId?.() || R().TESTS?.defaultTestId || "ielts1";
    const TEST_ID = (R().getTestConfig?.(ACTIVE_TEST_ID)?.readingTestId) || R().TESTS.readingTestId;
    const DURATION_MINUTES = 60;

    // TIMER/STATE
    let remainingSeconds = DURATION_MINUTES * 60;
    let timerInterval = null;

    const storageKey = (suffix) => `${TEST_ID}:${suffix}`;

    let hasSubmittedReading = S().get(storageKey("submitted"), "false") === "true";
    let hasTransitionedToWriting = false;

    const activeReadingContent = (R().getActiveTestContent?.() || {}).reading || {};
    const PARTS = ["part1", "part2", "part3"];
    let activePart = "part1";
    let resolvedReadingParts = null;

    // =========================
    // UI HELPERS
    // =========================

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
      const snapshot = { ...(answers || {}) };
      if (typeof answersRef !== "undefined" && answersRef) answersRef.current = snapshot;
      S().setJSON(storageKey("answers"), snapshot);
      S().set(storageKey("remainingSeconds"), String(remainingSeconds));
      if ($("autosaveStatus")) $("autosaveStatus").textContent = `Autosave: saved at ${new Date().toLocaleTimeString()}`;
    }

    function collectCurrentAnswersFromDOM(base = {}) {
      const out = { ...(base || {}) };

      document.querySelectorAll('#qCard input[type="text"], #qCard textarea').forEach((el) => {
        const qbox = el.closest('.sentenceRow, .mcqItem, .qrow, .optionsBox')?.querySelector('.qbox');
        const q = qbox?.textContent?.trim();
        if (!q) return;
        out[q] = (el.value || '').trim().replace(/\s+/g, ' ');
      });

      document.querySelectorAll('#qCard select').forEach((el) => {
        const qbox = el.closest('.qrow, .optionsBox')?.querySelector('.qbox');
        const qLabel = el.closest('.optionsBox, .panel')?.querySelector('b');
        const q = qbox?.textContent?.trim() || qLabel?.textContent?.replace('.', '').trim();
        if (!q) return;
        out[q] = el.value || '';
      });

      document.querySelectorAll('#qCard input[type="radio"]:checked').forEach((el) => {
        const name = String(el.name || '');
        const m = name.match(/^q_(\d+)$/);
        if (!m) return;
        out[m[1]] = el.value || '';
      });

      return out;
    }

    function loadState() {
      const answers = S().getJSON(storageKey("answers"), {}) || {};
      const savedRemaining = S().get(storageKey("remainingSeconds"), null);
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

    function lockReadingUI() {
      const rc = $("readingControls");
      const c = $("container");

      if (rc) rc.classList.add("view-only");
      if (c) c.classList.add("view-only");

      if (c) {
        c.querySelectorAll("input, select, textarea, button").forEach((el) => {
          el.disabled = true;
        });
      }

      if ($("submitBtn")) $("submitBtn").disabled = true;
    }

    // --- render blocks (same as your code) ---
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


    function renderMultiTextChoicesBlock(cfg, answers) {
      const panel = renderPanel(cfg.title, cfg.instructions);
      if (Array.isArray(cfg.choices) && cfg.choices.length) {
        const box = document.createElement("div");
        box.className = "optionsBox";
        const grid = document.createElement("div");
        grid.className = "optionsGrid";
        cfg.choices.forEach((ch) => {
          const div = document.createElement("div");
          div.className = "optCell";
          div.innerHTML = `<b>${escapeHtml(ch.letter)}</b> ${escapeHtml(ch.text)}`;
          grid.appendChild(div);
        });
        box.appendChild(grid);
        panel.appendChild(box);
      }
      const rows = document.createElement("div");
      rows.className = "qrows";
      (cfg.items || []).forEach((item) => {
        const row = document.createElement("div");
        row.className = "qrow";
        const qbox = document.createElement("div"); qbox.className = "qbox"; qbox.textContent = String(item.q);
        const label = document.createElement("div"); label.className = "qtext"; label.textContent = item.text || "";
        const input = document.createElement("input"); input.type = "text"; input.className = "gapInput"; input.value = answers?.[item.q] || "";
        input.addEventListener("input", () => { const latest = collectCurrentAnswersFromDOM(answersRef.current); answersRef.current = latest; saveAnswers(latest); });
        row.appendChild(qbox); row.appendChild(label); row.appendChild(input);
        rows.appendChild(row);
      });
      panel.appendChild(rows);
      return panel;
    }

    function renderBlocksFromStructuredContent(blocks, answers) {
      const wrap = document.createElement("div");
      (blocks || []).forEach((block) => {
        let node = null;
        if (block.type === "headings") node = renderHeadingsTask(block, answers);
        else if (block.type === "shortAnswer") node = renderShortAnswerBlock(block, answers);
        else if (block.type === "notes") node = renderNotesBlock(block, answers);
        else if (block.type === "sentenceGaps") node = renderSentenceGapsBlock(block, answers);
        else if (block.type === "tfng") node = renderTFNGBlock(block, answers);
        else if (block.type === "mcq") node = renderMCQBlock(block, answers);
        else if (block.type === "endingsMatch") node = renderEndingsMatchBlock(block, answers);
        else if (block.type === "summarySelect") node = renderSummarySelectBlock(block, answers);
        else if (block.type === "multiTextChoices") node = renderMultiTextChoicesBlock(block, answers);
        if (node) wrap.appendChild(node);
      });
      return wrap;
    }

    function resolveReadingParts() {
      if (resolvedReadingParts) return resolvedReadingParts;
      const helpers = {
        renderHeadingsTask,
        renderShortAnswerBlock,
        renderNotesBlock,
        renderSentenceGapsBlock,
        renderTFNGBlock,
        renderMCQBlock,
        renderEndingsMatchBlock,
        renderSummarySelectBlock,
      };
      if (typeof activeReadingContent.legacyFactory === "function") {
        const legacy = activeReadingContent.legacyFactory(helpers);
        if (legacy && Array.isArray(legacy.parts) && legacy.parts.length) {
          resolvedReadingParts = legacy.parts;
          return resolvedReadingParts;
        }
      }
      if (Array.isArray(activeReadingContent.parts) && activeReadingContent.parts.length) {
        resolvedReadingParts = activeReadingContent.parts.map((part, idx) => ({
          id: part.id || `part${idx + 1}`,
          title: part.title || `Part ${idx + 1}`,
          passageText: part.passageText || "",
          renderQuestions: (answers) => renderBlocksFromStructuredContent(part.blocks || [], answers),
        }));
        return resolvedReadingParts;
      }
      resolvedReadingParts = [];
      return resolvedReadingParts;
    }

    function getActivePartConfig() {
      const parts = resolveReadingParts();
      return parts.find((p) => p.id === activePart) || parts[0] || null;
    }

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

      if (!hasSubmittedReading) {
        const latest = collectCurrentAnswersFromDOM(answersRef.current);
        saveAnswers(latest);
      }

      activePart = partId;
      refreshTabUI();

      renderPassageForActivePart();

      const fresh = loadState().answers;
      answersRef.current = fresh;
      renderQuestionsForActivePart(fresh);

      if (hasSubmittedReading) {
      lockReadingUI();
      // If the page is refreshed after Reading was submitted, show the Writing gate.
      transitionToWritingOnce();
    }
    }

    function renderPassageForActivePart() {
  const passageEl = $("passage");
  if (!passageEl) return;

  const text =
    activePart === "part1"
      ? PART1_PASSAGE_TEXT
      : activePart === "part2"
      ? PART2_PASSAGE_TEXT
      : PART3_PASSAGE_TEXT;

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
      const partCfg = getActivePartConfig();
      if (!partCfg || typeof partCfg.renderQuestions !== "function") {
        card.innerHTML = `<div class="panel"><div class="task-title">Reading questions missing</div><div class="task-instructions">No question set was found for ${escapeHtml(activePart)} of ${escapeHtml(ACTIVE_TEST_ID)}.</div></div>`;
        return;
      }
      card.appendChild(partCfg.renderQuestions(answers));
    }

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
      S().set(storageKey("submitted"), "true");
      S().set(storageKey("remainingSeconds"), String(remainingSeconds));

      const payload = collectPayload(answers, reason);
      S().setJSON(storageKey("lastSubmission"), payload);

      lockReadingUI();

      if ($("autosaveStatus")) $("autosaveStatus").textContent = "Reading submitted.";

      // Whether submission was manual (button/admin) or automatic (timer),
      // always trigger the Reading → Writing transition at most once.
      transitionToWritingOnce();
    }

    function transitionToWritingOnce() {
  if (hasTransitionedToWriting) return;
  hasTransitionedToWriting = true;

  // Keep legacy event for any external orchestrator (safe no-op if unused)
  try { document.dispatchEvent(new CustomEvent("reading:submitted")); } catch (e) {}

  // If Writing already started or submitted, do not gate again.
  let writingStartedOrSubmitted = false;
  try {
    const WK = R()?.keysFor?.(ACTIVE_TEST_ID)?.writing;
    if (WK) {
      writingStartedOrSubmitted =
        S().get(WK.started, "false") === "true" ||
        S().get(WK.submitted, "false") === "true";
    }
  } catch (e) {}

  if (writingStartedOrSubmitted) return;

  // Show a non-closeable gate modal, then start Writing when user clicks.
  try {
    Modal().showModal(
      "Reading submitted",
      "Reading has ended. Click START WRITING to continue.",
      {
        mode: "gate",
        submitText: "Start Writing",
        onConfirm: () => {
          try { window.IELTS?.Engines?.Writing?.startWritingSystem?.(); } catch (e) {}
          try { UI().showOnly("writing"); } catch (e) {}
          try { UI().setExamNavStatus("Status: Writing in progress"); } catch (e) {}

          // Prefer hash route (if router exists), but keep a safe fallback above
          try { window.IELTS?.Router?.setHashRoute?.(ACTIVE_TEST_ID, "writing"); } catch (e) {}
        },
      }
    );
  } catch (e) {}
}

    function startTimer(answersRef) {
      if ($("timeLeft")) $("timeLeft").textContent = UI().formatTime(remainingSeconds);

      if (hasSubmittedReading) {
        if ($("autosaveStatus")) $("autosaveStatus").textContent = "Reading submitted (locked).";
        lockReadingUI();
        // Ensure user can proceed to Writing even after a refresh.
        transitionToWritingOnce();
        return;
      }

      timerInterval = setInterval(() => {
        remainingSeconds = Math.max(0, remainingSeconds - 1);

        if ($("timeLeft")) $("timeLeft").textContent = UI().formatTime(remainingSeconds);

        if (!hasSubmittedReading && remainingSeconds % 5 === 0) {
          saveAnswers(answersRef.current);
        }

        if (remainingSeconds === 0) {
          clearInterval(timerInterval);
          timerInterval = null;

          answersRef.current = collectCurrentAnswersFromDOM(loadState().answers);
          saveAnswers(answersRef.current);

          if (!hasSubmittedReading) submitReading("Reading time ended. Auto-submitted.", answersRef.current);
          transitionToWritingOnce();
        }
      }, 1000);
    }

    // INIT
    injectStyles();
    const answersRef = { current: loadState().answers };

    buildPartTabs();
    renderPassageForActivePart();
    renderQuestionsForActivePart(answersRef.current);

    if (hasSubmittedReading) {
      lockReadingUI();
      // If the page is refreshed after Reading was submitted, show the Writing gate.
      transitionToWritingOnce();
    }

    if ($("submitBtn")) {
      $("submitBtn").addEventListener("click", async () => {
        // Admin-only: students should NOT see/use the submit button
        const isAdmin = (UI && typeof UI().isAdminView === "function" && UI().isAdminView() === true) || (window.IELTS?.Access?.isAdmin?.() === true) || false;
        if (!isAdmin) return;
        if (hasSubmittedReading) return;

        const ok = confirm("Submit Reading now? (Students will be asked to start Writing)");
        if (!ok) return;

        const latest = collectCurrentAnswersFromDOM(answersRef.current);
        answersRef.current = latest;
        await submitReading("Student submitted reading early.", latest);

        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }

        transitionToWritingOnce();
      });
    }


    startTimer(answersRef);
  }

  window.IELTS = window.IELTS || {};
  window.IELTS.Engines = window.IELTS.Engines || {};
  window.IELTS.Engines.Reading = { startReadingSystem };
})();
