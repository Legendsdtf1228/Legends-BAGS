(function () {
  var SEL = "#lgs-upload-by-size,#lgs-gang-sheet,.lgs-ubs,.lgs-gs";

  function shopDomain(root) {
    var fromData = (root && root.getAttribute("data-shop")) || "";
    var fromShopify = (window.Shopify && window.Shopify.shop) || "";
    return String(fromData || fromShopify)
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
  }

  function isShopifyStorefront(root) {
    if (window.Shopify && window.Shopify.shop) return true;
    var host = window.location.hostname;
    if (host.endsWith(".myshopify.com")) return true;
    var shop = shopDomain(root);
    return Boolean(shop && host === shop);
  }

  function resolveAppProxyBase(root) {
    if (isShopifyStorefront(root)) {
      return window.location.origin.replace(/\/$/, "") + "/apps/legends-bags";
    }
    var override = ((root && root.getAttribute("data-editor-base")) || "").replace(/\/$/, "");
    if (override) return override;
    var shop = shopDomain(root);
    if (shop) return "https://" + shop + "/apps/legends-bags";
    return "";
  }

  function themeFullScriptSrc() {
    var current = document.currentScript;
    var src = current && current.src ? String(current.src) : "";
    if (src && /lgs-launcher\.js(\?|$)/.test(src)) {
      return src.replace(/lgs-launcher\.js(?=\?|$)/, "lgs-launcher.full.js");
    }
    var tags = document.getElementsByTagName("script");
    for (var i = tags.length - 1; i >= 0; i--) {
      var href = tags[i].src || "";
      if (/lgs-launcher\.js(\?|$)/.test(href)) {
        return href.replace(/lgs-launcher\.js(?=\?|$)/, "lgs-launcher.full.js");
      }
    }
    return "";
  }

  function bootAll() {
    if (window.__lgsBootAll) return window.__lgsBootAll();
    document.querySelectorAll(SEL).forEach(function (r) {
      if (window.__lgsBoot) window.__lgsBoot(r);
    });
  }

  function showLoadError(roots, message) {
    roots.forEach(function (root) {
      var status = root.querySelector("[data-lgs-status]");
      if (status) {
        status.hidden = false;
        status.textContent = message;
        status.classList.add("lgs-status--error");
      }
    });
  }

  var roots = document.querySelectorAll(SEL);
  if (!roots.length) return;

  if (window.__lgsBoot) {
    bootAll();
    return;
  }

  var proxyBase = resolveAppProxyBase(roots[0]);
  var themeSrc = themeFullScriptSrc();
  var proxySrc = proxyBase ? proxyBase + "/lgs-launcher.full.js" : "";
  var loadError =
    "Could not load the design editor. Refresh this page and try again.";

  function loadScript(src, onFail) {
    var s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = bootAll;
    s.onerror = onFail;
    document.head.appendChild(s);
  }

  function tryProxy() {
    if (!proxySrc) {
      showLoadError(roots, loadError);
      return;
    }
    loadScript(proxySrc, function () {
      showLoadError(roots, loadError);
    });
  }

  if (themeSrc) {
    loadScript(themeSrc, tryProxy);
    return;
  }
  if (proxySrc) {
    tryProxy();
    return;
  }

  showLoadError(roots, loadError);
})();
