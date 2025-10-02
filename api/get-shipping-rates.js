module.exports = async (req, res) => {
    try {
        const { customerAddress, product } = req.body;
        const apiKey = process.env.EASYPOST_API_KEY;

        if (!apiKey) {
            throw new Error("API key is not configured.");
        }

        const shippingProfiles = {
            S: { weight: 56.5, length: 14, width: 14, height: 2 },
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

        // We now build the API request manually and use fetch
        const response = await fetch('https://api.easypost.com/v1/shipments', {
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
            throw new Error(data.error.message || 'EasyPost API error');
        }

        return res.status(200).json(data.rates);

    } catch (error) {
        console.error("Function Error:", error);
        return res.status(500).json({ error: error.message });
    }
};
