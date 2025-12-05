const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
    try {
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method not allowed" });
        }

        const { items } = req.body;

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: "Invalid items array" });
        }

        // Convert cart items to Stripe line items
        const line_items = items.map(item => ({
            price: item.priceId,
            quantity: item.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            line_items,
            success_url: `${req.headers.origin}/success.html`,
            cancel_url: `${req.headers.origin}/shop.html`
        });

        return res.status(200).json({ url: session.url });

    } catch (err) {
        console.error("CHECKOUT ERROR:", err);
        return res.status(500).json({ error: err.message });
    }
};
