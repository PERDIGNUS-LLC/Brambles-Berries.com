document.addEventListener("DOMContentLoaded", () => {
  const baseImage = document.getElementById("base-image");
  const eyesImage = document.getElementById("eyes-image");
  const mouthImage = document.getElementById("mouth-image");

  const selectors = {
    base: document.getElementById("base-selector"),
    eyes: document.getElementById("eyes-selector"),
    mouth: document.getElementById("mouth-selector")
  };

  // Config object to track selections
  const config = {
    base: "apple.png",
    eyes: null,
    mouth: null,
    qty: 1
  };

  // Options data (add all 28 bases / your real filenames)
  const options = {
    base: [
      { file: "apple.png", label: "Apple" },
      { file: "pumpkin.png", label: "Pumpkin" },
      { file: "carrot.png", label: "Carrot" }
      // TODO: add remaining 25 items
    ],
    eyes: [
      { file: null, label: "None" },
      { file: "style1.png", label: "Eyes 1" },
      { file: "style2.png", label: "Eyes 2" }
    ],
    mouth: [
      { file: null, label: "None" },
      { file: "smile.png", label: "Smile" },
      { file: "surprised.png", label: "Surprised" }
    ]
  };

  // Utility: create SKU-safe token (uppercase, alphanum + dashes)
  function skuToken(str) {
    if (!str) return "NONE";
    return String(str)
      .replace(/\.[^/.]+$/, "")       // strip file extension
      .replace(/[^a-z0-9]+/gi, "-")   // any non-alnum -> dash
      .replace(/-+/g, "-")            // collapse dashes
      .replace(/(^-|-$)/g, "")        // trim leading/trailing dash
      .toUpperCase();
  }

  // Build SKU string and human title
  function buildIdentifiers(cfg) {
    const baseToken = skuToken(cfg.base || "BASE");
    const eyesToken = skuToken(cfg.eyes);
    const mouthToken = skuToken(cfg.mouth);

    const sku = `B&B-${baseToken}-${eyesToken}-${mouthToken}`;
    const humanTitle = [
      cfg.base ? cfg.base.replace(/\.[^/.]+$/, "").replace(/-/g, " ") : "Custom Base",
      cfg.eyes ? `• Eyes: ${cfg.eyes.replace(/\.[^/.]+$/, "")}` : "",
      cfg.mouth ? `• Mouth: ${cfg.mouth.replace(/\.[^/.]+$/, "")}` : ""
    ].filter(Boolean).join(" ");

    return { sku, humanTitle };
  }

  // Persist cart item to localStorage (simple cart model)
  function saveToLocalCart(item) {
    const CART_KEY = "bb_custom_cart_v1";
    const raw = localStorage.getItem(CART_KEY);
    const cart = raw ? JSON.parse(raw) : [];
    cart.push(item);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    return cart;
  }

  // Populate selectors
  function populateSelector(type, targetElement) {
    options[type].forEach(opt => {
      const img = document.createElement("img");
      img.src = opt.file
        ? `images/customizer/${type}/${opt.file}`
        : "images/customizer/none.png";
      img.alt = opt.label;
      img.title = opt.label;

      img.addEventListener("click", () => {
        // ui highlight
        [...targetElement.children].forEach(c => c.classList.remove("selected"));
        img.classList.add("selected");

        // update config + preview
        config[type] = opt.file;

        if (type === "base") {
          baseImage.src = `images/customizer/${type}/${opt.file}`;
        } else if (type === "eyes") {
          if (opt.file) {
            eyesImage.src = `images/customizer/${type}/${opt.file}`;
            eyesImage.style.display = "block";
          } else {
            eyesImage.style.display = "none";
          }
        } else if (type === "mouth") {
          if (opt.file) {
            mouthImage.src = `images/customizer/${type}/${opt.file}`;
            mouthImage.style.display = "block";
          } else {
            mouthImage.style.display = "none";
          }
        }
      });

      targetElement.appendChild(img);
    });

    // Set first item selected by default
    if (targetElement.children.length > 0) {
      targetElement.children[0].click();
    }
  }

  populateSelector("base", selectors.base);
  populateSelector("eyes", selectors.eyes);
  populateSelector("mouth", selectors.mouth);

  // Add-to-cart logic (client-only local cart + optional server checkout)
  document.getElementById("add-to-cart").addEventListener("click", async () => {
    const { sku, humanTitle } = buildIdentifiers(config);

    // Build the cart item
    const priceCents = 3500; // example: $35.00 base price — you can change logic per base/variant
    const item = {
      sku,
      title: humanTitle,
      base: config.base,
      eyes: config.eyes,
      mouth: config.mouth,
      qty: config.qty,
      unit_price_cents: priceCents
    };

    // 1) Save locally so cart persists
    const cart = saveToLocalCart(item);
    console.log("Cart now:", cart);
    alert(`Added to cart: ${sku} — ${humanTitle}`);

    // 2) (OPTIONAL) Example: create Stripe Checkout Session (requires server)
    // If you have a server endpoint /create-checkout-session that accepts JSON,
    // send the item as metadata. Replace URL and remove comments to enable.
    /*
    try {
      const resp = await fetch("/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          line_items: [{
            price_data: {
              currency: "usd",
              product_data: {
                name: humanTitle,
                metadata: { sku }
              },
              unit_amount: priceCents
            },
            quantity: config.qty
          }],
          metadata: {
            custom_sku: sku,
            base: config.base,
            eyes: config.eyes,
            mouth: config.mouth
          },
          success_url: window.location.origin + "/checkout-success.html",
          cancel_url: window.location.origin + "/cart.html"
        })
      });

      const session = await resp.json();
      if (session.url) {
        window.location = session.url; // redirect to Stripe Checkout
      }
    } catch (err) {
      console.error("Stripe session error:", err);
      alert("Checkout failed. See console for details.");
    }
    */

    // 3) (OPTIONAL) If you use Shopify or other platform, you can push this item
    // as a note/metafield using their API or create a hidden product variant with the SKU.
  });

  // OPTIONAL: expose utility for debugging
  window._bb_customizer = {
    config,
    buildIdentifiers,
    saveToLocalCart
  };
});
