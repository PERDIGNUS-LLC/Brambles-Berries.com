// force update 1
// File: cart-logic.js
// Rewritten to match EXACT shop.html IDs

document.addEventListener('DOMContentLoaded', () => {

    // ---- DOM ELEMENTS (MATCHING YOUR HTML EXACTLY) ----
    const openCartButton = document.getElementById('openCartButton');
    const cartDrawer = document.getElementById('cartDrawer');
    const cartOverlay = document.getElementById('cartOverlay');
    const closeCartButton = document.getElementById('closeCartButton');
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartSubtotal = document.getElementById('cartSubtotal');
    const checkoutButton = document.getElementById('checkoutButton');
    const cartCount = document.getElementById('cartCount');

    const addToCartButtons = document.querySelectorAll('.add-to-cart-button');

    const STORAGE_KEY = 'bb_cart_items';
    let cart = loadCart();
    renderCart();


    // ---- CART OPEN/CLOSE ----
    function openCart() {
        cartDrawer.classList.add('open');
    }

    function closeCart() {
        cartDrawer.classList.remove('open');
    }

    openCartButton?.addEventListener('click', openCart);
    closeCartButton?.addEventListener('click', closeCart);
    cartOverlay?.addEventListener('click', closeCart);


    // ---- LOAD/SAVE ----
    function loadCart() {
        try {
            const json = localStorage.getItem(STORAGE_KEY);
            return json ? JSON.parse(json) : [];
        } catch {
            return [];
        }
    }

    function saveCart() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    }


    // ---- ADD TO CART ----
    addToCartButtons.forEach(button => {
        button.addEventListener('click', () => {
            const card = button.closest('.product-card');
            if (!card) return;

            const name = card.querySelector('h3')?.textContent.trim() || 'Item';
            const price = card.querySelector('.price')?.textContent.trim() || '$0';
            const priceId = card.dataset.priceId;
            const size = card.dataset.size;

            const existingIndex = cart.findIndex(
                item => item.priceId === priceId && item.size === size
            );

            if (existingIndex >= 0) {
                cart[existingIndex].quantity++;
            } else {
                cart.push({
                    name,
                    price,
                    priceId,
                    size,
                    quantity: 1,
                    img: card.querySelector('img')?.src || ''
                });
            }

            renderCart();
            openCart();
        });
    });


    // ---- RENDER CART ----
    function renderCart() {
        cartItemsContainer.innerHTML = '';

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `<p>Your cart is empty.</p>`;
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

                row.querySelector('.cart-item-remove').addEventListener('click', () => {
                    cart.splice(index, 1);
                    renderCart();
                });

                cartItemsContainer.appendChild(row);
            });
        }

        const subtotal = calculateSubtotal();
        cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;

        cartCount.textContent = cart.reduce((t, i) => t + i.quantity, 0);

        checkoutButton.disabled = cart.length === 0;

        saveCart();
    }


    function calculateSubtotal() {
        return cart.reduce((acc, item) => {
            const priceNum = parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0;
            return acc + priceNum * item.quantity;
        }, 0);
    }


    // ---- CHECKOUT ----
    checkoutButton.addEventListener('click', async () => {
        if (cart.length === 0) return;

        checkoutButton.textContent = 'Processing...';
        checkoutButton.disabled = true;

        try {
            const res = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: cart })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Checkout failed.');

            window.location.href = data.url;
        } catch (err) {
            console.error(err);
            alert(err.message);
        } finally {
            checkoutButton.textContent = 'Proceed to Checkout';
            checkoutButton.disabled = false;
        }
    });

});
