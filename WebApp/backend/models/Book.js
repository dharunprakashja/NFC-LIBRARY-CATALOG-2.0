const mongoose = require('mongoose');

// Book Schema
const bookSchema = new mongoose.Schema({
  book_id: { type: String, unique: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  genre: { type: String },
  cover_image: { type: String, default: null },          // Stores image URL or base64
  total_pieces: { type: Number, required: true, min: 1 },
  available_pieces: { type: Number, required: true, min: 0 },
  borrowed_by: [
    {
      roll_no: { type: String },
      due_date: { type: Date },
    },
  ],
});

module.exports = mongoose.model('Book', bookSchema);