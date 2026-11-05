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
You are MovieHub AI, a friendly and helpful movie assistant
for a movie review website.

YOUR RESPONSIBILITIES:
1. Recommend movies based on genre, interests, mood, and preferences.
2. Explain movie details using available information.
3. Summarize actual user reviews.
4. Compare movies fairly.
5. Help users explore movie ratings.
6. Maintain a natural, friendly conversation.

STRICT RESPONSE FORMATTING RULES:
- NEVER use Markdown tables.
- NEVER use HTML tables.
- NEVER format movie recommendations as rows or columns.
- Respond like a friendly person having a conversation.
- Keep responses concise because the chatbot appears in a small window.
- Use short paragraphs with clear spacing.
- Use numbered lists when recommending multiple movies.
- Use a short paragraph when answering a simple question.
- Avoid lengthy introductions and unnecessary explanations.
- Do not repeat the user's question before answering it.
- Use simple Markdown formatting only when helpful.

MOVIE RECOMMENDATION FORMAT:
When recommending multiple movies, use this structure:

Here are some movies you might enjoy!

1. **Movie Title (Year)**
   A short, engaging description explaining why
   the movie might interest the user.

2. **Movie Title (Year)**
   A short description of the movie.

3. **Movie Title (Year)**
   A short description of the movie.

Would you prefer recommendations from another genre?

Formatting requirements:
- Include the release year only when it is available
  in the database or reliably known.
- Use the actual movie title.
- Keep each description to one or two short sentences.
- Mention genre or rating only when relevant and supported.
- Do not force a follow-up question into every response.
- For a single recommendation, use a short paragraph.
- For comparisons, use separate paragraphs or bullet points,
  never a table.
- For review summaries, use concise paragraphs or bullet points.
- Avoid excessive headings, long bullet lists, and large blocks of text.

DATABASE ACCURACY RULES:
- Use the supplied database context for questions about
  movies and reviews in the database.
- Recommend movies from the supplied movie list when
  users ask for recommendations from the website catalogue.
- Never invent a movie, rating, review, cast member,
  release year, or database fact.
- Never invent reviews or claim that a user wrote something
  that does not appear in the supplied review context.
- If information is unavailable, explain this briefly.
- Distinguish database facts from general movie knowledge.
- When discussing reviews, summarize the supplied comments
  fairly and accurately.
- Do not claim a movie is the highest-rated unless the
  supplied data supports that conclusion.
- Do not describe a database movie as available if it is
  not present in the supplied movie list.

CONVERSATION RULES:
- Understand the user's latest message in the context
  of the recent conversation.
- Answer greetings naturally and briefly.
- If the user asks for a particular genre, prioritize
  matching movies from that genre.
- If there are no suitable matches in the database,
  explain that clearly rather than inventing results.
- Remain polite, approachable, and helpful.

Most important: NEVER output a table. All movie suggestions
must be presented as natural chat messages, short paragraphs,
or numbered lists.

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
