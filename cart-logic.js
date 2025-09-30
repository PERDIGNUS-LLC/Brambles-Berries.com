// This function will be called by any page when it needs to get shipping rates.
// It sends the user's address and cart details to our secure Netlify function.
async function fetchShippingRates(customerAddress, cart) {
  try {
    // This is the special URL that triggers your secure serverless function.
    const response = await fetch('/.netlify/functions/get-shipping-rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerAddress, cart })
    });

    if (!response.ok) {
      throw new Error('The server could not fetch shipping rates.');
    }

    const rates = await response.json();
    console.log('Available shipping rates:', rates);
    //
    // TODO: Add your code here to display the rates to the user on the page.
    // For example, update the innerHTML of a div with the rate options.
    //
    
  } catch (error) {
    console.error('Error fetching shipping rates:', error);
  }
}

// Add event listeners to ALL "Add to Cart" buttons on any page.
// This code will run as soon as the script is loaded.
document.addEventListener('DOMContentLoaded', () => {
    const allAddToCartButtons = document.querySelectorAll('.add-to-cart-button'); // Use a common class for all buttons
    
    allAddToCartButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const productElement = event.target.closest('.product'); // Find the parent product container
            const priceId = productElement.id;
            const size = productElement.dataset.size; // Gets the 'S' or 'L' you added

            // Add the product to your cart object/array
            // This is where your existing cart management logic would go.
            console.log(`Added to cart: Product with size ${size}`);

            // For demonstration: When do you fetch rates?
            // Typically, you'd do this on the checkout page after the user enters their address.
            // Let's simulate that here:
            // const userCart = { items: [{ size: size }] };
            // const userAddress = { street1: '123 Main St', city: 'Anytown', state: 'CA', zip: '90210', country: 'US' };
            // fetchShippingRates(userAddress, userCart);
        });
    });
});
