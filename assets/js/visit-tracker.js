(function () {
  "use strict";

  var script = document.currentScript;
  var endpoint = script && script.getAttribute("data-endpoint");
  if (!endpoint || !window.crypto || !window.crypto.randomUUID) return;
  try {
    if (new URL(endpoint).protocol !== "https:") return;
  } catch (_) {
    return;
  }

  // Each page load has its own ID; no cookies or persistent visitor identifier.
  var visitId = window.crypto.randomUUID();
  var path = window.location.pathname; // Exclude query strings and fragments.
  var visibleSince = null;
  var durationMs = 0;
  var started = false;
  var suspended = false;

  function checkpoint() {
    if (visibleSince !== null) {
      var now = performance.now();
      durationMs += Math.max(0, now - visibleSince);
      visibleSince = now;
    }
  }

  function report(leaving) {
    if (!started) return;
    checkpoint();
    var body = JSON.stringify({
      visit_id: visitId,
      path: path,
      duration_ms: Math.round(durationMs)
    });

    // A cumulative counter makes retries and out-of-order delivery harmless.
    if (leaving && navigator.sendBeacon) {
      try {
        if (navigator.sendBeacon(endpoint, new Blob([body], { type: "text/plain" }))) return;
      } catch (_) { /* Try fetch if the beacon cannot be queued. */ }
    }
    try {
      fetch(endpoint, {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
        keepalive: true,
        headers: { "Content-Type": "text/plain" },
        body: body
      }).catch(function () { /* Logging must never interrupt the page. */ });
    } catch (_) { /* Unsupported browsers can still use the site. */ }
  }

  function resume() {
    if (suspended || document.visibilityState !== "visible" || document.prerendering) return;
    if (visibleSince === null) visibleSince = performance.now();
    if (!started) {
      started = true;
      report(false);
    }
  }

  function pause() {
    checkpoint();
    visibleSince = null;
    report(true);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") resume();
    else pause();
  });
  document.addEventListener("prerenderingchange", resume);
  window.addEventListener("pagehide", function () {
    suspended = true;
    pause();
  });
  window.addEventListener("pageshow", function () {
    suspended = false;
    resume(); // Continue the same visit after back/forward cache restoration.
  });
  window.setInterval(function () {
    if (visibleSince !== null) report(false);
  }, 15000);
  resume();
})();
