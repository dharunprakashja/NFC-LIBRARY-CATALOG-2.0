const express = require('express');
const axios = require('axios');
const twilio = require('twilio');
const Account = require('../models/account');
const sendSMS = require('../services/smsService');

const router = express.Router();

const finePerDay = Number(process.env.FINE_PER_DAY || 10);

const daysOverdue = (dueDate) => {
    if (!dueDate) return 0;
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = now.getTime() - due.getTime();
    return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
};

const normalizeMobile = (mobile) => {
    if (!mobile) return '';
    const trimmed = String(mobile).trim();
    if (trimmed.startsWith('+')) return trimmed;
    if (/^\d{10}$/.test(trimmed)) return `+91${trimmed}`;
    return trimmed;
};

const buildFineBreakdown = (account) => {
    let totalFine = 0;

    const books = (account.borrowed_books || []).map((book) => {
        const overdueDays = daysOverdue(book.due_date);
        const liveFine = overdueDays * finePerDay;
        const fine = Math.max(book.fine || 0, liveFine);
        totalFine += fine;

        return {
            book_id: book.book_id,
            title: book.title,
            borrowed_date: book.borrowed_date,
            due_date: book.due_date,
            overdue_days: overdueDays,
            fine,
        };
    });

    return { books, totalFine };
};

const serializeAccountFine = (account, req) => {
    const { books, totalFine } = buildFineBreakdown(account);
    const preferred = account.notification_settings?.preferred_channel || 'whatsapp';
    const automated = account.notification_settings?.automated_enabled !== false;

    const provider = (process.env.PAYMENT_PROVIDER || 'razorpay').toLowerCase();
    const upiVpa = process.env.UPI_PAYEE_VPA || '';
    const upiName = process.env.UPI_PAYEE_NAME || 'Library';
    const upiNotePrefix = process.env.UPI_NOTE_PREFIX || 'Library Fine';
    const razorpayBase = process.env.RAZORPAY_PAYMENT_LINK_BASE || process.env.PAYMENT_BASE_URL || '';

    let paymentLink = `${req.protocol}://${req.get('host')}/fines/pay?roll_no=${encodeURIComponent(account.roll_no)}&amount=${encodeURIComponent(totalFine)}`;
    let paymentMode = 'fallback';

    if (provider === 'upi' && upiVpa) {
        const note = `${upiNotePrefix} ${account.roll_no}`.trim();
        paymentLink = `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(upiName)}&am=${encodeURIComponent(totalFine)}&cu=INR&tn=${encodeURIComponent(note)}`;
        paymentMode = 'upi';
    } else if (razorpayBase) {
        paymentLink = `${razorpayBase}?roll_no=${encodeURIComponent(account.roll_no)}&amount=${encodeURIComponent(totalFine)}`;
        paymentMode = 'razorpay';
    }

    return {
        id: account._id,
        name: account.name,
        department: account.department,
        roll_no: account.roll_no,
        mobile: account.mobile,
        total_fine: totalFine,
        preferred_channel: preferred,
        automated_enabled: automated,
        payment_mode: paymentMode,
        payment_link: paymentLink,
        borrowed_books: books,
    };
};

const buildFallbackMessage = ({ account, channel, paymentLink }) => {
    const overdueBooks = (account.borrowed_books || [])
        .filter((b) => b.fine > 0)
        .map((b) => `${b.title || b.book_id} (fine Rs.${b.fine})`)
        .join(', ');

    const opening = channel === 'voice'
        ? `Hello ${account.name}. This is your library fine reminder.`
        : `Hi ${account.name}, library fine reminder:`;

    return `${opening} Your outstanding fine is Rs.${account.total_fine}. Overdue books: ${overdueBooks || 'none'}. Please pay here: ${paymentLink}`;
};

const generateAiMessage = async ({ account, channel, paymentLink }) => {
    const apiKey = process.env.GEMINI_API_KEY_ADMIN;
    if (!apiKey) {
        return buildFallbackMessage({ account, channel, paymentLink });
    }

    const prompt = [
        'You are generating a short, polite library fine alert.',
        `Channel: ${channel}`,
        `Member: ${account.name} (${account.roll_no})`,
        `Total fine: Rs.${account.total_fine}`,
        `Books: ${(account.borrowed_books || [])
            .filter((b) => b.fine > 0)
            .map((b) => `${b.title || b.book_id} fine Rs.${b.fine} due ${b.due_date || 'N/A'}`)
            .join('; ')}`,
        `Payment link: ${paymentLink}`,
        'Rules: keep under 70 words for sms/whatsapp and under 45 words for voice. Mention the member name and payment link. Plain text only.',
    ].join('\n');

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const { data } = await axios.post(url, {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.6,
                topP: 0.9,
                maxOutputTokens: 220,
            },
        });

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        return text || buildFallbackMessage({ account, channel, paymentLink });
    } catch (error) {
        return buildFallbackMessage({ account, channel, paymentLink });
    }
};

const getTwilioClient = () => {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) return null;
    return twilio(sid, token);
};

const dispatchByChannel = async ({ mobile, channel, text }) => {
    const normalizedMobile = normalizeMobile(mobile);

    if (!normalizedMobile) {
        return { sent: false, channel, detail: 'Missing mobile number.' };
    }

    if (channel === 'sms') {
        await sendSMS(normalizedMobile, text);
        return { sent: true, channel, detail: 'SMS sent.' };
    }

    if (channel === 'whatsapp') {
        const client = getTwilioClient();
        const from = process.env.TWILIO_WHATSAPP_FROM;
        if (!client || !from) {
            return { sent: false, channel, detail: 'WhatsApp gateway not configured.' };
        }

        await client.messages.create({
            from,
            to: `whatsapp:${normalizedMobile}`,
            body: text,
        });

        return { sent: true, channel, detail: 'WhatsApp sent.' };
    }

    if (channel === 'voice') {
        return {
            sent: false,
            channel,
            detail: 'Voice gateway not configured yet. Configure TWILIO voice flow/NCCO webhook.',
        };
    }

    return { sent: false, channel, detail: 'Unsupported channel.' };
};

const refreshFineValues = async (accounts) => {
    for (const account of accounts) {
        const { books, totalFine } = buildFineBreakdown(account);
        account.borrowed_books = account.borrowed_books.map((book) => {
            const updated = books.find((b) => b.book_id === book.book_id && String(b.due_date) === String(book.due_date));
            return {
                ...book.toObject(),
                fine: updated ? updated.fine : book.fine,
            };
        });
        account.total_fine = totalFine;
        await account.save();
    }
};

router.get('/accounts', async (req, res) => {
    try {
        const includeZero = req.query.includeZero === 'true';
        const accounts = await Account.find().sort({ name: 1 });
        const data = accounts.map((a) => serializeAccountFine(a, req));
        const filtered = includeZero ? data : data.filter((x) => x.total_fine > 0);
        res.status(200).json({ accounts: filtered });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch fine accounts.', error: error.message });
    }
});

router.post('/recalculate', async (req, res) => {
    try {
        const accounts = await Account.find();
        await refreshFineValues(accounts);
        res.status(200).json({ message: 'Fine values recalculated successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to recalculate fines.', error: error.message });
    }
});

router.put('/preferences/:roll_no', async (req, res) => {
    try {
        const { preferred_channel, automated_enabled } = req.body;
        const allowed = ['sms', 'whatsapp', 'voice'];

        if (preferred_channel && !allowed.includes(preferred_channel)) {
            return res.status(400).json({ message: 'Invalid preferred channel.' });
        }

        const account = await Account.findOne({ roll_no: req.params.roll_no });
        if (!account) {
            return res.status(404).json({ message: 'Account not found.' });
        }

        account.notification_settings = {
            preferred_channel: preferred_channel || account.notification_settings?.preferred_channel || 'whatsapp',
            automated_enabled: typeof automated_enabled === 'boolean'
                ? automated_enabled
                : account.notification_settings?.automated_enabled !== false,
        };

        await account.save();
        res.status(200).json({ message: 'Notification preferences updated.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update preferences.', error: error.message });
    }
});

router.post('/payment-link', async (req, res) => {
    try {
        const { roll_no } = req.body;
        if (!roll_no) {
            return res.status(400).json({ message: 'roll_no is required.' });
        }

        const account = await Account.findOne({ roll_no });
        if (!account) {
            return res.status(404).json({ message: 'Account not found.' });
        }

        const serialized = serializeAccountFine(account, req);
        res.status(200).json({
            message: 'Payment link generated.',
            roll_no,
            amount: serialized.total_fine,
            payment_link: serialized.payment_link,
            note: 'Integrate Razorpay or preferred gateway URL through PAYMENT_BASE_URL env.',
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to generate payment link.', error: error.message });
    }
});

router.post('/waive', async (req, res) => {
    try {
        const { roll_no, book_id, amount } = req.body;
        if (!roll_no) {
            return res.status(400).json({ message: 'roll_no is required.' });
        }

        const account = await Account.findOne({ roll_no });
        if (!account) {
            return res.status(404).json({ message: 'Account not found.' });
        }

        if (book_id) {
            const book = account.borrowed_books.find((b) => b.book_id === book_id);
            if (!book) {
                return res.status(404).json({ message: 'Book entry not found for this account.' });
            }

            const cut = Number(amount);
            if (Number.isFinite(cut) && cut > 0) {
                book.fine = Math.max(0, (book.fine || 0) - cut);
            } else {
                book.fine = 0;
            }
        } else {
            const cut = Number(amount);
            if (Number.isFinite(cut) && cut > 0) {
                let remaining = cut;
                for (const book of account.borrowed_books) {
                    if (remaining <= 0) break;
                    const currentFine = book.fine || 0;
                    if (currentFine <= 0) continue;
                    const delta = Math.min(currentFine, remaining);
                    book.fine = currentFine - delta;
                    remaining -= delta;
                }
            } else {
                account.borrowed_books.forEach((b) => {
                    b.fine = 0;
                });
            }
        }

        account.total_fine = account.borrowed_books.reduce((sum, b) => sum + (b.fine || 0), 0);
        await account.save();

        res.status(200).json({ message: 'Fine waived successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to waive fine.', error: error.message });
    }
});

const notifyAccounts = async ({ req, rollNos = [], selectAll = false, forcedChannel = null, automatedOnly = false }) => {
    const query = selectAll ? {} : { roll_no: { $in: rollNos } };
    const accounts = await Account.find(query);
    const results = [];

    for (const account of accounts) {
        const serialized = serializeAccountFine(account, req);
        if (serialized.total_fine <= 0) continue;

        if (automatedOnly && !serialized.automated_enabled) continue;

        const channel = forcedChannel || serialized.preferred_channel || 'whatsapp';
        const text = await generateAiMessage({
            account: serialized,
            channel,
            paymentLink: serialized.payment_link,
        });

        let delivery;
        try {
            delivery = await dispatchByChannel({ mobile: serialized.mobile, channel, text });
        } catch (error) {
            delivery = { sent: false, channel, detail: error.message };
        }

        results.push({
            roll_no: serialized.roll_no,
            name: serialized.name,
            channel,
            sent: delivery.sent,
            detail: delivery.detail,
            message: text,
        });
    }

    return results;
};

router.post('/notify', async (req, res) => {
    try {
        const { roll_nos = [], select_all = false, channel = 'preferred' } = req.body;

        const forcedChannel = channel === 'preferred' ? null : channel;
        const results = await notifyAccounts({
            req,
            rollNos: roll_nos,
            selectAll: select_all,
            forcedChannel,
            automatedOnly: false,
        });

        res.status(200).json({
            message: 'Notification request processed.',
            total: results.length,
            sent: results.filter((r) => r.sent).length,
            failed: results.filter((r) => !r.sent).length,
            results,
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to send notifications.', error: error.message });
    }
});

router.post('/preview', async (req, res) => {
    try {
        const { roll_no, channel = 'whatsapp' } = req.body;
        if (!roll_no) {
            return res.status(400).json({ message: 'roll_no is required.' });
        }

        const account = await Account.findOne({ roll_no });
        if (!account) {
            return res.status(404).json({ message: 'Account not found.' });
        }

        const serialized = serializeAccountFine(account, req);
        const text = await generateAiMessage({
            account: serialized,
            channel,
            paymentLink: serialized.payment_link,
        });

        return res.status(200).json({ message: text });
    } catch (error) {
        res.status(500).json({ message: 'Failed to preview AI message.', error: error.message });
    }
});

router.get('/pay', async (req, res) => {
    try {
        const { roll_no, amount } = req.query;
        if (!roll_no) {
            return res.status(400).send('roll_no is required.');
        }

        const account = await Account.findOne({ roll_no });
        if (!account) {
            return res.status(404).send('Account not found.');
        }

        const serialized = serializeAccountFine(account, req);
        const fineAmount = amount || serialized.total_fine;

        const html = `
                    <!doctype html>
                    <html>
                        <head>
                            <meta charset="utf-8" />
                            <meta name="viewport" content="width=device-width, initial-scale=1" />
                            <title>Pay Fine</title>
                            <style>
                                body{font-family:Arial,sans-serif;background:#f8fafc;color:#0f172a;margin:0;padding:24px}
                                .card{max-width:720px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:20px;box-shadow:0 10px 30px rgba(15,23,42,.08)}
                                .title{font-size:24px;font-weight:700;margin:0 0 10px}
                                .muted{color:#64748b;font-size:14px;margin:0 0 16px}
                                .row{padding:12px 0;border-top:1px solid #e2e8f0}
                                .btn{display:inline-block;margin-top:16px;padding:12px 16px;border-radius:10px;background:#0f172a;color:#fff;text-decoration:none;font-weight:700}
                                .pill{display:inline-block;padding:6px 10px;border-radius:999px;background:#f1f5f9;margin-right:8px;font-size:13px}
                            </style>
                        </head>
                        <body>
                            <div class="card">
                                <h1 class="title">Pay Library Fine</h1>
                                <p class="muted">Member: ${serialized.name} (${serialized.roll_no})</p>
                                <p><span class="pill">Amount: Rs.${fineAmount}</span><span class="pill">Mode: ${(serialized.payment_mode || 'fallback').toUpperCase()}</span></p>
                                <div class="row">
                                    <div><strong>Payment link</strong></div>
                                    <div style="word-break:break-all;margin-top:8px">${serialized.payment_link}</div>
                                </div>
                                <a class="btn" href="${serialized.payment_link}" target="_blank" rel="noreferrer">Open Payment Link</a>
                            </div>
                        </body>
                    </html>
                `;

        return res.status(200).type('html').send(html);
    } catch (error) {
        return res.status(500).send('Failed to open payment page.');
    }
});

const sendAutomatedFineNotifications = async (reqLike = null) => {
    const fakeReq = reqLike || {
        protocol: process.env.SERVER_PROTOCOL || 'http',
        get: (key) => {
            if (key === 'host') {
                return process.env.SERVER_HOST || `localhost:${process.env.PORT || 5000}`;
            }
            return '';
        },
    };

    return notifyAccounts({
        req: fakeReq,
        selectAll: true,
        forcedChannel: null,
        automatedOnly: true,
    });
};

module.exports = { router, sendAutomatedFineNotifications };
