const OpenAI = require("openai");
require("dotenv").config();

if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing from the .env file");
}

const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

module.exports = openai;
