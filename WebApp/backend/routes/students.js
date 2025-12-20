const express = require('express');
const router = express.Router();
const Student = require('../models/Student'); // Import Student model
const { updateFinesManually } = require('../controllers/fineController');

// Get all students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching students', error: err.message });
  }
});

// Get individual student details by roll_no
router.get('/:roll_no', async (req, res) => {
  try {
    const { roll_no } = req.params;
    const student = await Student.findOne({ roll_no });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching student details', error: err.message });
  }
});


// Route to manually update fines
router.post('/update-fines', updateFinesManually);  

module.exports = router;
