/* assets/js/modal.js */
(function () {
  "use strict";

  const UI = () => window.IELTS.UI;
  const S = () => window.IELTS.Storage;
  const R = () => window.IELTS.Registry;

  // confirm | gate | admincode | final | locked
  let MODAL_MODE = "confirm";
  let MODAL_ONCONFIRM = null;
  let MODAL_ONCANCEL = null;
  let MODAL_LOCKED = false;

  function $(id) {
    return document.getElementById(id);
  }

  function hideModal(force = false) {
    if (MODAL_LOCKED && !force) return; // locked means cannot close
    const modal = $("modal");
    if (modal) modal.classList.add("hidden");
    // clear handlers after close
    MODAL_ONCONFIRM = null;
    MODAL_ONCANCEL = null;
    MODAL_MODE = "confirm";
    MODAL_LOCKED = false;
  }

  function showModal(title, text, opts = {}) {
    const modal = $("modal");
    const t = $("modalTitle");
    const p = $("modalText");
    const nameWrap = $("modalNameWrap");
    const nameInput = $("modalFullName");
    const submit = $("modalSubmitBtn");
    const cancel = $("modalCancelBtn");

    MODAL_MODE = opts.mode || "confirm";
    MODAL_ONCONFIRM = typeof opts.onConfirm === "function" ? opts.onConfirm : null;
    MODAL_ONCANCEL = typeof opts.onCancel === "function" ? opts.onCancel : null;

    // "locked" blocks any closing.
    // For "gate" / "admincode" we want non-closeable, but still with a submit button.
    MODAL_LOCKED =
      opts.locked === true ||
      MODAL_MODE === "locked" ||
      MODAL_MODE === "gate" ||
      MODAL_MODE === "admincode";

    if (t) t.textContent = title || "";
    if (p) p.textContent = text || "";

    const isFinal = MODAL_MODE === "final";
    const isGate = MODAL_MODE === "gate";
    const isAdminCode = MODAL_MODE === "admincode";

    // name required only in "final"
    if (nameWrap) nameWrap.classList.toggle("hidden", !isFinal);

    // buttons
    if (cancel) {
      const showCancel = opts.showCancel === true;
      // never show cancel in gate/admincode/locked
      const allowCancel = showCancel && !isGate && !isAdminCode && MODAL_MODE !== "locked";
      cancel.classList.toggle("hidden", !allowCancel);
      cancel.textContent = opts.cancelText || "Cancel";
      cancel.disabled = MODAL_MODE === "locked";
    }

    if (submit) {
      // submit is hidden only in true "locked" mode
      submit.classList.toggle("hidden", MODAL_MODE === "locked");
      submit.textContent =
        opts.submitText || (isFinal ? "Submit" : isGate ? "Continue" : isAdminCode ? "Unlock" : "OK");
      submit.disabled = false;
    }

    if (nameInput && isFinal) {
      const saved = (S().get(R().TESTS.writingKeys.studentName, "") || "").trim();
      if (saved && !nameInput.value) nameInput.value = saved;
    }

    if (modal) modal.classList.remove("hidden");

    if (isFinal) setTimeout(() => nameInput?.focus?.(), 0);
  }

  function bindModalOnce() {
    const submit = $("modalSubmitBtn");
    const cancel = $("modalCancelBtn");

    if (submit && !submit.dataset.bound) {
      submit.dataset.bound = "1";
      submit.addEventListener("click", async () => {
        if (MODAL_MODE === "locked") return;

        // CONFIRM / GATE / ADMINCODE: run callback and force close even if locked
        if (MODAL_MODE === "confirm" || MODAL_MODE === "gate" || MODAL_MODE === "admincode") {
          const fn = MODAL_ONCONFIRM;
          hideModal(true);
          if (typeof fn === "function") fn();
          return;
        }

        // FINAL MODE (name required)
        const nameInput = $("modalFullName");
        const fullName = (nameInput?.value || "").trim().replace(/\s+/g, " ");

        if (!UI().isValidFullName(fullName)) {
          showModal("Name required", "Please type your Name and Surname to submit the exam.", {
            mode: "final",
            locked: true,
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

        showModal("Error", "Submit function is not ready. Please refresh and try again.", { mode: "confirm" });
      });
    }

    if (cancel && !cancel.dataset.bound) {
      cancel.dataset.bound = "1";
      cancel.addEventListener("click", () => {
        if (MODAL_LOCKED) return;
        const fn = MODAL_ONCANCEL;
        hideModal(true);
        if (typeof fn === "function") fn();
      });
    }
  }

  window.IELTS = window.IELTS || {};
  window.IELTS.Modal = { showModal, hideModal, bindModalOnce };
})();
