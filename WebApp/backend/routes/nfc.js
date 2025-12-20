const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Book = require('../models/Book');
const parseNFCData = require('../utils/parseNFCData');


router.post('/nfc', async (req, res) => {
  const { nfc_data, type } = req.body;
  const parsedData = parseNFCData(nfc_data, type);

  if (!parsedData) {
    return res.status(400).send({ error: 'Invalid data format' });
  }

  try {
    if (parsedData.type === 'student') {
      const { roll_no, name, department, mobile } = parsedData.data;
      const student = await Student.findOneAndUpdate(
        { roll_no },
        { $push: { attendance: new Date() } },
        { upsert: true, new: true }
      );
      res.status(200).send({ message: 'Attendance updated', student });
    } else if (parsedData.type === 'book_borrow') {
      const book = await Book.findOneAndUpdate(
        { title: parsedData.data.title },
        { borrowed_by: req.body.studentId, borrowed_date: new Date() },
        { upsert: true, new: true }
      );
      res.status(200).send({ message: 'Book borrowed', book });
    } else if (parsedData.type === 'book_return') {
      const book = await Book.findOneAndUpdate(
        { borrowed_by: req.body.studentId },
        { borrowed_by: null, borrowed_date: null, due_date: null },
        { new: true }
      );
      res.status(200).send({ message: 'Book returned', book });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

module.exports = router;
