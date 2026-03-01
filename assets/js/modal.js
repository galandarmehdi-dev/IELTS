/* assets/js/modal.js */
(function () {
  "use strict";

  const UI = () => window.IELTS.UI;
  const S = () => window.IELTS.Storage;
  const R = () => window.IELTS.Registry;

  // Modal mode: "confirm" (no name) | "final" (name required)
  let MODAL_MODE = "confirm";
  let MODAL_ONCONFIRM = null;
  let MODAL_ONCANCEL = null;

  function hideModal() {
    const m = UI().$("modal");
    if (m) m.classList.add("hidden");
  }

  function showModal(title, text, opts = {}) {
    const $ = UI().$;

    if ($("modalTitle")) $("modalTitle").textContent = title;
    if ($("modalText")) $("modalText").textContent = text;

    MODAL_MODE = opts.mode === "final" ? "final" : "confirm";
    const needName = MODAL_MODE === "final";

    const nameWrap = $("modalNameWrap");
    const nameInput = $("modalFullName");
    const submitBtn = $("modalSubmitBtn");
    const cancelBtn = $("modalCancelBtn");

    if (nameWrap) nameWrap.classList.toggle("hidden", !needName);

    if (submitBtn) submitBtn.textContent = opts.submitText || (needName ? "Submit" : "OK");

    const showCancel = !!opts.showCancel;
    if (cancelBtn) {
      cancelBtn.classList.toggle("hidden", !showCancel);
      cancelBtn.textContent = opts.cancelText || "Cancel";
    }

    MODAL_ONCONFIRM = typeof opts.onConfirm === "function" ? opts.onConfirm : null;
    MODAL_ONCANCEL = typeof opts.onCancel === "function" ? opts.onCancel : null;

    // Prefill name from writing storage
    if (needName) {
      const existing = (S().get(R().TESTS.writingKeys.studentName, "") || "")
        .trim()
        .replace(/\s+/g, " ");
      if (nameInput) {
        if (!nameInput.value.trim() && existing) nameInput.value = existing;
        setTimeout(() => nameInput.focus(), 0);
      }
    }

    const modal = $("modal");
    if (modal) modal.classList.remove("hidden");
  }

  function bindModalOnce() {
    const $ = UI().$;
    const submit = $("modalSubmitBtn");
    const cancel = $("modalCancelBtn");

    if (submit && !submit.dataset.bound) {
      submit.dataset.bound = "1";
      submit.addEventListener("click", async () => {
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
