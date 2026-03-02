/* assets/js/modal.js (patched: gate is clickable; locked blocks; supports final mode) */
(function () {
  "use strict";

  let BOUND = false;
  let MODE = "normal"; // normal | gate | locked | final

  function $(id) {
    return document.getElementById(id);
  }

  function hideModal() {
    const m = $("modal");
    if (!m) return;
    m.classList.add("hidden");
  }

  function showModal(title, message, opts = {}) {
    MODE = opts.mode || "normal";

    const m = $("modal");
    const h = $("modalTitle");
    const b = $("modalBody");
    const cancel = $("modalCancelBtn");
    const submit = $("modalSubmitBtn");

    if (!m || !h || !b || !submit) return;

    h.textContent = title || "Notice";
    b.textContent = message || "";

    submit.textContent = opts.submitText || "OK";

    // Cancel handling
    if (cancel) {
      const cancelAllowed = !(MODE === "locked" || MODE === "final");
      cancel.classList.toggle("hidden", !cancelAllowed);
      cancel.textContent = opts.cancelText || "Cancel";
    }

    // Store callbacks on element (simpler)
    m.__onConfirm = typeof opts.onConfirm === "function" ? opts.onConfirm : null;
    m.__onCancel = typeof opts.onCancel === "function" ? opts.onCancel : null;

    // Show
    m.classList.remove("hidden");
  }

  function bindModalOnce() {
    if (BOUND) return;
    BOUND = true;

    const m = $("modal");
    const cancel = $("modalCancelBtn");
    const submit = $("modalSubmitBtn");

    if (cancel) {
      cancel.addEventListener("click", () => {
        if (MODE === "locked" || MODE === "final") return;
        try { m?.__onCancel?.(); } catch {}
        hideModal();
      });
    }

    if (submit) {
      submit.addEventListener("click", () => {
        // locked mode blocks interaction
        if (MODE === "locked") return;

        // gate/final/normal are allowed
        let ok = true;
        try {
          if (m?.__onConfirm) ok = m.__onConfirm() !== false;
        } catch {}
        if (ok !== false) hideModal();
      });
    }
  }

  window.IELTS = window.IELTS || {};
  window.IELTS.Modal = { showModal, hideModal, bindModalOnce };
})();
