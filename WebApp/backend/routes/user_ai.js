const express = require('express');
const router  = express.Router();
const fetch   = require('node-fetch'); // npm i node-fetch@2

// POST /gemini/chat
// Body: { history: [...], userMessage: "..." }
// The API key never leaves the server — frontend never sees it.
router.post('/chat', async (req, res) => {
  const { history = [], userMessage, systemPrompt } = req.body;

  if (!userMessage?.trim()) {
    return res.status(400).json({ message: 'userMessage is required.' });
  }

  const apiKey = process.env.USER_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ message: 'GEMINI_API_KEY is not set in .env' });
  }

  const GEMINI_URL =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  // Append the new user turn to provided history
  const contents = [
    ...history,
    { role: 'user', parts: [{ text: userMessage }] },
  ].slice(-20); // keep last 10 turns (20 messages)

  try {
    const geminiRes = await fetch(GEMINI_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: systemPrompt
          ? { parts: [{ text: systemPrompt }] }
          : undefined,
        contents,
        generationConfig: {
          temperature:     0.7,
          topK:            40,
          topP:            0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }),
    });

    if (!geminiRes.ok) {
      const errBody = await geminiRes.json().catch(() => ({}));
      return res.status(geminiRes.status).json({
        message: errBody?.error?.message || `Gemini API error ${geminiRes.status}`,
      });
    }

    const data    = await geminiRes.json();
    const aiText  = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const newTurn = { role: 'model', parts: [{ text: aiText }] };

    return res.status(200).json({
      reply:   aiText,
      history: [...contents, newTurn], // return updated history to frontend
    });

  } catch (err) {
    console.error('[Gemini] Error:', err.message);
    return res.status(500).json({ message: 'Failed to reach Gemini API.', error: err.message });
  }
});

module.exports = router;