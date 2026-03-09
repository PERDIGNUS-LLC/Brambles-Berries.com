document.addEventListener("DOMContentLoaded", () => {
  const CART_KEY = "bb_cart_items";

  const baseImage = document.getElementById("base-image");
  const eyesImage = document.getElementById("eyes-image");
  const mouthImage = document.getElementById("mouth-image");

  const selectors = {
    base: document.getElementById("base-selector"),
    eyes: document.getElementById("eyes-selector"),
    mouth: document.getElementById("mouth-selector")
  };

  const uploadInput = document.getElementById("upload-base");
  const btnReset = document.getElementById("base-reset");
  const btnZoomIn = document.getElementById("base-zoom-in");
  const btnZoomOut = document.getElementById("base-zoom-out");

  const primaryActionBtn = document.getElementById("add-to-cart");

  const config = {
    base: "watermelon.png",
    eyes: null,
    mouth: null,
    qty: 1
  };

  // Map base choice -> REAL shop product (Stripe priceId)
  // NOTE: these are from your shop.html data-price-id values.
  const BASE_PRICE_MAP = {
    "watermelon.png": {
      name: "Watermelon Stool (Small)",
      price: 40,
      priceId: "price_1SBzJw7ywjQM5ca8ve87p3Io",
      size: "S",
      image: "images/product-watermelon.jpg"
    },
    "lemon.png": {
      name: "Lemon Stool (Small)",
      price: 40,
      priceId: "price_1SBzVl7ywjQM5ca8jN3fsRUh",
      size: "S",
      image: "images/product-small-lemon.jpg"
    },
    "tangerine.png": {
      name: "Tangerine Stool",
      price: 40,
      priceId: "price_1Sb5fx7ywjQM5ca8Nv9XGe3B",
      size: "S",
      image: "images/product-tangerine.jpg"
    },
    "raspberry.png": {
      name: "Raspberry Stool",
      price: 60,
      priceId: "price_1SCqGf7ywjQM5ca8vvBRJ0f3",
      size: "S",
      image: "images/product-raspberry.jpg"
    },
    "Sun.png": {
      name: "Sun Stool",
      price: 60,
      priceId: "price_1Sb5oP7ywjQM5ca8xu6CPfgD",
      size: "S",
      image: "images/product-sun.jpg"
    },
    // closest match in your shop list
    "succulent.png": {
      name: "Potted Plant Stool",
      price: 60,
      priceId: "price_1SCqKo7ywjQM5ca8zuyhyDFU",
      size: "S",
      image: "images/product-potted plant.jpg"
    },
    // closest match in your shop list
    "cactus.png": {
      name: "Saguaro Stool",
      price: 60,
      priceId: "price_1SCqM47ywjQM5ca8xZLXixjO",
      size: "S",
      image: "images/product-saguaro.jpg"
    }
  };

  // -----------------------------
  // Base photo transform state (USER_UPLOAD only)
  // -----------------------------
  let baseTx = 0;
  let baseTy = 0;
  let baseScale = 1;

  function applyBaseTransform() {
    baseImage.style.transform = `translate(${baseTx}px, ${baseTy}px) scale(${baseScale})`;
  }

  function resetBaseTransform() {
    baseTx = 0;
    baseTy = 0;
    baseScale = 1;
    applyBaseTransform();
  }

  btnReset?.addEventListener("click", resetBaseTransform);

  btnZoomIn?.addEventListener("click", () => {
    baseScale = Math.min(5, baseScale * 1.15);
    applyBaseTransform();
  });

  btnZoomOut?.addEventListener("click", () => {
    baseScale = Math.max(0.2, baseScale / 1.15);
    applyBaseTransform();
  });

  // -----------------------------
  // Drag + pinch zoom (pointer events)
  // -----------------------------
  const activePointers = new Map();
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let lastPinchDist = null;

  function pointerDist(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  baseImage.addEventListener("pointerdown", (e) => {
    if (config.base !== "USER_UPLOAD") return;

    baseImage.setPointerCapture(e.pointerId);
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.size === 1) {
      dragging = true;
      baseImage.classList.add("dragging");
      lastX = e.clientX;
      lastY = e.clientY;
    }

    if (activePointers.size === 2) {
      dragging = false;
      baseImage.classList.remove("dragging");
      const pts = [...activePointers.values()];
      lastPinchDist = pointerDist(pts[0], pts[1]);
    }
  });

  baseImage.addEventListener("pointermove", (e) => {
    if (config.base !== "USER_UPLOAD") return;
    if (!activePointers.has(e.pointerId)) return;

    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.size === 1 && dragging) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      baseTx += dx;
      baseTy += dy;
      lastX = e.clientX;
      lastY = e.clientY;
      applyBaseTransform();
      return;
    }

    if (activePointers.size === 2) {
      const pts = [...activePointers.values()];
      const dist = pointerDist(pts[0], pts[1]);
      if (lastPinchDist) {
        const ratio = dist / lastPinchDist;
        baseScale = Math.max(0.2, Math.min(5, baseScale * ratio));
        applyBaseTransform();
      }
      lastPinchDist = dist;
    }
  });

  function endPointer(e) {
    if (!activePointers.has(e.pointerId)) return;
    activePointers.delete(e.pointerId);

    if (activePointers.size === 0) {
      dragging = false;
      lastPinchDist = null;
      baseImage.classList.remove("dragging");
    }

    if (activePointers.size === 1) {
      // resume drag on remaining pointer
      const pt = [...activePointers.values()][0];
      dragging = true;
      baseImage.classList.add("dragging");
      lastX = pt.x;
      lastY = pt.y;
      lastPinchDist = null;
    }
  }

  baseImage.addEventListener("pointerup", endPointer);
  baseImage.addEventListener("pointercancel", endPointer);

  // Zoom on wheel (desktop)
  baseImage.addEventListener("wheel", (e) => {
    if (config.base !== "USER_UPLOAD") return;
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
    baseScale = Math.max(0.2, Math.min(5, baseScale * zoomFactor));
    applyBaseTransform();
  }, { passive: false });

  // -----------------------------
  // Upload image
  // -----------------------------
  let uploadedBaseDataUrl = null;

  uploadInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      uploadedBaseDataUrl = reader.result;
      baseImage.src = uploadedBaseDataUrl;

      config.base = "USER_UPLOAD";
      resetBaseTransform();
      updatePrimaryButtonMode();
    };
    reader.readAsDataURL(file);
  });

  // -----------------------------
  // Options
  // -----------------------------
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
      { file: "eyes6.png", label: "Eyes 6" },
      { file: "eyes7.png", label: "Eyes 7" },
      { file: "eyes8.png", label: "Eyes 8" },
      { file: "eyes12.png", label: "Eyes 9" }
    ],
    mouth: [
      { file: null, label: "None" },
      { file: "mouth1.png", label: "Mouth 1" },
      { file: "mouth2.png", label: "Mouth 2" },
      { file: "mouth3.png", label: "Mouth 3" },
      { file: "mouth4.png", label: "Mouth 4" },
      { file: "mouth5.png", label: "Mouth 5" },
      { file: "mouth6.png", label: "Mouth 6" },
      { file: "mouth7.png", label: "Mouth 7" },
      { file: "mouth8.png", label: "Mouth 8" },
      { file: "mouth9.png", label: "Mouth 9" }
         ]
  };

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
          uploadedBaseDataUrl = null;
          baseImage.style.transform = ""; // clear any translate/scale
          baseTx = 0; baseTy = 0; baseScale = 1;

          baseImage.src = `images/customizer/${folder}/${opt.file}`;
          updatePrimaryButtonMode();
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

  // -----------------------------
  // Helpers
  // -----------------------------
  function skuToken(str) {
    if (!str) return "NONE";
    return String(str)
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/-+/g, "-")
      .replace(/(^-|-$)/g, "")
      .toUpperCase();
  }

  function buildHumanTitle(cfg) {
    const baseLabel =
      cfg.base === "USER_UPLOAD"
        ? "Custom Uploaded Base"
        : (cfg.base || "Base").replace(/\.[^/.]+$/, "").replace(/-/g, " ");

    const eyesLabel = cfg.eyes ? cfg.eyes.replace(/\.[^/.]+$/, "") : "None";
    const mouthLabel = cfg.mouth ? cfg.mouth.replace(/\.[^/.]+$/, "") : "None";

    return `${baseLabel} • Eyes: ${eyesLabel} • Mouth: ${mouthLabel}`;
  }

  function getCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function setCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  // Capture preview exactly as seen (including translate/scale on USER_UPLOAD)
  function captureMockup() {
    const preview = document.querySelector(".preview");
    const rect = preview.getBoundingClientRect();

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(rect.width);
    canvas.height = Math.round(rect.height);

    const ctx = canvas.getContext("2d");

    // Draw base (with transform if USER_UPLOAD)
    if (baseImage && baseImage.style.display !== "none") {
      ctx.save();

      if (config.base === "USER_UPLOAD") {
        ctx.translate(baseTx, baseTy);
        ctx.scale(baseScale, baseScale);
      }

      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    // Draw overlays
    function drawOverlay(imgEl) {
      if (!imgEl || imgEl.style.display === "none") return;

      // compute overlay position inside preview
      const imgRect = imgEl.getBoundingClientRect();
      const x = imgRect.left - rect.left;
      const y = imgRect.top - rect.top;

      ctx.drawImage(imgEl, x, y, imgRect.width, imgRect.height);
    }

    drawOverlay(eyesImage);
    drawOverlay(mouthImage);

    return canvas.toDataURL("image/png");
  }

  function updatePrimaryButtonMode() {
    if (!primaryActionBtn) return;

    if (config.base === "USER_UPLOAD") {
      primaryActionBtn.textContent = "Submit for Quotation";
    } else {
      primaryActionBtn.textContent = "Add to Cart";
    }
  }

  updatePrimaryButtonMode();

  // -----------------------------
  // Primary action
  // -----------------------------
  primaryActionBtn?.addEventListener("click", () => {
    const humanTitle = buildHumanTitle(config);
    const mockupImage = captureMockup();

    // Quote path (uploaded image)
    if (config.base === "USER_UPLOAD") {
      const quoteSku = `BB-QUOTE-${Date.now()}-${skuToken(config.eyes)}-${skuToken(config.mouth)}`;

      const quoteItem = {
        // No priceId = quote-only (cart disables checkout)
        sku: quoteSku,
        name: `Quote Request • ${humanTitle}`,
        price: 0,
        quantity: 1,
        size: "",
        image: mockupImage, // show the mockup in the cart
        meta: {
          type: "quote",
          createdAt: new Date().toISOString(),
          eyes: config.eyes,
          mouth: config.mouth
        }
      };

      const cart = getCart();
      cart.push(quoteItem);
      setCart(cart);

      // Update cart UI (if cart-logic is loaded)
      window.bbCart?.updateCartCount?.();
      window.bbCart?.renderCart?.();
      window.bbCart?.openCart?.();

      alert(
        "Quote submitted!\n\nNext step: we’ll review your request and email you a final price.\n\n(Checkout is disabled while Quote Requests are in the cart.)"
      );
      return;
    }

    // Standard product path
    const baseData = BASE_PRICE_MAP[config.base];
    if (!baseData || !baseData.priceId) {
      alert("This base is not mapped to a shop product yet.");
      return;
    }

    const item = {
      priceId: baseData.priceId,
      name: humanTitle, // show customized title in cart
      price: baseData.price,
      quantity: 1,
      size: baseData.size,
      image: mockupImage, // show the customized mockup
      meta: {
        base: config.base,
        eyes: config.eyes,
        mouth: config.mouth,
        baseProductName: baseData.name
      }
    };

    const cart = getCart();
    cart.push(item);
    setCart(cart);

    window.bbCart?.updateCartCount?.();
    window.bbCart?.renderCart?.();
    window.bbCart?.openCart?.();

    alert(`Added to cart:\n${humanTitle}`);
  });

  // expose
  window._bb_customizer = { config };
});
