const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const smsFrom = process.env.TWILIO_FROM_PHONE;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

const client = (accountSid && authToken)
  ? twilio(accountSid, authToken)
  : null;

function sendSMS(mobile, message) {
  return new Promise((resolve, reject) => {
    if (!client || (!smsFrom && !messagingServiceSid)) {
      reject(new Error('Twilio SMS gateway is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and either TWILIO_FROM_PHONE or TWILIO_MESSAGING_SERVICE_SID in .env.'));
      return;
    }

    const timestamp = new Date().toISOString(); // Log the timestamp

    console.log(`[${timestamp}] Attempting to send SMS to ${mobile}`);

    const createPayload = {
      to: mobile,
      body: message,
    };

    if (messagingServiceSid) {
      createPayload.messagingServiceSid = messagingServiceSid;
    } else {
      createPayload.from = smsFrom;
    }

    client.messages.create(createPayload)
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

