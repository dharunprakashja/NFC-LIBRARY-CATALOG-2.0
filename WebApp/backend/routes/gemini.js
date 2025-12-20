const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const router = express.Router();
router.use(express.json());

const API_KEY = "AIzaSyBrulOorXX01nH0VVkCV6Ts6hK64EGxyBU";

if (!API_KEY) {
  console.error("❌ ERROR: Gemini API Key is missing!");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

router.post("/", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required!" });
  }

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text(); // ✅ Extract text response

    res.json({ summary: responseText });
  } catch (error) {
    console.error("❌ Gemini AI Error:", error);
    res.status(500).json({
      summary: "Failed to generate a summary.",
      error: error.message,
    });
  }
});

module.exports = router;
