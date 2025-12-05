// File: api/create-checkout-session.js

import Stripe from "stripe";
export const config = { runtime: "edge" };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req) {
    try {
        // ⬅️ Now also accept shippingRate (and optionally address, even if unused)
        const { cart, shippingRate, address } = await req.json();

        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            return new Response(JSON.stringify({ error: "Cart is empty" }), { status: 400 });
        }

        // Build Stripe line_items using your actual priceId
        const line_items = cart.map(item => ({
            price: item.priceId,   // Stripe price ID
            quantity: item.quantity || 1
        }));

        // ---------------------------------------------
        // ✅ Add shipping as a separate line item (if provided)
        // ---------------------------------------------
        if (shippingRate && shippingRate.rate) {
            const shippingAmount = Math.round(Number(shippingRate.rate) * 100); // dollars → cents

            line_items.push({
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: `${shippingRate.carrier} ${shippingRate.service} Shipping`
                    },
                    unit_amount: shippingAmount
                },
                quantity: 1
            });
        }
        // ---------------------------------------------

        // Create the Checkout Session
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            line_items,
            success_url: `${process.env.NEXT_PUBLIC_DOMAIN}/success.html`,
            cancel_url: `${process.env.NEXT_PUBLIC_DOMAIN}/shop.html`,
            shipping_address_collection: { allowed_countries: ["US"] },
        });

        return new Response(JSON.stringify({ url: session.url }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
