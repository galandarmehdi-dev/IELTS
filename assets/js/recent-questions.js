/* assets/js/recent-questions.js — Recent IELTS Questions forum */
(function () {
  "use strict";

  const MODULES = ["All", "Listening", "Reading", "Writing Task 1", "Writing Task 2", "Speaking Part 1", "Speaking Part 2", "Speaking Part 3"];
  const TEST_TYPES = ["All", "Academic", "General Training"];

  // Placeholder posts for demo when DB is empty
  const PLACEHOLDER_POSTS = [
    { id: "demo-1", module: "Writing Task 2", test_type: "Academic", country: "UK", exam_date: "2025-04-15", question_text: "Some people believe that the best way to improve public health is to increase the number of sports facilities. Others argue that this would have little effect on public health and that other measures are required. Discuss both views and give your own opinion.", difficulty: 3, created_at: new Date(Date.now() - 86400000 * 3).toISOString(), is_demo: true },
    { id: "demo-2", module: "Speaking Part 2", test_type: "Academic", country: "Australia", exam_date: "2025-04-18", question_text: "Describe a time when you helped someone. You should say: who you helped, how you helped them, why they needed help, and how you felt about helping.", difficulty: 2, created_at: new Date(Date.now() - 86400000 * 5).toISOString(), is_demo: true },
    { id: "demo-3", module: "Reading", test_type: "Academic", country: "Canada", exam_date: "2025-04-10", question_text: "Passage about urban farming and vertical agriculture. Topics: sustainability, food security, land use. Question types: True/False/NG, matching headings, sentence completion.", difficulty: 4, created_at: new Date(Date.now() - 86400000 * 7).toISOString(), is_demo: true },
    { id: "demo-4", module: "Writing Task 1", test_type: "Academic", country: "Germany", exam_date: "2025-04-12", question_text: "The graph below shows the percentage of households in three different countries with access to the internet between 2000 and 2020. Summarise the information by selecting and reporting the main features.", difficulty: 2, created_at: new Date(Date.now() - 86400000 * 9).toISOString(), is_demo: true },
    { id: "demo-5", module: "Listening", test_type: "Academic", country: "New Zealand", exam_date: "2025-04-20", question_text: "Section 3: A discussion between two university students and a professor about a research project on urban bird populations. Topics: data collection methods, analysis challenges, conclusion writing.", difficulty: 3, created_at: new Date(Date.now() - 86400000 * 2).toISOString(), is_demo: true },
  ];

  let state = { posts: [], loading: false, error: null, moduleFilter: "All", typeFilter: "All", showForm: false };

  function difficultyStars(d) {
    return "★".repeat(d || 0) + "☆".repeat(5 - (d || 0));
  }

  function timeAgo(iso) {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  async function loadPosts() {
    state.loading = true;
    state.error = null;
    renderPosts();
    try {
      const token = await window.IELTS?.Auth?.getAccessToken?.() || null;
      const url = new URL("/api/admin", window.location.origin);
      url.searchParams.set("action", "listRecentQuestions");
      const res = await fetch(url.toString(), token ? { headers: { Authorization: `Bearer ${token}` } } : {});
      if (!res.ok) throw new Error("Could not load questions. Please try again later.");
      const data = await res.json();
      state.posts = data.posts || [];
      // If DB returned zero approved posts, show empty state (not demo data)
      state.error = null;
    } catch (e) {
      state.posts = [];
      state.error = e.message || "Could not load questions. Please try again later.";
    }
    state.loading = false;
    renderPosts();
  }

  function filteredPosts() {
    return state.posts.filter((p) => {
      if (state.moduleFilter !== "All" && p.module !== state.moduleFilter) return false;
      if (state.typeFilter !== "All" && p.test_type !== state.typeFilter) return false;
      return true;
    });
  }

  function renderPosts() {
    const container = document.getElementById("rqPostsList");
    if (!container) return;
    if (state.loading) { container.innerHTML = `<div style="padding:40px;text-align:center;color:var(--neutral-500)">Loading recent questions…</div>`; return; }
    if (state.error) { container.innerHTML = `<div style="padding:40px;text-align:center;color:var(--neutral-500)">${state.error}</div>`; return; }
    const posts = filteredPosts();
    if (!posts.length) { container.innerHTML = `<div style="padding:40px;text-align:center;color:var(--neutral-500)">No questions yet. Be the first to share your recent IELTS experience!</div>`; return; }
    container.innerHTML = posts.map((p) => `
      <div class="pp-post-card">
        <div class="pp-post-header">
          <h3 class="pp-post-title">${p.is_demo ? "📌 " : ""}${p.module}: ${p.test_type}</h3>
          <div class="pp-post-meta">
            ${p.country ? `<span>📍 ${p.country}</span>` : ""}
            ${p.exam_date ? `<span>📅 ${p.exam_date}</span>` : ""}
            <span>${timeAgo(p.created_at)}</span>
            ${p.is_demo ? `<span class="pp-tag amber">Demo</span>` : ""}
          </div>
        </div>
        <div class="pp-post-body">${p.question_text}</div>
        <div class="pp-post-footer">
          <span class="pp-tag blue">${p.module}</span>
          <span class="pp-tag">${p.test_type}</span>
          ${p.difficulty ? `<span style="color:#d97706;font-weight:700;font-size:12px">${difficultyStars(p.difficulty)}</span>` : ""}
        </div>
      </div>`).join("");
  }

  function renderForm(container) {
    if (!state.showForm) return;
    const isSignedIn = window.IELTS?.Auth?.isSignedIn?.() || false;
    if (!isSignedIn) {
      container.innerHTML = `<div class="pp-form"><p style="font-weight:600">Please <button class="btn secondary" onclick="window.IELTS?.Auth?.openLoginGate?.('Sign in to share your IELTS experience.')" style="font-size:13px;display:inline-flex">sign in</button> to share your recent exam experience.</p></div>`;
      return;
    }
    container.innerHTML = `
      <div class="pp-form">
        <h3 class="pp-form-title">Share your recent IELTS experience</h3>
        <div class="pp-form-row">
          <div class="pp-field"><label>Exam date</label><input type="date" id="rqDate"></div>
          <div class="pp-field"><label>Test type</label><select id="rqTestType"><option>Academic</option><option>General Training</option></select></div>
          <div class="pp-field"><label>Module</label><select id="rqModule">${MODULES.filter((m) => m !== "All").map((m) => `<option>${m}</option>`).join("")}</select></div>
        </div>
        <div class="pp-form-row">
          <div class="pp-field"><label>Country (optional)</label><input type="text" id="rqCountry" placeholder="e.g. United Kingdom"></div>
          <div class="pp-field"><label>Difficulty (1–5)</label><input type="number" id="rqDifficulty" min="1" max="5" placeholder="3"></div>
        </div>
        <div class="pp-field"><label>Question or topic</label><textarea id="rqQuestion" rows="3" placeholder="Describe the question, topic, or task as accurately as you can remember…"></textarea></div>
        <p id="rqFormError" style="color:var(--danger,#ca4454);font-size:13px;display:none"></p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px">
          <button class="btn" type="button" id="rqSubmitBtn">Share</button>
          <button class="btn secondary" type="button" id="rqCancelBtn">Cancel</button>
        </div>
      </div>`;
    document.getElementById("rqSubmitBtn")?.addEventListener("click", submitPost);
    document.getElementById("rqCancelBtn")?.addEventListener("click", () => { state.showForm = false; render(); });
  }

  async function submitPost() {
    const question = document.getElementById("rqQuestion")?.value?.trim() || "";
    const errEl = document.getElementById("rqFormError");
    if (!question) { if (errEl) { errEl.textContent = "Please describe the question or topic."; errEl.style.display = "block"; } return; }
    if (errEl) errEl.style.display = "none";
    const btn = document.getElementById("rqSubmitBtn");
    if (btn) { btn.disabled = true; btn.textContent = "Sharing…"; }
    try {
      const token = await window.IELTS?.Auth?.getAccessToken?.() || null;
      const body = {
        exam_date: document.getElementById("rqDate")?.value || null,
        test_type: document.getElementById("rqTestType")?.value || "Academic",
        module: document.getElementById("rqModule")?.value || "Listening",
        country: document.getElementById("rqCountry")?.value?.trim() || null,
        difficulty: parseInt(document.getElementById("rqDifficulty")?.value || "3", 10) || 3,
        question_text: question,
      };
      const url = new URL("/api/admin", window.location.origin);
      url.searchParams.set("action", "submitRecentQuestion");
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Could not submit. Please try again.");
      state.showForm = false;
      // Show pending-review notice instead of immediately reloading posts
      const container = document.getElementById("recentQuestionsContainer");
      if (container) {
        const notice = document.createElement("div");
        notice.className = "pp-success-notice";
        notice.style.cssText = "background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 18px;margin:0 0 16px;color:#166534;font-size:14px;line-height:1.5";
        notice.textContent = "✓ Your submission has been received and is pending review. It will appear once approved.";
        container.prepend(notice);
      }
    } catch (e) {
      if (errEl) { errEl.textContent = e.message || "Could not submit. Please try again."; errEl.style.display = "block"; }
      if (btn) { btn.disabled = false; btn.textContent = "Share"; }
    }
  }

  function render() {
    const container = document.getElementById("recentQuestionsContainer");
    if (!container) return;
    const filtersHtml = `
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:20px">
        <div class="pp-filters" style="margin:0">
          ${MODULES.map((m) => `<button class="pp-filter-btn${m === state.moduleFilter ? " active" : ""}" data-rq-module="${m}">${m}</button>`).join("")}
        </div>
      </div>
      <div class="pp-filters">
        ${TEST_TYPES.map((t) => `<button class="pp-filter-btn${t === state.typeFilter ? " active" : ""}" data-rq-type="${t}">${t}</button>`).join("")}
      </div>`;
    container.innerHTML = `
      <div class="pp-hero" style="margin-bottom:32px">
        <div class="pp-badge">Student community</div>
        <h2 class="pp-hero-title">What did students see on their real IELTS exams?</h2>
        <p class="pp-hero-sub">Students share recent exam questions and topics to help others prepare. Browse by module or test type, and contribute your own experience.</p>
        <div class="pp-hero-actions">
          <button class="btn" id="rqShareBtn" style="background:#fff;color:var(--primary-700,#153462);font-weight:700;box-shadow:0 2px 12px rgba(0,0,0,.15)">Share your experience</button>
        </div>
      </div>
      <div id="rqFormContainer"></div>
      ${filtersHtml}
      <div id="rqPostsList"></div>`;
    renderForm(document.getElementById("rqFormContainer"));
    renderPosts();
    container.querySelectorAll("[data-rq-module]").forEach((btn) => {
      btn.addEventListener("click", () => { state.moduleFilter = btn.dataset.rqModule; renderPosts(); });
    });
    container.querySelectorAll("[data-rq-type]").forEach((btn) => {
      btn.addEventListener("click", () => { state.typeFilter = btn.dataset.rqType; renderPosts(); });
    });
    document.getElementById("rqShareBtn")?.addEventListener("click", () => {
      state.showForm = !state.showForm;
      renderForm(document.getElementById("rqFormContainer"));
    });
  }

  function bindButtons() {
    const homeBtn = document.getElementById("recentQuestionsHomeBtn");
    if (homeBtn && !homeBtn.dataset.bound) {
      homeBtn.dataset.bound = "1";
      homeBtn.addEventListener("click", () => {
        try { window.IELTS?.UI?.showOnly?.("home"); } catch (e) {}
        try { window.IELTS?.Router?.setHashRoute?.(window.IELTS?.Registry?.getActiveTestId?.() || "ielts1", "home"); } catch (e) {}
      });
    }
  }

  function init() {
    bindButtons();
    render();
    loadPosts();
  }

  window.IELTS = window.IELTS || {};
  window.IELTS.RecentQuestions = { init, render };
})();
