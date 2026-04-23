const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const smsFrom = process.env.TWILIO_FROM_PHONE;

const client = (accountSid && authToken)
  ? twilio(accountSid, authToken)
  : null;

function sendSMS(mobile, message) {
  return new Promise((resolve, reject) => {
    if (!client || !smsFrom) {
      reject(new Error('Twilio SMS gateway is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_PHONE in .env.'));
      return;
    }

    const timestamp = new Date().toISOString(); // Log the timestamp

    console.log(`[${timestamp}] Attempting to send SMS to ${mobile}`);

    client.messages.create({
      to: mobile,
      from: smsFrom,
      body: message,
    })
      .then((response) => {
        const responseTime = new Date().toISOString();
        console.log(`[${responseTime}] SMS sent to ${mobile}. SID: ${response.sid}`);
        resolve(response);
      })
      .catch((err) => {
        const responseTime = new Date().toISOString();
        console.error(`[${responseTime}] Failed to send SMS to ${mobile}:`, err.message);
        reject(err);
      });
  });
}

module.exports = sendSMS;

