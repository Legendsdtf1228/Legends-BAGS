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
    var customerId = root.getAttribute("data-customer-id") || "";
    var builderType = root.getAttribute("data-builder-type") || "upload_by_size";
    var lastFocus = null;
    var scrollY = 0;
    var gangSheetVariants = [];
    var variantPicker = root.querySelector("[data-lgs-variant-picker]");
    var variantSelect = root.querySelector("[data-lgs-variant-select]");
    var variantHint = root.querySelector("[data-lgs-variant-hint]");

    function resolveCustomerKey() {
      if (customerId) {
        return "gid://shopify/Customer/" + String(customerId).replace(/\D/g, "");
      }
      try {
        var guest = localStorage.getItem("lgs_guest_key");
        if (!guest) {
          guest = "g_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
          localStorage.setItem("lgs_guest_key", guest);
        }
        return "guest:" + guest;
      } catch (e) {
        return "guest:anonymous";
      }
    }

    var customerKey = resolveCustomerKey();

    function formatPrice(cents) {
      if (cents == null || cents === "") return "";
      var n = Number(cents);
      if (!isFinite(n)) return "";
      var dollars = n / 100;
      return dollars % 1 === 0 ? "$" + dollars.toFixed(0) : "$" + dollars.toFixed(2);
    }

    function variantLabel(v) {
      var height = v.sheetHeightIn != null ? v.sheetHeightIn + "″ sheet" : "Sheet";
      var price = formatPrice(v.priceCents);
      return price ? height + " · " + price : height;
    }

    function findVariantById(id) {
      if (!id) return null;
      return (
        gangSheetVariants.find(function (v) {
          return String(v.variantId) === String(id);
        }) || null
      );
    }

    function syncVariantHint(variant) {
      if (!variantHint) return;
      if (!variant || variant.priceCents == null) {
        variantHint.hidden = true;
        variantHint.textContent = "";
        return;
      }
      variantHint.hidden = false;
      variantHint.textContent =
        "Selected variant price: " + formatPrice(variant.priceCents) + " (before design pricing adjustments).";
    }

    function renderVariantPicker() {
      if (builderType !== "gang_sheet" || gangSheetVariants.length <= 1) {
        if (variantPicker) variantPicker.hidden = true;
        return;
      }
      if (!variantPicker || !variantSelect) return;
      variantPicker.hidden = false;
      variantSelect.innerHTML = "";
      gangSheetVariants.forEach(function (v) {
        if (!v.variantId) return;
        var opt = document.createElement("option");
        opt.value = String(v.variantId);
        opt.textContent = variantLabel(v);
        variantSelect.appendChild(opt);
      });
      var current = findVariantById(currentVariantId());
      if (current && current.variantId) {
        variantSelect.value = String(current.variantId);
        syncVariantHint(current);
      } else if (gangSheetVariants[0] && gangSheetVariants[0].variantId) {
        variantSelect.value = String(gangSheetVariants[0].variantId);
        selectVariantOnPage(gangSheetVariants[0].variantId);
        syncVariantHint(gangSheetVariants[0]);
      }
    }

    function applyGangSheetVariants(variants) {
      gangSheetVariants = Array.isArray(variants) ? variants : [];
      renderVariantPicker();
    }

    function handleVariantChange(nextVariantId, fromPicker) {
      if (!nextVariantId) return;
      var prev = currentVariantId();
      if (String(nextVariantId) === String(prev)) return;
      if (hasDesign()) {
        clearDesign();
        setStatus("Sheet height changed — save a new design for this variant.", "warn");
      }
      selectVariantOnPage(nextVariantId);
      syncVariantHint(findVariantById(nextVariantId));
      if (!fromPicker && variantSelect) {
        variantSelect.value = String(nextVariantId);
      }
    }

    function editorOrigin() {
      try {
        return new URL(base || window.location.origin).origin;
      } catch (e) {
        return window.location.origin;
      }
    }

    /** App proxy on Shopify storefront; direct app URL when editor base is set (dev). */
    function storefrontApiUrl(path) {
      var onStorefront =
        shop &&
        (window.location.hostname === shop ||
          window.location.hostname.endsWith(".myshopify.com"));
      if (onStorefront) {
        return new URL("/apps/legends-bags/" + path.replace(/^\//, ""), window.location.origin);
      }
      if (base) {
        return new URL(path, base);
      }
      return null;
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
          "_lgs_design_token",
          "Design",
        ].forEach(function (key) {
          removeHidden(form, "properties[" + key + "]");
        });
      });
      setStatus("Start fresh — create a new design.", "warn");
      syncUi();
    }

    function selectVariantOnPage(nextVariantId) {
      if (!nextVariantId) return;
      variantId = String(nextVariantId);
      cartForms().forEach(function (form) {
        var idInput = form.querySelector('[name="id"]');
        if (idInput) {
          idInput.value = variantId;
          idInput.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
      document.querySelectorAll('[name="id"]').forEach(function (input) {
        if (input.form && isTargetForm(input.form)) {
          input.value = variantId;
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
    }

    function applyAppearanceLabels(appearance) {
      if (!appearance) return;
      if (openBtn) {
        openBtn.setAttribute("data-label-open", appearance.launcherOpenLabel || "Build your gang sheet");
        openBtn.setAttribute("data-label-edit", appearance.launcherEditLabel || "Edit design");
      }
      syncUi();
    }

    function fetchStorefrontSession() {
      var url = storefrontApiUrl("/session");
      if (!url || !shop) return Promise.resolve(null);
      url.searchParams.set("shop", shop);
      if (customerKey) url.searchParams.set("customerKey", customerKey);
      return fetch(url.toString())
        .then(function (res) {
          return res.ok ? res.json() : null;
        })
        .catch(function () {
          return null;
        });
    }

    function loadStorefrontConfig() {
      if (!shop) return;
      var url = storefrontApiUrl("/storefront-config");
      if (!url) return;
      url.searchParams.set("shop", shop);
      if (productGid) url.searchParams.set("productGid", productGid);
      fetch(url.toString())
        .then(function (res) {
          return res.ok ? res.json() : null;
        })
        .then(function (json) {
          if (json && json.appearance) applyAppearanceLabels(json.appearance);
          if (json && json.gangSheetVariants) applyGangSheetVariants(json.gangSheetVariants);
        })
        .catch(function () {
          /* optional */
        });
    }

    function hydrateDesignFromUrl() {
      var params = new URLSearchParams(window.location.search);
      var fromUrl = params.get("lgs_design_id");
      if (!fromUrl) {
        syncUi();
        return;
      }
      var version = params.get("lgs_design_version") || "1";
      var token = params.get("lgs_token");
      if (token) {
        var apiUrl = storefrontApiUrl("designs/" + encodeURIComponent(fromUrl));
        if (!apiUrl && base) {
          apiUrl = new URL("/api/designs/" + encodeURIComponent(fromUrl), base);
        }
        if (apiUrl) {
          apiUrl.searchParams.set("version", version);
          apiUrl.searchParams.set("token", token);
          if (shop) apiUrl.searchParams.set("shop", shop);
          fetch(apiUrl.toString())
            .then(function (res) {
              return res.ok ? res.json() : null;
            })
            .then(function (json) {
              if (json && json.cartProperties) {
                attachDesign(
                  json.designId || fromUrl,
                  json.version || version,
                  json.cartProperties,
                  json.designName,
                );
              } else {
                attachDesign(fromUrl, version);
              }
            })
            .catch(function () {
              attachDesign(fromUrl, version);
            });
          return;
        }
      }
      attachDesign(fromUrl, version);
    }

    function productNumericId() {
      var match = productGid.match(/(\d+)$/);
      return match ? match[1] : "";
    }

    function currentQuantity() {
      var form = cartForms()[0];
      var q = form && form.querySelector('[name="quantity"]');
      var value = q && q.value;
      if (value && Number(value) >= 1) return String(Math.floor(Number(value)));
      return "1";
    }

    function builderUrl(options) {
      var u = new URL("/builder", base || window.location.origin);
      u.searchParams.set("shop", shop);
      u.searchParams.set("product", productNumericId());
      u.searchParams.set("variant", currentVariantId() || "");
      u.searchParams.set("quantity", currentQuantity());
      u.searchParams.set("shop_mode", "1");
      u.searchParams.set("embedded", "1");
      u.searchParams.set("parentOrigin", window.location.origin);
      if (customerKey) u.searchParams.set("lgs_customer_key", customerKey);
      if (options && options.designId) {
        u.searchParams.set("designId", options.designId);
        u.searchParams.set(
          "designVersion",
          options.designVersion || root.dataset.lgsDesignVersion || "1",
        );
      }
      return u.toString();
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
      if (customerKey) u.searchParams.set("lgs_customer_key", customerKey);
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

      function launchEditor(sessionToken) {
        var u = new URL(builderUrl(options));
        if (sessionToken) {
          u.searchParams.set("lgs_session", sessionToken);
        }
        frame.src = u.toString();
        wrap.hidden = false;
        wrap.setAttribute("aria-hidden", "false");
        lockScroll();
        window.setTimeout(function () {
          if (closeBtn) closeBtn.focus();
        }, 50);
      }

      fetchStorefrontSession().then(function (json) {
        launchEditor(json && json.sessionToken ? json.sessionToken : null);
      });
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
      if (!event.data) return;
      if (event.origin !== editorOrigin()) return;
      if (event.data.type === "lgs:select-variant") {
        handleVariantChange(event.data.variantId, false);
        return;
      }
      if (event.data.type !== "lgs:design-ready") return;
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
      handleVariantChange(target.value, false);
    });

    variantSelect &&
      variantSelect.addEventListener("change", function () {
        handleVariantChange(variantSelect.value, true);
      });

    loadStorefrontConfig();
    hydrateDesignFromUrl();
  }

  document
    .querySelectorAll("#lgs-upload-by-size, #lgs-gang-sheet, .lgs-ubs, .lgs-gs")
    .forEach(boot);
})();
