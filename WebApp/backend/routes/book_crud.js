const express = require('express');
const router = express.Router();
const Book = require('../models/book');

// ─────────────────────────────────────────
// GET ALL BOOKS
// ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const books = await Book.find();
    res.status(200).json({ message: 'Books fetched successfully', books });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching books', error: err.message });
  }
});

// ─────────────────────────────────────────
// GET SINGLE BOOK BY book_id
// ─────────────────────────────────────────
router.get('/:book_id', async (req, res) => {
  try {
    const book = await Book.findOne({ book_id: req.params.book_id });
    if (!book) return res.status(404).json({ message: 'Book not found' });

    res.status(200).json({ message: 'Book fetched successfully', book });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching book', error: err.message });
  }
});

// ─────────────────────────────────────────
// CREATE A NEW BOOK
// ─────────────────────────────────────────
router.post('/', async (req, res) => {
  const { book_id, title, author, genre, total_pieces, available_pieces, cover_image } = req.body;

  try {
    if (!book_id || !title || !author || !total_pieces) {
      return res.status(400).json({ message: 'book_id, title, author and total_pieces are required' });
    }

    const existing = await Book.findOne({ book_id });
    if (existing) return res.status(409).json({ message: 'Book with this ID already exists' });

    const book = new Book({
      book_id,
      title,
      author,
      genre:             genre            || null,
      cover_image:       cover_image      || null,
      total_pieces,
      available_pieces:  available_pieces ?? total_pieces, // default to total if not provided
      borrowed_by:       [],
    });

    await book.save();
    res.status(201).json({ message: 'Book created successfully', book });
  } catch (err) {
    res.status(500).json({ message: 'Error creating book', error: err.message });
  }
});

// ─────────────────────────────────────────
// UPDATE A BOOK BY book_id
// ─────────────────────────────────────────
router.put('/:book_id', async (req, res) => {
  const { title, author, genre, total_pieces, available_pieces, cover_image } = req.body;

  try {
    const book = await Book.findOne({ book_id: req.params.book_id });
    if (!book) return res.status(404).json({ message: 'Book not found' });

    if (title            !== undefined) book.title            = title;
    if (author           !== undefined) book.author           = author;
    if (genre            !== undefined) book.genre            = genre;
    if (cover_image      !== undefined) book.cover_image      = cover_image;
    if (total_pieces     !== undefined) book.total_pieces     = total_pieces;
    if (available_pieces !== undefined) book.available_pieces = available_pieces;

    await book.save();
    res.status(200).json({ message: 'Book updated successfully', book });
  } catch (err) {
    res.status(500).json({ message: 'Error updating book', error: err.message });
  }
});

// ─────────────────────────────────────────
// DELETE A BOOK BY book_id
// ─────────────────────────────────────────
router.delete('/:book_id', async (req, res) => {
  try {
    const book = await Book.findOneAndDelete({ book_id: req.params.book_id });
    if (!book) return res.status(404).json({ message: 'Book not found' });

    res.status(200).json({ message: 'Book deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting book', error: err.message });
  }
});

// ─────────────────────────────────────────
// ADD A BORROWER TO A BOOK
// ─────────────────────────────────────────
router.post('/:book_id/borrow', async (req, res) => {
  const { roll_no, due_date } = req.body;

  try {
    if (!roll_no || !due_date) {
      return res.status(400).json({ message: 'roll_no and due_date are required' });
    }

    const book = await Book.findOne({ book_id: req.params.book_id });
    if (!book) return res.status(404).json({ message: 'Book not found' });

    if (book.available_pieces < 1) {
      return res.status(400).json({ message: 'No copies available for borrowing' });
    }

    const alreadyBorrowed = book.borrowed_by.find(b => b.roll_no === roll_no);
    if (alreadyBorrowed) {
      return res.status(409).json({ message: 'This member already has a copy of this book' });
    }

    book.borrowed_by.push({ roll_no, due_date: new Date(due_date) });
    book.available_pieces -= 1;

    await book.save();
    res.status(200).json({ message: 'Book borrowed successfully', book });
  } catch (err) {
    res.status(500).json({ message: 'Error borrowing book', error: err.message });
  }
});

// ─────────────────────────────────────────
// REMOVE A BORROWER (RETURN)
// ─────────────────────────────────────────
router.post('/:book_id/return', async (req, res) => {
  const { roll_no } = req.body;

  try {
    if (!roll_no) return res.status(400).json({ message: 'roll_no is required' });

    const book = await Book.findOne({ book_id: req.params.book_id });
    if (!book) return res.status(404).json({ message: 'Book not found' });

    const borrowerIndex = book.borrowed_by.findIndex(b => b.roll_no === roll_no);
    if (borrowerIndex === -1) {
      return res.status(404).json({ message: 'This member has not borrowed this book' });
    }

    book.borrowed_by.splice(borrowerIndex, 1);
    book.available_pieces += 1;

    await book.save();
    res.status(200).json({ message: 'Book returned successfully', book });
  } catch (err) {
    res.status(500).json({ message: 'Error returning book', error: err.message });
  }
});

// ─────────────────────────────────────────
// BULK CREATE BOOKS
// ─────────────────────────────────────────
router.post('/bulk', async (req, res) => {
  const { books } = req.body;

  try {
    if (!Array.isArray(books) || books.length === 0) {
      return res.status(400).json({ message: 'Provide a non-empty "books" array' });
    }

    const results = { created: [], skipped: [], errors: [] };

    for (const item of books) {
      const { book_id, title, author, genre, total_pieces, available_pieces, cover_image } = item;

      // Validate required fields per book
      if (!book_id || !title || !author || !total_pieces) {
        results.errors.push({ book_id: book_id || '?', reason: 'Missing required fields (book_id, title, author, total_pieces)' });
        continue;
      }

      // Skip duplicates instead of failing the whole request
      const existing = await Book.findOne({ book_id });
      if (existing) {
        results.skipped.push({ book_id, reason: 'Already exists' });
        continue;
      }

      try {
        const book = new Book({
          book_id,
          title,
          author,
          genre:            genre            || null,
          cover_image:      cover_image      || null,
          total_pieces,
          available_pieces: available_pieces ?? total_pieces,
          borrowed_by:      [],
        });

        await book.save();
        results.created.push(book_id);
      } catch (saveErr) {
        results.errors.push({ book_id, reason: saveErr.message });
      }
    }

    res.status(207).json({
      message:  `${results.created.length} created, ${results.skipped.length} skipped, ${results.errors.length} failed`,
      created:  results.created,
      skipped:  results.skipped,
      errors:   results.errors,
    });

  } catch (err) {
    res.status(500).json({ message: 'Bulk insert failed', error: err.message });
  }
});

module.exports = router;