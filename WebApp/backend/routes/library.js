const express = require('express');
const Account = require('../models/account');
const Book = require('../models/book.js');
const router = express.Router();

// ── In-memory session store ───────────────────────────────────────────────────
let librarySession = {
  action:  null, // "borrow" | "return"
  account: null, // Account document
  books:   [],   // Books scanned in this session
};

// ─────────────────────────────────────────
// SELECT ACTION  (borrow / return)
// ─────────────────────────────────────────
router.post('/select-action', (req, res) => {
  const { action } = req.body;

  if (!['borrow', 'return'].includes(action)) {
    return res.status(400).json({
      message: 'Invalid action. Choose either "borrow" or "return".',
    });
  }

  // Reset session on each new action
  librarySession = { action, account: null, books: [] };
  console.log(`[Session] Action selected: ${action}`);
  res.status(200).json({ message: `Action set to ${action}` });
});

// ─────────────────────────────────────────
// SCAN NFC  (account card or book tag)
// ─────────────────────────────────────────
router.post('/', async (req, res) => {
  const { nfc_data } = req.body;

  if (!librarySession.action) {
    return res.status(400).json({
      message: 'No action selected. Please select borrow or return first.',
    });
  }

  // ── Account (member) scan ─────────────────────────────────────────────────
  if (nfc_data.includes('Account Details') || nfc_data.includes('Student Details')) {

    if (librarySession.account) {
      return res.status(400).json({
        message: 'Session already active. Scan books or stop the session.',
      });
    }

    const accountData = parseAccountData(nfc_data);
    if (!accountData) {
      return res.status(400).json({ message: 'Invalid NFC account data.' });
    }

    try {
      const account = await Account.findOne({ roll_no: accountData.roll_no });
      if (!account) {
        return res.status(404).json({ message: 'Account not found.' });
      }

      librarySession.account = account;
      console.log('[Session] Account started:', accountData.roll_no);

      req.io.emit('nfcDataReceived', {
        account,
        action:  librarySession.action,
        message: 'Account session started.',
      });

      return res.status(200).json({ message: 'Account session started.', account });
    } catch (err) {
      return res.status(500).json({ message: 'Error starting account session.', error: err.message });
    }
  }

  // ── Book scan ─────────────────────────────────────────────────────────────
  if (nfc_data.includes('Book Details')) {

    if (!librarySession.account) {
      return res.status(400).json({
        message: 'No account session active. Scan a member card first.',
      });
    }

    const bookData = parseBookData(nfc_data);
    if (!bookData) {
      return res.status(400).json({ message: 'Invalid NFC book data.' });
    }

    // Prevent scanning the same book twice in one session
    if (librarySession.books.some(b => b.book_id === bookData.book_id)) {
      return res.status(400).json({ message: 'Book already scanned in this session.' });
    }

    try {
      const book = await Book.findOne({ book_id: bookData.book_id });
      if (!book) {
        return res.status(404).json({ message: 'Book not found.' });
      }

      if (librarySession.action === 'borrow' && book.available_pieces <= 0) {
        return res.status(400).json({ message: 'No copies available for borrowing.' });
      }

      if (librarySession.action === 'return') {
        const isBorrowed = book.borrowed_by.some(
          b => b.roll_no === librarySession.account.roll_no
        );
        if (!isBorrowed) {
          return res.status(400).json({
            message: 'This book was not borrowed by the current member.',
          });
        }
      }

      librarySession.books.push(book);
      console.log('[Session] Book added:', book.title);

      req.io.emit('nfcDataReceived', {
        book,
        action:  librarySession.action,
        message: `Book added to session: ${book.title}`,
      });

      return res.status(200).json({ message: 'Book added to session.', book });
    } catch (err) {
      return res.status(500).json({ message: 'Error adding book to session.', error: err.message });
    }
  }

  return res.status(400).json({
    message: 'Invalid NFC data. Could not identify account or book.',
  });
});

// ─────────────────────────────────────────
// STOP SESSION  (commit borrow / return)
// ─────────────────────────────────────────
router.post('/stop-session', async (req, res) => {
  if (!librarySession.account) {
    return res.status(400).json({ message: 'No active session to stop.' });
  }

  if (librarySession.books.length === 0) {
    return res.status(400).json({ message: 'No books scanned in this session.' });
  }

  try {
    const { action, account, books } = librarySession;

    // Due date: 14 days from now
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    if (action === 'borrow') {
      for (const book of books) {

        // Update book document
        if (!book.borrowed_by.some(b => b.roll_no === account.roll_no)) {
          book.borrowed_by.push({
            roll_no:  account.roll_no,
            due_date: dueDate,
          });
        }
        book.available_pieces -= 1;

        // Update account document
        account.borrowed_books.push({
          book_id:       book.book_id,
          title:         book.title,
          borrowed_date: new Date(),
          due_date:      dueDate,
          fine:          0,
        });

        await book.save();
      }

    } else if (action === 'return') {
      for (const book of books) {

        // Remove from book's borrowed_by
        book.borrowed_by = book.borrowed_by.filter(
          b => b.roll_no !== account.roll_no
        );
        book.available_pieces += 1;

        // Remove from account's borrowed_books
        account.borrowed_books = account.borrowed_books.filter(
          b => b.book_id !== book.book_id
        );

        await book.save();
      }

      // Recalculate fines after return
      await account.calculateAndUpdateFines();
    }

    await account.save();

    // Reset session
    librarySession = { action: null, account: null, books: [] };
    console.log('[Session] Completed successfully.');

    req.io.emit('nfcDataReceived', {
      message: 'Session completed successfully.',
    });

    res.status(200).json({
      message: 'Session completed successfully.',
      account,
      books,
    });
  } catch (err) {
    console.error('[Session] Error:', err);
    res.status(500).json({ message: 'Error completing session.', error: err.message });
  }
});

// ─────────────────────────────────────────
// GET SESSION STATUS
// ─────────────────────────────────────────
router.get('/session-status', (req, res) => {
  res.status(200).json({
    action:      librarySession.action,
    account:     librarySession.account
      ? {
          name:       librarySession.account.name,
          roll_no:    librarySession.account.roll_no,
          department: librarySession.account.department,
        }
      : null,
    books_count: librarySession.books.length,
    books:       librarySession.books.map(b => ({
      book_id: b.book_id,
      title:   b.title,
    })),
  });
});

// ─────────────────────────────────────────
// PARSE HELPERS
// ─────────────────────────────────────────

// Supports both old "Student Details" and new "Account Details" NFC format
function parseAccountData(nfcData) {
  const match = /(?:Account|Student) Details\s+Name:\s*(.+?)\s+Department:\s*(.+?)\s+Roll-no:\s*(\w+)(?:\s+Mobile:\s*(\d+))?/.exec(nfcData);
  return match
    ? {
        name:       match[1].trim(),
        department: match[2].trim(),
        roll_no:    match[3].trim(),
        mobile:     match[4]?.trim() || null,
      }
    : null;
}

function parseBookData(nfcData) {
  // Handles both quoted and unquoted values:
  //   book_id: BK001           (no quotes)
  //   book_id: "BK001"         (with quotes)
  const Q   = '"?';              // optional quote
  const VAL = `${Q}(.+?)${Q}`;  // value optionally wrapped in quotes
  const pattern = new RegExp(
    `Book Details\\s+book_id:\\s*${VAL}\\s+title:\\s*${VAL}\\s+author:\\s*${VAL}(?:\\s+genre:\\s*${VAL})?\\s*$`
  );
  const match = pattern.exec(nfcData);
  return match
    ? {
        book_id: match[1].trim(),
        title:   match[2].trim(),
        author:  match[3].trim(),
        genre:   match[4]?.trim() || null,
      }
    : null;
}

module.exports = router;