(function () {
  "use strict";

  async function loadPartial(targetId, url) {
    const target = document.getElementById(targetId);
    if (!target) return;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load partial: ${url}`);
    target.innerHTML = await res.text();
  }

  let loaded = false;

  async function loadAllPartials() {
    if (loaded) {
      document.dispatchEvent(new CustomEvent("partials:loaded"));
      return;
    }
    await loadPartial("homeMount", "assets/partials/home.html");
    await loadPartial("speakingMount", "assets/partials/speaking.html");
    loaded = true;
    document.dispatchEvent(new CustomEvent("partials:loaded"));
  }

  window.IELTS = window.IELTS || {};
  window.IELTS.Partials = { loadAllPartials };
})();
