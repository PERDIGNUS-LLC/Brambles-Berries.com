document.addEventListener("DOMContentLoaded", () => {
  const baseImage = document.getElementById("base-image");
  const eyesImage = document.getElementById("eyes-image");
  const mouthImage = document.getElementById("mouth-image");

  const selectors = {
    base: document.getElementById("base-selector"),
    eyes: document.getElementById("eyes-selector"),
    mouth: document.getElementById("mouth-selector")
  };

  const uploadInput = document.getElementById("upload-base");

  const config = {
    base: "watermelon.png",
    eyes: null,
    mouth: null,
    qty: 1
  };

  let uploadedBaseDataUrl = null;

  /* =========================
     IMAGE UPLOAD (CUSTOM BASE)
     ========================= */
  uploadInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      uploadedBaseDataUrl = reader.result;
      baseImage.src = uploadedBaseDataUrl;
      config.base = "USER_UPLOAD";
    };
    reader.readAsDataURL(file);
  });

  /* =========================
     OPTIONS
     ========================= */
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

  /* =========================
     CAPTURE MOCKUP IMAGE
     ========================= */
  function captureMockup() {
    const canvas = document.createElement("canvas");
    const preview = document.querySelector(".preview");

    const rect = preview.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext("2d");

    const drawImage = (img) => {
      if (!img || img.style.display === "none") return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };

    drawImage(baseImage);
    drawImage(eyesImage);
    drawImage(mouthImage);

    return canvas.toDataURL("image/png");
  }

  /* =========================
     SKU / TITLE HELPERS
     ========================= */
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
    const baseToken =
      cfg.base === "USER_UPLOAD" ? "CUSTOM" : skuToken(cfg.base);
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

  /* =========================
     CART STORAGE
     ========================= */
  function saveToLocalCart(item) {
    const CART_KEY = "bb_custom_cart_v1";
    const raw = localStorage.getItem(CART_KEY);
    const cart = raw ? JSON.parse(raw) : [];
    cart.push(item);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    return cart;
  }

  /* =========================
     SELECTOR POPULATION
     ========================= */
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
        [...targetElement.children].forEach((c) =>
          c.classList.remove("selected")
        );
        img.classList.add("selected");

        config[type] = opt.file;

        if (type === "base") {
          uploadedBaseDataUrl = null;
          baseImage.src = `images/customizer/${folder}/${opt.file}`;
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

  /* =========================
     ADD TO CART
     ========================= */
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
    document.getElementById("mini-cart").innerText = `Cart items: ${cart.length}`;
  });

  window._bb_customizer = { config, buildIdentifiers, saveToLocalCart };
});
