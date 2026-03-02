/* assets/js/modal.js */
(function () {
  "use strict";

  const UI = () => window.IELTS.UI;
  const S = () => window.IELTS.Storage;
  const R = () => window.IELTS.Registry;

  let MODAL_MODE = "confirm"; // confirm | final | locked | gate
  let MODAL_ONCONFIRM = null;
  let MODAL_ONCANCEL = null;
  let MODAL_LOCKED = false;

  function $(id) {
    return document.getElementById(id);
  }

  function hideModal(force = false) {
    if (MODAL_LOCKED && !force) return; // locked/gate means cannot close unless forced
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

    MODAL_LOCKED = MODAL_MODE === "locked" || MODAL_MODE === "gate";

    if (t) t.textContent = title || "";
    if (p) p.textContent = text || "";

    const isFinal = MODAL_MODE === "final";
    if (nameWrap) nameWrap.classList.toggle("hidden", !isFinal);

    if (cancel) {
      const showCancel = opts.showCancel === true;
      cancel.classList.toggle("hidden", !(showCancel && !MODAL_LOCKED));
      cancel.textContent = opts.cancelText || "Cancel";
      cancel.disabled = MODAL_LOCKED;
    }

    if (submit) {
      // locked: no button; gate: button visible
      submit.classList.toggle("hidden", MODAL_MODE === "locked");
      submit.textContent = opts.submitText || (isFinal ? "Submit" : "OK");
      submit.disabled = false;
    }

    if (nameInput && isFinal) {
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
        if (MODAL_LOCKED && MODAL_MODE === "locked") return;

        // CONFIRM / GATE MODE
        if (MODAL_MODE === "confirm" || MODAL_MODE === "gate") {
          const fn = MODAL_ONCONFIRM;
          MODAL_ONCONFIRM = null;
          MODAL_ONCANCEL = null;

          // gate is "locked" until clicking, so force-close is required
          hideModal(MODAL_MODE === "gate");
          if (typeof fn === "function") fn();
          return;
        }

        // FINAL MODE (name required)
        const nameInput = $("modalFullName");
        const fullName = (nameInput?.value || "").trim().replace(/\s+/g, " ");

        if (!UI().isValidFullName(fullName)) {
          $("modalText").textContent =
            "Name required. Please type your Name and Surname before submitting.";
          nameInput?.focus?.();
          return;
        }

        // persist name
        try {
          S().set(R().TESTS.writingKeys.studentName, fullName);
        } catch {}

        const fn = MODAL_ONCONFIRM;
        MODAL_ONCONFIRM = null;
        MODAL_ONCANCEL = null;

        hideModal();
        if (typeof fn === "function") fn(fullName);
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
  window.IELTS.Modal = { showModal, hideModal, bindModalOnce };
})();
