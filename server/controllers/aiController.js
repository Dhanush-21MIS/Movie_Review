const openai = require("../config/openai");
const Movie = require("../models/Movie");
const Review = require("../models/Review");

const chatWithMovieAI = async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        // Validate the user's message
        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please enter a message."
            });
        }

        // Limit message size
        if (message.length > 2000) {
            return res.status(400).json({
                success: false,
                message: "Message must not exceed 2000 characters."
            });
        }

        // Fetch movies from MongoDB
        const movies = await Movie.find({})
            .select(
                "title description genre releaseYear director cast averageRating reviewCount"
            )
            .limit(100)
            .lean();

        // Fetch recent reviews from MongoDB
        const reviews = await Review.find({})
            .select("movie rating comment createdAt")
            .sort({ createdAt: -1 })
            .limit(100)
            .populate("movie", "title")
            .lean();

        // Build movie context for the AI
        const movieContext = movies.map((movie) => ({
            title: movie.title,
            description: movie.description,
            genres: movie.genre,
            releaseYear: movie.releaseYear,
            director: movie.director,
            cast: movie.cast,
            averageRating: movie.averageRating,
            reviewCount: movie.reviewCount
        }));

        // Build review context for the AI
        const reviewContext = reviews.map((review) => ({
            movie: review.movie?.title || "Unknown movie",
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt
        }));

        // Keep only valid recent conversation messages
        const validHistory = Array.isArray(history)
            ? history
                .filter(
                    (item) =>
                        item &&
                        ["user", "assistant"].includes(item.role) &&
                        typeof item.content === "string"
                )
                .slice(-8)
                .map((item) => ({
                    role: item.role,
                    content: item.content.slice(0, 2000)
                }))
            : [];

        const systemPrompt = `
You are MovieHub AI, a helpful movie assistant for a movie review website.

You can help users:
1. Discover movies based on genre, interests, and preferences.
2. Understand movie details.
3. Summarize actual user reviews.
4. Compare movies using available information.
5. Explore movie ratings.

DATABASE RULES:
- Use the supplied database context when answering questions about movies and reviews.
- Recommend movies from the supplied movie list.
- Never invent a movie, rating, review, cast member, or database fact.
- If the requested information is unavailable, explain that clearly.
- Distinguish database facts from general movie knowledge.
- When discussing reviews, summarize the supplied review comments fairly.
- Do not claim that a movie is the highest-rated unless the supplied data supports that conclusion.
- Be friendly, concise, and helpful.
- Format movie recommendations as readable lists when appropriate.

MOVIES FROM DATABASE:
${JSON.stringify(movieContext)}

RECENT USER REVIEWS:
${JSON.stringify(reviewContext)}
`;

        // Call Groq through the OpenAI SDK
        const completion = await openai.chat.completions.create({
            model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                ...validHistory,
                {
                    role: "user",
                    content: message.trim()
                }
            ],
            temperature: 0.5,
            max_tokens: 700
        });

        const reply =
            completion.choices?.[0]?.message?.content?.trim();

        if (!reply) {
            return res.status(502).json({
                success: false,
                message: "The AI could not generate a response. Please try again."
            });
        }

        return res.status(200).json({
            success: true,
            reply,
            model: completion.model
        });

    } catch (error) {
        console.error(
            "Movie chatbot error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to process your message right now. Please try again."
        });
    }
};

module.exports = {
    chatWithMovieAI
};