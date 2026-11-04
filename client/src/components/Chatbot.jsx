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
        "Hi! I'm AI assistant. Ask me about movies, genres, ratings, reviews, or recommendations!",
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Automatically scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isLoading, error]);

  // Focus the input when the chatbot opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Send a message to the AI backend
  const handleSend = async (event) => {
    event.preventDefault();

    const message = input.trim();

    if (!message || isLoading) return;

    setError("");
    setInput("");

    // Keep recent conversation history for context
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
      console.error("AI chatbot error:", err);

      let errorMessage = err.message;

      if (err instanceof TypeError) {
        errorMessage =
          "Unable to connect to the backend. Please check your internet connection and API URL.";
      }

      setError(
        errorMessage || "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Send the message when Enter is pressed
  // Shift + Enter inserts a new line
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend(event);
    }
  };

  // Clear the conversation
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

  // Fill the input with a suggested question
  const handleSuggestion = (suggestion) => {
    setInput(suggestion);
    setError("");
    inputRef.current?.focus();
  };

  return (
    <div className="movie-chatbot">
      {/* Floating chatbot button */}
      {!isOpen && (
        <button
          type="button"
          className="chatbot-toggle"
          onClick={() => setIsOpen(true)}
          aria-label="Open AI chatbot"
          title="Chat with AI"
        >
          <span className="chatbot-toggle-icon">✦</span>

          <span className="chatbot-toggle-text">
            Ask AI
          </span>
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <section
          className="chatbot-window"
          aria-label="AI chat"
        >
          {/* Header */}
          <header className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">AI</div>

              <div>
                <h3>AI Assistant</h3>

                <p>
                  <span className="chatbot-status-dot"></span>
                  Your movie assistant
                </p>
              </div>
            </div>

            <div className="chatbot-header-actions">
              {/* Clear conversation */}
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

              {/* Close chatbot */}
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

          {/* Conversation messages */}
          <div
            className="chatbot-messages"
            aria-live="polite"
            aria-relevant="additions"
          >
            <div className="chatbot-date-label">
              AI ASSISTANT
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
                {/* AI avatar */}
                {message.role === "assistant" && (
                  <div className="chatbot-message-avatar">
                    AI
                  </div>
                )}

                {/* Message bubble */}
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

            {/* AI typing indicator */}
            {isLoading && (
              <div className="chatbot-message-row assistant-message-row">
                <div className="chatbot-message-avatar">
                  AI
                </div>

                <div
                  className="chatbot-message assistant-message chatbot-typing"
                  aria-label="AI is responding"
                  role="status"
                >
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="chatbot-error" role="alert">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested questions */}
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
                  onClick={() => handleSuggestion(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Message input */}
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
              aria-label="Message AI"
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

          {/* Footer */}
          <div className="chatbot-footer">
            Powered by AI
          </div>
        </section>
      )}
    </div>
  );
}

export default Chatbot;
