document.addEventListener("DOMContentLoaded", () => {
  const baseImage = document.getElementById("base-image");
  const eyesImage = document.getElementById("eyes-image");
  const mouthImage = document.getElementById("mouth-image");

  const addBtn = document.getElementById("add-to-cart");

  const selectors = {
    base: document.getElementById("base-selector"),
    eyes: document.getElementById("eyes-selector"),
    mouth: document.getElementById("mouth-selector"),
  };

  const uploadInput = document.getElementById("upload-base");

  // Upload UI elements
  const uploadTools = document.getElementById("upload-tools");
  const uploadHint = document.getElementById("upload-hint");
  const btnReset = document.getElementById("base-reset");
  const btnZoomIn = document.getElementById("base-zoom-in");
  const btnZoomOut = document.getElementById("base-zoom-out");

  // ✅ Use the SAME cart storage key as shop/cart-logic.js
  const CART_KEY = "bb_cart_items";

  // -----------------------------
  // Config state
  // -----------------------------
  const config = {
    base: "watermelon.png",
    eyes: null,
    mouth: null,
    qty: 1,
  };

  let uploadedBaseDataUrl = null;

  // -----------------------------
  // Price mapping (Customizer base -> real shop Stripe priceId/size/price/name/img)
  // -----------------------------
  const BASE_PRODUCT_MAP = {
    "watermelon.png": {
      name: "Watermelon Stool (Small)",
      price: "$40",
      priceId: "price_1SBzJw7ywjQM5ca8ve87p3Io",
      size: "S",
      img: "images/product-watermelon.jpg",
    },
    "lemon.png": {
      name: "Lemon Stool (Small)",
      price: "$40",
      priceId: "price_1SBzVl7ywjQM5ca8WcIHnq8o",
      size: "S",
      img: "images/product-lemon.jpg",
    },
    "tangerine.png": {
      name: "Tangerine Stool",
      price: "$40",
      priceId: "price_1Sb5fx7ywjQM5ca8Nv9XGe3B",
      size: "S",
      img: "images/product-tangerine.jpg",
    },
    "raspberry.png": {
      name: "Raspberry Stool",
      price: "$60",
      priceId: "price_1SCqGf7ywjQM5ca8AIfELs3X",
      size: "S",
      img: "images/product-raspberry.jpg",
    },
    "succulent.png": {
      name: "Potted Plant Stool",
      price: "$60",
      priceId: "price_1SCqKo7ywjQM5ca81X8E5bqk",
      size: "S",
      img: "images/product-succulent.jpg",
    },
    "Sun.png": {
      name: "Sun Stool",
      price: "$60",
      priceId: "price_1Sb5oP7ywjQM5ca8xu6CPfgD",
      size: "S",
      img: "images/product-sun.jpg",
    },
    "cactus.png": {
      name: "Saguaro Stool",
      price: "$60",
      priceId: "price_1SCqM47ywjQM5ca8xZLXixjO",
      size: "S",
      img: "images/product-saguaro.jpg",
    },
  };

  // -----------------------------
  // Base photo transform state (USER_UPLOAD only)
  // -----------------------------
  let baseTx = 0;
  let baseTy = 0;
  let baseScale = 1;

  function applyBaseTransform() {
    // Only visually transform when user upload is active
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

  btnReset?.addEventListener("click", resetBaseTransform);

  btnZoomIn?.addEventListener("click", () => {
    baseScale = Math.min(5, baseScale * 1.15);
    applyBaseTransform();
  });

  btnZoomOut?.addEventListener("click", () => {
    baseScale = Math.max(0.2, baseScale / 1.15);
    applyBaseTransform();
  });

  // Drag behavior (pointer events)
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

  baseImage.addEventListener("pointerup", () => {
    dragging = false;
    baseImage.classList.remove("dragging");
  });

  baseImage.addEventListener("pointercancel", () => {
    dragging = false;
    baseImage.classList.remove("dragging");
  });

  // Wheel zoom (desktop)
  baseImage.addEventListener(
    "wheel",
    (e) => {
      if (config.base !== "USER_UPLOAD") return;
      e.preventDefault();

      const zoomFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      baseScale = Math.max(0.2, Math.min(5, baseScale * zoomFactor));
      applyBaseTransform();
    },
    { passive: false }
  );

  // -----------------------------
  // Upload handling
  // -----------------------------
  function setButtonMode() {
    if (config.base === "USER_UPLOAD") {
      addBtn.textContent = "Submit for Quotation";
      addBtn.classList.add("quote-mode");
      uploadTools.style.display = "flex";
      uploadHint.style.display = "block";
    } else {
      addBtn.textContent = "Add to Cart";
      addBtn.classList.remove("quote-mode");
      uploadTools.style.display = "none";
      uploadHint.style.display = "none";
    }
  }

  uploadInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      uploadedBaseDataUrl = reader.result;

      config.base = "USER_UPLOAD";
      baseImage.src = uploadedBaseDataUrl;

      // reset transform for new photo
      resetBaseTransform();
      applyBaseTransform();
      setButtonMode();
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
      { file: "cactus.png", label: "Cactus" },
    ],
    eyes: [
      { file: null, label: "None" },
      { file: "eyes1.png", label: "Eyes 1" },
      { file: "eyes2.png", label: "Eyes 2" },
      { file: "eyes3.png", label: "Eyes 3" },
      { file: "eyes4.png", label: "Eyes 4" },
      { file: "eyes5.png", label: "Eyes 5" },
      { file: "eyes6.png", label: "Eyes 6" },
    ],
    mouth: [
      { file: null, label: "None" },
      { file: "mouth1.png", label: "Mouth 1" },
      { file: "mouth2.png", label: "Mouth 2" },
      { file: "mouth3.png", label: "Mouth 3" },
      { file: "mouth4.png", label: "Mouth 4" },
      { file: "mouth5.png", label: "Mouth 5" },
    ],
  };

  // -----------------------------
  // Capture mockup (includes user transform)
  // -----------------------------
  function captureMockup() {
    const previewStage = document.querySelector(".preview-stage");
    const rect = previewStage.getBoundingClientRect();

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(rect.width));
    canvas.height = Math.max(1, Math.floor(rect.height));

    const ctx = canvas.getContext("2d");

    // Base
    if (config.base === "USER_UPLOAD") {
      ctx.save();
      ctx.translate(baseTx, baseTy);
      ctx.scale(baseScale, baseScale);
      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
    }

    // Eyes
    if (eyesImage && eyesImage.style.display !== "none") {
      ctx.drawImage(eyesImage, 0, 0, canvas.width, canvas.height);
    }

    // Mouth
    if (mouthImage && mouthImage.style.display !== "none") {
      ctx.drawImage(mouthImage, 0, 0, canvas.width, canvas.height);
    }

    return canvas.toDataURL("image/png");
  }

  // -----------------------------
  // Helpers
  // -----------------------------
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
          // Switching away from upload -> clear upload state
          uploadedBaseDataUrl = null;
          baseTx = 0;
          baseTy = 0;
          baseScale = 1;

          baseImage.src = `images/customizer/${folder}/${opt.file}`;
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

  // -----------------------------
  // Real Cart integration
  // -----------------------------
  function loadCart() {
    try {
      const json = localStorage.getItem(CART_KEY);
      const parsed = json ? JSON.parse(json) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {}
  }

  function addMappedBaseToCart() {
    const baseFile = config.base;
    const mapped = BASE_PRODUCT_MAP[baseFile];

    if (!mapped) {
      alert("That base isn't mapped to a Shop product yet.");
      return;
    }

    const cart = loadCart();

    const existingIndex = cart.findIndex(
      (i) => i.priceId === mapped.priceId && i.size === mapped.size
    );

    if (existingIndex >= 0) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({
        name: mapped.name,
        price: mapped.price,
        priceId: mapped.priceId,
        size: mapped.size,
        img: mapped.img,
        quantity: 1,
      });
    }

    saveCart(cart);

    // Tell cart-logic to re-render if it exposed an API
    if (window.bbCart?.refresh) window.bbCart.refresh();

    // Open the sidebar cart
    if (window.bbCart?.open) window.bbCart.open();
    else document.getElementById("open-cart")?.click();
  }

  function submitForQuote() {
    const mockup = captureMockup();

    // Download mockup for the user to attach to email (mailto cannot attach automatically)
    const a = document.createElement("a");
    a.href = mockup;
    a.download = "brambles-customizer-mockup.png";
    document.body.appendChild(a);
    a.click();
    a.remove();

    const details = {
      base: "USER_UPLOAD",
      eyes: config.eyes || "None",
      mouth: config.mouth || "None",
      note:
        "Customer uploaded a custom stool photo. This is a quote request, not a paid order.",
    };

    // Store a lightweight record (no giant data URLs in localStorage)
    try {
      const KEY = "bb_quote_requests";
      const existing = JSON.parse(localStorage.getItem(KEY) || "[]");
      existing.push({
        createdAt: new Date().toISOString(),
        ...details,
      });
      localStorage.setItem(KEY, JSON.stringify(existing));
    } catch {}

    // Open an email draft
    const subject = encodeURIComponent("Brambles & Berries — Custom Stool Quote Request");
    const body = encodeURIComponent(
      `Hi Brambles & Berries,\n\nI’d like a quote for a custom stool design.\n\nDetails:\n- Eyes: ${details.eyes}\n- Mouth: ${details.mouth}\n\nI just downloaded a mockup image from the Customizer.\nPlease reply with pricing + approval steps.\n\nThanks!`
    );

    window.location.href = `mailto:Bramblesandberries37@gmail.com?subject=${subject}&body=${body}`;

    alert(
      "Quote request started.\n\n1) A mockup image was downloaded.\n2) An email draft will open.\n3) Attach the mockup and send it.\n\nWe’ll reply with a quote."
    );
  }

  addBtn.addEventListener("click", () => {
    if (config.base === "USER_UPLOAD") {
      submitForQuote();
    } else {
      addMappedBaseToCart();
    }
  });

  // Initialize button UI
  setButtonMode();
});
