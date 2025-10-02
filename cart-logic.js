// File: cart-logic.js

document.addEventListener('DOMContentLoaded', () => {
    const allProductButtons = document.querySelectorAll('.add-to-cart-button');

    allProductButtons.forEach(button => {
        button.addEventListener('click', () => {
            const productCard = button.closest('.product-card');
            if (!productCard) {
                console.error('No product card found for button');
                return;
            }

            const nameEl = productCard.querySelector('h3');
            const priceEl = productCard.querySelector('.price');

            const product = {
                priceId: productCard.dataset.priceId || null,
                size: productCard.dataset.size || null,
                name: nameEl ? nameEl.textContent : 'Unknown Product',
                price: priceEl ? priceEl.textContent : '0.00'
            };

            console.log('Starting checkout for:', product);
            alert(`Next step: We would now ask for the shipping address for the ${product.name}.`);

            // --- THIS IS A SIMULATED NEXT STEP ---
            // In your real code, you would get this data from a form the user fills out.
            const simulatedAddress = {
                street1: '164 Townsend St',
                city: 'San Francisco',
                state: 'CA',
                zip: '94107',
                country: 'US'
            };

            // After getting the address, call our function to get rates.
            fetchShippingRates(simulatedAddress, product);
        });
    });
});

async function fetchShippingRates(customerAddress, product) {
    console.log('Fetching rates from our secure function...');

    try {
        const response = await fetch('/api/get-shipping-rates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerAddress, product })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Server error: ${response.status} ${text}`);
        }

        const rates = await response.json();

        if (!rates.length) {
            alert('No shipping rates returned.');
            return;
        }

        console.log('SUCCESS! Received rates:', rates);
        alert(`Received ${rates.length} shipping rates! The cheapest is $${rates[0].rate}. Check the console for details.`);

        // TODO: Display these rates to the user and let them choose one.
        // After they choose, you will proceed to Stripe checkout with the final total.

    } catch (error) {
        console.error('Error fetching shipping rates:', error);
        alert('Could not get shipping rates. Please try again.');
    }
}
