// File: api/get-shipping-rates.js
export const config = { runtime: "edge" };

export default async function handler(req) {
    try {
        if (req.method !== "POST") {
            return new Response(
                JSON.stringify({ error: "Method not allowed" }),
                { status: 405 }
            );
        }

        const body = await req.json();
        const { address, cart } = body;

        if (!address || !cart || !Array.isArray(cart)) {
            return new Response(
                JSON.stringify({ error: "Invalid request body" }),
                { status: 400 }
            );
        }

        // Weight/dimensions for S and L stools
        const shippingProfiles = {
            S: { weight: 56.5, length: 14, width: 14, height: 2 },
            L: { weight: 115.5, length: 18, width: 12, height: 2 }
        };

        // Combine items (EasyPost supports sending one parcel per request)
        let totalWeight = 0;
        let length = 0;
        let width = 0;
        let height = 0;

        cart.forEach(item => {
            const profile = shippingProfiles[item.size];
            if (profile) {
                totalWeight += profile.weight * item.quantity;
                length = Math.max(length, profile.length);
                width = Math.max(width, profile.width);
                height += profile.height * item.quantity;
            }
        });

        const apiKey = process.env.EASYPOST_API_KEY;

        const response = await fetch("https://api.easypost.com/v1/shipments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization:
                    "Basic " + btoa(apiKey + ":")
            },
            body: JSON.stringify({
                shipment: {
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
                    parcel: {
                        weight: totalWeight,
                        length,
                        width,
                        height
                    }
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return new Response(
                JSON.stringify({ error: data.error?.message || "EasyPost error" }),
                { status: 500 }
            );
        }

        return new Response(JSON.stringify({ rates: data.rates }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
