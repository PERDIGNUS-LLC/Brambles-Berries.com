// File: netlify/functions/get-shipping-rates.js

const EasyPost = require('@easypost/api');

exports.handler = async function(event) {
  // Start the try block immediately to catch any error.
  try {
    const easyPostApi = new EasyPost(process.env.EASYPOST_API_KEY); 

    const shippingProfiles = {
      S: { weight: 56.5, length: 14, width: 14, height: 2 },
      L: { weight: 115.5, length: 18, width: 12, height: 2 }
    };

    const { customerAddress, product } = JSON.parse(event.body);

    const parcelData = shippingProfiles[product.size];

    if (!parcelData) {
      // This is a user error, not a server crash, so we handle it cleanly.
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid product size.' }) };
    }

    const fromAddress = {
      street1: '125 S King St', // IMPORTANT: Use your real "ship from" address
      city: 'Seattle',
      state: 'WA',
      zip: '98104',
      country: 'US',
      company: 'Brambles and Berries',
      phone: '555-555-5555'
    };

    const shipment = await easyPostApi.Shipment.create({
      to_address: customerAddress,
      from_address: fromAddress,
      parcel: parcelData
    });

    // This is the success path
    return {
      statusCode: 200,
      body: JSON.stringify(shipment.rates)
    };

  } catch (error) {
    // This will now catch ANY error, including initialization errors.
    console.error('Unhandled Function Error:', error);
    return {
      statusCode: 500,
      // We send back the detailed error message to the browser for debugging.
      body: JSON.stringify({ 
          error: error.message, 
          stack: error.stack // Include the stack trace for more detail
      })
    };
  }
};
