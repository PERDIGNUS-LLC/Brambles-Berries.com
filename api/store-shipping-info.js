export const config = { runtime: "nodejs" };

import { kv } from "@vercel/kv";

// Utility to read JSON body for Node functions
async function getJSON(req) {
    return new Promise((resolve, reject) => {
        let b = "";
        req.on("data", chunk => (b += chunk));
        req.on("end", () => {
            try {
                resolve(JSON.parse(b));
            } catch (e) {
                reject(new Error("Invalid JSON"));
            }
        });
    });
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        const { cart, address, shippingRate } = await getJSON(req);

        if (!cart || !address || !shippingRate) {
            return res.status(400).json({ error: "Missing cart, address, or shipping rate" });
        }

        // Generate unique token for this order
        const orderToken = "ORD_" + Math.random().toString(36).substring(2, 12);

        // Save into KV
        await kv.set(orderToken, {
            cart,
            address,
            shippingRate,
            timestamp: Date.now()
        });

        console.log("💾 Saved shipping info:", orderToken);

        return res.status(200).json({ orderToken });

    } catch (err) {
        console.error("KV Save Error:", err);
        return res.status(500).json({ error: err.message });
    }
}
