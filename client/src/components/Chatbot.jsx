import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./Chatbot.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm MovieHub AI. Ask me about movies, genres, ratings, reviews, or recommendations!",
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isLoading, error]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSend = async (event) => {
    event.preventDefault();

    const message = input.trim();

    if (!message || isLoading) return;

    setError("");
    setInput("");

    const history = messages
      .filter(
        (item) =>
          ["user", "assistant"].includes(item.role) &&
          typeof item.content === "string"
      )
      .slice(-8)
      .map((item) => ({
        role: item.role,
        content: item.content,
      }));

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: message,
      },
    ]);

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          message,
          history,
        }),
      });

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response. Please check your backend."
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            `Request failed with status ${response.status}.`
        );
      }

      if (
        typeof data.reply !== "string" ||
        !data.reply.trim()
      ) {
        throw new Error("The AI returned an empty response.");
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.reply,
        },
      ]);
    } catch (err) {
      console.error("MovieHub AI chatbot error:", err);

      let errorMessage = err.message;

      if (err instanceof TypeError) {
        errorMessage =
          "Unable to connect to the backend. Make sure your server is running and the API URL is correct.";
      }

      setError(
        errorMessage || "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      handleSend(event);
    }
  };

  const handleClearChat = () => {
    if (isLoading) return;

    setMessages([
      {
        role: "assistant",
        content:
          "Chat cleared! What movies would you like to explore?",
      },
    ]);

    setError("");
    setInput("");
  };

  const handleSuggestion = (suggestion) => {
    setInput(suggestion);
    setError("");
    inputRef.current?.focus();
  };

  return (
    <div className="movie-chatbot">
      {!isOpen && (
        <button
          type="button"
          className="chatbot-toggle"
          onClick={() => setIsOpen(true)}
          aria-label="Open MovieHub AI chatbot"
          title="Chat with MovieHub AI"
        >
          <span className="chatbot-toggle-icon">✦</span>

          <span className="chatbot-toggle-text">
            Ask MovieHub AI
          </span>
        </button>
      )}

      {isOpen && (
        <section
          className="chatbot-window"
          aria-label="MovieHub AI chat"
        >
          <header className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">M</div>

              <div>
                <h3>MovieHub AI</h3>

                <p>
                  <span className="chatbot-status-dot"></span>
                  Your movie assistant
                </p>
              </div>
            </div>

            <div className="chatbot-header-actions">
              <button
                type="button"
                className="chatbot-header-button"
                onClick={handleClearChat}
                disabled={isLoading}
                title="Clear conversation"
                aria-label="Clear conversation"
              >
                ↻
              </button>

              <button
                type="button"
                className="chatbot-header-button"
                onClick={() => setIsOpen(false)}
                title="Close chatbot"
                aria-label="Close chatbot"
              >
                ×
              </button>
            </div>
          </header>

          <div
            className="chatbot-messages"
            aria-live="polite"
            aria-relevant="additions"
          >
            <div className="chatbot-date-label">
              MOVIEHUB AI ASSISTANT
            </div>

            {messages.map((message, index) => (
              <div
                key={`${index}-${message.role}`}
                className={`chatbot-message-row ${
                  message.role === "user"
                    ? "user-message-row"
                    : "assistant-message-row"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="chatbot-message-avatar">
                    M
                  </div>
                )}

                <div
                  className={`chatbot-message ${
                    message.role === "user"
                      ? "user-message"
                      : "assistant-message"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <div className="chatbot-markdown">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ node, ...props }) => (
                            <a
                              {...props}
                              target="_blank"
                              rel="noopener noreferrer"
                            />
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="chatbot-message-row assistant-message-row">
                <div className="chatbot-message-avatar">
                  M
                </div>

                <div
                  className="chatbot-message assistant-message chatbot-typing"
                  aria-label="MovieHub AI is responding"
                >
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            {error && (
              <div className="chatbot-error" role="alert">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && !isLoading && (
            <div className="chatbot-suggestions">
              <p>Try asking:</p>

              {[
                "Recommend a movie",
                "What are the highest-rated movies?",
                "Suggest a science-fiction movie",
              ].map((suggestion) => (
                <button
                  type="button"
                  key={suggestion}
                  onClick={() =>
                    handleSuggestion(suggestion)
                  }
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <form
            className="chatbot-input-area"
            onSubmit={handleSend}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about movies..."
              rows={1}
              maxLength={2000}
              disabled={isLoading}
              aria-label="Message MovieHub AI"
            />

            <button
              type="submit"
              className="chatbot-send-button"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              title="Send message"
            >
              ➤
            </button>
          </form>

          <div className="chatbot-footer">
            Powered by MovieHub AI
          </div>
        </section>
      )}
    </div>
  );
}

export default Chatbot;