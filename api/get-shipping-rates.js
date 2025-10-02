// File: api/get-shipping-rates.js

const EasyPost = require('@easypost/api');

exports.handler = async function(event) {
  try {
    const easyPostApi = new EasyPost(process.env.EASYPOST_API_KEY); 

    const shippingProfiles = {
      S: { weight: 56.5, length: 14, width: 14, height: 2 },
      L: { weight: 115.5, length: 18, width: 12, height: 2 }
    };

    const { customerAddress, product } = JSON.parse(event.body);

    const parcelData = shippingProfiles[product.size];

    if (!parcelData) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid product size.' }) };
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

    return {
      statusCode: 200,
      body: JSON.stringify(shipment.rates)
    };

  } catch (error) {
    console.error("Function Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
