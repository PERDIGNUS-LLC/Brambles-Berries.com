document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // DOM ELEMENTS
  // =========================
  const baseImage = document.getElementById("base-image");
  const eyesImage = document.getElementById("eyes-image");
  const mouthImage = document.getElementById("mouth-image");

  const selectors = {
    base: document.getElementById("base-selector"),
    eyes: document.getElementById("eyes-selector"),
    mouth: document.getElementById("mouth-selector")
  };

  const uploadInput = document.getElementById("upload-base");

  // Optional upload tool UI (only used if you added these elements in HTML)
  const uploadTools = document.getElementById("upload-tools");
  const uploadHint = document.getElementById("upload-hint");
  const btnReset = document.getElementById("base-reset");
  const btnZoomIn = document.getElementById("base-zoom-in");
  const btnZoomOut = document.getElementById("base-zoom-out");

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
    // Only apply transforms for uploaded base. Otherwise clear.
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
  // IMAGE UPLOAD (CUSTOM BASE)
  // =========================
  uploadInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      uploadedBaseDataUrl = reader.result;

      // Switch into "uploaded base" mode
      config.base = "USER_UPLOAD";
      baseImage.src = uploadedBaseDataUrl;

      // Reset transform for a predictable starting point
      resetBaseTransform();
      showUploadTools(true);
    };
    reader.readAsDataURL(file);
  });

  // =========================
  // OPTIONAL TOOL BUTTONS
  // =========================
  btnReset?.addEventListener("click", resetBaseTransform);

  btnZoomIn?.addEventListener("click", () => {
    if (config.base !== "USER_UPLOAD") return;
    baseScale = Math.min(5, baseScale * 1.1);
    applyBaseTransform();
  });

  btnZoomOut?.addEventListener("click", () => {
    if (config.base !== "USER_UPLOAD") return;
    baseScale = Math.max(0.2, baseScale / 1.1);
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
  baseImage.addEventListener("pointerleave", () => {
    // If pointer leaves while dragging, stop safely
    if (dragging) stopDrag();
  });

  // Desktop zoom (mouse wheel / trackpad)
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
  // CAPTURE MOCKUP IMAGE (RESPECTS BASE TRANSFORM)
  // =========================
  function captureMockup() {
    const canvas = document.createElement("canvas");
    const preview = document.querySelector(".preview");
    const rect = preview.getBoundingClientRect();

    canvas.width = Math.max(1, Math.round(rect.width));
    canvas.height = Math.max(1, Math.round(rect.height));

    const ctx = canvas.getContext("2d");

    // Helper: draw an image to cover the preview area (matches CSS "width:100% height:auto" feel)
    function drawBaseCover(img) {
      if (!img || !img.complete) return;

      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;
      if (!iw || !ih) return;

      // Your base-image is styled width:100%, height:auto inside the preview width
      const drawW = canvas.width;
      const drawH = (ih / iw) * drawW;

      // Vertically center if taller than canvas (rare but possible)
      const x0 = 0;
      const y0 = (canvas.height - drawH) / 2;

      // Apply translate/scale around center of the image drawing
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

      // eyes/mouth are absolutely positioned with left:50% translateX(-50%)
      // We will approximate by drawing them centered based on their rendered
      // size relative to the preview. This matches your current UI.
      const computed = window.getComputedStyle(img);
      const topPx = parseFloat(computed.top || "0");
      const widthPx = parseFloat(computed.width || "0");

      const w = widthPx > 0 ? widthPx : canvas.width * 0.2;
      const h = (img.naturalHeight / img.naturalWidth) * w;

      const x = (canvas.width - w) / 2;
      const y = topPx; // top is already relative to preview in px

      ctx.drawImage(img, x, y, w, h);
    }

    // Base first, then overlays
    drawBaseCover(baseImage);
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
  // CART STORAGE
  // =========================
  function saveToLocalCart(item) {
    const CART_KEY = "bb_custom_cart_v1";
    const raw = localStorage.getItem(CART_KEY);
    const cart = raw ? JSON.parse(raw) : [];
    cart.push(item);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    return cart;
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
          // Switching back to stock bases
          uploadedBaseDataUrl = null;
          baseImage.src = `images/customizer/${folder}/${opt.file}`;

          // Disable upload transform mode
          showUploadTools(false);
          applyBaseTransform(); // clears transform when not USER_UPLOAD
        } else if (type === "eyes") {
          if (opt.file) {
            eyesImage.src = `images/customizer/${folder}/${opt.file}`;
            eyesImage.style.display = "block";
          } else {
            eyesImage.style.display = "none";
          }
        } else if (type === "mouth") {
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

  // Hide upload tools by default
  showUploadTools(false);

  // =========================
  // ADD TO CART
  // =========================
  document.getElementById("add-to-cart").addEventListener("click", () => {
    const { sku, humanTitle } = buildIdentifiers(config);
    const priceCents = 3500;

    const mockupImage = captureMockup();

    const item = {
      sku,
      title: humanTitle,
      base: config.base,
      eyes: config.eyes,
      mouth: config.mouth,
      qty: config.qty,
      unit_price_cents: priceCents,

      // ⭐ NEW
      mockupImage,
      isCustomUpload: config.base === "USER_UPLOAD"
    };

    const cart = saveToLocalCart(item);

    console.log("Cart now:", cart);
    alert(`Added to cart:\n${humanTitle}`);
    const mini = document.getElementById("mini-cart");
    if (mini) mini.innerText = `Cart items: ${cart.length}`;
  });

  window._bb_customizer = { config, buildIdentifiers, saveToLocalCart };
});
