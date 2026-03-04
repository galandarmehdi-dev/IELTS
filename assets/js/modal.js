/* assets/js/modal.js */
(function () {
  "use strict";

  const UI = () => window.IELTS.UI;
  const S = () => window.IELTS.Storage;
  const R = () => window.IELTS.Registry;

  let MODAL_MODE = "confirm"; // confirm | final | gate | locked | password
  let MODAL_ONCONFIRM = null;
  let MODAL_ONCANCEL = null;
  let MODAL_LOCKED = false;

  function $(id) {
    return document.getElementById(id);
  }

  function hideModal() {
    if (MODAL_MODE === "locked") return; // locked means cannot close
    const modal = $("modal");
    if (modal) modal.classList.add("hidden");
  }

  function showModal(title, text, opts = {}) {
    const modal = $("modal");
    const t = $("modalTitle");
    const p = $("modalText");
    const nameWrap = $("modalNameWrap");
    const nameInput = $("modalFullName");
    const passWrap = $("modalPassWrap");
    const passInput = $("modalPasscode");
    const passError = $("modalPassError");
    const submit = $("modalSubmitBtn");
    const cancel = $("modalCancelBtn");

    // Normalize mode to avoid case/typo issues (e.g., "PASSWORD" vs "password").
    MODAL_MODE = String(opts.mode || "confirm").toLowerCase();
    MODAL_ONCONFIRM = typeof opts.onConfirm === "function" ? opts.onConfirm : null;
    MODAL_ONCANCEL = typeof opts.onCancel === "function" ? opts.onCancel : null;

    MODAL_LOCKED = (MODAL_MODE === "locked" || MODAL_MODE === "gate");

    if (t) t.textContent = title || "";
    if (p) p.textContent = text || "";

    // name required only in "final"
    const isFinal = MODAL_MODE === "final";
    // Also allow forcing password UI via opts.password === true
    const isPassword = (MODAL_MODE === "password") || (opts && opts.password === true);
    if (nameWrap) nameWrap.classList.toggle("hidden", !isFinal);
    if (passWrap) passWrap.classList.toggle("hidden", !isPassword);
    if (passError) { passError.textContent = ""; passError.classList.add("hidden"); }
    if (passInput && isPassword) { passInput.value = ""; }

    // buttons
    if (cancel) {
      const showCancel = (opts.showCancel === true) && (MODAL_MODE === "confirm");
      cancel.classList.toggle("hidden", !showCancel);
      cancel.textContent = opts.cancelText || "Cancel";
      cancel.disabled = false;
    }

    if (submit) {
      submit.classList.toggle("hidden", (MODAL_MODE === "locked")); // gate keeps button visible
      submit.textContent = opts.submitText || (isFinal ? "Submit" : "OK");
      submit.disabled = false;
    }

    if (nameInput && isFinal) {
      // preload saved name if exists
      const saved = (S().get(R().TESTS.writingKeys.studentName, "") || "").trim();
      if (saved && !nameInput.value) nameInput.value = saved;
    }

    if (modal) modal.classList.remove("hidden");

    if (isFinal) {
      setTimeout(() => nameInput?.focus?.(), 0);
    }
  }

  function bindModalOnce() {
    const submit = $("modalSubmitBtn");
    const cancel = $("modalCancelBtn");

    if (submit && !submit.dataset.bound) {
      submit.dataset.bound = "1";
      submit.addEventListener("click", async () => {
        if (MODAL_MODE === "locked") return;

        // CONFIRM MODE
        if (MODAL_MODE === "confirm") {
          const fn = MODAL_ONCONFIRM;
          MODAL_ONCONFIRM = null;
          MODAL_ONCANCEL = null;
          hideModal();
          if (typeof fn === "function") fn();
          return;
        }

        
        // GATE MODE (non-closeable until clicking the button)
        if (MODAL_MODE === "gate") {
          const fn = MODAL_ONCONFIRM;
          MODAL_ONCONFIRM = null;
          MODAL_ONCANCEL = null;
          // temporarily unlock to close
          MODAL_LOCKED = false;
          hideModal();
          if (typeof fn === "function") fn();
          return;
        }

        
        // PASSWORD MODE (test unlock)
        if (MODAL_MODE === "password") {
          const passInput = $("modalPasscode");
          const passError = $("modalPassError");
          const typed = String(passInput?.value || "");
          const expected = String(window.IELTS?.Registry?.TEST_PASSWORD || "").trim();

          if (!expected) {
            // if not configured, allow through (fail-open)
            const fn = MODAL_ONCONFIRM;
            MODAL_ONCONFIRM = null;
            MODAL_ONCANCEL = null;
            hideModal();
            if (typeof fn === "function") fn();
            return;
          }

          if (typed.trim() !== expected) {
            if (passError) {
              passError.textContent = "Wrong password. Please try again.";
              passError.classList.remove("hidden");
            }
            passInput?.focus?.();
            passInput?.select?.();
            return;
          }

          const fn = MODAL_ONCONFIRM;
          MODAL_ONCONFIRM = null;
          MODAL_ONCANCEL = null;
          hideModal();
          if (typeof fn === "function") fn();
          return;
        }

        // FINAL MODE (name required)
        const nameInput = $("modalFullName");
    const passWrap = $("modalPassWrap");
    const passInput = $("modalPasscode");
    const passError = $("modalPassError");
        const fullName = (nameInput?.value || "").trim().replace(/\s+/g, " ");

        if (!UI().isValidFullName(fullName)) {
          showModal("Name required", "Please type your Name and Surname to submit the exam.", {
            mode: "final",
          });
          setTimeout(() => nameInput?.focus?.(), 0);
          return;
        }

        S().set(R().TESTS.writingKeys.studentName, fullName);

        if (typeof window.__IELTS_SUBMIT_FINAL__ === "function") {
          submit.disabled = true;
          submit.textContent = "Submitting...";
          await window.__IELTS_SUBMIT_FINAL__("Student submitted exam.");
          return;
        }

        showModal("Error", "Submit function is not ready. Please refresh and try again.", {
          mode: "confirm",
        });
      });
    }

    if (cancel && !cancel.dataset.bound) {
      cancel.dataset.bound = "1";
      cancel.addEventListener("click", () => {
        if (MODAL_MODE === "locked") return;
        const fn = MODAL_ONCANCEL;
        MODAL_ONCONFIRM = null;
        MODAL_ONCANCEL = null;
        hideModal();
        if (typeof fn === "function") fn();
      });
    }
  }

  window.IELTS = window.IELTS || {};
  window.IELTS.Modal = { showModal, hideModal, bindModalOnce };
})();
