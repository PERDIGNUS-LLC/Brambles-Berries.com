exports.handler = async function(event) {
    const apiKey = process.env.EASYPOST_API_KEY;

    if (apiKey && apiKey.length > 10) {
        return {
            statusCode: 200,
            body: JSON.stringify({ 
                message: "SUCCESS: The EASYPOST_API_KEY is loaded correctly.",
                keyPreview: `Key starts with: ${apiKey.substring(0, 8)}...`
            })
        };
    } else {
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                message: "FAILURE: The EASYPOST_API_KEY environment variable is NOT SET or is empty." 
            })
        };
    }
};
