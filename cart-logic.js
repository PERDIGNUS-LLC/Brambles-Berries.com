// File: cart-logic.js

// 🔑 Stripe Publishable Key (frontend). This one is safe to be public.
const STRIPE_PUBLISHABLE_KEY = "pk_live_51SBmn37ywjQM5ca8riRBkuS6PLt7UUU4RSXzsJte8xXZxuTmjKnR5EcMLLCaHWFmk7j4ElguOMAFfykiyhL72ayC0049Aejzrt";

// Initialize Stripe.js
let stripe = null;
function getStripe() {
    if (!STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY.includes("REPLACE")) {
        console.error("Stripe publishable key is not set correctly in cart-logic.js");
        return null;
    }
    if (!stripe) {
        stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
    }
    return stripe;
}

let cart = [];
const CART_STORAGE_KEY = "bb_cart";

// ---- Cart persistence helpers ----

function loadCart() {
    try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        if (!raw) {
            cart = [];
            return;
        }
        const parsed = JSON.parse(raw);
        cart = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        console.error("Error loading cart from localStorage:", err);
        cart = [];
    }
}

function saveCart() {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {
        console.error("Error saving cart to localStorage:", err);
    }
}

function parsePriceString(priceText) {
    if (!priceText) return 0;
    const n = parseFloat(priceText.replace(/[^0-9.]/g, ""));
    return isNaN(n) ? 0 : n;
}

function formatPrice(num) {
    return "$" + num.toFixed(2);
}

function getCartCount() {
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
}

// ---- UI Updates ----

function updateCartCountDisplay() {
    const countEl = document.getElementById("cartCount");
    if (!countEl) return;
    countEl.textContent = getCartCount();
}

function updateSubtotalDisplay() {
    const subtotalEl = document.getElementById("cartSubtotal");
    if (!subtotalEl) return;

    const subtotal = cart.reduce((sum, item) => {
        const priceNumber =
            typeof item.priceNumber === "number"
                ? item.priceNumber
                : parsePriceString(item.price);
        return sum + priceNumber * (item.quantity || 1);
    }, 0);

    subtotalEl.textContent = formatPrice(subtotal);
}

function renderCart() {
    const container = document.getElementById("cartItemsContainer");
    if (!container) return;

    if (!cart.length) {
        container.innerHTML = "<p>Your cart is empty.</p>";
        updateCartCountDisplay();
        updateSubtotalDisplay();
        return;
    }

    container.innerHTML = "";

    cart.forEach((item, index) => {
        const wrapper = document.createElement("div");
        wrapper.className = "cart-item";

        const img = document.createElement("img");
        img.src = item.imageSrc || "";
        img.alt = item.name || "Cart item";

        const info = document.createElement("div");
        info.className = "cart-item-info";

        const nameEl = document.createElement("div");
        nameEl.className = "cart-item-name";
        nameEl.textContent = item.name || "Unknown Product";

        const meta = document.createElement("div");
        meta.className = "cart-item-meta";
        const sizeText = item.size ? `Size: ${item.size}` : "";
        const qtyText = `Qty: ${item.quantity || 1}`;
        meta.textContent = [sizeText, qtyText].filter(Boolean).join(" • ");

        const priceEl = document.createElement("div");
        priceEl.className = "cart-item-price";
        const priceNumber =
            typeof item.priceNumber === "number"
                ? item.priceNumber
                : parsePriceString(item.price);
        priceEl.textContent = formatPrice(priceNumber);

        const removeBtn = document.createElement("button");
        removeBtn.className = "cart-item-remove";
        removeBtn.textContent = "Remove";
        removeBtn.addEventListener("click", () => {
            removeCartItem(index);
        });

        info.appendChild(nameEl);
        info.appendChild(meta);
        info.appendChild(priceEl);
        info.appendChild(removeBtn);

        wrapper.appendChild(img);
        wrapper.appendChild(info);

        container.appendChild(wrapper);
    });

    updateCartCountDisplay();
    updateSubtotalDisplay();
}

function removeCartItem(index) {
    if (index < 0 || index >= cart.length) return;
    cart.splice(index, 1);
    saveCart();
    renderCart();
}

// ---- Drawer open/close ----

function openCartDrawer() {
    const drawer = document.getElementById("cartDrawer");
    if (!drawer) return;
    drawer.classList.add("open");
}

function closeCartDrawer() {
    const drawer = document.getElementById("cartDrawer");
    if (!drawer) return;
    drawer.classList.remove("open");
}

// ---- Add items to cart ----

function addToCartFromCard(productCard) {
    const nameEl = productCard.querySelector("h3");
    const priceEl = productCard.querySelector(".price");
    const imgEl = productCard.querySelector("img");

    const product = {
        priceId: productCard.dataset.priceId || null,
        size: productCard.dataset.size || null,
        name: nameEl ? nameEl.textContent.trim() : "Unknown Product",
        price: priceEl ? priceEl.textContent.trim() : "$0.00",
        imageSrc: imgEl ? imgEl.getAttribute("src") : "",
    };

    const priceNumber = parsePriceString(product.price);

    // Try to merge with existing matching item
    const existing = cart.find(
        (item) =>
            item.priceId === product.priceId &&
            item.size === product.size &&
            item.name === product.name
    );

    if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
    } else {
        cart.push({
            ...product,
            quantity: 1,
            priceNumber,
        });
    }

    saveCart();
    renderCart();
    openCartDrawer();
}

// ---- Stripe Checkout ----

async function proceedToCheckout() {
    if (!cart.length) {
        alert("Your cart is empty.");
        return;
    }

    const stripeClient = getStripe();
    if (!stripeClient) {
        alert("Stripe is not configured correctly. Check the publishable key in cart-logic.js.");
        return;
    }

    // Only send items that actually have Stripe price IDs
    const payloadCart = cart
        .filter((item) => item.priceId)
        .map((item) => ({
            priceId: item.priceId,
            quantity: item.quantity || 1,
        }));

    if (!payloadCart.length) {
        alert("No items in your cart have Stripe price IDs configured.");
        console.error("Cart items missing priceId:", cart);
        return;
    }

    try:
        const response = await fetch("/api/create-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cart: payloadCart }),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error("Error from create-checkout-session:", response.status, text);
            alert("Failed to start checkout. See console for details.");
            return;
        }

        const data = await response.json();
        if (!data.id) {
            console.error("No session id returned from create-checkout-session:", data);
            alert("Checkout session was not created properly.");
            return;
        }

        const { error } = await stripeClient.redirectToCheckout({
            sessionId: data.id,
        });

        if (error) {
            console.error("Stripe redirectToCheckout error:", error);
            alert("There was a problem redirecting to checkout.");
        }
    } catch (err) {
        console.error("Error during proceedToCheckout:", err);
        alert("Could not start checkout. Please try again.");
    }
}

// ---- Wire up events on DOM ready ----

document.addEventListener("DOMContentLoaded", () => {
    loadCart();
    renderCart();

    const allProductButtons = document.querySelectorAll(".add-to-cart-button");
    allProductButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const productCard = button.closest(".product-card");
            if (!productCard) {
                console.error("No product card found for button");
                return;
            }
            addToCartFromCard(productCard);
        });
    });

    const openCartButton = document.getElementById("openCartButton");
    const closeCartButton = document.getElementById("closeCartButton");
    const cartOverlay = document.getElementById("cartOverlay");
    const checkoutButton = document.getElementById("checkoutButton");

    if (openCartButton) {
        openCartButton.addEventListener("click", () => openCartDrawer());
    }
    if (closeCartButton) {
        closeCartButton.addEventListener("click", () => closeCartDrawer());
    }
    if (cartOverlay) {
        cartOverlay.addEventListener("click", () => closeCartDrawer());
    }
    if (checkoutButton) {
        checkoutButton.addEventListener("click", () => {
            proceedToCheckout();
        });
    }

    updateCartCountDisplay();
});
