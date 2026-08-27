(function () {
  function boot(root) {
    if (!root || root.dataset.lgsBooted) return;
    root.dataset.lgsBooted = "1";

    var openBtn = root.querySelector("[data-lgs-open]");
    var editBtn = root.querySelector("[data-lgs-edit]");
    var resetBtn = root.querySelector("[data-lgs-reset]");
    var closeBtn = root.querySelector("[data-lgs-close]");
    var wrap = root.querySelector("[data-lgs-frame-wrap]");
    var frame = root.querySelector("[data-lgs-frame]");
    var status = root.querySelector("[data-lgs-status]");
    var warn = root.querySelector("[data-lgs-design-warn]");
    var attached = root.querySelector("[data-lgs-design-attached]");
    var loading = root.querySelector("[data-lgs-loading]");
    var base = (root.getAttribute("data-editor-base") || "").replace(/\/$/, "");
    var productGid = root.getAttribute("data-product-gid") || "";
    var variantId = root.getAttribute("data-variant-id") || "";
    var shop = root.getAttribute("data-shop") || "";
    var builderType = root.getAttribute("data-builder-type") || "upload_by_size";
    var lastFocus = null;
    var scrollY = 0;

    function editorOrigin() {
      try {
        return new URL(base || window.location.origin).origin;
      } catch (e) {
        return window.location.origin;
      }
    }

    function hasDesign() {
      return Boolean(root.dataset.lgsDesignId);
    }

    function cartForms() {
      var section = root.closest("section") || root.closest(".product") || root.parentElement;
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
          return idInput && String(idInput.value) === String(currentVariantId());
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

    function removeHidden(form, name) {
      var input = form.querySelector('input[name="' + name + '"]');
      if (input) input.remove();
    }

    function setStatus(text, kind) {
      if (!status) return;
      status.hidden = !text;
      status.textContent = text || "";
      status.classList.toggle("lgs-status--ok", kind === "ok");
      status.classList.toggle("lgs-status--warn", kind === "warn");
      status.classList.toggle("lgs-status--error", kind === "error");
    }

    function syncUi() {
      var ready = hasDesign();
      root.classList.toggle("lgs--design-ready", ready);
      root.classList.toggle("lgs--needs-design", !ready);
      if (openBtn) {
        openBtn.textContent = ready
          ? openBtn.getAttribute("data-label-edit") || "Edit design"
          : openBtn.getAttribute("data-label-open") || openBtn.textContent;
      }
      if (editBtn) editBtn.hidden = !ready;
      if (resetBtn) resetBtn.hidden = !ready;
      if (warn) warn.hidden = ready;
      if (attached) {
        attached.hidden = !ready;
        if (ready) {
          var name = root.dataset.lgsDesignName;
          attached.textContent = name
            ? "Design attached ✓ · " + name + " · v" + (root.dataset.lgsDesignVersion || "1")
            : "Design attached ✓ · ready for cart · v" + (root.dataset.lgsDesignVersion || "1");
        }
      }
      if (ready) {
        setStatus("Design attached — you can add this product to cart.", "ok");
      }
    }

    function attachDesign(designId, version, cartProperties, designName) {
      if (!designId) return;
      root.dataset.lgsDesignId = designId;
      root.dataset.lgsDesignVersion = String(version || 1);
      if (designName) root.dataset.lgsDesignName = designName;
      setStatus("Design attached — add to cart to continue.", "ok");
      cartForms().forEach(function (form) {
        if (cartProperties && typeof cartProperties === "object") {
          Object.keys(cartProperties).forEach(function (key) {
            upsertHidden(form, "properties[" + key + "]", cartProperties[key]);
          });
        } else {
          upsertHidden(form, "properties[_lgs_design_id]", designId);
          upsertHidden(form, "properties[_lgs_design_version]", String(version || 1));
        }
      });
      syncUi();
    }

    function clearDesign() {
      delete root.dataset.lgsDesignId;
      delete root.dataset.lgsDesignVersion;
      delete root.dataset.lgsDesignName;
      cartForms().forEach(function (form) {
        [
          "_lgs_design_id",
          "_lgs_design_version",
          "_lgs_workflow",
          "_lgs_sheet_size",
          "_lgs_piece_count",
          "_lgs_price_ref",
          "Design",
        ].forEach(function (key) {
          removeHidden(form, "properties[" + key + "]");
        });
      });
      setStatus("Start fresh — create a new design.", "warn");
      syncUi();
    }

    function editorPath() {
      return builderType === "gang_sheet"
        ? "/editor/gang-sheet"
        : "/editor/upload-by-size";
    }

    function editorUrl(options) {
      var u = new URL(editorPath(), base || window.location.origin);
      u.searchParams.set("productGid", productGid);
      u.searchParams.set("variantId", currentVariantId());
      u.searchParams.set("shop", shop);
      u.searchParams.set("embedded", "1");
      u.searchParams.set("parentOrigin", window.location.origin);
      if (options && options.designId) {
        u.searchParams.set("designId", options.designId);
        u.searchParams.set(
          "designVersion",
          options.designVersion || root.dataset.lgsDesignVersion || "1",
        );
      }
      return u.toString();
    }

    function lockScroll() {
      scrollY = window.scrollY || 0;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = "-" + scrollY + "px";
      document.body.style.width = "100%";
    }

    function unlockScroll() {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    }

    function openModal(options) {
      if (!base) {
        window.alert(
          "Editor URL is not configured on this block yet. Set Editor base URL in the theme editor.",
        );
        return;
      }
      lastFocus = document.activeElement;
      if (loading) loading.hidden = false;
      setStatus("Loading editor…", null);
      frame.src = editorUrl(options);
      wrap.hidden = false;
      wrap.setAttribute("aria-hidden", "false");
      lockScroll();
      window.setTimeout(function () {
        if (closeBtn) closeBtn.focus();
      }, 50);
    }

    function closeModal() {
      wrap.hidden = true;
      wrap.setAttribute("aria-hidden", "true");
      frame.src = "about:blank";
      if (loading) loading.hidden = true;
      unlockScroll();
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    openBtn &&
      openBtn.addEventListener("click", function () {
        openModal(hasDesign() ? { designId: root.dataset.lgsDesignId } : null);
      });

    editBtn &&
      editBtn.addEventListener("click", function () {
        openModal({ designId: root.dataset.lgsDesignId });
      });

    resetBtn &&
      resetBtn.addEventListener("click", function () {
        if (
          !window.confirm(
            "Start over? This removes the attached design from this product. Your saved library copies are not deleted.",
          )
        )
          return;
        clearDesign();
      });

    closeBtn &&
      closeBtn.addEventListener("click", function () {
        closeModal();
      });

    frame &&
      frame.addEventListener("load", function () {
        if (loading) loading.hidden = true;
        if (frame.src === "about:blank") return;
        try {
          frame.contentWindow && frame.contentWindow.focus();
        } catch (e) {
          /* cross-origin */
        }
      });

    frame &&
      frame.addEventListener("error", function () {
        setStatus("Could not load the editor. Check the Editor base URL.", "error");
        if (loading) loading.hidden = true;
      });

    document.addEventListener("keydown", function (event) {
      if (wrap.hidden) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
      }
    });

    window.addEventListener("message", function (event) {
      if (!event.data || event.data.type !== "lgs:design-ready") return;
      if (event.origin !== editorOrigin()) return;
      var designId = event.data.designId;
      var version = event.data.version;
      if (!designId) return;

      closeModal();
      attachDesign(
        designId,
        version,
        event.data.cartProperties,
        event.data.designName || (event.data.cartProperties && event.data.cartProperties.Design),
      );
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

    document.addEventListener("change", function (event) {
      var target = event.target;
      if (!target || target.name !== "id") return;
      var form = target.form;
      if (!isTargetForm(form)) return;
      variantId = target.value;
      if (hasDesign()) {
        setStatus("Variant changed — reopen the editor if sizing depends on variant.", "warn");
      }
    });

    var params = new URLSearchParams(window.location.search);
    var fromUrl = params.get("lgs_design_id");
    if (fromUrl) {
      attachDesign(fromUrl, params.get("lgs_design_version") || "1");
    } else {
      syncUi();
    }
  }

  document
    .querySelectorAll("#lgs-upload-by-size, #lgs-gang-sheet, .lgs-ubs, .lgs-gs")
    .forEach(boot);
})();
