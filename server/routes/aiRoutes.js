const express = require("express");
const router = express.Router();

const {
    chatWithMovieAI
} = require("../controllers/aiController");

// Temporary route to verify the AI router is mounted
router.post("/chat-test", (req, res) => {
    res.json({
        success: true,
        message: "AI router is working!"
    });
});

// Actual AI chatbot endpoint
router.post("/chat", chatWithMovieAI);

module.exports = router;