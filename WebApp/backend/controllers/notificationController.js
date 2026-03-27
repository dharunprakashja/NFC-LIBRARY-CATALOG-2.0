// // //  const Student = require('../models/Student');
// // //  const calculateFine = require('../services/fineCalculator');
// // //  const sendSMS = require('../services/smsService');

// // //  async function sendNotifications() {
// // //    try {
// // //      const currentDate = new Date();

// // //      // Fetch all students with total fine greater than 0
// // //      const studentsWithFines = await Student.find({ total_fine: { $gt: 0 } });

// // //      if (studentsWithFines.length === 0) {
// // //        console.log('No students with fines found.');
// // //        return;
// // //      }

// // //      console.log(`Found ${studentsWithFines.length} students with fines.`);

// // //      for (const student of studentsWithFines) {
// // //        let booksToReturn = [];
// // //        let hasFine = false;

// // //        for (const book of student.borrowed_books) {
// // //          const { due_date, title } = book;

// // //          // Skip books with no due date
// // //          if (!due_date) continue;

// // //          const timeDifference = (new Date(due_date) - currentDate) / (24 * 60 * 60 * 1000);

// // //          if (timeDifference < 0) {
// // //            // Late submission logic
// // //            const fineAmount = calculateFine(due_date, currentDate);

// // //            if (fineAmount > 0) {
// // //              book.fine = fineAmount;
// // //              student.total_fine += fineAmount;
// // //              hasFine = true;
// // //            }

// // //            booksToReturn.push(title);
// // //          }
// // //        }

// // //        // Save updated student data
// // //        await student.save();

// // //        if (hasFine || booksToReturn.length > 0) {
// // //          const message = `Notice: You have an outstanding fine of ₹${student.total_fine}. Please return the following overdue books immediately: ${booksToReturn.join(', ')}.`;
// // //          console.log(`Sending SMS to ${student.name} (${student.mobile}): ${message}`);

// // //          // Send SMS
// // //          await sendSMS(student.mobile, message);
// // //        } else {
// // //          console.log(`No fine or overdue books for ${student.name} (${student.mobile}).`);
// // //        }
// // //      }

// // //      console.log('All notifications sent.');
// // //    } catch (error) {
// // //      console.error('Error sending notifications:', error);
// // //    }
// // //  }

// // //  module.exports = sendNotifications;

const Student = require('../models/account');
const calculateFine = require('../services/fineCalculator');
const twilio = require('twilio');
require('dotenv').config();


// // Twilio credentials
// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const fromPhoneNumber = process.env.TWILIO_FROM_PHONE;
// const client = twilio(accountSid, authToken);

async function sendNotifications() {
  try {
    const currentDate = new Date();

    // Fetch all students with total fine greater than 0
    const studentsWithFines = await Student.find({ total_fine: { $gt: 0 } });

    if (studentsWithFines.length === 0) {
      console.log('No students with fines found.');
      return;
    }

    console.log(`Found ${studentsWithFines.length} students with fines.`);

    for (const student of studentsWithFines) {
      let booksToReturn = [];
      let hasFine = false;

      for (const book of student.borrowed_books) {
        const { due_date, title } = book;

        // Skip books with no due date
        if (!due_date) continue;

        const timeDifference = (new Date(due_date) - currentDate) / (24 * 60 * 60 * 1000);

        if (timeDifference < 0) {
          // Late submission logic
          const fineAmount = calculateFine(due_date, currentDate);

          if (fineAmount > 0) {
            book.fine = fineAmount;
            student.total_fine += fineAmount;
            hasFine = true;
          }

          booksToReturn.push(title);
        }
      }

      // Save updated student data
      await student.save();

      if (hasFine || booksToReturn.length > 0) {
        const message = `Notice: You have an outstanding fine of ₹${student.total_fine}. Please return the following overdue books immediately: ${booksToReturn.join(', ')}.`;
        console.log(`Sending SMS to ${student.name} (${student.mobile}): ${message}`);

        // Send SMS using Twilio
        try {
          await client.messages.create({
            body: message,
            from: fromPhoneNumber,
            to: student.mobile
          });
          console.log(`SMS sent to ${student.name} (${student.mobile}).`);
        } catch (twilioError) {
          console.error(`Failed to send SMS to ${student.name} (${student.mobile}):`, twilioError);
        }
      } else {
        console.log(`No fine or overdue books for ${student.name} (${student.mobile}).`);
      }
    }

    console.log('All notifications sent.');
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
}

module.exports = sendNotifications;