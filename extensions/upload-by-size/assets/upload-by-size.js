(function () {
  function boot(root) {
    if (!root || root.dataset.lgsBooted) return;
    root.dataset.lgsBooted = "1";

    var openBtn = root.querySelector("[data-lgs-open]");
    var closeBtn = root.querySelector("[data-lgs-close]");
    var wrap = root.querySelector("[data-lgs-frame-wrap]");
    var frame = root.querySelector("[data-lgs-frame]");
    var base = root.getAttribute("data-editor-base") || "";
    var productGid = root.getAttribute("data-product-gid") || "";
    var variantId = root.getAttribute("data-variant-id") || "";

    function editorUrl() {
      var u = new URL("/editor/upload-by-size", base || window.location.origin);
      u.searchParams.set("productGid", productGid);
      u.searchParams.set("variantId", variantId);
      u.searchParams.set("embedded", "1");
      return u.toString();
    }

    openBtn &&
      openBtn.addEventListener("click", function () {
        if (!base) {
          window.alert(
            "Upload-by-Size editor URL is not configured on this block yet.",
          );
          return;
        }
        frame.src = editorUrl();
        wrap.hidden = false;
      });

    closeBtn &&
      closeBtn.addEventListener("click", function () {
        wrap.hidden = true;
        frame.src = "about:blank";
      });

    window.addEventListener("message", function (event) {
      if (!event.data || event.data.type !== "lgs:design-ready") return;
      var designId = event.data.designId;
      var version = event.data.version;
      if (!designId) return;

      // Store properties for cart add — theme product form integration
      root.dataset.lgsDesignId = designId;
      root.dataset.lgsDesignVersion = String(version || 1);
      wrap.hidden = true;
      frame.src = "about:blank";

      // If a product form exists, inject hidden properties
      var form = document.querySelector('form[action="/cart/add"]');
      if (form) {
        upsertHidden(form, "properties[_lgs_design_id]", designId);
        upsertHidden(
          form,
          "properties[_lgs_design_version]",
          String(version || 1),
        );
      }
    });
  }

  function upsertHidden(form, name, value) {
    var input = form.querySelector('input[name="' + name + '"]');
    if (!input) {
      input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      form.appendChild(input);
    }
    input.value = value;
  }

  document.querySelectorAll("#lgs-upload-by-size, .lgs-ubs").forEach(boot);
})();
