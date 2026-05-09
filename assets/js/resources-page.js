/* assets/js/resources-page.js — Study Resources page */
(function () {
  "use strict";

  const RESOURCES = [
    { id: 1, icon: "📄", title: "IELTS Writing Task 2 — Essay Templates", category: "Writing", fileType: "PDF", description: "Three reusable essay templates for Opinion, Discussion, and Problem-Solution Task 2 questions. With annotated model paragraphs.", demo: true },
    { id: 2, icon: "📊", title: "IELTS Writing Task 1 — Graph Language Guide", category: "Writing", fileType: "PDF", description: "Complete vocabulary for describing trends, comparisons, and processes. Includes band-annotated sample sentences.", demo: true },
    { id: 3, icon: "📝", title: "IELTS Academic Word List — Top 300", category: "Vocabulary", fileType: "PDF", description: "The 300 most useful academic words for IELTS Reading and Writing, with definitions, collocations, and example sentences.", demo: true },
    { id: 4, icon: "🎧", title: "Listening Section Strategies", category: "Listening", fileType: "PDF", description: "Section-by-section strategy guide: how to predict answers, deal with distractors, and manage time in all 4 sections.", demo: true },
    { id: 5, icon: "📖", title: "Reading Passage Analysis Guide", category: "Reading", fileType: "PDF", description: "How to approach different question types: True/False/NG, Headings, Matching, Sentence Completion, and Short Answers.", demo: true },
    { id: 6, icon: "🗣️", title: "IELTS Speaking — Topic Vocabulary Packs", category: "Speaking", fileType: "PDF", description: "Vocabulary, ideas, and phrases for the 20 most common IELTS Speaking topics. With Part 1, 2, and 3 sample answers.", demo: true },
    { id: 7, icon: "📚", title: "Grammar for IELTS — Essential Rules", category: "Grammar", fileType: "PDF", description: "A concise grammar reference covering the 12 most tested areas in IELTS Writing and Speaking, with band-relevant examples.", demo: true },
    { id: 8, icon: "🗓️", title: "8-Week IELTS Study Plan", category: "Full mock support", fileType: "PDF", description: "A structured 8-week preparation plan with daily tasks, practice goals, and mock exam schedule. Adaptable to any band target.", demo: true },
  ];

  const CATEGORIES = ["All", "Writing", "Vocabulary", "Grammar", "Reading", "Listening", "Speaking", "Full mock support"];

  let activeCategory = "All";

  function filtered() {
    if (activeCategory === "All") return RESOURCES;
    return RESOURCES.filter((r) => r.category === activeCategory);
  }

  function render() {
    const container = document.getElementById("resourcesContainer");
    if (!container) return;
    const filtersHtml = CATEGORIES.map((c) =>
      `<button class="pp-filter-btn${c === activeCategory ? " active" : ""}" data-res-cat="${c}">${c}</button>`
    ).join("");
    const gridHtml = filtered().map((r) => `
      <div class="pp-card">
        <div class="pp-card-icon">${r.icon}</div>
        <div>
          <h3 class="pp-card-title">${r.title}</h3>
          ${r.demo ? `<span class="pp-tag amber" style="margin-top:4px">Sample · Demo</span>` : ""}
        </div>
        <p class="pp-card-copy">${r.description}</p>
        <div class="pp-card-meta">
          <span class="pp-tag blue">${r.category}</span>
          <span class="pp-tag">${r.fileType}</span>
        </div>
        <div style="display:flex;gap:8px;margin-top:4px;flex-wrap:wrap">
          <button class="btn secondary" style="font-size:13px;opacity:.55;cursor:default" disabled title="Download will be available soon">Coming soon</button>
        </div>
      </div>`).join("");
    container.innerHTML = `
      <div class="pp-hero" style="margin-bottom:32px">
        <div class="pp-badge">Free downloads</div>
        <h2 class="pp-hero-title">Study materials and guides</h2>
        <p class="pp-hero-sub">Download writing templates, vocabulary lists, grammar references, study plans, and more. New resources are added regularly.</p>
      </div>
      <div class="pp-filters">${filtersHtml}</div>
      <div class="pp-grid">${gridHtml || "<p style='color:var(--neutral-500)'>No resources in this category yet.</p>"}</div>`;
    container.querySelectorAll("[data-res-cat]").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeCategory = btn.dataset.resCat;
        render();
      });
    });
  }

  function bindButtons() {
    const homeBtn = document.getElementById("resourcesHomeBtn");
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
  window.IELTS.ResourcesPage = { init, render };
})();
