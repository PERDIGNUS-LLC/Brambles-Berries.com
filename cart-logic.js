// cart-logic.js

(function () {
  const CART_KEY = "bb_cart_items";

  const openBtn = document.getElementById("open-cart");
  const closeBtn = document.getElementById("close-cart");
  const overlay = document.getElementById("cart-overlay");
  const sidebar = document.getElementById("cart-sidebar");
  const cartItemsEl = document.getElementById("cart-items");
  const subtotalEl = document.getElementById("cart-subtotal");
  const cartCountPill = document.getElementById("cart-count-pill");
  const checkoutBtn = document.getElementById("checkout-button");

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

  function money(n) {
    return `$${Number(n || 0).toFixed(2)}`;
  }

  function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    if (cartCountPill) cartCountPill.textContent = String(count);
  }

  function openCart() {
    if (!overlay || !sidebar) return;
    overlay.style.display = "block";
    requestAnimationFrame(() => {
      sidebar.style.right = "0px";
    });
    renderCart();
  }

  function closeCart() {
    if (!overlay || !sidebar) return;
    sidebar.style.right = "-420px";
    overlay.style.display = "none";
  }

  function renderCart() {
    if (!cartItemsEl || !subtotalEl) return;

    const cart = getCart();
    cartItemsEl.innerHTML = "";

    if (cart.length === 0) {
      cartItemsEl.innerHTML = `<p>Your cart is empty.</p>`;
      subtotalEl.textContent = money(0);
      if (checkoutBtn) {
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = "Proceed to Checkout";
      }
      updateCartCount();
      return;
    }

    let subtotal = 0;
    let hasQuoteItems = false;

    cart.forEach((item, idx) => {
      const qty = item.quantity || 1;
      const price = Number(item.price || 0);
      const line = price * qty;

      // If item has no priceId, treat as quote-only (no checkout)
      if (!item.priceId) hasQuoteItems = true;

      subtotal += line;

      const wrapper = document.createElement("div");
      wrapper.className = "cart-item";

      const img = document.createElement("img");
      img.src = item.image || "images/customizer/none.png";
      img.alt = item.name || "Item";

      const right = document.createElement("div");

      const title = document.createElement("div");
      title.className = "cart-item-title";
      title.textContent = item.name || "Item";

      const meta = document.createElement("div");
      meta.className = "cart-item-meta";
      const size = item.size ? `Size: ${item.size}` : "";
      const priceText = item.priceId ? `${money(price)} × ${qty}` : `Quote Request (no payment yet)`;
      meta.textContent = [size, priceText].filter(Boolean).join(" • ");

      const actions = document.createElement("div");
      actions.className = "cart-item-actions";

      const minus = document.createElement("button");
      minus.textContent = "−";
      minus.addEventListener("click", () => {
        const c = getCart();
        if (!c[idx]) return;
        c[idx].quantity = Math.max(1, (c[idx].quantity || 1) - 1);
        setCart(c);
        renderCart();
        updateCartCount();
      });

      const plus = document.createElement("button");
      plus.textContent = "+";
      plus.addEventListener("click", () => {
        const c = getCart();
        if (!c[idx]) return;
        c[idx].quantity = (c[idx].quantity || 1) + 1;
        setCart(c);
        renderCart();
        updateCartCount();
      });

      const remove = document.createElement("button");
      remove.textContent = "Remove";
      remove.addEventListener("click", () => {
        const c = getCart();
        c.splice(idx, 1);
        setCart(c);
        renderCart();
        updateCartCount();
      });

      actions.appendChild(minus);
      actions.appendChild(plus);
      actions.appendChild(remove);

      right.appendChild(title);
      right.appendChild(meta);
      right.appendChild(actions);

      wrapper.appendChild(img);
      wrapper.appendChild(right);

      cartItemsEl.appendChild(wrapper);
    });

    subtotalEl.textContent = money(subtotal);

    if (checkoutBtn) {
      if (hasQuoteItems) {
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = "Quotes pending — checkout disabled";
      } else {
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = "Proceed to Checkout";
      }
    }

    updateCartCount();
  }

  // Checkout
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      const cart = getCart();

      // Safety: block checkout if any quote-only item exists
      if (cart.some(i => !i.priceId)) {
        alert("Your cart contains a Quote Request item. Please remove it before checkout.");
        return;
      }

      // Redirect to checkout page
      window.location.href = "checkout.html";
    });
  }

  // Wiring
  openBtn?.addEventListener("click", openCart);
  closeBtn?.addEventListener("click", closeCart);
  overlay?.addEventListener("click", closeCart);

  // Keep count synced across tabs/pages
  window.addEventListener("storage", (e) => {
    if (e.key === CART_KEY) {
      updateCartCount();
      renderCart();
    }
  });

  // Expose helpers for other scripts (Customizer)
  window.bbCart = {
    getCart,
    setCart,
    openCart,
    closeCart,
    renderCart,
    updateCartCount
  };

  // Init
  updateCartCount();
})();
