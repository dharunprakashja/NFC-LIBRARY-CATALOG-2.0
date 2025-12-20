const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// POST route for receiving NFC data
router.post('/', async (req, res) => {
  const { nfc_data } = req.body;
  const studentMatch = /Name:\s*(.+?)\s*Department:\s*(.+?)\s*Roll-no:\s*(\w+)\s*Mobile:\s*(\d+)/.exec(nfc_data);

  if (!studentMatch) {
    return res.status(400).json({ message: 'Invalid student data format' });
  }

  const studentData = {
    name: studentMatch[1].trim(),
    department: studentMatch[2].trim(),
    roll_no: studentMatch[3].trim(),
    mobile: studentMatch[4].trim(),
  };

  try {
    const currentDate = new Date().setHours(0, 0, 0, 0); // Today's date (no time)
    let student = await Student.findOne({ roll_no: studentData.roll_no });

    let message = '';
    if (student) {
      const hasAttendanceToday = student.attendance.some(
        (date) => date.setHours(0, 0, 0, 0) === currentDate
      );

      if (!hasAttendanceToday) {
        student.attendance.push(new Date());
        student.no_of_days = student.attendance.length;
        await student.save();
        message = 'Attendance updated';
      } else {
        message = 'Attendance already marked for today';
      }
    } else {
      student = new Student({
        ...studentData,
        attendance: [new Date()],
        no_of_days: 1,
      });
      await student.save();
      message = 'New student created and attendance marked';
    }

    // Emit the student data to the frontend
    req.io.emit('nfcDataReceived', { student: studentData, message });

    res.status(200).json({ message });
  } catch (error) {
    console.error('Error saving attendance:', error);
    res.status(500).json({ message: 'Error saving attendance' });
  }
});

module.exports = router;
