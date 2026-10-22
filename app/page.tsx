
"use client";

import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể kết nối AI");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error instanceof Error ? error.message : "Đã xảy ra lỗi.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="chat-page">
      <header className="chat-header">
        <div className="brand-icon">✦</div>
        <div>
          <h1>Nova AI</h1>
          <p>Trợ lý AI của bạn</p>
        </div>
        <span className="status">● Sẵn sàng</span>
      </header>

      <section className="chat-content">
        {messages.length === 0 ? (
          <div className="welcome">
            <div className="welcome-icon">✦</div>
            <h2>Hôm nay mình có thể giúp gì?</h2>
            <p>Đặt câu hỏi, học tập hoặc cùng AI viết code.</p>
            <div className="suggestions">
              {[
                "Giải thích JavaScript",
                "Hướng dẫn học lập trình",
                "Viết code Next.js",
              ].map((item) => (
                <button key={item} onClick={() => setInput(item)}>
                  {item} ↗
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.role}`}
              >
                <div className="message-label">
                  {message.role === "user" ? "Bạn" : "Nova AI"}
                </div>
                <div className="message-text">{message.content}</div>
              </div>
            ))}
            {loading && (
              <div className="message assistant">
                <div className="message-label">Nova AI</div>
                <div className="message-text">Đang suy nghĩ...</div>
              </div>
            )}
          </div>
        )}
      </section>

      <form
        className="chat-form"
        onSubmit={(event) => {
          event.preventDefault();
          void sendMessage();
        }}
      >
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              void sendMessage();
            }
          }}
          placeholder="Nhập câu hỏi của bạn..."
          rows={2}
        />
        <div className="form-footer">
          <span>Enter để gửi · Shift + Enter để xuống dòng</span>
          <button type="submit" disabled={loading || !input.trim()}>
            {loading ? "Đang gửi..." : "Gửi ↑"}
          </button>
        </div>
      </form>

      <footer className="chat-footer">
        AI có thể mắc lỗi. Hãy kiểm tra thông tin quan trọng.
      </footer>
    </main>
  );
}
