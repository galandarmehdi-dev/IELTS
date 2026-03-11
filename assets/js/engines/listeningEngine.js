/* assets/js/engines/listeningEngine.js */
(function () {
  "use strict";

  const UI = () => window.IELTS.UI;
  const S = () => window.IELTS.Storage;
  const R = () => window.IELTS.Registry;
  const Modal = () => window.IELTS.Modal;

  function isAdminView() {
    try {
      return window.IELTS?.Access?.isAdmin?.() === true;
    } catch {
      return false;
    }
  }

  function initListeningSystem() {
    if (window.__IELTS_LISTENING_INIT__) return;
    window.__IELTS_LISTENING_INIT__ = true;

    const testId = R().getActiveTestId?.() || R().TESTS?.defaultTestId || "ielts1";
    const L_KEYS = (R().keysFor?.(testId)?.listening) || R().TESTS?.listeningKeys;

    // Auto-migrate legacy single-test keys on this browser
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
    const listeningRoot = () => sec();

    let submitted = S().get(L_KEYS.submitted, "false") === "true";
    let started = S().get(L_KEYS.started, "false") === "true";

    // 2-minute review time after audio ends
    let transferActive = false;
    let transferEndsAt = 0;
    let transferInterval = null;
    let strictActive = false;

    let currentPageIndex = Math.max(0, Math.min(3, parseInt(S().get(L_KEYS.pageIndex, "0"), 10) || 0));

    let lastGoodTime = 0;
    let ignoreSeekUntil = 0;
    let autosaveTimer = null;
    let listenersBound = false;

    function applyActiveListeningContent() {
      const content = (typeof R().getActiveTestContent === "function" && R().getActiveTestContent()) || {};
      const listening = content.listening || {};
      const body = $("listenBody");
      const aud = audio();

      if (body && typeof listening.html === "string" && listening.html.trim()) {
        body.innerHTML = listening.html;
      }

      if (aud && typeof listening.audioSrc === "string" && listening.audioSrc.trim()) {
        let source = aud.querySelector("source");
        if (!source) {
          source = document.createElement("source");
          source.type = "audio/mpeg";
          aud.appendChild(source);
        }
        source.src = listening.audioSrc.trim();
        aud.load();
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

    function getScopedElements(selector) {
      const root = listeningRoot();
      return root ? Array.from(root.querySelectorAll(selector)) : [];
    }

    function getListeningAnswers() {
      const out = {};

      getScopedElements("[data-lq]").forEach((el) => {
        const q = String(el.dataset.lq || "").trim();
        if (!q) return;

        if (el.type === "checkbox") {
          out[q] = el.checked ? (el.value || "true") : "";
        } else {
          out[q] = String(el.value || "").trim();
        }
      });

      getScopedElements("[data-lq-radio]").forEach((el) => {
        const q = String(el.dataset.lqRadio || "").trim();
        if (!q) return;

        if (!(q in out)) out[q] = "";
        if (el.checked) out[q] = String(el.value || "").trim();
      });

      return out;
    }

    function setAutosaveText(text) {
      const a = $("listenAutosave");
      if (a) a.textContent = text;
    }

    function saveListeningAnswers() {
      const answers = getListeningAnswers();
      S().setJSON(L_KEYS.answers, answers);

      setAutosaveText("Autosave: saved");

      try {
        if (autosaveTimer) clearTimeout(autosaveTimer);
      } catch (_) {}

      autosaveTimer = setTimeout(() => {
        setAutosaveText("Autosave: ready");
      }, 800);
    }

    function queueSaveListeningAnswers() {
      try {
        if (autosaveTimer) clearTimeout(autosaveTimer);
      } catch (_) {}

      autosaveTimer = setTimeout(() => {
        saveListeningAnswers();
      }, 0);
    }

    function loadListeningAnswers() {
      const answers = S().getJSON(L_KEYS.answers, null);
      if (!answers || typeof answers !== "object") return;

      getScopedElements("[data-lq]").forEach((el) => {
        const q = String(el.dataset.lq || "").trim();
        if (!q) return;
        if (Object.prototype.hasOwnProperty.call(answers, q)) {
          el.value = answers[q] ?? "";
        }
      });

      getScopedElements("[data-lq-radio]").forEach((el) => {
        const q = String(el.dataset.lqRadio || "").trim();
        if (!q) return;
        el.checked = Object.prototype.hasOwnProperty.call(answers, q)
          ? String(answers[q]) === String(el.value)
          : false;
      });
    }

    function collectListeningPayload(reason) {
      saveListeningAnswers();

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
        try {
          clearInterval(transferInterval);
        } catch (_) {}
      }
      transferInterval = null;
      try {
        UI().setExamNavTimer("");
      } catch (_) {}
    }

    function startTransferTime() {
      if (submitted || transferActive) return;

      transferActive = true;
      transferEndsAt = Date.now() + 2 * 60 * 1000;

      try {
        Modal().showModal(
          "2 minutes to check answers",
          "The audio has ended. You have 2 minutes to check your answers. The Listening section will be submitted automatically when the timer reaches 00:00.",
          {
            mode: "confirm",
            submitText: "Continue",
            onConfirm: () => {},
          }
        );
      } catch (_) {}

      try {
        UI().setExamNavStatus("Status: Listening — check answers");
      } catch (_) {}

      const tick = () => {
        const msLeft = Math.max(0, transferEndsAt - Date.now());
        const totalSec = Math.ceil(msLeft / 1000);
        const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
        const ss = String(totalSec % 60).padStart(2, "0");

        try {
          UI().setExamNavTimer(`${mm}:${ss}`);
        } catch (_) {}

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

      stopTransferTime();

      const aud = audio();
      if (aud) {
        try {
          aud.pause();
        } catch {}
      }

      submitted = true;
      strictActive = false;

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

      saveListeningAnswers();

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
      if (p) {
        p.onclick = () => {
          saveListeningAnswers();
          goToPage(currentPageIndex - 1);
        };
      }
      if (n) {
        n.onclick = () => {
          saveListeningAnswers();
          goToPage(currentPageIndex + 1);
        };
      }

      tabButtons().forEach((btn) => {
        btn.onclick = () => {
          saveListeningAnswers();
          const idx = parseInt(btn.dataset.listenTab, 10);
          if (!Number.isNaN(idx)) goToPage(idx);
        };
      });
    }

    function enableStrictAudio(aud) {
      if (!aud) return;

      const isAdmin = isAdminView();

      // Keep this exactly as intended by your current setup
      const allowStudentScrub = !!(R() && R().TEMP_STUDENT_AUDIO_SCRUB === false);
      const allowControls = isAdmin || allowStudentScrub;

      strictActive = !allowControls;

      aud.controls = allowControls;
      aud.setAttribute("controlsList", "nodownload noplaybackrate noremoteplayback");
      aud.disablePictureInPicture = true;

      lastGoodTime = aud.currentTime || 0;

      aud.addEventListener("timeupdate", () => {
        if (submitted) return;

        const t = aud.currentTime || 0;

        if (strictActive) {
          if (Math.abs(t - lastGoodTime) > 1.25 && !aud.ended) {
            try {
              aud.currentTime = lastGoodTime;
            } catch {}
            return;
          }
        }

        lastGoodTime = t;

        if (Math.floor(t) % 5 === 0) {
          saveListeningAnswers();
        }
      });

      aud.addEventListener("ended", () => {
        if (submitted) return;
        saveListeningAnswers();
        startTransferTime();
      });

      if (!strictActive) return;

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
        try {
          aud.currentTime = lastGoodTime;
        } catch {}
      });

      window.addEventListener(
        "keydown",
        (e) => {
          if (!strictActive || submitted) return;

          const t = e.target;
          if (
            t &&
            (t.tagName === "INPUT" ||
              t.tagName === "TEXTAREA" ||
              t.tagName === "SELECT" ||
              t.isContentEditable)
          ) {
            return;
          }

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

    function bindAnswerListeners() {
      if (listenersBound) return;
      listenersBound = true;

      const root = listeningRoot();
      if (!root) return;

      const saveHandler = (e) => {
        const t = e.target;
        if (!t) return;

        if (
          t.matches("[data-lq]") ||
          t.matches("[data-lq-radio]") ||
          t.matches("input") ||
          t.matches("textarea") ||
          t.matches("select")
        ) {
          queueSaveListeningAnswers();
        }
      };

      root.addEventListener("input", saveHandler, true);
      root.addEventListener("change", saveHandler, true);
      root.addEventListener("keyup", saveHandler, true);
      root.addEventListener("blur", saveHandler, true);

      window.addEventListener("beforeunload", () => {
        try {
          saveListeningAnswers();
        } catch (_) {}
      });
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
      bindAnswerListeners();

      setStatus("Status: Not started");
      saveListeningAnswers();
    }

    async function startAudioFromUserGesture() {
      const s = sec();
      const m = modal();
      const aud = audio();
      if (!s || !aud) return;
      if (submitted) return;

      saveListeningAnswers();
      setStatus("Status: Loading audio...");

      try {
        aud.pause();
      } catch {}

      aud.muted = false;
      aud.volume = 1;

      try {
        aud.currentTime = 0;
      } catch {}

      aud.load();

      try {
        await aud.play();

        started = true;
        S().set(L_KEYS.started, "true");

        s.classList.add("started");
        if (m) m.style.display = "none";

        setupNavHandlers();
        bindAnswerListeners();

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

      const isAdmin =
        (UI && typeof UI().isAdminView === "function" && UI().isAdminView() === true) ||
        (window.IELTS?.Access?.isAdmin?.() === true) ||
        false;

      if (submitted) {
        const s = sec();
        if (s) s.classList.add("view-only");
        if (s) s.classList.remove("hidden");
        lockReading(false);
        document.dispatchEvent(new CustomEvent("listening:submitted"));
        return;
      }

      showListening();

      const sBtn = startBtn();
      if (sBtn) sBtn.onclick = startAudioFromUserGesture;

      const submitNow = $("submitListeningBtn");
      if (submitNow) {
        if (!isAdmin) {
          submitNow.classList.add("hidden");
        } else {
          submitNow.onclick = () => {
            if (submitted) return;

            saveListeningAnswers();

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
                try {
                  window.__IELTS_READING_INIT__ = false;
                } catch (_) {}
                try {
                  window.IELTS?.Router?.setHashRoute?.(
                    (R().getActiveTestId?.() || R().TESTS?.defaultTestId || "ielts1"),
                    "reading"
                  );
                } catch (_) {}
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
          saveListeningAnswers();
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
