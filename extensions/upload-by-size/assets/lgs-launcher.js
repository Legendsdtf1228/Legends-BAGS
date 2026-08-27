(function () {
  var SEL = "#lgs-upload-by-size,#lgs-gang-sheet,.lgs-ubs,.lgs-gs";
  function bootAll() {
    if (window.__lgsBootAll) return window.__lgsBootAll();
    document.querySelectorAll(SEL).forEach(function (r) {
      if (window.__lgsBoot) window.__lgsBoot(r);
    });
  }
  var roots = document.querySelectorAll(SEL);
  if (!roots.length) return;
  var base = (roots[0].getAttribute("data-editor-base") || "").replace(/\/$/, "");
  if (!base) return;
  if (window.__lgsBoot) {
    bootAll();
    return;
  }
  var s = document.createElement("script");
  s.src = base + "/lgs-launcher.full.js";
  s.async = true;
  s.onload = bootAll;
  s.onerror = function () {
    console.error("[Legends BAGS] Could not load launcher from " + s.src);
  };
  document.head.appendChild(s);
})();
