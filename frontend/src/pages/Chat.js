import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  MessageSquare,
  Bell,
  User,
  LogOut,
  Send,
  Bot,
  Paperclip,
  Mic,
  ImageIcon,
  Video,
  BarChart3,
  UserCircle,
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
        text: `Hello ${user.name ? user.name.split(" ")[0] : "there"}! I'm HealthBot 👋\nDescribe your symptoms and I'll help analyze them.`,
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
    const currentInput = inputText;
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: "user", text: currentInput, time: now },
    ]);
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
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          sender: "bot",
          text: "I'm having trouble connecting. Please try again.",
          time: now,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex font-sans overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar - Desktop Only */}
      <aside className="w-72 border-r border-slate-800/60 bg-[#020617]/60 backdrop-blur-xl flex flex-col hidden lg:flex z-20">
        <div className="p-6 flex items-center gap-2 mb-4">
          <Activity className="h-7 w-7 text-cyan-400" strokeWidth={3} />
          <span className="text-2xl font-bold text-white tracking-tight">
            HealthBot
          </span>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <button
            onClick={() => setActiveTab("chat")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${activeTab === "chat" ? "bg-cyan-500/10 text-cyan-400" : "text-slate-400"}`}
          >
            <MessageSquare size={18} /> AI Chat
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${activeTab === "profile" ? "bg-cyan-500/10 text-cyan-400" : "text-slate-400"}`}
          >
            <User size={18} /> Profile
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              navigate("/login");
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 mt-auto mb-4"
          >
            <LogOut size={18} /> Log Out
          </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-screen relative z-10">
        <header className="h-[64px] lg:h-[72px] shrink-0 border-b border-slate-800/60 flex items-center justify-between px-4 lg:px-8 bg-[#020617]/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <Bot size={18} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="text-white text-sm lg:text-base font-bold leading-none">
                HealthBot
              </h3>
              <p className="text-[9px] lg:text-[10px] text-cyan-400 font-bold uppercase tracking-tight">
                Online
              </p>
            </div>
          </div>
          <UserCircle className="text-slate-500 lg:hidden" size={28} />
        </header>

        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 scrollbar-hide">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border ${msg.sender === "user" ? "bg-cyan-500/10 border-cyan-500/20" : "bg-slate-800 border-slate-700"}`}
                >
                  {msg.sender === "user" ? (
                    <User size={14} className="text-cyan-400" />
                  ) : (
                    <Bot size={14} className="text-cyan-400" />
                  )}
                </div>
                <div
                  className={`flex flex-col gap-1 ${msg.sender === "user" ? "items-end" : ""}`}
                >
                  <div
                    className={`p-3 lg:p-4 rounded-2xl text-xs lg:text-sm ${msg.sender === "user" ? "bg-cyan-600 text-white rounded-tr-none" : "bg-slate-800/80 border border-slate-700/50 text-slate-200 rounded-tl-none"}`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[8px] text-slate-600 font-bold uppercase">
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="p-4 lg:p-6 bg-gradient-to-t from-[#020617] to-transparent">
          <div className="max-w-4xl mx-auto">
            {/* Quick Suggestions - Scrollable on mobile */}
            <div className="flex overflow-x-auto gap-2 mb-4 pb-2 scrollbar-hide no-scrollbar">
              {[
                "What food should I eat?",
                "Is it contagious?",
                "When to see a doctor?",
                "Home remedies?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setInputText(q)}
                  className="whitespace-nowrap bg-slate-800/40 border border-slate-700/50 px-3 py-1.5 rounded-full text-[10px] text-slate-400"
                >
                  {q}
                </button>
              ))}
            </div>

            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-xl p-1.5 flex items-center gap-1 shadow-2xl">
              <button className="p-2 text-slate-500">
                <Paperclip size={18} />
              </button>
              <input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type symptoms..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-xs text-white py-2"
              />
              <button className="p-2 text-slate-500">
                <Mic size={18} />
              </button>
              <button
                onClick={sendMessage}
                className="bg-cyan-500 text-slate-900 p-2 rounded-lg"
              >
                <Send size={16} strokeWidth={3} />
              </button>
            </div>

            {/* FIXED FEATURES SECTION - Compact for mobile */}
            <div className="mt-8 border-t border-slate-800/60 pt-6 pb-4">
              <h4 className="text-center text-cyan-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-4">
                Advanced Integrated Features
              </h4>
              <div className="grid grid-cols-3 lg:grid-cols-5 gap-y-6 gap-x-2">
                <Feature icon={Mic} label="Voice Input" />
                <Feature icon={ImageIcon} label="Image Analysis" />
                <Feature icon={Bell} label="Med Reminders" />
                <Feature icon={Video} label="Video Consult" />
                <Feature icon={BarChart3} label="Health Insights" />
              </div>
              <p className="text-[9px] text-slate-600 mt-8 text-center italic">
                ⚠️ For guidance only. Not a substitute for a doctor.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const Feature = ({ icon: Icon, label }) => (
  <div className="flex flex-col items-center gap-1.5">
    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
      <Icon size={16} className="text-slate-500" />
    </div>
    <span className="text-[8px] font-bold text-slate-400 uppercase text-center leading-tight">
      {label}
    </span>
  </div>
);
