const express = require('express');
const router = express.Router();
const Book = require('../models/Book'); // Import Book model

// Get all books
router.get('/', async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching books', error: err.message });
  }
});

module.exports = router;
