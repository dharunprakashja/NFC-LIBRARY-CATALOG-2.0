const express = require('express');
const router = express.Router();
const Account = require('../models/account');

// ─────────────────────────────────────────
// POST /attendance
// Scan NFC card to mark attendance
// ─────────────────────────────────────────
router.post('/', async (req, res) => {
  const { nfc_data } = req.body;

  if (!nfc_data) {
    return res.status(400).json({ message: 'nfc_data is required.' });
  }

  const accountData = parseAccountData(nfc_data);

  if (!accountData) {
    return res.status(400).json({
      message: 'Invalid NFC data format. Expected Account/Student Details tag.',
    });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let account = await Account.findOne({ roll_no: accountData.roll_no });

    if (!account) {
      return res.status(404).json({
        message: `No account found for roll no: ${accountData.roll_no}`,
      });
    }

    // ── Helper: build the full payload the frontend needs ─────────────────────
    const buildPayload = (acct) => ({
      name:           acct.name,
      roll_no:        acct.roll_no,
      department:     acct.department,
      mobile:         acct.mobile,
      profile_image:  acct.profile_image,
      no_of_days:     acct.no_of_days,
      total_fine:     acct.total_fine ?? 0,
      attendance:     acct.attendance,          // full array — frontend uses last-14-days dots
      borrowed_books: acct.borrowed_books.map(b => ({
        book_id:       b.book_id,
        title:         b.title,
        cover_image:   b.cover_image ?? null,
        borrowed_date: b.borrowed_date,
        due_date:      b.due_date,
        fine:          b.fine ?? 0,
      })),
    });

    // ── Check if already marked today ─────────────────────────────────────────
    const alreadyMarked = account.attendance.some(date => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });

    if (alreadyMarked) {
      req.io.emit('nfcDataReceived', {
        account: buildPayload(account),
        message: 'Attendance already marked for today.',
      });

      return res.status(200).json({
        message: 'Attendance already marked for today.',
        account,
      });
    }

    // ── Mark attendance ───────────────────────────────────────────────────────
    account.attendance.push(new Date());
    account.no_of_days = account.attendance.length;
    await account.save();

    console.log(`[Attendance] Marked for ${account.name} (${account.roll_no})`);

    req.io.emit('nfcDataReceived', {
      account: buildPayload(account),
      message: 'Attendance marked successfully.',
    });

    return res.status(200).json({
      message: 'Attendance marked successfully.',
      account,
    });

  } catch (err) {
    console.error('[Attendance] Error:', err);
    return res.status(500).json({
      message: 'Error marking attendance.',
      error: err.message,
    });
  }
});
// ─────────────────────────────────────────
// GET /attendance/:roll_no
// Fetch attendance record for a member
// ─────────────────────────────────────────
router.get('/:roll_no', async (req, res) => {
  try {
    const account = await Account.findOne({ roll_no: req.params.roll_no }).select(
      'name roll_no department attendance no_of_days'
    );

    if (!account) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    res.status(200).json({
      message: 'Attendance fetched successfully.',
      account,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching attendance.', error: err.message });
  }
});

// ─────────────────────────────────────────
// PARSE HELPER
// ─────────────────────────────────────────
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

module.exports = router;