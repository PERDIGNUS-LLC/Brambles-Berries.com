// File: netlify/functions/get-shipping-rates.js

const EasyPost = require('@easypost/api');

// --- IMPORTANT: ACTION REQUIRED ---
// 1. Replace with your REAL EasyPost Secret API Key. 
//    For production, store this in Netlify's "Environment Variables" and use process.env.EASYPOST_API_KEY
const easyPostApi = new EasyPost('YOUR_EASYPOST_API_KEY'); 

// This is the data for your shipping profiles.
const shippingProfiles = {
  S: { weight: 56.5, length: 14, width: 14, height: 2 },
  L: { weight: 115.5, length: 18, width: 12, height: 2 }
};

// This is the main function Netlify will run.
exports.handler = async function(event) {
  // Get the address and product info sent from the cart-logic.js file.
  const { customerAddress, product } = JSON.parse(event.body);

  const parcelData = shippingProfiles[product.size];

  if (!parcelData) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid product size.' }) };
  }

  // --- ACTION REQUIRED ---
  // 2. Fill in your "ship from" address here.
  const fromAddress = {
    street1: '1520 Leffingwell Avenue',
    city: 'Grand Rapids',
    state: 'Michigan',
    zip: '49525',
    country: 'US',
    company: 'Brambles and Berries',
    phone: '6166437988'
  };

  try {
    // Create the shipment object and request rates from EasyPost.
    const shipment = await easyPostApi.Shipment.create({
      to_address: customerAddress,
      from_address: fromAddress,
      parcel: parcelData
    });

    // Success! Send the calculated rates back to the frontend.
    return {
      statusCode: 200,
      body: JSON.stringify(shipment.rates)
    };
 // INSIDE: netlify/functions/get-shipping-rates.js

  } catch (error) {
    console.error('EasyPost API Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }) // This is the NEW line
    };
  }
