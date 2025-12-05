export const config = {
    api: {
        bodyParser: false, // ❗ REQUIRED — Stripe needs the raw body
    },
    runtime: "nodejs"
};

import Stripe from "stripe";
import getRawBody from "raw-body";
import EasyPost from "@easypost/api";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const easypost = new EasyPost(process.env.EASYPOST_API_KEY);

export default async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    let rawBody;
    try {
        rawBody = await getRawBody(req);
    } catch (err) {
        return res.status(400).json({ error: "Could not read body" });
    }

    const sig = req.headers["stripe-signature"];

    let event;
    try {
        event = stripe.webhooks.constructEvent(
            rawBody,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error("❌ Webhook signature failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle checkout completion
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        console.log("💰 Stripe checkout completed:", session.id);

        // Extract metadata passed during checkout creation
        const metadata = session.metadata || {};

        const address = {
            street1: metadata.street1,
            city: metadata.city,
            state: metadata.state,
            zip: metadata.zip,
            country: metadata.country
        };

        const parcel = {
            weight: Number(metadata.weight),
            length: Number(metadata.length),
            width: Number(metadata.width),
            height: Number(metadata.height)
        };

        const selectedRateId = metadata.selected_rate_id;

        if (!selectedRateId) {
            console.error("❌ No rate ID provided in metadata");
            return res.status(200).json({ received: true });
        }

        try {
            // 1️⃣ Recreate shipment
            const shipment = await easypost.Shipment.create({
                to_address: address,
                from_address: {
                    street1: "1520 LEFFINGWELL AVE NE",
                    city: "GRAND RAPIDS",
                    state: "MI",
                    zip: "49525",
                    country: "US",
                    company: "PERDIGNUS LLC",
                    phone: "6167196346"
                },
                parcel
            });

            // 2️⃣ Find the same rate from EasyPost
            const rate = shipment.rates.find(r => r.id === selectedRateId);

            if (!rate) {
                console.error("❌ Rate not found in recreated shipment");
                return res.status(200).json({ received: true });
            }

            // 3️⃣ Buy the shipping label
            const bought = await shipment.buy({ rate });

            console.log("📦 Label purchased:", bought.postage_label.label_url);
            console.log("🔍 Tracking:", bought.tracking_code);

            // 4️⃣ Store tracking + label URL in Stripe metadata
            await stripe.checkout.sessions.update(session.id, {
                metadata: {
                    ...metadata,
                    tracking_code: bought.tracking_code,
                    label_url: bought.postage_label.label_url,
                    tracking_url: bought.tracker.public_url
                }
            });

        } catch (err) {
            console.error("❌ EasyPost label purchase error:", err);
        }
    }

    res.status(200).json({ received: true });
}
