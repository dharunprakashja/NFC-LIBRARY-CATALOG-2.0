const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  book_id: { type: String, unique: true },
  title: { type: String, required: true }, // Book title
  author: { type: String, required: true }, // Author name
  genre: { type: String }, // Book genre
  total_pieces: { type: Number, required: true, min: 1 }, // Total number of copies
  available_pieces: { type: Number, required: true, min: 0 }, // Number of available copies
  borrowed_by: [
    {
      roll_no: { type: String}, // Student ID who borrowed
      due_date: { type: Date } // Due date for this copy
    }
  ] // Array of borrowed pieces with their respective due dates
});

module.exports = mongoose.model('Book', bookSchema);
