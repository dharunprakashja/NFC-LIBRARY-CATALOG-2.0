const sendSMS = require('./services/smsService');

(async () => {
  try {
    const response = await sendSMS('+916374406703', 'Hello from Vonage!');
    console.log('SMS sent successfully:', response.messageId);
  } catch (error) {
    console.error('Failed to send SMS:', error.message);
  }
})();
