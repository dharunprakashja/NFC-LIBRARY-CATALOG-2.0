const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const Account = require('../models/account');

// ─────────────────────────────────────────
// AUTH ROUTES
// ─────────────────────────────────────────

// Sign-In
router.post('/signin', async (req, res) => {
  const { roll_no, password } = req.body;

  try {
    if (!roll_no || !password) {
      return res.status(400).json({ message: 'Roll number and password are required' });
    }

    const user = await Account.findOne({ roll_no });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.status(200).json({
      message: 'Sign-in successful',
      account: {
        name: user.name,
        roll_no: user.roll_no,
        department: user.department,
        mobile: user.mobile,
        is_admin: user.is_admin,
        profile_image: user.profile_image,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// ─────────────────────────────────────────
// CRUD ROUTES
// ─────────────────────────────────────────

// CREATE - Register a new account
router.post('/register', async (req, res) => {
  try {
    // Handle both single object and array
    const users = Array.isArray(req.body) ? req.body : [req.body];

    const results = [];
    const errors = [];

    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      const {
        name,
        department,
        roll_no,
        mobile,
        password,
        is_admin,
        profile_image
      } = user;

      // ✅ Validation per user
      if (!name || !roll_no || !password) {
        errors.push({ index: i, message: 'Missing required fields' });
        continue;
      }

      // ✅ Duplicate check
      const existing = await Account.findOne({ roll_no });
      if (existing) {
        errors.push({ index: i, message: `Roll no ${roll_no} already exists` });
        continue;
      }

      // ✅ Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const newAccount = new Account({
        name,
        department,
        roll_no,
        mobile,
        password: hashedPassword,
        is_admin: is_admin || false,
        profile_image: profile_image || null,
      });

      await newAccount.save();

      results.push({
        name,
        roll_no,
        department,
        is_admin: is_admin || false
      });
    }

    return res.status(201).json({
      message: 'Bulk insert completed',
      created_count: results.length,
      failed_count: errors.length,
      created_users: results,
      errors: errors
    });

  } catch (error) {
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error.message
    });
  }
});

// READ - Get all accounts (Admin only check can be added via middleware)
router.get('/', async (req, res) => {
  try {
    // Exclude password from results
    const accounts = await Account.find().select('-password');

    res.status(200).json({ message: 'Accounts fetched successfully', accounts });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// READ - Get a single account by roll_no
router.get('/:roll_no', async (req, res) => {
  try {
    const account = await Account.findOne({ roll_no: req.params.roll_no }).select('-password');

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.status(200).json({ message: 'Account fetched successfully', account });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// UPDATE - Update account details by roll_no
router.put('/:roll_no', async (req, res) => {
  const { name, department, mobile, password, is_admin, profile_image } = req.body;

  try {
    const account = await Account.findOne({ roll_no: req.params.roll_no });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Update only provided fields
    if (name) account.name = name;
    if (department) account.department = department;
    if (mobile) account.mobile = mobile;
    if (is_admin !== undefined) account.is_admin = is_admin;
    if (profile_image) account.profile_image = profile_image;

    // If password is being updated, hash the new password
    if (password) {
      account.password = await bcrypt.hash(password, 10);
    }

    await account.save();

    res.status(200).json({
      message: 'Account updated successfully',
      account: {
        name: account.name,
        roll_no: account.roll_no,
        department: account.department,
        mobile: account.mobile,
        is_admin: account.is_admin,
        profile_image: account.profile_image,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// DELETE - Delete an account by roll_no
router.delete('/:roll_no', async (req, res) => {
  try {
    const account = await Account.findOneAndDelete({ roll_no: req.params.roll_no });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

module.exports = router;