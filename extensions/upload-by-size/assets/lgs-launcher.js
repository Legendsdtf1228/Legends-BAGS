(function () {
  var SEL = "#lgs-upload-by-size,#lgs-gang-sheet,.lgs-ubs,.lgs-gs";

  function isStorefrontRoot(root) {
    var shop = root.getAttribute("data-shop") || "";
    if (!shop) return false;
    var host = window.location.hostname;
    return host === shop || host.endsWith(".myshopify.com");
  }

  function resolveScriptBase(root) {
    if (isStorefrontRoot(root)) {
      return window.location.origin.replace(/\/$/, "") + "/apps/legends-bags";
    }
    var base = (root.getAttribute("data-editor-base") || "").replace(/\/$/, "");
    return base;
  }

  function bootAll() {
    if (window.__lgsBootAll) return window.__lgsBootAll();
    document.querySelectorAll(SEL).forEach(function (r) {
      if (window.__lgsBoot) window.__lgsBoot(r);
    });
  }

  var roots = document.querySelectorAll(SEL);
  if (!roots.length) return;

  var scriptBase = resolveScriptBase(roots[0]);
  if (!scriptBase) {
    console.error("[Legends BAGS] Launcher not configured — app proxy or Editor base URL required.");
    roots.forEach(function (root) {
      var btn = root.querySelector("[data-lgs-open]");
      if (!btn || btn.dataset.lgsMisconfigBound) return;
      btn.dataset.lgsMisconfigBound = "1";
      btn.addEventListener("click", function () {
        window.alert(
          "Legends BAGS editor is not available yet. Install the Legends BAGS app and enable the app proxy, or set Editor base URL in the theme block settings.",
        );
      });
    });
    return;
  }

  if (window.__lgsBoot) {
    bootAll();
    return;
  }

  var s = document.createElement("script");
  s.src = scriptBase + "/lgs-launcher.full.js";
  s.async = true;
  s.onload = bootAll;
  s.onerror = function () {
    if (!isStorefrontRoot(roots[0])) {
      console.error("[Legends BAGS] Could not load launcher from " + s.src);
      roots.forEach(function (root) {
        var status = root.querySelector("[data-lgs-status]");
        if (status) {
          status.hidden = false;
          status.textContent = "Could not load the design editor. Check that Legends BAGS is installed.";
          status.classList.add("lgs-status--error");
        }
      });
      return;
    }
    var fallback = window.location.origin.replace(/\/$/, "") + "/apps/legends-bags/lgs-launcher.full.js";
    if (s.src === fallback) return;
    s.src = fallback;
  };
  document.head.appendChild(s);
})();
