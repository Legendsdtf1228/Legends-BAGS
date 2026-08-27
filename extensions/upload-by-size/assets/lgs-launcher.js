(function () {
  function boot(root) {
    if (!root || root.dataset.lgsBooted) return;
    root.dataset.lgsBooted = "1";

    var openBtn = root.querySelector("[data-lgs-open]");
    var closeBtn = root.querySelector("[data-lgs-close]");
    var wrap = root.querySelector("[data-lgs-frame-wrap]");
    var frame = root.querySelector("[data-lgs-frame]");
    var status = root.querySelector("[data-lgs-status]");
    var warn = root.querySelector("[data-lgs-design-warn]");
    var attached = root.querySelector("[data-lgs-design-attached]");
    var base = root.getAttribute("data-editor-base") || "";
    var productGid = root.getAttribute("data-product-gid") || "";
    var variantId = root.getAttribute("data-variant-id") || "";
    var shop = root.getAttribute("data-shop") || "";
    var builderType = root.getAttribute("data-builder-type") || "upload_by_size";

    function hasDesign() {
      return Boolean(root.dataset.lgsDesignId);
    }

    function cartForms() {
      var section = root.closest("section") || root.parentElement;
      var nearby = section
        ? Array.prototype.slice.call(
            section.querySelectorAll('form[action="/cart/add"], form[action*="/cart/add"]'),
          )
        : [];
      if (nearby.length) return nearby;
      return Array.prototype.slice
        .call(document.querySelectorAll('form[action="/cart/add"], form[action*="/cart/add"]'))
        .filter(function (form) {
          var idInput = form.querySelector('[name="id"]');
          return idInput && String(idInput.value) === String(variantId);
        });
    }

    function isTargetForm(form) {
      return Boolean(form && cartForms().indexOf(form) !== -1);
    }

    function currentVariantId() {
      var form = cartForms()[0];
      var idInput = form && form.querySelector('[name="id"]');
      return (idInput && idInput.value) || variantId;
    }

    function syncUi() {
      var ready = hasDesign();
      root.classList.toggle("lgs--design-ready", ready);
      root.classList.toggle("lgs--needs-design", !ready);
      if (warn) warn.hidden = ready;
      if (attached) {
        attached.hidden = !ready;
        if (ready) {
          attached.textContent =
            "Design attached ✓  ·  ready for cart  ·  v" +
            (root.dataset.lgsDesignVersion || "1");
        }
      }
      if (status) {
        if (ready) {
          status.hidden = false;
          status.textContent =
            status.textContent || "Design attached — you can add this product to cart.";
          status.classList.add("lgs-status--ok");
          status.classList.remove("lgs-status--warn");
        } else {
          status.classList.remove("lgs-status--ok");
        }
      }
    }

    function attachDesign(designId, version, cartProperties) {
      if (!designId) return;
      root.dataset.lgsDesignId = designId;
      root.dataset.lgsDesignVersion = String(version || 1);
      setStatus("Design attached — add to cart to continue.", "ok");
      cartForms().forEach(function (form) {
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
      syncUi();
    }

    function editorPath() {
      return builderType === "gang_sheet"
        ? "/editor/gang-sheet"
        : "/editor/upload-by-size";
    }

    function editorUrl() {
      var u = new URL(editorPath(), base || window.location.origin);
      u.searchParams.set("productGid", productGid);
      u.searchParams.set("variantId", currentVariantId());
      u.searchParams.set("shop", shop);
      u.searchParams.set("embedded", "1");
      return u.toString();
    }

    function setStatus(text, kind) {
      if (!status) return;
      status.hidden = !text;
      status.textContent = text || "";
      status.classList.toggle("lgs-status--ok", kind === "ok");
      status.classList.toggle("lgs-status--warn", kind === "warn");
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

    function blockMissingDesign(event) {
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      setStatus("Create and save a design before adding this product to cart.", "warn");
      if (warn) {
        warn.hidden = false;
        warn.focus && warn.focus();
      }
    }

    // Product-scoped hard gate. Only the cart form in the same product section
    // is blocked; quick-add forms and unrelated products remain untouched.
    document.addEventListener(
      "submit",
      function (event) {
        if (hasDesign() || !isTargetForm(event.target)) return;
        blockMissingDesign(event);
      },
      true,
    );

    document.addEventListener(
      "click",
      function (event) {
        if (hasDesign()) return;
        var target = event.target;
        if (!target || !target.closest) return;
        var btn = target.closest(
          'button[name="add"], button[type="submit"], [name="add"], .product-form__submit, [data-lgs-require-design]',
        );
        if (!btn) return;
        var form = btn.form || btn.closest("form");
        if (!isTargetForm(form)) return;
        blockMissingDesign(event);
      },
      true,
    );

    var params = new URLSearchParams(window.location.search);
    var fromUrl = params.get("lgs_design_id");
    if (fromUrl) {
      attachDesign(fromUrl, params.get("lgs_design_version") || "1");
    } else {
      syncUi();
    }
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
