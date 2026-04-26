import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  User,
  LogOut,
  Send,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";

export default function Chat() {
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setMessages([
      {
        id: "welcome",
        sender: "bot",
        text: `Hello ${user.name ? user.name.split(" ")[0] : "there"}! I'm HealthBot 🤖\nDescribe your symptoms and I'll help analyze them.`,
        time: now,
      },
    ]);
  }, [user.name]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;
    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: "user", text: inputText, time: now },
    ]);
    const currentInput = inputText;
    setInputText("");
    setLoading(true);

    try {
      const res = await axios.post(
        "https://healthbot-production-3c7d.up.railway.app/api/chat/message",
        { text: currentInput },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: res.data.reply,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          sender: "bot",
          text: "Connection error. Try again.",
          time: now,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#0B1120] font-sans text-slate-50 flex items-center justify-center p-0 lg:p-8 relative overflow-hidden">
      <div className="w-full max-w-[1440px] h-screen lg:h-[90vh] bg-[#0f1523]/80 backdrop-blur-2xl lg:border lg:border-teal-500/20 lg:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden relative z-10">
        <header className="h-[72px] shrink-0 border-b border-slate-800/60 flex items-center justify-between px-6 bg-[#0f1523]/50">
          <div className="flex items-center gap-2">
            <Activity className="h-7 w-7 text-teal-400" />
            <span className="text-2xl font-bold text-white">HealthBot</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="hidden md:flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full text-amber-400 text-xs font-bold">
              <ShieldCheck className="h-3.5 w-3.5" /> VERIFY EMAIL
            </button>
            <div className="w-10 h-10 rounded-full border-2 border-teal-500/30 bg-slate-800 flex items-center justify-center">
              <User className="h-5 w-5 text-slate-300" />
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <aside className="w-[280px] shrink-0 border-r border-slate-800/60 bg-[#0b1120]/50 hidden lg:flex flex-col">
            <nav className="p-4 flex flex-col gap-1 text-sm font-medium text-slate-400">
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "chat" ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "hover:bg-slate-800/50"}`}
              >
                <MessageSquare className="h-4 w-4" /> AI Chat
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "profile" ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "hover:bg-slate-800/50"}`}
              >
                <User className="h-4 w-4" /> My Profile
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-500/10 text-rose-400 mt-4"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </nav>
          </aside>

          <main className="flex-1 flex flex-col bg-[#0f1523]/30 relative overflow-hidden">
            {activeTab === "chat" ? (
              <>
                <div className="flex-1 overflow-y-auto px-4 md:px-10 pb-6 pt-28 flex flex-col gap-6">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-4 max-w-[85%] md:max-w-[70%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                    >
                      <div
                        className={`p-4 text-sm leading-relaxed ${msg.sender === "user" ? "bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-2xl rounded-tr-none" : "bg-slate-800/50 text-slate-200 rounded-2xl rounded-tl-none"}`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
                <div className="p-4 md:p-8">
                  <div className="max-w-4xl mx-auto flex items-center gap-3 bg-[#111827]/80 border border-slate-700 rounded-2xl p-2 pl-5">
                    <textarea
                      rows={1}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Describe symptoms..."
                      className="flex-1 bg-transparent text-white focus:outline-none py-3 resize-none"
                    />
                    <button
                      onClick={sendMessage}
                      className="w-11 h-11 rounded-xl bg-teal-500 text-slate-900 flex items-center justify-center"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 p-12 text-white">
                <h1 className="text-3xl font-bold mb-4">
                  {user.name || "User Profile"}
                </h1>
                <p className="text-slate-400">
                  {user.email || "No email available"}
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
