/* assets/js/grammar.js — Grammar Hub page */
(function () {
  "use strict";

  const GRAMMAR_CATEGORIES = [
    { icon: "⏱️", title: "Tenses", tags: ["Writing", "Speaking"], copy: "Present simple, continuous, perfect, past forms, future structures. Learn which tense to use and when.", level: "Core" },
    { icon: "🔗", title: "Linking Words & Cohesion", tags: ["Writing"], copy: "Conjunctions, discourse markers, transitions. Essential for band 7+ coherence and cohesion scoring.", level: "Band 7+" },
    { icon: "🏗️", title: "Sentence Structure", tags: ["Writing", "Speaking"], copy: "Simple, compound, and complex sentences. Variety and accuracy in sentence forms raises your grammatical range score.", level: "Core" },
    { icon: "📐", title: "Complex Sentences", tags: ["Writing"], copy: "Relative clauses, adverbial clauses, noun clauses. Demonstrates the grammatical range IELTS examiners look for.", level: "Band 7+" },
    { icon: "🔄", title: "Conditionals", tags: ["Writing", "Speaking"], copy: "Zero, first, second, and third conditionals plus mixed conditionals for expressing hypothesis and speculation.", level: "Band 7+" },
    { icon: "🔵", title: "Passive Voice", tags: ["Writing"], copy: "When and how to use passive structures correctly. Common in academic and formal Task 1 and Task 2 writing.", level: "Core" },
    { icon: "📖", title: "Articles & Determiners", tags: ["Writing", "Speaking"], copy: "A, an, the, some, any, each, every — the rules and exceptions that catch many IELTS candidates out.", level: "Core" },
    { icon: "🗺️", title: "Prepositions", tags: ["Writing", "Speaking"], copy: "Prepositions of time, place, direction, and movement. Fixed expressions and collocations that affect accuracy score.", level: "Core" },
    { icon: "📊", title: "Describing Trends (Task 1)", tags: ["Writing Task 1"], copy: "Vocabulary and grammar for describing graphs, charts, tables, maps, and processes. Rise, fall, fluctuate, remain stable.", level: "Task 1" },
    { icon: "💡", title: "Opinion & Argument Language", tags: ["Writing Task 2"], copy: "How to express, develop, and support an argument. Avoid informal expressions that lower your score.", level: "Task 2" },
    { icon: "⚠️", title: "Common Mistakes", tags: ["Writing", "Speaking"], copy: "The most frequent errors in IELTS submissions: subject-verb agreement, article misuse, verb forms, and more.", level: "Must read" },
    { icon: "📝", title: "Punctuation & Spelling", tags: ["Writing"], copy: "Comma use, apostrophes, capital letters, and consistent British vs. American spelling — all affect your score.", level: "Core" },
  ];

  function render() {
    const grid = document.getElementById("grammarGrid");
    if (!grid) return;
    grid.innerHTML = GRAMMAR_CATEGORIES.map((cat) => {
      const tagsHtml = cat.tags.map((t) => `<span class="pp-tag blue">${t}</span>`).join("");
      const levelClass = cat.level === "Band 7+" ? "green" : cat.level === "Must read" ? "red" : cat.level.startsWith("Task") ? "amber" : "";
      return `
        <div class="pp-card">
          <div class="pp-card-icon">${cat.icon}</div>
          <div>
            <h3 class="pp-card-title">${cat.title}</h3>
            <span class="pp-tag ${levelClass}" style="margin-top:4px">${cat.level}</span>
          </div>
          <p class="pp-card-copy">${cat.copy}</p>
          <div class="pp-card-meta">${tagsHtml}</div>
          <button class="btn secondary" type="button" style="margin-top:4px;font-size:13px;opacity:.55;cursor:default" disabled title="Full lesson content coming soon">Coming soon</button>
        </div>`;
    }).join("");
  }

  function bindButtons() {
    const homeBtn = document.getElementById("grammarHomeBtn");
    if (homeBtn && !homeBtn.dataset.bound) {
      homeBtn.dataset.bound = "1";
      homeBtn.addEventListener("click", () => {
        try { window.IELTS?.UI?.showOnly?.("home"); } catch (e) {}
        try { window.IELTS?.Router?.setHashRoute?.(window.IELTS?.Registry?.getActiveTestId?.() || "ielts1", "home"); } catch (e) {}
      });
    }
  }

  function init() {
    render();
    bindButtons();
  }

  window.IELTS = window.IELTS || {};
  window.IELTS.Grammar = { init, render };
})();
