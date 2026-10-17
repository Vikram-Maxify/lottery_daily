const axios = require('axios');

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://127.0.0.1:3002';
const SECRET_KEY  = process.env.GATEWAY_SECRET_KEY;

async function createPaymentRequest(payload) {
  // ⭐ Real gateway ka endpoint
  const url = `${GATEWAY_URL}/api/payments/create`;
  console.log('\n📤 Calling gateway:', url);

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Secret-Key': SECRET_KEY,
      },
      timeout: 15000,
    });

    console.log('📥 Gateway status:', response.status);
    return response.data;

  } catch (error) {
    if (error.response) {
      console.error('❌ HTTP error:', error.response.status, error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ REFUSED:', url);
    } else if (error.code === 'ECONNABORTED') {
      console.error('❌ TIMEOUT:', url);
    } else {
      console.error('❌ Network error:', error.message);
    }

    throw new Error(
      error.response?.data?.message || error.message || 'Failed to create payment request'
    );
  }
}

module.exports = { createPaymentRequest };