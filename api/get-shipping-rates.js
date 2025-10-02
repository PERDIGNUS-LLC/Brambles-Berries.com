// File: api/get-shipping-rates.js

const EasyPost = require('@easypost/api');

exports.handler = async function(event) {
  console.log("Step 1: Function handler started.");

  try {
    console.log("Step 2: Entered the main try...catch block.");

    const apiKey = process.env.EASYPOST_API_KEY;
    if (!apiKey || apiKey.length < 10) {
      console.error("CRITICAL ERROR: EASYPOST_API_KEY environment variable not found or is invalid.");
      throw new Error("Server configuration error: API key is missing.");
    }
    console.log("Step 3: API Key is present.");

    const easyPostApi = new EasyPost(apiKey); 
    console.log("Step 4: EasyPost client initialized successfully.");

    const shippingProfiles = {
      S: { weight: 56.5, length: 14, width: 14, height: 2 },
      L: { weight: 115.5, length: 18, width: 12, height: 2 }
    };

    console.log("Step 5: Parsing request body.");
    const { customerAddress, product } = JSON.parse(event.body);
    console.log("Step 6: Request body parsed successfully.");

    const parcelData = shippingProfiles[product.size];
    if (!parcelData) {
      throw new Error(`Invalid product size received: ${product.size}`);
    }
    console.log(`Step 7: Found shipping profile for size '${product.size}'.`);
    
    const fromAddress = {
      street1: '1520 LEFFINGWELL AVE NE',
      city: 'GRAND RAPIDS',
      state: 'MI',
      zip: '49525',
      country: 'US',
      company: 'PERDIGNUS LLC', // <-- SYNTAX ERROR FIXED HERE
      phone: '6167196346'
    };

    console.log("Step 8: Calling EasyPost API to create shipment...");
    const shipment = await easyPostApi.Shipment.create({
      to_address: customerAddress,
      from_address: fromAddress,
      parcel: parcelData
    });
    console.log("Step 9: Shipment created successfully by EasyPost.");

    return {
      statusCode: 200,
      body: JSON.stringify(shipment.rates)
    };

  } catch (error) {
    console.error("FINAL ERROR:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
