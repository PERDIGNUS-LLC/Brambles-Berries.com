const EasyPost = require('@easypost/api');

// This is the Vercel-native export format
module.exports = async (req, res) => {
    try {
        // Vercel automatically parses the body, so we just use req.body
        const { customerAddress, product } = req.body;

        const easyPostApi = new EasyPost(process.env.EASYPOST_API_KEY);

        const shippingProfiles = {
            S: { weight: 56.5, length: 14, width: 14, height: 2 },
            L: { weight: 115.5, length: 18, width: 12, height: 2 }
        };

        const parcelData = shippingProfiles[product.size];
        if (!parcelData) {
            // In Vercel, we send responses like this
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

        const shipment = await easyPostApi.Shipment.create({
            to_address: customerAddress,
            from_address: fromAddress,
            parcel: parcelData
        });

        // This is the success response in Vercel's format
        return res.status(200).json(shipment.rates);

    } catch (error) {
        console.error("Function Error:", error);
        // This is the error response in Vercel's format
        return res.status(500).json({ error: error.message });
    }
};
