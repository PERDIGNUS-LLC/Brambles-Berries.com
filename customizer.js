document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // DOM ELEMENTS
  // =========================
  const baseImage = document.getElementById("base-image");
  const eyesImage = document.getElementById("eyes-image");
  const mouthImage = document.getElementById("mouth-image");

  const addBtn = document.getElementById("add-to-cart");
  const cartStatus = document.getElementById("cart-status");
  const clearCartBtn = document.getElementById("clear-cart");

  const selectors = {
    base: document.getElementById("base-selector"),
    eyes: document.getElementById("eyes-selector"),
    mouth: document.getElementById("mouth-selector")
  };

  const uploadInput = document.getElementById("upload-base");
  const uploadTools = document.getElementById("upload-tools");
  const uploadHint = document.getElementById("upload-hint");
  const btnReset = document.getElementById("base-reset");
  const btnZoomIn = document.getElementById("base-zoom-in");
  const btnZoomOut = document.getElementById("base-zoom-out");

  // =========================
  // STORAGE KEYS
  // =========================
  const CART_KEY = "bb_custom_cart_v1";
  const QUOTE_KEY = "bb_quote_requests_v1";

  // =========================
  // STATE
  // =========================
  const config = {
    base: "watermelon.png",
    eyes: null,
    mouth: null,
    qty: 1
  };

  let uploadedBaseDataUrl = null;

  // Uploaded-base transform state (only relevant when config.base === "USER_UPLOAD")
  let baseTx = 0;
  let baseTy = 0;
  let baseScale = 1;

  function applyBaseTransform() {
    if (config.base !== "USER_UPLOAD") {
      baseImage.style.transform = "";
      return;
    }
    baseImage.style.transform = `translate(${baseTx}px, ${baseTy}px) scale(${baseScale})`;
  }

  function resetBaseTransform() {
    baseTx = 0;
    baseTy = 0;
    baseScale = 1;
    applyBaseTransform();
  }

  function showUploadTools(show) {
    if (uploadTools) uploadTools.style.display = show ? "block" : "none";
    if (uploadHint) uploadHint.style.display = show ? "block" : "none";
  }

  function getCart() {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  function setCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartStatus();
  }

  function getQuotes() {
    const raw = localStorage.getItem(QUOTE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  function setQuotes(list) {
    localStorage.setItem(QUOTE_KEY, JSON.stringify(list));
  }

  function updateCartStatus() {
    if (!cartStatus) return;
    const cart = getCart();
    cartStatus.textContent = `Cart items: ${cart.length}`;
  }

  function setButtonMode() {
    // USER_UPLOAD => quote mode
    if (config.base === "USER_UPLOAD") {
      addBtn.textContent = "Submit for Quotation";
      addBtn.dataset.mode = "quote";
    } else {
      addBtn.textContent = "Add to Cart";
      addBtn.dataset.mode = "cart";
    }
  }

  // =========================
  // OPTIONS
  // =========================
  const options = {
    base: [
      { file: "watermelon.png", label: "Watermelon" },
      { file: "lemon.png", label: "Lemon" },
      { file: "tangerine.png", label: "Tangerine" },
      { file: "raspberry.png", label: "Raspberry" },
      { file: "succulent.png", label: "Succulent" },
      { file: "Sun.png", label: "Sun" },
      { file: "cactus.png", label: "Cactus" }
    ],
    eyes: [
      { file: null, label: "None" },
      { file: "eyes1.png", label: "Eyes 1" },
      { file: "eyes2.png", label: "Eyes 2" },
      { file: "eyes3.png", label: "Eyes 3" },
      { file: "eyes4.png", label: "Eyes 4" },
      { file: "eyes5.png", label: "Eyes 5" },
      { file: "eyes6.png", label: "Eyes 6" }
    ],
    mouth: [
      { file: null, label: "None" },
      { file: "mouth1.png", label: "Mouth 1" },
      { file: "mouth2.png", label: "Mouth 2" },
      { file: "mouth3.png", label: "Mouth 3" },
      { file: "mouth4.png", label: "Mouth 4" },
      { file: "mouth5.png", label: "Mouth 5" }
    ]
  };

  // =========================
  // UPLOAD (CUSTOM BASE)
  // =========================
  uploadInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      uploadedBaseDataUrl = reader.result;

      config.base = "USER_UPLOAD";
      baseImage.src = uploadedBaseDataUrl;

      resetBaseTransform();
      showUploadTools(true);
      setButtonMode();
    };
    reader.readAsDataURL(file);
  });

  // Tool buttons
  btnReset?.addEventListener("click", () => {
    if (config.base !== "USER_UPLOAD") return;
    resetBaseTransform();
  });

  btnZoomIn?.addEventListener("click", () => {
    if (config.base !== "USER_UPLOAD") return;
    baseScale = Math.min(5, baseScale * 1.15);
    applyBaseTransform();
  });

  btnZoomOut?.addEventListener("click", () => {
    if (config.base !== "USER_UPLOAD") return;
    baseScale = Math.max(0.2, baseScale / 1.15);
    applyBaseTransform();
  });

  // =========================
  // DRAG + ZOOM (UPLOADED BASE ONLY)
  // =========================
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  baseImage.addEventListener("pointerdown", (e) => {
    if (config.base !== "USER_UPLOAD") return;

    dragging = true;
    baseImage.classList.add("dragging");
    baseImage.setPointerCapture(e.pointerId);
    lastX = e.clientX;
    lastY = e.clientY;
  });

  baseImage.addEventListener("pointermove", (e) => {
    if (!dragging) return;

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;

    baseTx += dx;
    baseTy += dy;

    lastX = e.clientX;
    lastY = e.clientY;

    applyBaseTransform();
  });

  function stopDrag() {
    dragging = false;
    baseImage.classList.remove("dragging");
  }

  baseImage.addEventListener("pointerup", stopDrag);
  baseImage.addEventListener("pointercancel", stopDrag);

  baseImage.addEventListener(
    "wheel",
    (e) => {
      if (config.base !== "USER_UPLOAD") return;
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
      baseScale = Math.max(0.2, Math.min(5, baseScale * zoomFactor));
      applyBaseTransform();
    },
    { passive: false }
  );

  // =========================
  // CAPTURE MOCKUP (RESPECT BASE TRANSFORM)
  // =========================
  function captureMockup() {
    const canvas = document.createElement("canvas");
    const preview = document.querySelector(".preview");
    const rect = preview.getBoundingClientRect();

    canvas.width = Math.max(1, Math.round(rect.width));
    canvas.height = Math.max(1, Math.round(rect.height));

    const ctx = canvas.getContext("2d");

    function drawBase(img) {
      if (!img || !img.complete) return;

      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;
      if (!iw || !ih) return;

      const drawW = canvas.width;
      const drawH = (ih / iw) * drawW;
      const x0 = 0;
      const y0 = (canvas.height - drawH) / 2;

      if (config.base === "USER_UPLOAD") {
        const cx = x0 + drawW / 2;
        const cy = y0 + drawH / 2;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.translate(baseTx, baseTy);
        ctx.scale(baseScale, baseScale);
        ctx.translate(-cx, -cy);
        ctx.drawImage(img, x0, y0, drawW, drawH);
        ctx.restore();
      } else {
        ctx.drawImage(img, x0, y0, drawW, drawH);
      }
    }

    function drawOverlay(img) {
      if (!img || img.style.display === "none" || !img.complete) return;

      const computed = window.getComputedStyle(img);
      const topPx = parseFloat(computed.top || "0");
      const widthPx = parseFloat(computed.width || "0");

      const w = widthPx > 0 ? widthPx : canvas.width * 0.2;
      const h = (img.naturalHeight / img.naturalWidth) * w;

      const x = (canvas.width - w) / 2;
      const y = topPx;

      ctx.drawImage(img, x, y, w, h);
    }

    drawBase(baseImage);
    drawOverlay(eyesImage);
    drawOverlay(mouthImage);

    return canvas.toDataURL("image/png");
  }

  // =========================
  // SKU / TITLE HELPERS
  // =========================
  function skuToken(str) {
    if (!str) return "NONE";
    return String(str)
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/-+/g, "-")
      .replace(/(^-|-$)/g, "")
      .toUpperCase();
  }

  function buildIdentifiers(cfg) {
    const baseToken = cfg.base === "USER_UPLOAD" ? "CUSTOM" : skuToken(cfg.base);
    const eyesToken = skuToken(cfg.eyes);
    const mouthToken = skuToken(cfg.mouth);

    const sku = `B&B-${baseToken}-${eyesToken}-${mouthToken}`;
    const humanTitle = [
      cfg.base === "USER_UPLOAD"
        ? "Custom Uploaded Base"
        : cfg.base.replace(/\.[^/.]+$/, "").replace(/-/g, " "),
      cfg.eyes ? `• Eyes: ${cfg.eyes.replace(/\.[^/.]+$/, "")}` : "",
      cfg.mouth ? `• Mouth: ${cfg.mouth.replace(/\.[^/.]+$/, "")}` : ""
    ]
      .filter(Boolean)
      .join(" ");

    return { sku, humanTitle };
  }

  // =========================
  // SELECTOR POPULATION
  // =========================
  function populateSelector(type, targetElement) {
    const folder = type === "base" ? "bases" : type;

    options[type].forEach((opt) => {
      const img = document.createElement("img");
      img.src = opt.file
        ? `images/customizer/${folder}/${opt.file}`
        : "images/customizer/none.png";
      img.alt = opt.label;
      img.title = opt.label;

      img.addEventListener("click", () => {
        [...targetElement.children].forEach((c) => c.classList.remove("selected"));
        img.classList.add("selected");

        config[type] = opt.file;

        if (type === "base") {
          // switching to stock base cancels upload mode
          uploadedBaseDataUrl = null;
          baseImage.src = `images/customizer/${folder}/${opt.file}`;
          showUploadTools(false);
          applyBaseTransform();
          setButtonMode();
        }

        if (type === "eyes") {
          if (opt.file) {
            eyesImage.src = `images/customizer/${folder}/${opt.file}`;
            eyesImage.style.display = "block";
          } else {
            eyesImage.style.display = "none";
          }
        }

        if (type === "mouth") {
          if (opt.file) {
            mouthImage.src = `images/customizer/${folder}/${opt.file}`;
            mouthImage.style.display = "block";
          } else {
            mouthImage.style.display = "none";
          }
        }
      });

      targetElement.appendChild(img);
    });

    if (targetElement.children.length > 0) {
      targetElement.children[0].click();
    }
  }

  populateSelector("base", selectors.base);
  populateSelector("eyes", selectors.eyes);
  populateSelector("mouth", selectors.mouth);

  // =========================
  // BUTTON ACTIONS
  // =========================
  addBtn.addEventListener("click", async () => {
    const { sku, humanTitle } = buildIdentifiers(config);
    const mockupImage = captureMockup();

    // QUOTE MODE
    if (addBtn.dataset.mode === "quote") {
      const email = prompt("Enter your email so we can contact you with a quote:");
      if (!email) return;

      const note = prompt("Optional: describe your request (theme, colors, details):") || "";

      const quoteRequest = {
        createdAt: new Date().toISOString(),
        email,
        note,
        sku,
        title: humanTitle,
        base: config.base,
        eyes: config.eyes,
        mouth: config.mouth,
        mockupImage
      };

      const list = getQuotes();
      list.push(quoteRequest);
      setQuotes(list);

      // Download the mockup automatically (so user can email it if needed)
      const a = document.createElement("a");
      a.href = mockupImage;
      a.download = `bb-quote-${sku}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      alert(
        "Quote request submitted!\n\n" +
          "We downloaded your mockup image so you can share it if needed.\n" +
          "Next step: we’ll review feasibility + price and email you back."
      );

      return;
    }

    // CART MODE (stock bases)
    const item = {
      sku,
      title: humanTitle,
      base: config.base,
      eyes: config.eyes,
      mouth: config.mouth,
      qty: config.qty,
      unit_price_cents: 3500,
      mockupImage,
      isCustomUpload: false
    };

    const cart = getCart();
    cart.push(item);
    setCart(cart);

    alert(`Added to cart:\n${humanTitle}`);
  });

  clearCartBtn?.addEventListener("click", () => {
    if (!confirm("Clear your customizer cart items?")) return;
    setCart([]);
  });

  // =========================
  // INIT UI
  // =========================
  showUploadTools(false);
  updateCartStatus();
  setButtonMode();

  window._bb_customizer = { config };
});
