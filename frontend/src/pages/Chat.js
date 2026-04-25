import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  useEffect(() => {
    // Welcome message
    setMessages([
      {
        sender: "bot",
        text: "Hello! I'm HealthBot 🤖 Describe your symptoms and I'll help analyze them. Example: \"I have fever, cough and fatigue\"",
      },
    ]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await axios.post(
        "https://healthbot-production-3c7d.up.railway.app/api/chat/message",
        { text: input },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessages((prev) => [...prev, { sender: "bot", text: res.data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Sorry, something went wrong. Please try again.",
        },
      ]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logo}>⚕️ HealthBot</span>
          <span style={styles.online}>● Online</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userName}>{user.name}</span>
          <button style={styles.logoutBtn} onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <div style={styles.messages}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
              marginBottom: "12px",
            }}
          >
            {msg.sender === "bot" && <div style={styles.avatar}>🤖</div>}
            <div
              style={
                msg.sender === "user" ? styles.userBubble : styles.botBubble
              }
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", marginBottom: "12px" }}>
            <div style={styles.avatar}>🤖</div>
            <div style={styles.botBubble}>Analyzing symptoms...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={styles.inputArea}>
        <textarea
          style={styles.textarea}
          rows={1}
          placeholder="Describe your symptoms... (e.g. I have fever and cough)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
        />
        <button style={styles.sendBtn} onClick={sendMessage} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#0f172a",
    color: "#e2e8f0",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    background: "#1e293b",
    borderBottom: "1px solid #334155",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "12px" },
  headerRight: { display: "flex", alignItems: "center", gap: "12px" },
  logo: { fontSize: "20px", fontWeight: "700", color: "#38bdf8" },
  online: { fontSize: "12px", color: "#22c55e" },
  userName: { fontSize: "13px", color: "#94a3b8" },
  logoutBtn: {
    padding: "6px 14px",
    background: "transparent",
    border: "1px solid #334155",
    color: "#94a3b8",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#1e40af",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "8px",
    flexShrink: 0,
    fontSize: "16px",
  },
  botBubble: {
    maxWidth: "70%",
    padding: "12px 16px",
    background: "#1e293b",
    borderRadius: "0 12px 12px 12px",
    fontSize: "14px",
    lineHeight: "1.6",
    border: "1px solid #334155",
    whiteSpace: "pre-wrap",
  },
  userBubble: {
    maxWidth: "70%",
    padding: "12px 16px",
    background: "#0369a1",
    borderRadius: "12px 0 12px 12px",
    fontSize: "14px",
    lineHeight: "1.6",
    whiteSpace: "pre-wrap",
  },
  inputArea: {
    display: "flex",
    gap: "12px",
    padding: "16px 24px",
    background: "#1e293b",
    borderTop: "1px solid #334155",
  },
  textarea: {
    flex: 1,
    padding: "12px 16px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "#e2e8f0",
    fontSize: "14px",
    resize: "none",
    outline: "none",
  },
  sendBtn: {
    padding: "12px 24px",
    background: "#0ea5e9",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "14px",
  },
};
