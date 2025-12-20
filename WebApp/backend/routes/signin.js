const express = require('express');
const router = express.Router();
const Account = require('../models/account'); // Import the account model

// Sign-In Logic (Service + Controller)
router.post('/', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Validate inputs
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find the user in the database
    const user = await Account.findOne({ username, password });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Respond with user details, including admin status
    res.status(200).json({
      username: user.username,
      admin: user.admin // Send admin status
    });
  } catch (error) {
    // Handle unexpected errors
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});


module.exports = router;
