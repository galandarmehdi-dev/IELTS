/* assets/js/engines/listeningEngine.js */
(function () {
  "use strict";

  const UI = () => window.IELTS.UI;
  const S = () => window.IELTS.Storage;
  const R = () => window.IELTS.Registry;
  const Modal = () => window.IELTS.Modal;
  const Auth = () => window.IELTS?.Auth;

  function isAdminView() {
    try {
      return window.IELTS?.Access?.isAdmin?.() === true;
    } catch (e) {
      return false;
    }
  }

  function initListeningSystem() {
    if (window.__IELTS_LISTENING_INIT__) return;
    window.__IELTS_LISTENING_INIT__ = true;

    const testId = R().getActiveTestId?.() || R().TESTS?.defaultTestId || "ielts1";
    const LAUNCH_CONTEXT = R().getLaunchContext?.() || null;
    const L_KEYS = (R().getScopedKeys?.(testId)?.listening) || (R().keysFor?.(testId)?.listening) || R().TESTS?.listeningKeys;
    const REVIEW_MODE = !!(LAUNCH_CONTEXT && LAUNCH_CONTEXT.mode === "section" && LAUNCH_CONTEXT.section === "listening");

    // Auto-migrate legacy single-test keys on this browser (so nothing breaks mid-attempt)
    const LEG = R().LEGACY?.listeningKeys;
    try {
      if (LEG && L_KEYS && S()) {
        const pairs = [
          ["submitted", "submitted"],
          ["started", "started"],
          ["answers", "answers"],
          ["lastSubmission", "lastSubmission"],
          ["pageIndex", "pageIndex"],
        ];
        pairs.forEach(([kNew, kOld]) => {
          const newKey = L_KEYS[kNew];
          const oldKey = LEG[kOld];
          if (!newKey || !oldKey) return;
          const hasNew = S().get(newKey, null) !== null;
          const hasOld = S().get(oldKey, null) !== null;
          if (!hasNew && hasOld) S().set(newKey, S().get(oldKey));
        });
      }
    } catch (e) {}


    const $ = UI().$;
    const sec = () => $("listeningSection");
    const modal = () => $("listenModal");
    const startBtn = () => $("startListeningBtn");
    const cancelBtn = () => $("cancelListeningBtn");
    const statusEl = () => $("listenStatus");
    const audio = () => $("listeningAudio");

    const prevBtn = () => $("listenPrevBtn");
    const nextBtn = () => $("listenNextBtn");
    const tabButtons = () => Array.from(document.querySelectorAll(".listenTab[data-listen-tab]"));

    const pages = () => [$("listenSec1"), $("listenSec2"), $("listenSec3"), $("listenSec4")].filter(Boolean);
    const readingContainer = () => $("container");

    let submitted = S().get(L_KEYS.submitted, "false") === "true";
    let started = S().get(L_KEYS.started, "false") === "true";

    // 2-minute review/transfer time after audio ends (computer-delivered IELTS style)
    let transferActive = false;
    let transferEndsAt = 0;
    let transferInterval = null;
    let strictActive = false;
    let lastReviewRows = S().getJSON(`${L_KEYS.answers}:reviewRows`, []) || [];
    let lastReviewRevealed = S().get(`${L_KEYS.answers}:reviewRevealed`, "false") === "true";

    let currentPageIndex = Math.max(
      0,
      Math.min(
        3,
        Number.isInteger(LAUNCH_CONTEXT?.pageIndex)
          ? LAUNCH_CONTEXT.pageIndex
          : (parseInt(S().get(L_KEYS.pageIndex, "0"), 10) || 0)
      )
    );

    const initialListenBodyHtml = (() => {
      try {
        const el = document.getElementById("listenBody");
        return el && typeof el.innerHTML === "string" ? el.innerHTML : "";
      } catch (e) {
        return "";
      }
    })();

    let lastGoodTime = 0;
    let ignoreSeekUntil = 0;


function applyActiveListeningContent() {
  const content = (typeof R().getActiveTestContent === "function" && R().getActiveTestContent()) || {};
  const listening = content.listening || {};
  const body = $("listenBody");
  const aud = audio();

  if (body) {
    const nextHtml = (typeof listening.html === "string" ? listening.html.trim() : "");
    if (nextHtml) {
      body.innerHTML = nextHtml;
      body.querySelectorAll(".listen-footer").forEach((node) => node.remove());
    } else if (!String(body.innerHTML || "").trim() && initialListenBodyHtml.trim()) {
      body.innerHTML = initialListenBodyHtml;
      body.querySelectorAll(".listen-footer").forEach((node) => node.remove());
    }
  }

  if (aud) {
    let source = aud.querySelector("source");
    if (!source) {
      source = document.createElement("source");
      source.type = "audio/mpeg";
      aud.appendChild(source);
    }

    const nextSrc = (typeof listening.audioSrc === "string" ? listening.audioSrc.trim() : "") || source.getAttribute("src") || source.src || "";
    if (nextSrc) {
      source.src = nextSrc;
      try { aud.load(); } catch (e) {}
    }
  }

  if (body && !body.querySelector(".listen-page") && initialListenBodyHtml.trim()) {
    body.innerHTML = initialListenBodyHtml;
    body.querySelectorAll(".listen-footer").forEach((node) => node.remove());
  }
}

    function setStatus(t) {
      const el = statusEl();
      if (el) el.textContent = t;
    }

    function lockReading(lock) {
      const c = readingContainer();
      if (c) {
        c.style.pointerEvents = lock ? "none" : "";
        c.style.filter = lock ? "blur(2px)" : "";
        c.style.userSelect = lock ? "none" : "";
      }
    }

    function getListeningRoot() {
      return $("listenBody") || sec() || document;
    }

    function getListeningAnswers() {
      const out = {};
      const root = getListeningRoot();

      root.querySelectorAll("[data-lq]").forEach((el) => {
        const key = String(el.dataset.lq || "").trim();
        if (!key) return;

        if (el.matches('input[type="checkbox"]')) {
          out[key] = el.checked ? (el.value || "true") : "";
          return;
        }

        out[key] = (el.value || "").trim();
      });

      root.querySelectorAll("[data-lq-radio]").forEach((el) => {
        const q = String(el.dataset.lqRadio || "").trim();
        if (!q) return;
        if (el.checked) out[q] = String(el.value || "").trim();
      });

      const groupedChecks = {};
      root.querySelectorAll("[data-lq-check]").forEach((el) => {
        const startQ = Number(String(el.dataset.lqCheck || "").trim());
        if (!Number.isFinite(startQ) || startQ <= 0) return;
        if (!groupedChecks[startQ]) groupedChecks[startQ] = [];
        if (el.checked) groupedChecks[startQ].push(String(el.value || "").trim());
      });

      Object.entries(groupedChecks).forEach(([startQRaw, values]) => {
        const startQ = Number(startQRaw);
        const chosen = Array.isArray(values) ? values.slice(0, 2).sort() : [];
        out[startQ] = chosen[0] || "";
        out[startQ + 1] = chosen[1] || "";
      });

      return out;
    }

    function saveListeningAnswers() {
      S().setJSON(L_KEYS.answers, getListeningAnswers());
      const a = $("listenAutosave");
      if (a) a.textContent = "Autosave: saved";
      setTimeout(() => {
        if (a) a.textContent = "Autosave: ready";
      }, 800);
    }

    function injectListeningReviewStyles() {
      if (document.getElementById("listeningReviewStyles")) return;
      const style = document.createElement("style");
      style.id = "listeningReviewStyles";
      style.textContent = `
        .answer-review-panel{margin-top:18px;border:1px solid rgba(18,26,36,.08);border-radius:24px;padding:18px;background:linear-gradient(180deg, rgba(255,253,249,.98) 0%, rgba(246,239,230,.94) 100%);box-shadow:0 18px 40px rgba(18,26,36,.06);}
        .answer-review-panel.hidden{display:none;}
        .answer-review-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:16px;}
        .answer-review-head h3{margin:4px 0 0;font-size:28px;color:var(--ink);}
        .answer-review-hint{max-width:360px;color:var(--muted);font-weight:700;line-height:1.45;}
        .answer-review-list{display:grid;gap:12px;}
        .answer-review-row{border:1px solid rgba(18,26,36,.08);border-radius:18px;padding:14px;background:#fff;}
        .answer-review-row.is-correct{border-color:rgba(31,132,90,.28);box-shadow:inset 0 0 0 1px rgba(31,132,90,.08);}
        .answer-review-row.is-wrong{border-color:rgba(196,69,54,.28);box-shadow:inset 0 0 0 1px rgba(196,69,54,.08);}
        .answer-review-row-top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:10px;}
        .answer-review-badge{display:inline-flex;align-items:center;padding:5px 10px;border-radius:999px;font-size:12px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;}
        .answer-review-row.is-correct .answer-review-badge{background:rgba(31,132,90,.12);color:#1f845a;}
        .answer-review-row.is-wrong .answer-review-badge{background:rgba(196,69,54,.12);color:#c44536;}
        .answer-review-student,.answer-review-correct{display:grid;gap:4px;}
        .answer-review-student span,.answer-review-correct span{font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);}
      `;
      document.head.appendChild(style);
    }

    function getVisibleListeningQuestionNumbers() {
      const start = currentPageIndex * 10 + 1;
      return Array.from({ length: 10 }, (_, index) => start + index);
    }

    function getManagedListeningAnswerKeyStorageKey() {
      const scope = String(LAUNCH_CONTEXT?.storageScope || testId || "listening").trim();
      return `${scope}:LISTENING:managedAnswerKey:section:${currentPageIndex + 1}`;
    }

    function loadManagedListeningOverrides() {
      return S().getJSON(getManagedListeningAnswerKeyStorageKey(), {}) || {};
    }

    function saveManagedListeningOverrides(map) {
      S().setJSON(getManagedListeningAnswerKeyStorageKey(), map || {});
    }

    function getListeningReviewPanel() {
      let panel = $("listeningReviewPanel");
      if (panel) return panel;
      const footer = document.querySelector(".listen-footer");
      if (!footer || !footer.parentNode) return null;
      panel = document.createElement("div");
      panel.id = "listeningReviewPanel";
      panel.className = "answer-review-panel hidden";
      footer.parentNode.insertBefore(panel, footer.nextSibling);
      return panel;
    }

    function renderListeningReview(rows, revealed, totalCorrect, totalQuestions) {
      const panel = getListeningReviewPanel();
      if (!panel) return;
      const safeRows = Array.isArray(rows) ? rows : [];
      if (!safeRows.length) {
        panel.classList.add("hidden");
        panel.innerHTML = "";
        return;
      }
      const correctCount = Number.isFinite(totalCorrect) ? totalCorrect : safeRows.filter((item) => item.mark).length;
      const questionCount = Number.isFinite(totalQuestions) && totalQuestions > 0 ? totalQuestions : safeRows.length;
      panel.classList.remove("hidden");
      panel.innerHTML = `
        <div class="answer-review-head">
          <div>
            <div class="home-card-topline">Listening review</div>
            <h3>${correctCount}/${questionCount} correct</h3>
          </div>
          <div class="answer-review-hint">${revealed ? "Correct answers are visible below." : "Correct answers stay hidden until you click See answers."}</div>
        </div>
        <div class="answer-review-list">
          ${safeRows.map((row) => `
            <article class="answer-review-row ${row.mark ? "is-correct" : "is-wrong"}">
              <div class="answer-review-row-top">
                <strong>Question ${String(row.q || "—")}</strong>
                <span class="answer-review-badge">${row.mark ? "Correct" : "Wrong"}</span>
              </div>
              <div class="answer-review-student"><span>Your answer</span><b>${escapeReviewValue(row.student || "—")}</b></div>
              ${revealed ? `<div class="answer-review-correct"><span>Correct answer</span><b>${escapeReviewValue(row.correct || "—")}</b></div>` : ""}
            </article>
          `).join("")}
        </div>
      `;
    }

    function escapeReviewValue(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    async function fetchListeningReview(reveal) {
      const url = R().buildAdminApiUrl?.({ action: "objectiveAnswerCheck" });
      if (!url) throw new Error("Listening review endpoint is unavailable.");

      const latest = getListeningAnswers();
      S().setJSON(L_KEYS.answers, latest);

      const token = await Auth()?.getAccessToken?.();
      const response = await fetch(url.toString(), {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          testId,
          skill: "listening",
          reveal: reveal === true,
          answers: latest,
          questionNumbers: getVisibleListeningQuestionNumbers(),
          overrideMap: isAdminView() ? loadManagedListeningOverrides() : {},
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data || data.ok !== true) {
        throw new Error(data?.error || "Could not check listening answers.");
      }
      if (!Number(data.availableCount || 0)) {
        throw new Error("No listening answer key is configured for this section yet.");
      }
      lastReviewRows = Array.isArray(data.review) ? data.review.slice() : [];
      lastReviewRevealed = reveal === true;
      S().setJSON(`${L_KEYS.answers}:reviewRows`, lastReviewRows);
      S().set(`${L_KEYS.answers}:reviewRevealed`, lastReviewRevealed ? "true" : "false");
      renderListeningReview(lastReviewRows, lastReviewRevealed, Number(data.totalCorrect || 0), Number(data.totalQuestions || lastReviewRows.length || 0));
    }

    function openManageListeningPrompt() {
      const seed = {};
      const existing = loadManagedListeningOverrides();
      getVisibleListeningQuestionNumbers().forEach((q) => {
        seed[q] = existing[q] || "";
      });
      const raw = window.prompt(
        "Set listening answers as JSON, for example {\"17\":\"A\",\"18\":\"B\",\"19\":\"garden gallery\"}",
        JSON.stringify(seed, null, 2)
      );
      if (raw == null) return;
      try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("bad-json");
        saveManagedListeningOverrides(parsed);
        window.alert("Listening answer overrides saved for this browser.");
      } catch (e) {
        window.alert("Please paste a valid JSON object.");
      }
    }

    function syncListeningReviewButtons() {
      const finishBtn = $("finishListeningReviewBtn");
      const checkBtn = $("checkListeningAnswersBtn");
      const showBtn = $("showListeningAnswersBtn");
      const manageBtn = $("manageListeningAnswersBtn");
      if (finishBtn) finishBtn.disabled = submitted;
      if (checkBtn) checkBtn.disabled = !submitted;
      if (showBtn) showBtn.disabled = !submitted || !lastReviewRows.length;
      if (manageBtn) manageBtn.classList.toggle("hidden", !isAdminView());
    }

    function ensureListeningReviewButtons() {
      if (!REVIEW_MODE) return;
      const footer = document.querySelector(".listen-footer");
      if (!footer) return;

      const ensureBtn = (id, label, ghost) => {
        let btn = document.getElementById(id);
        if (btn) return btn;
        btn = document.createElement("button");
        btn.type = "button";
        btn.id = id;
        btn.className = ghost ? "btn secondary" : "btn";
        btn.textContent = label;
        footer.appendChild(btn);
        return btn;
      };

      const finishBtn = ensureBtn("finishListeningReviewBtn", "Finish Listening", false);
      const checkBtn = ensureBtn("checkListeningAnswersBtn", "Check answers", true);
      const showBtn = ensureBtn("showListeningAnswersBtn", "See answers", true);
      const manageBtn = ensureBtn("manageListeningAnswersBtn", "Manage", true);

      if (!finishBtn.dataset.bound) {
        finishBtn.dataset.bound = "1";
        finishBtn.addEventListener("click", () => {
          if (submitted) return;
          finishListening("Listening section finished.");
          const a = $("listenAutosave");
          if (a) a.textContent = "Listening finished. Check your answers below.";
          syncListeningReviewButtons();
        });
      }

      if (!checkBtn.dataset.bound) {
        checkBtn.dataset.bound = "1";
        checkBtn.addEventListener("click", async () => {
          try {
            await fetchListeningReview(false);
            syncListeningReviewButtons();
          } catch (error) {
            window.alert(error?.message || "Could not check listening answers.");
          }
        });
      }

      if (!showBtn.dataset.bound) {
        showBtn.dataset.bound = "1";
        showBtn.addEventListener("click", async () => {
          try {
            await fetchListeningReview(true);
            syncListeningReviewButtons();
          } catch (error) {
            window.alert(error?.message || "Could not reveal listening answers.");
          }
        });
      }

      if (!manageBtn.dataset.bound) {
        manageBtn.dataset.bound = "1";
        manageBtn.addEventListener("click", openManageListeningPrompt);
      }

      syncListeningReviewButtons();
    }

    function loadListeningAnswers() {
      const a = S().getJSON(L_KEYS.answers, null);
      if (!a) return;

      const root = getListeningRoot();

      root.querySelectorAll("[data-lq]").forEach((el) => {
        const k = String(el.dataset.lq || "").trim();
        if (!k || a[k] === undefined) return;

        if (el.matches('input[type="checkbox"]')) {
          el.checked = !!a[k] && String(a[k]).trim() !== "" && String(a[k]).toLowerCase() !== "false";
          return;
        }

        el.value = a[k];
      });

      root.querySelectorAll("[data-lq-radio]").forEach((el) => {
        const k = String(el.dataset.lqRadio || "").trim();
        if (a[k] !== undefined) el.checked = String(a[k]) === String(el.value);
      });

      const groupedChecks = new Map();
      root.querySelectorAll("[data-lq-check]").forEach((el) => {
        const startQ = Number(String(el.dataset.lqCheck || "").trim());
        if (!Number.isFinite(startQ) || startQ <= 0) return;
        if (!groupedChecks.has(startQ)) groupedChecks.set(startQ, []);
        groupedChecks.get(startQ).push(el);
      });

      groupedChecks.forEach((inputs, startQ) => {
        const allowed = new Set(
          [a[startQ], a[String(startQ)], a[startQ + 1], a[String(startQ + 1)]]
            .map((value) => String(value || "").trim())
            .filter(Boolean)
        );
        inputs.forEach((el) => {
          el.checked = allowed.has(String(el.value || "").trim());
        });
      });
    }

    function enforceListeningCheckLimits() {
      const root = getListeningRoot();
      const groupedChecks = new Map();
      root.querySelectorAll("[data-lq-check]").forEach((el) => {
        const startQ = Number(String(el.dataset.lqCheck || "").trim());
        if (!Number.isFinite(startQ) || startQ <= 0) return;
        if (!groupedChecks.has(startQ)) groupedChecks.set(startQ, []);
        groupedChecks.get(startQ).push(el);
      });

      groupedChecks.forEach((inputs) => {
        inputs.forEach((input) => {
          if (input.dataset.limitBound === "1") return;
          input.dataset.limitBound = "1";
          input.addEventListener("change", () => {
            const checked = inputs.filter((el) => el.checked);
            if (checked.length > 2) {
              input.checked = false;
              try {
                window.alert("Please choose only TWO answers for this question.");
              } catch (e) {}
              return;
            }
            saveListeningAnswers();
          });
        });
      });
    }

    function collectListeningPayload(reason) {
      return {
        type: "listening",
        submittedAt: new Date().toISOString(),
        reason,
        answers: getListeningAnswers(),
        pageIndex: currentPageIndex,
      };
    }

    
    function stopTransferTime() {
      transferActive = false;
      transferEndsAt = 0;
      if (transferInterval) {
        try { clearInterval(transferInterval); } catch (_) {}
      }
      transferInterval = null;
      try { UI().setExamNavTimer(""); } catch (_) {}
    }

    function startTransferTime() {
      if (submitted || transferActive) return;

      transferActive = true;
      transferEndsAt = Date.now() + 2 * 60 * 1000;

      // Show warning once, then let students keep editing answers during the countdown
      try {
        Modal().showModal(
          "2 minutes to check answers",
          "The audio has ended. You have 2 minutes to check your answers. The Listening section will be submitted automatically when the timer reaches 00:00.",
          {
            mode: "confirm",
            submitText: "Continue",
            onConfirm: () => {
              // Just close and continue editing.
            },
          }
        );
      } catch (_) {}

      // Status + pinned timer in the nav bar
      try { UI().setExamNavStatus("Status: Listening — check answers"); } catch (_) {}

      const tick = () => {
        const msLeft = Math.max(0, transferEndsAt - Date.now());
        const totalSec = Math.ceil(msLeft / 1000);
        const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
        const ss = String(totalSec % 60).padStart(2, "0");
        try { UI().setExamNavTimer(`${mm}:${ss}`); } catch (_) {}

        if (msLeft <= 0) {
          stopTransferTime();
          finishListening("Audio ended (2-minute review time over).");
        }
      };

      tick();
      transferInterval = setInterval(tick, 250);
    }

    function finishListening(reason) {
      if (submitted) return;

      // If transfer time was running, stop it now.
      stopTransferTime();

      const aud = audio();
      if (aud) {
        try { aud.pause(); } catch (e) {}
      }

      submitted = true;
      strictActive = false;
      saveListeningAnswers();

      const payload = collectListeningPayload(reason);
      S().setJSON(L_KEYS.lastSubmission, payload);
      S().set(L_KEYS.submitted, "true");

      const s = sec();
      if (s) {
        s.classList.add("view-only");
        s.classList.remove("hidden");
      }

      lockReading(false);

      document.dispatchEvent(new CustomEvent("listening:submitted"));
    }

    function renderNavUI(total, active) {
      const p = prevBtn();
      const n = nextBtn();
      if (p) p.disabled = active === 0;
      if (n) n.disabled = active === total - 1;

      tabButtons().forEach((btn) => {
        const idx = parseInt(btn.dataset.listenTab, 10);
        btn.classList.toggle("active", idx === active);
        btn.setAttribute("aria-selected", idx === active ? "true" : "false");
      });
    }

    function goToPage(index) {
      const list = pages();
      if (!list.length) return;

      if (!submitted) saveListeningAnswers();

      const clamped = Math.max(0, Math.min(list.length - 1, index));
      currentPageIndex = clamped;
      S().set(L_KEYS.pageIndex, String(clamped));

      list.forEach((p, i) => p.classList.toggle("hidden", i !== clamped));
      renderNavUI(list.length, clamped);
    }

    function setupNavHandlers() {
      const list = pages();
      if (!list.length) return;

      goToPage(currentPageIndex);

      const p = prevBtn();
      const n = nextBtn();
      if (p) p.onclick = () => goToPage(currentPageIndex - 1);
      if (n) n.onclick = () => goToPage(currentPageIndex + 1);

      tabButtons().forEach((btn) => {
        btn.onclick = () => {
          const idx = parseInt(btn.dataset.listenTab, 10);
          if (!Number.isNaN(idx)) goToPage(idx);
        };
      });
    }

    function enableStrictAudio(aud) {
      if (!aud) return;

      const isAdmin = isAdminView();

      // TEMP: allow students to scrub audio for testing (Registry.TEMP_STUDENT_AUDIO_SCRUB)
      const allowStudentScrub = !!(R() && R().TEMP_STUDENT_AUDIO_SCRUB === true);
      const allowControls = isAdmin || allowStudentScrub;

      // Students: strict, no pause/seek. Admin (and temp testing mode): allow full controls (seek forward/back).
      strictActive = !allowControls;

      aud.controls = allowControls;
      aud.setAttribute("controlsList", "nodownload noplaybackrate noremoteplayback");
      aud.disablePictureInPicture = true;

      lastGoodTime = aud.currentTime || 0;

      // Always: autosave periodically + detect end of audio.
      aud.addEventListener("timeupdate", () => {
        if (submitted) return;
        const t = aud.currentTime || 0;

        // Student anti-seek protection
        if (strictActive) {
          if (Math.abs(t - lastGoodTime) > 1.25 && !aud.ended) {
            try { aud.currentTime = lastGoodTime; } catch (e) {}
            return;
          }
        }

        lastGoodTime = t;

        if (Math.floor(t) % 5 === 0) saveListeningAnswers();
      });

      aud.addEventListener("ended", () => {
        if (submitted) return;
        startTransferTime();
      });

      if (!strictActive) {
        // Admin: allow pause/seek/keyboard freely.
        return;
      }

      // -----------------------
      // Student-only restrictions
      // -----------------------
      aud.addEventListener("pause", () => {
        if (!strictActive || submitted) return;
        if (aud.ended) return;
        aud.play().catch(() => {});
      });

      aud.addEventListener("seeking", () => {
        if (!strictActive || submitted) return;
        const now = Date.now();
        if (now < ignoreSeekUntil) return;
        ignoreSeekUntil = now + 200;
        try { aud.currentTime = lastGoodTime; } catch (e) {}
      });

      window.addEventListener(
        "keydown",
        (e) => {
          if (!strictActive || submitted) return;

          const t = e.target;
          if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;

          const k = (e.key || "").toLowerCase();
          const blocked =
            k === " " ||
            k === "k" ||
            k === "j" ||
            k === "l" ||
            k === "arrowleft" ||
            k === "arrowright" ||
            k === "mediarewind" ||
            k === "mediafastforward" ||
            k === "mediaplaypause";

          if (blocked) {
            e.preventDefault();
            e.stopPropagation();
            aud.play().catch(() => {});
          }
        },
        true
      );
    }

    function showListening() {
      const s = sec();
      if (!s) return;

      lockReading(true);
      s.classList.remove("hidden");

      started = false;
      S().set(L_KEYS.started, "false");
      s.classList.remove("started");

      const m = modal();
      if (m) {
        m.classList.remove("hidden");
        m.style.display = "flex";
      }

      loadListeningAnswers();
      enforceListeningCheckLimits();
      setupNavHandlers();

      setStatus("Status: Not started");

      if (!s.dataset.listenBound) {
        s.dataset.listenBound = "1";

        const persistIfAnswerField = (e) => {
          const t = e.target;
          if (t && (t.matches("input") || t.matches("select") || t.matches("textarea"))) {
            saveListeningAnswers();
          }
        };

        s.addEventListener("input", persistIfAnswerField);
        s.addEventListener("change", persistIfAnswerField);
      }
    }

    async function startAudioFromUserGesture() {
      const s = sec();
      const m = modal();
      const aud = audio();
      if (!s || !aud) return;
      if (submitted) return;

      setStatus("Status: Loading audio...");

      try { aud.pause(); } catch (e) {}
      aud.muted = false;
      aud.volume = 1;

      try { aud.currentTime = 0; } catch (e) {}
      aud.load();

      try {
        await aud.play();

        started = true;
        S().set(L_KEYS.started, "true");

        s.classList.add("started");
        if (m) {
          m.classList.add("hidden");
          m.style.display = "none";
        }

        setupNavHandlers();
        setStatus("Status: Playing (navigate Section 1–4 while audio continues)");
        enableStrictAudio(aud);
      } catch (err) {
        console.warn("Audio play failed:", err);

        started = false;
        S().set(L_KEYS.started, "false");

        s.classList.remove("started");
        if (m) m.style.display = "flex";

        const code = aud.error?.code;
        const reason = !aud.currentSrc
          ? "No audio source loaded (check URL)"
          : code
          ? "Audio error code: " + code
          : "Audio blocked by browser. Student must click START.";

        setStatus("Status: " + reason);
      }
    }

    function setupListeningUI() {
  applyActiveListeningContent();
  injectListeningReviewStyles();

  // Admin gate (students must NOT be able to submit early / control flow)
  const isAdmin =
    (UI && typeof UI().isAdminView === "function" && UI().isAdminView() === true) ||
    (window.IELTS?.Access?.isAdmin?.() === true) ||
    false;

  if (submitted) {
    const s = sec();
    if (s) s.classList.add("view-only");
    if (s) s.classList.remove("hidden");
    lockReading(false);
    if (REVIEW_MODE && lastReviewRows.length) {
      renderListeningReview(lastReviewRows, lastReviewRevealed);
      syncListeningReviewButtons();
    }
    document.dispatchEvent(new CustomEvent("listening:submitted"));
    return;
  }

  showListening();

  const sBtn = startBtn();
  if (sBtn) sBtn.onclick = startAudioFromUserGesture;

  const submitNow = $("submitListeningBtn");
  if (submitNow) {
    if (REVIEW_MODE) {
      submitNow.classList.add("hidden");
    } else
    if (!isAdmin) {
      // Students cannot submit early
      submitNow.classList.add("hidden");
    } else {
      // Admin can submit early (for testing / supervision)
      submitNow.onclick = () => {
        if (submitted) return;

        const ok = confirm(
          "Submit Listening now? You will NOT be able to change answers after submitting."
        );
        if (!ok) return;

        finishListening("Admin submitted listening early.");

        Modal().showModal("Listening submitted", "Listening is submitted. Start Reading now?", {
          mode: "confirm",
          showCancel: true,
          submitText: "Start Reading",
          cancelText: "Stay here",
          onConfirm: () => {
            try { window.__IELTS_READING_INIT__ = false; } catch (_) {}
            try { window.IELTS?.Router?.setHashRoute?.((R().getActiveTestId?.() || R().TESTS?.defaultTestId || "ielts1"), "reading"); } catch (_) {}
            window.IELTS.Engines.Reading.startReadingSystem();
            UI().showOnly("reading");
            UI().setExamNavStatus("Status: Reading in progress");
          },
          onCancel: () => {
            UI().showOnly("listening");
            UI().setExamNavStatus("Status: Listening submitted (review)");
          },
        });
      };
    }
  }

  const cBtn = cancelBtn();
  if (cBtn) {
    cBtn.onclick = () => {
      const m = modal();
      if (m) {
        m.classList.remove("hidden");
        m.style.display = "flex";
      }
      setStatus("Status: Not started");
    };
  }

  ensureListeningReviewButtons();
}
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", setupListeningUI);
    } else {
      setupListeningUI();
    }
  }

  window.IELTS = window.IELTS || {};
  window.IELTS.Engines = window.IELTS.Engines || {};
  window.IELTS.Engines.Listening = { initListeningSystem };
})();
