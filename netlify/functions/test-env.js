// File: netlify/functions/test-env.js

exports.handler = async function(event) {
  const apiKey = process.env.EASYPOST_API_KEY;

  if (apiKey && apiKey.length > 10) {
    // If the key is found, return a success message
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: "SUCCESS: The EASYPOST_API_KEY is loaded correctly.",
        keyPreview: `Key starts with: ${apiKey.substring(0, 8)}...`
      })
    };
  } else {
    // If the key is missing, return a failure message
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: "FAILURE: The EASYPOST_API_KEY environment variable is NOT SET or is empty." 
      })
    };
  }
};
