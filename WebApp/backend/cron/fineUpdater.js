const cron = require('node-cron');
const Student = require('../models/Student');

// Function to update fines for all students
async function updateAllStudentsFines() {
  try {
    const students = await Student.find(); // Fetch all students
    for (const student of students) {
      await student.calculateAndUpdateFines(); // Call the instance method to calculate and update fines
    }
    console.log('Fines updated for all students.');
  } catch (error) {
    console.error('Error updating fines:', error.message);
  }
}

// Schedule the cron job to run daily at midnight
cron.schedule('0 0 * * *', () => {
  console.log(`${new Date().toISOString()}: Running daily fine update...`);
  updateAllStudentsFines();
});

module.exports = updateAllStudentsFines;
