const Student = require('../models/Student');
const calculateFine = require('../services/fineCalculator');

// Function to calculate and update fines
const updateFinesManually = async (req, res) => {
  try {
    const students = await Student.find(); // Fetch all students

    for (const student of students) {
      let totalFine = 0;

      // Calculate fine for each borrowed book
      for (const book of student.borrowed_books) {
        const fine = calculateFine(book.due_date, new Date()); // Calculate fine
        book.fine = fine; // Update fine for the book
        totalFine += fine; // Accumulate total fine
      }

      student.total_fine = totalFine; // Update total fine
      await student.save(); // Save updated student data
    }

    res.status(200).json({ message: 'Fines updated successfully for all students.' });
  } catch (error) {
    console.error('Error updating fines:', error);
    res.status(500).json({ message: 'Error updating fines.', error: error.message });
  }
};

module.exports = { updateFinesManually };
