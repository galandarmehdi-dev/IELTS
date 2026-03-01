/* assets/js/engines/readingEngine.js */
(function () {
  "use strict";

  const UI = () => window.IELTS.UI;
  const S = () => window.IELTS.Storage;
  const R = () => window.IELTS.Registry;

  function startReadingSystem() {
    if (window.__IELTS_READING_INIT__) return;
    window.__IELTS_READING_INIT__ = true;

    const $ = UI().$;

    // SETTINGS
    const TEST_ID = R().TESTS.readingTestId;
    const DURATION_MINUTES = 60;

    // TIMER/STATE
    let remainingSeconds = DURATION_MINUTES * 60;
    let timerInterval = null;

    const storageKey = (suffix) => `${TEST_ID}:${suffix}`;

    let hasSubmittedReading = S().get(storageKey("submitted"), "false") === "true";
    let hasTransitionedToWriting = false;

    const PARTS = ["part1", "part2", "part3"];
    let activePart = "part1";

    let PART1_PASSAGE_HTML = "";

    // =========================
    // PART 1 / 2 / 3 (UNCHANGED)
    // =========================

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
      S().setJSON(storageKey("answers"), answers);
      S().set(storageKey("remainingSeconds"), String(remainingSeconds));
      if ($("autosaveStatus")) $("autosaveStatus").textContent = `Autosave: saved at ${new Date().toLocaleTimeString()}`;
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
      if ($("focusBtn")) $("focusBtn").disabled = true;
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

      activePart = partId;
      refreshTabUI();

      renderPassageForActivePart();

      const fresh = loadState().answers;
      renderQuestionsForActivePart(fresh);

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
    }

    function transitionToWritingOnce() {
      if (hasTransitionedToWriting) return;
      hasTransitionedToWriting = true;
      window.IELTS.Engines.Writing.startWritingSystem();
    }

    function startTimer(answersRef) {
      if ($("timeLeft")) $("timeLeft").textContent = UI().formatTime(remainingSeconds);

      if (hasSubmittedReading) {
        if ($("autosaveStatus")) $("autosaveStatus").textContent = "Reading submitted (locked).";
        lockReadingUI();
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

          answersRef.current = loadState().answers;

          if (!hasSubmittedReading) submitReading("Reading time ended. Auto-submitted.", answersRef.current);
          transitionToWritingOnce();
        }
      }, 1000);
    }

    function toggleFocus() {
      document.body.classList.toggle("focus");
      const isFocus = document.body.classList.contains("focus");
      if ($("focusBtn")) $("focusBtn").textContent = isFocus ? "Exit focus" : "Focus mode";
    }

    // INIT
    injectStyles();

    PART1_PASSAGE_HTML = $("passage")?.innerHTML || "";

    const answersRef = { current: loadState().answers };

    buildPartTabs();
    renderPassageForActivePart();
    renderQuestionsForActivePart(answersRef.current);

    if (hasSubmittedReading) lockReadingUI();

    if ($("submitBtn")) {
      $("submitBtn").addEventListener("click", async () => {
        if (hasSubmittedReading) return;

        const ok = confirm("Submit Reading now and start Writing?");
        if (!ok) return;

        await submitReading("Student submitted reading early.", answersRef.current);

        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }

        transitionToWritingOnce();
      });
    }

    if ($("focusBtn")) $("focusBtn").addEventListener("click", toggleFocus);

    window.addEventListener("beforeunload", (e) => {
      const finalDone = S().get(R().EXAM.keys.finalSubmitted, "false") === "true";
      if (!finalDone) {
        e.preventDefault();
        e.returnValue = "";
      }
    });

    startTimer(answersRef);
  }

  window.IELTS = window.IELTS || {};
  window.IELTS.Engines = window.IELTS.Engines || {};
  window.IELTS.Engines.Reading = { startReadingSystem };
})();
