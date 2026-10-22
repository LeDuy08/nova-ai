
"use client";

import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendMessage(event) {
    event?.preventDefault();

    const text = input.trim();
    if (!text || loading) return;

    const nextMessages = [
      ...messages,
      { role: "user", content: text },
    ];

    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Yêu cầu thất bại.");
      }

      setMessages([
        ...nextMessages,
        { role: "assistant", content: data.reply },
      ]);
    } catch (err) {
      setError(err.message || "Không kết nối được AI.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app">
      <aside className="sidebar">
        <h2>✳ Chat AI</h2>
        <button onClick={() => {
          setMessages([]);
          setError("");
        }}>
          + Cuộc trò chuyện mới
        </button>
        <p>Trợ lý AI cá nhân</p>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <strong>Chat AI</strong>
          <span>Gemini · qua 9Router</span>
        </header>

        <div className="conversation">
          {messages.length === 0 ? (
            <div className="welcome">
              <div className="sparkle">✳</div>
              <h1>Hôm nay mình giúp gì cho bạn?</h1>
              <p>Đặt câu hỏi để bắt đầu trò chuyện.</p>
              <div className="suggestions">
                <button onClick={() =>
                  setInput("Giải thích Next.js cho người mới")
                }>
                  Học lập trình
                </button>
                <button onClick={() =>
                  setInput("Viết một chương trình JavaScript")
                }>
                  Viết code
                </button>
              </div>
            </div>
          ) : (
            <div className="messages">
              {messages.map((message, index) => (
                <div className={`message ${message.role}`} key={index}>
                  <b>{message.role === "user" ? "Bạn" : "✳ AI"}</b>
                  <div className="message-content">
                    {message.content}
                  </div>
                </div>
              ))}
              {loading && <p>AI đang trả lời...</p>}
            </div>
          )}

          {error && <p className="error">{error}</p>}
        </div>

        <form className="composer" onSubmit={sendMessage}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập câu hỏi..."
            rows={2}
            maxLength={12000}
            disabled={loading}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <div className="composer-footer">
            <span>Enter để gửi</span>
            <button disabled={loading || !input.trim()}>
              {loading ? "Đang gửi..." : "Gửi ↑"}
            </button>
          </div>
        </form>

        <footer className="disclaimer">
          AI có thể đưa ra thông tin chưa chính xác.
        </footer>
      </section>
    </main>
  );
}
