/* assets/js/bootstrap-init.js
   Step 1 foundation fix:
   If the page uses inline sections instead of partialsLoader,
   dispatch the event that app.js is waiting for.
*/
(function () {
  "use strict";

  if (window.__IELTS_BOOTSTRAP_INIT_BOUND__) return;
  window.__IELTS_BOOTSTRAP_INIT_BOUND__ = true;

  function dispatchPartialsLoadedOnce() {
    if (window.__IELTS_BOOTSTRAP_INIT_DISPATCHED__) return;
    window.__IELTS_BOOTSTRAP_INIT_DISPATCHED__ = true;

    try {
      document.dispatchEvent(new CustomEvent("partials:loaded"));
    } catch (e) {
      var evt = document.createEvent("Event");
      evt.initEvent("partials:loaded", true, true);
      document.dispatchEvent(evt);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", dispatchPartialsLoadedOnce, { once: true });
  } else {
    dispatchPartialsLoadedOnce();
  }
})();
