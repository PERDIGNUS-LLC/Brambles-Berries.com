// File: api/create-checkout-session.js

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
    try {
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method not allowed" });
        }

        const body = req.body || {};
        const cart = body.cart;

        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            return res.status(400).json({ error: "Cart is empty or invalid." });
        }

        const lineItems = cart.map((item) => ({
            price: item.priceId,
            quantity: item.quantity || 1,
        }));

        console.log("Creating Stripe session with line items:", lineItems);

        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            line_items: lineItems,
            success_url: `${req.headers.origin}/success.html`,
            cancel_url: `${req.headers.origin}/shop.html`,
        });

        console.log("Stripe session created:", session.id);

        return res.status(200).json({ id: session.id });
    } catch (error) {
        console.error("Stripe Session Error:", error);
        return res.status(500).json({ error: error.message });
    }
};
