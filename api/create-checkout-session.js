// File: api/create-checkout-session.js

import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET;
if (!stripeSecretKey) {
  console.error('❌ STRIPE_SECRET_KEY is not set in Environment Variables.');
}

// Create the Stripe client
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

export default async function handler(req, res) {
  // Vercel Serverless Function entrypoint

  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    if (!stripe) {
      return res.status(500).json({
        error: 'Stripe configuration error',
        details: 'Missing STRIPE_SECRET_KEY environment variable.'
      });
    }

    const { items } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'No items provided',
        details: 'Expected body: { items: [{ priceId, quantity }] }'
      });
    }

    // Convert cart items into Stripe line_items
    const line_items = items.map((item) => {
      if (!item.priceId) {
        throw new Error('Cart item missing priceId');
      }
      return {
        price: item.priceId,
        quantity: item.quantity && item.quantity > 0 ? item.quantity : 1
      };
    });

    const origin = req.headers.origin || 'https://bramblesandberries.com';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop.html`,
      billing_address_collection: 'required'
    });

    // ✅ Return JSON so the frontend can do data.url
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('❌ Error in create-checkout-session:', err);

    // Make absolutely sure we always return JSON, not HTML
    return res.status(500).json({
      error: 'Internal server error',
      details: err.message || 'Unknown error'
    });
  }
}
