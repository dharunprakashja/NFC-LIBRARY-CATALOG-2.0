const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;

const client = (accountSid && authToken)
    ? twilio(accountSid, authToken)
    : null;

const normalizeMobile = (mobile) => {
    const trimmed = String(mobile || '').trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('+')) return trimmed;
    if (/^\d{10}$/.test(trimmed)) return `+91${trimmed}`;
    return trimmed;
};

function sendWhatsApp(mobile, message) {
    return new Promise((resolve, reject) => {
        if (!client || !whatsappFrom) {
            reject(new Error('Twilio WhatsApp gateway is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM in .env.'));
            return;
        }

        const normalizedMobile = normalizeMobile(mobile);
        if (!normalizedMobile) {
            reject(new Error('Recipient mobile number is missing or invalid for WhatsApp.'));
            return;
        }

        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] Attempting to send WhatsApp to ${normalizedMobile}`);

        client.messages.create({
            to: `whatsapp:${normalizedMobile}`,
            from: whatsappFrom,
            body: message,
        })
            .then((response) => {
                const responseTime = new Date().toISOString();
                console.log(`[${responseTime}] WhatsApp sent to ${normalizedMobile}. SID: ${response.sid}`);
                resolve(response);
            })
            .catch((err) => {
                const responseTime = new Date().toISOString();
                console.error(`[${responseTime}] Failed to send WhatsApp to ${normalizedMobile}:`, err.message);
                reject(err);
            });
    });
}

module.exports = sendWhatsApp;
