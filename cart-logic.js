// File: cart-logic.js

document.addEventListener('DOMContentLoaded', () => {
    const allProductButtons = document.querySelectorAll('.add-to-cart-button');

    allProductButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const productCard = event.target.closest('.product-card');
            
            const product = {
                priceId: productCard.dataset.priceId,
                size: productCard.dataset.size,
                name: productCard.querySelector('h3').textContent,
                price: productCard.querySelector('.price').textContent
            };

            // For now, we are not building a multi-item cart.
            // Clicking "Add to Cart" will immediately start the checkout for that ONE item.
            // This is where you would pop up a modal to ask for the shipping address.
            
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
        const response = await fetch('/.netlify/functions/get-shipping-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // <-- ADD THIS LINE
        body: JSON.stringify({ customerAddress, product })
    });

        if (!response.ok) {
            throw new Error('Server function failed');
        }

        const rates = await response.json();
        
        console.log('SUCCESS! Received rates:', rates);
        alert(`Received ${rates.length} shipping rates! The cheapest is $${rates[0].rate}. Check the console for details.`);

        // TODO: Display these rates to the user and let them choose one.
        // After they choose, you will proceed to Stripe checkout with the final total.

    } catch (error) {
        console.error('Error fetching shipping rates:', error);
        alert('Could not get shipping rates. Please try again.');
    }
}
