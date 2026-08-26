(function () {
  function boot(root) {
    if (!root || root.dataset.lgsBooted) return;
    root.dataset.lgsBooted = "1";

    var openBtn = root.querySelector("[data-lgs-open]");
    var closeBtn = root.querySelector("[data-lgs-close]");
    var wrap = root.querySelector("[data-lgs-frame-wrap]");
    var frame = root.querySelector("[data-lgs-frame]");
    var status = root.querySelector("[data-lgs-status]");
    var base = root.getAttribute("data-editor-base") || "";
    var productGid = root.getAttribute("data-product-gid") || "";
    var variantId = root.getAttribute("data-variant-id") || "";
    var shop = root.getAttribute("data-shop") || "";
    var builderType = root.getAttribute("data-builder-type") || "upload_by_size";

    function attachDesign(designId, version, cartProperties) {
      if (!designId) return;
      root.dataset.lgsDesignId = designId;
      root.dataset.lgsDesignVersion = String(version || 1);
      setStatus("Design saved — add to cart to continue.");
      document
        .querySelectorAll('form[action="/cart/add"], form[action*="/cart/add"]')
        .forEach(function (form) {
          upsertHidden(form, "properties[_lgs_design_id]", designId);
          upsertHidden(
            form,
            "properties[_lgs_design_version]",
            String(version || 1),
          );
          if (cartProperties && typeof cartProperties === "object") {
            Object.keys(cartProperties).forEach(function (key) {
              if (key === "_lgs_design_id" || key === "_lgs_design_version")
                return;
              upsertHidden(form, "properties[" + key + "]", cartProperties[key]);
            });
          }
        });
    }

    function editorPath() {
      return builderType === "gang_sheet"
        ? "/editor/gang-sheet"
        : "/editor/upload-by-size";
    }

    function editorUrl() {
      var u = new URL(editorPath(), base || window.location.origin);
      u.searchParams.set("productGid", productGid);
      u.searchParams.set("variantId", variantId);
      u.searchParams.set("shop", shop);
      u.searchParams.set("embedded", "1");
      return u.toString();
    }

    function setStatus(text) {
      if (!status) return;
      status.hidden = !text;
      status.textContent = text || "";
    }

    openBtn &&
      openBtn.addEventListener("click", function () {
        if (!base) {
          window.alert(
            "Editor URL is not configured on this block yet. Set Editor base URL in the theme editor.",
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

      wrap.hidden = true;
      frame.src = "about:blank";
      attachDesign(designId, version, event.data.cartProperties);
    });

    var params = new URLSearchParams(window.location.search);
    attachDesign(
      params.get("lgs_design_id"),
      params.get("lgs_design_version") || "1",
    );
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

  document
    .querySelectorAll("#lgs-upload-by-size, #lgs-gang-sheet, .lgs-ubs, .lgs-gs")
    .forEach(boot);
})();
