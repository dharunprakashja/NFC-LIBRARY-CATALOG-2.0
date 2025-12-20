const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Student = require('./models/Student');
const Book = require('./models/Book');
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());  // Parse JSON requests

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/nfcData')
  .then(() => console.log('Connected to MongoDB'))
  .catch(error => console.error('Error connecting to MongoDB:', error));

// Define NFCData schema (optional if you want to save raw NFC data)
const nfcSchema = new mongoose.Schema({
  nfc_data: String,
});
const NFCData = mongoose.model('NFCData', nfcSchema);

// Helper function to parse NFC data
function parseNFCData(nfcData) {
  const isStudent = nfcData.includes('Student Details');
  const isBook = nfcData.includes('Book Details');

  if (isStudent) {
    const studentMatch = /Name:\s*(.+?)\s*Department:\s*(.+?)\s*Roll-no:\s*(\w+)\s*Mobile:\s*(\d+)/.exec(nfcData);
    if (studentMatch) {
      return {
        type: 'student',
        data: {
          name: studentMatch[1].trim(),
          department: studentMatch[2].trim(),
          roll_no: studentMatch[3].trim(),
          mobile: studentMatch[4].trim(),
        },
      };
    }
  } else if (isBook) {
    const bookMatch = /title:\s*"(.+?)"\s*author:\s*"(.+?)"\s*genre:\s*"(.+?)"/.exec(nfcData);
    if (bookMatch) {
      return {
        type: 'book',
        data: {
          title: bookMatch[1].trim(),
          author: bookMatch[2].trim(),
          genre: bookMatch[3].trim(),
        },
      };
    }
  }
  return null;
}

// POST route for receiving NFC data
app.post('/nfc', async (req, res) => {
  console.log('Received NFC Data:', req.body);

  try {
    // Save raw NFC data to NFCData collection (optional)
    const nfcEntry = new NFCData({ nfc_data: req.body.nfc_data });
    await nfcEntry.save();

    // Parse and save to respective collections
    const parsedData = parseNFCData(req.body.nfc_data);

    if (parsedData) {
      if (parsedData.type === 'student') {
        const { roll_no, name, department, mobile } = parsedData.data;

        // Define student data with ordered fields
        const studentData = {
          name,
          department,
          roll_no,
          mobile,
          attendance: [new Date()],
          no_of_days: 0,
          borrowed_books: [],
        };

        // Check if the student already exists
        const existingStudent = await Student.findOne({ roll_no });

        if (existingStudent) {
          // If the student exists, only push a new attendance date
          await Student.updateOne(
            { roll_no },
            { $push: { attendance: new Date() } }
          );
          res.status(200).send({ message: 'Attendance updated for existing student.' });
        } else {
          // If the student does not exist, create a new document
          const newStudent = new Student(studentData);
          await newStudent.save();
          res.status(200).send({ message: 'New student data saved!', newStudent });
        }
      } else if (parsedData.type === 'book') {
        const book = new Book(parsedData.data);
        await book.save();
        res.status(200).send({ message: 'Book data received and saved!' });
      }
    } else {
      res.status(400).send({ error: 'Unrecognized NFC data format' });
    }
  } catch (error) {
    console.error('Error processing NFC data:', error);
    res.status(500).send({ error: 'Failed to process NFC data' });
  }
});


// Start the server
// Start the server
app.listen(PORT, () => {
  const serverIP = require('ip').address();  // Get local IP address
  console.log(`Backend running on http://${serverIP}:${PORT}`);
});

