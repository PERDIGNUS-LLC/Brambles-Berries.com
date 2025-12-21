console.log("🔥 get-shipping-rates.js EXECUTED");

export const config = {
    runtime: "nodejs"
};

export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
    }

    try {
        // --- Parse JSON body manually (Vercel Node functions don’t give you req.body) ---
        const rawBody = await getRawBody(req);
        let parsed;

        try {
            parsed = rawBody ? JSON.parse(rawBody) : {};
        } catch (e) {
            return res.status(400).json({ error: 'Invalid JSON body.' });
        }

        const { customerAddress, product } = parsed;
        
        console.log("📦 Incoming parsed body:", parsed);
        console.log("📦 customerAddress:", customerAddress);
        console.log("📦 product:", product);

        if (!customerAddress || !product || !product.size) {
            return res.status(400).json({ error: 'Missing customerAddress or product.size in request body.' });
        }

        const apiKey = process.env.EASYPOST_API_KEY;
        if (!apiKey) {
            throw new Error('API key is not configured.');
        }

        const shippingProfiles = {
            S: { weight: 56.5, length: 18, width: 12, height: 2 },
            L: { weight: 115.5, length: 18, width: 12, height: 2 }
        };

        const parcelData = shippingProfiles[product.size];
        if (!parcelData) {
            return res.status(400).json({ error: 'Invalid product size.' });
        }

        const fromAddress = {
            street1: '1520 LEFFINGWELL AVE NE',
            city: 'GRAND RAPIDS',
            state: 'MI',
            zip: '49525',
            country: 'US',
            company: 'PERDIGNUS LLC',
            phone: '6167196346'
        };

        const response = await fetch('https://api.easypost.com/v2/shipments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // EasyPost uses Basic Auth with the API key as the username
                'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`
            },
            body: JSON.stringify({
                shipment: {
                    to_address: customerAddress,
                    from_address: fromAddress,
                    parcel: parcelData
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // If EasyPost returns an error, forward it
            const msg =
                (data && data.error && data.error.message) ||
                (Array.isArray(data?.errors) && data.errors[0]?.message) ||
                'EasyPost API error';
            throw new Error(msg);
        }

        // Send back just the rates array
        return res.status(200).json(data.rates || []);

    } catch (error) {
        console.error('Function Error:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}

/**
 * Read the raw request body into a string.
 * Works in Vercel Node.js serverless functions.
 */
function getRawBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => resolve(body));
        req.on('error', reject);
    });
}
