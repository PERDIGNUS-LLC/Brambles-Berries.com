// File: api/create-checkout-session.js

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
    try {
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method not allowed" });
        }

        // Parse request body
        const { cart } = req.body;

        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            return res.status(400).json({ error: "Cart is empty or invalid." });
        }

        // Convert cart items into Stripe line items
        const lineItems = cart.map(item => ({
            price: item.priceId,  // STRIPE PRICE ID
            quantity: 1           // Always quantity 1 for stools
        }));

        console.log("Creating checkout session with line items:", lineItems);

        // Create Stripe Checkout session
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            line_items: lineItems,

            // The URL to return to after payment success
            success_url: `${req.headers.origin}/success.html`,
            cancel_url: `${req.headers.origin}/cancel.html`
        });

        console.log("Stripe session created:", session.id);

        // Respond with the URL Stripe returns
        return res.status(200).json({ url: session.url });

    } catch (error) {
        console.error("Stripe Session Error:", error);
        return res.status(500).json({ error: error.message });
    }
};
