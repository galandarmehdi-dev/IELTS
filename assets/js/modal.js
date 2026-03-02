/* assets/js/modal.js */
(function () {
  "use strict";

  const UI = () => window.IELTS.UI;
  const S = () => window.IELTS.Storage;
  const R = () => window.IELTS.Registry;

  let MODAL_MODE = "confirm"; // confirm | final | locked | lockedAction
  let MODAL_ONCONFIRM = null;
  let MODAL_ONCANCEL = null;
  let MODAL_LOCKED = false;

  function $(id) {
    return document.getElementById(id);
  }

  function hideModal() {
    // lockedAction and locked cannot be closed until action completes
    if (MODAL_LOCKED) return;
    const modal = $("modal");
    if (modal) modal.classList.add("hidden");
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

    MODAL_LOCKED = (MODAL_MODE === "locked" || MODAL_MODE === "lockedAction");

    if (t) t.textContent = title || "";
    if (p) p.textContent = text || "";

    // name required only in "final"
    const isFinal = MODAL_MODE === "final";
    if (nameWrap) nameWrap.classList.toggle("hidden", !isFinal);

    // buttons
    if (cancel) {
      const showCancel = opts.showCancel === true;
      // In lockedAction/locked we never show cancel.
      cancel.classList.toggle("hidden", !(showCancel && MODAL_MODE === "confirm"));
      cancel.textContent = opts.cancelText || "Cancel";
      cancel.disabled = (MODAL_MODE !== "confirm");
    }

    if (submit) {
      const hideSubmit = (MODAL_MODE === "locked");
      submit.classList.toggle("hidden", hideSubmit);
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
        // lockedAction is locked but still has a button that must work
        if (MODAL_LOCKED && MODAL_MODE !== "lockedAction") return;

        // CONFIRM MODE
        if (MODAL_MODE === "confirm") {
          const fn = MODAL_ONCONFIRM;
          MODAL_ONCONFIRM = null;
          MODAL_ONCANCEL = null;
          hideModal();
          if (typeof fn === "function") fn();
          return;
        }

        // FINAL MODE (name required)
        const nameInput = $("modalFullName");
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
        if (MODAL_LOCKED) return;
        const fn = MODAL_ONCANCEL;
        MODAL_ONCONFIRM = null;
        MODAL_ONCANCEL = null;
        hideModal();
        if (typeof fn === "function") fn();
      });
    }
  }

  window.IELTS = window.IELTS || {};

  function forceHideModal() {
    MODAL_LOCKED = false;
    const modal = $("modal");
    if (modal) modal.classList.add("hidden");
  }

  window.IELTS.Modal = { showModal, hideModal, forceHideModal, bindModalOnce };
})();
