// api/create-checkout-session.js
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { cartItems, shippingRate } = req.body;

        if (!cartItems || !Array.isArray(cartItems)) {
            return res.status(400).json({ error: 'Invalid cart items' });
        }

        // Convert your cart into Stripe line items
        const line_items = cartItems.map(item => ({
            price: item.priceId,
            quantity: item.quantity,
        }));

        // Create the checkout session
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',

            // REQUIRED to collect shipping address
            shipping_address_collection: {
                allowed_countries: ['US'],
            },

            // APPLY THE SHIPPING RATE RETURNED FROM YOUR EasyPost API
            shipping_options: [
                {
                    shipping_rate_data: {
                        type: 'fixed_amount',
                        fixed_amount: {
                            amount: Math.round(shippingRate * 100), // USD → cents
                            currency: 'usd',
                        },
                        display_name: 'Shipping',
                    }
                }
            ],

            line_items,
            success_url: `${req.headers.origin}/success.html`,
            cancel_url: `${req.headers.origin}/shop.html`,
        });

        return res.status(200).json({ url: session.url });

    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
