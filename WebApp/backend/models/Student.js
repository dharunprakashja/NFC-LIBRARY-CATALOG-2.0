const mongoose = require('mongoose');

// Define the schema
const studentSchema = new mongoose.Schema({
  name: String,
  department: String,
  roll_no: { type: String, unique: true },
  mobile: String,
  attendance: [{ type: Date }], // Stores attendance dates
  no_of_days: { type: Number, default: 0 }, // Total attendance days

  borrowed_books: [
    {
      book_id: { type: String, unique: true },
      title: { type: String}, // Reference to the book
      borrowed_date: { type: Date }, // Date when the book was borrowed
      due_date: { type: Date }, // Due date for returning the book
      fine: { type: Number, default: 0 }, // Fine for late return of this book
    },
  ],

  total_fine: { type: Number, default: 0 }, // Total fine accumulated by the student
});

// Instance method to calculate and update fines
studentSchema.methods.calculateAndUpdateFines = async function () {
  const currentDate = new Date();
  let totalFine = 0;

  this.borrowed_books.forEach((book) => {
    if (book.due_date) {
      const oneDay = 24 * 60 * 60 * 1000; // Milliseconds in one day
      const diffDays = Math.ceil((currentDate - book.due_date) / oneDay);
      const fine = diffDays > 0 ? diffDays * 10 : 0; // ₹10 per day late fine

      book.fine = fine; // Update individual book fine
      totalFine += fine; // Accumulate total fine
    }
  });

  this.total_fine = totalFine; // Update total fine in schema
  await this.save(); // Save updated student data to the database
};

module.exports = mongoose.model('Student', studentSchema);
