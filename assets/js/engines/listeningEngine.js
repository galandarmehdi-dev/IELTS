/* assets/js/engines/listeningEngine.js */
(function () {
  "use strict";

  const UI = () => window.IELTS.UI;
  const S = () => window.IELTS.Storage;
  const R = () => window.IELTS.Registry;
  const Modal = () => window.IELTS.Modal;

  function initListeningSystem() {
    if (window.__IELTS_LISTENING_INIT__) return;
    window.__IELTS_LISTENING_INIT__ = true;

    const L_KEYS = R().TESTS.listeningKeys;

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
    let strictActive = false;

    let currentPageIndex = Math.max(0, Math.min(3, parseInt(S().get(L_KEYS.pageIndex, "0"), 10) || 0));

    let lastGoodTime = 0;
    let ignoreSeekUntil = 0;

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

    function getListeningAnswers() {
      const out = {};
      document.querySelectorAll("[data-lq]").forEach((el) => {
        out[String(el.dataset.lq)] = (el.value || "").trim();
      });

      document.querySelectorAll("[data-lq-radio]").forEach((el) => {
        const q = String(el.dataset.lqRadio);
        if (el.checked) out[q] = el.value;
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

    function loadListeningAnswers() {
      const a = S().getJSON(L_KEYS.answers, null);
      if (!a) return;

      document.querySelectorAll("[data-lq]").forEach((el) => {
        const k = String(el.dataset.lq);
        if (a[k] !== undefined) el.value = a[k];
      });

      document.querySelectorAll("[data-lq-radio]").forEach((el) => {
        const k = String(el.dataset.lqRadio);
        if (a[k] !== undefined) el.checked = String(a[k]) === String(el.value);
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

    function finishListening(reason) {
      if (submitted) return;

      const aud = audio();
      if (aud) {
        try { aud.pause(); } catch {}
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
      strictActive = true;

      aud.controls = false;
      aud.setAttribute("controlsList", "nodownload noplaybackrate noremoteplayback");
      aud.disablePictureInPicture = true;

      lastGoodTime = aud.currentTime || 0;

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
        try { aud.currentTime = lastGoodTime; } catch {}
      });

      aud.addEventListener("timeupdate", () => {
        if (!strictActive || submitted) return;
        const t = aud.currentTime || 0;

        if (Math.abs(t - lastGoodTime) > 1.25 && !aud.ended) {
          try { aud.currentTime = lastGoodTime; } catch {}
          return;
        }
        lastGoodTime = t;

        if (Math.floor(t) % 5 === 0) saveListeningAnswers();
      });

      aud.addEventListener("ended", () => {
        if (submitted) return;
        finishListening("Audio ended (auto-submitted).");
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
      if (m) m.style.display = "flex";

      loadListeningAnswers();
      setupNavHandlers();

      setStatus("Status: Not started");

      s.addEventListener("input", (e) => {
        const t = e.target;
        if (t && (t.matches("input") || t.matches("select") || t.matches("textarea"))) {
          saveListeningAnswers();
        }
      });
    }

    async function startAudioFromUserGesture() {
      const s = sec();
      const m = modal();
      const aud = audio();
      if (!s || !aud) return;
      if (submitted) return;

      setStatus("Status: Loading audio...");

      try { aud.pause(); } catch {}
      aud.muted = false;
      aud.volume = 1;

      try { aud.currentTime = 0; } catch {}
      aud.load();

      try {
        await aud.play();

        started = true;
        S().set(L_KEYS.started, "true");

        s.classList.add("started");
        if (m) m.style.display = "none";

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
      if (submitted) {
        const s = sec();
        if (s) s.classList.add("hidden");
        lockReading(false);
        document.dispatchEvent(new CustomEvent("listening:submitted"));
        return;
      }

      showListening();

      const sBtn = startBtn();
      if (sBtn) sBtn.onclick = startAudioFromUserGesture;

      const submitNow = $("submitListeningBtn");
      if (submitNow) {
        submitNow.onclick = () => {
          if (submitted) return;

          const ok = confirm("Submit Listening now? You will NOT be able to change answers after submitting.");
          if (!ok) return;

          finishListening("Student submitted listening early.");

          Modal().showModal("Listening submitted", "Listening is submitted. Start Reading now?", {
            mode: "confirm",
            showCancel: true,
            submitText: "Start Reading",
            cancelText: "Stay here",
            onConfirm: () => {
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

      const cBtn = cancelBtn();
      if (cBtn) {
        cBtn.onclick = () => {
          const m = modal();
          if (m) m.style.display = "flex";
          setStatus("Status: Not started");
        };
      }
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
