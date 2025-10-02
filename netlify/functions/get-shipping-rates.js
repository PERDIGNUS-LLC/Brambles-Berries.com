// File: netlify/functions/get-shipping-rates.js

const EasyPost = require('@easypost/api');

const easyPostApi = new EasyPost(process.env.EASYPOST_API_KEY); 

const shippingProfiles = {
  S: { weight: 56.5, length: 14, width: 14, height: 2 },
  L: { weight: 115.5, length: 18, width: 12, height: 2 }
};

// This is the main function Netlify will run
exports.handler = async function(event) {
  const { customerAddress, product } = JSON.parse(event.body);

  const parcelData = shippingProfiles[product.size];

  if (!parcelData) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid product size.' }) };
  }

  const fromAddress = {
    street1: '125 S King St', // IMPORTANT: Make sure this is your real address
    city: 'Seattle',
    state: 'WA',
    zip: '98104',
    country: 'US',
    company: 'Brambles and Berries',
    phone: '555-555-5555'
  };

  try {
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
    console.error('EasyPost API Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }) // This sends the real error to the browser
    };
  }
}; // <-- The typo was likely a missing character on this line or the one above it
