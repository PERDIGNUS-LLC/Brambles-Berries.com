// File: cart-logic.js
// Matches current shop.html IDs and class names

document.addEventListener('DOMContentLoaded', () => {
    // ---- DOM ELEMENTS (MATCH YOUR shop.html) ----
    const openCartButton   = document.getElementById('open-cart');
    const cartOverlay      = document.getElementById('cart-overlay');
    const cartSidebar      = document.getElementById('cart-sidebar');
    const closeCartButton  = document.getElementById('close-cart');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartSubtotalEl   = document.getElementById('cart-subtotal');
    const checkoutButton   = document.getElementById('checkout-button');
    const cartCountPill    = document.getElementById('cart-count-pill');

    const addToCartButtons = document.querySelectorAll('.add-to-cart-button');

    const STORAGE_KEY = 'bb_cart_items';

    // ---- CART STATE ----
    let cart = loadCart();
    renderCart();

    // ---- CART OPEN/CLOSE ----
    function openCart() {
        if (cartOverlay) cartOverlay.style.display = 'block';
        if (cartSidebar) cartSidebar.style.right = '0';
    }

    function closeCart() {
        if (cartOverlay) cartOverlay.style.display = 'none';
        if (cartSidebar) cartSidebar.style.right = '-420px';
    }

    if (openCartButton) {
        openCartButton.addEventListener('click', openCart);
    }
    if (closeCartButton) {
        closeCartButton.addEventListener('click', closeCart);
    }
    if (cartOverlay) {
        cartOverlay.addEventListener('click', closeCart);
    }

    // ---- LOAD/SAVE ----
    function loadCart() {
        try {
            const json = localStorage.getItem(STORAGE_KEY);
            const parsed = json ? JSON.parse(json) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    function saveCart() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
        } catch {
            // ignore storage errors
        }
    }

    // ---- ADD TO CART ----
    addToCartButtons.forEach(button => {
        button.addEventListener('click', () => {
            const card = button.closest('.product-card');
            if (!card) return;

            const name  = card.querySelector('h3')?.textContent.trim() || 'Item';
            const price = card.querySelector('.price')?.textContent.trim() || '$0';
            const priceId = card.dataset.priceId || '';
            const size    = card.dataset.size || '';
            const img     = card.querySelector('img')?.src || '';

            const existingIndex = cart.findIndex(
                item => item.priceId === priceId && item.size === size
            );

            if (existingIndex >= 0) {
                cart[existingIndex].quantity += 1;
            } else {
                cart.push({
                    name,
                    price,
                    priceId,
                    size,
                    img,
                    quantity: 1
                });
            }

            renderCart();
            openCart();
        });
    });

    // ---- RENDER CART ----
    function renderCart() {
        if (!cartItemsContainer || !cartSubtotalEl || !cartCountPill) {
            return; // HTML not present, nothing to render
        }

        cartItemsContainer.innerHTML = '';

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
        } else {
            cart.forEach((item, index) => {
                const row = document.createElement('div');
                row.className = 'cart-item';
                row.innerHTML = `
                    <img src="${item.img}" alt="">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-meta">Size: ${item.size}</div>
                        <div class="cart-item-price">${item.price} × ${item.quantity}</div>
                        <button class="cart-item-remove">Remove</button>
                    </div>
                `;

                const removeBtn = row.querySelector('.cart-item-remove');
                if (removeBtn) {
                    removeBtn.addEventListener('click', () => {
                        cart.splice(index, 1);
                        renderCart();
                    });
                }

                cartItemsContainer.appendChild(row);
            });
        }

        const subtotal = calculateSubtotal();
        cartSubtotalEl.textContent = `$${subtotal.toFixed(2)}`;

        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountPill.textContent = totalItems;

        if (checkoutButton) {
            checkoutButton.disabled = cart.length === 0;
        }

        saveCart();
    }

    function calculateSubtotal() {
        return cart.reduce((acc, item) => {
            const priceNum = parseFloat(
                String(item.price).replace(/[^0-9.]/g, '')
            ) || 0;
            return acc + priceNum * item.quantity;
        }, 0);
    }

    // ---- CHECKOUT ----

    if (checkoutButton) {
        checkoutButton.addEventListener('click', async () => {
            if (cart.length === 0) return;

            checkoutButton.disabled = true;
            checkoutButton.textContent = "Processing...";

            try {
                const response = await fetch("/api/create-checkout-session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ items: cart })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Checkout failed.");
                }

                // Redirect to Stripe Checkout
                window.location.href = data.url;

            } catch (err) {
                console.error("Checkout error:", err);
                alert("Error starting checkout: " + err.message);
            } finally {
                checkoutButton.disabled = false;
                checkoutButton.textContent = "Proceed to Checkout";
            }
        });
    }
});

   
