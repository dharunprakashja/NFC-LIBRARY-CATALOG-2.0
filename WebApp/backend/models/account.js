const mongoose = require('mongoose');

// Account Schema (Generalized - replaces Student)
const accountSchema = new mongoose.Schema({
  name: String,
  department: String,
  roll_no: { type: String, unique: true },
  mobile: String,
  password: { type: String, required: true },           // Hashed password
  is_admin: { type: Boolean, default: false },           // Admin role flag
  profile_image: { type: String, default: null },        // Stores image URL or base64

  attendance: [{ type: Date }],
  no_of_days: { type: Number, default: 0 },

  borrowed_books: [
    {
      book_id: { type: String },
      title: { type: String },
      borrowed_date: { type: Date },
      due_date: { type: Date },
      fine: { type: Number, default: 0 },
    },
  ],

  total_fine: { type: Number, default: 0 },
});

// Instance method to calculate and update fines
accountSchema.methods.calculateAndUpdateFines = async function () {
  const currentDate = new Date();
  let totalFine = 0;

  this.borrowed_books.forEach((book) => {
    if (book.due_date) {
      const oneDay = 24 * 60 * 60 * 1000;
      const diffDays = Math.ceil((currentDate - book.due_date) / oneDay);
      const fine = diffDays > 0 ? diffDays * 10 : 0;

      book.fine = fine;
      totalFine += fine;
    }
  });

  this.total_fine = totalFine;
  await this.save();
};

module.exports = mongoose.model('Account', accountSchema);