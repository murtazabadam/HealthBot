import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  MessageSquare,
  History,
  Bookmark,
  FolderHeart,
  Bell,
  User,
  Settings,
  LogOut,
  Send,
  Bot,
  Paperclip,
  Mic,
  Image as ImageIcon,
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

  // Retrieve user data and auth token
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  // Logic for the first auto-reply greeting using the Full Registered Name
  useEffect(() => {
    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const fullName = user.name || "User";

    setMessages([
      {
        id: "welcome",
        sender: "bot",
        text: `Hello ${fullName}! I am your HealthBot. Please describe your symptoms.`,
        time: now,
      },
    ]);
  }, [user.name]);

  // Auto-scroll to most recent message
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

    // UI Update: Add user message
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: "user", text: currentInput, time: now },
    ]);

    setInputText("");
    setLoading(true);

    try {
      // API call to the trained ML service backend
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
          text: "⚠️ Connection error. Please ensure the ML service backend is live.",
          time: now,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex font-sans overflow-hidden relative">
      {/* Visual background decorative orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar - Desktop Layout (Hidden on Mobile) */}
      <aside className="w-72 border-r border-slate-800/60 bg-[#020617]/60 backdrop-blur-xl flex flex-col hidden lg:flex z-20">
        <div className="p-6 flex items-center gap-2 mb-4">
          <Activity className="h-7 w-7 text-cyan-400" strokeWidth={3} />
          <span className="text-2xl font-bold text-white tracking-tight">
            HealthBot
          </span>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <NavItem
            icon={MessageSquare}
            label="New Chat"
            active={activeTab === "chat"}
            onClick={() => setActiveTab("chat")}
          />
          <NavItem icon={History} label="Chat History" />
          <NavItem icon={Bookmark} label="Saved Conversations" />
          <NavItem icon={FolderHeart} label="Health Records" />
          <NavItem icon={Bell} label="Reminders" />
          <NavItem
            icon={User}
            label="Profile"
            active={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
          />
          <NavItem icon={Settings} label="Settings" />
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 mt-8 hover:bg-rose-500/10 transition-all"
          >
            <LogOut size={18} />{" "}
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </nav>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-screen relative z-10">
        <header className="h-[64px] lg:h-[72px] shrink-0 border-b border-slate-800/60 flex items-center justify-between px-4 lg:px-8 bg-[#020617]/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <Bot size={22} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="text-white text-sm lg:text-base font-bold leading-none">
                HealthBot
              </h3>
              <p className="text-[9px] lg:text-[10px] text-cyan-400 font-bold uppercase mt-1">
                AI Health Assistant
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-green-500/10 text-green-400 text-[10px] font-bold px-2 py-1 rounded border border-green-500/20 uppercase">
              Online
            </div>
            <UserCircle className="text-slate-500 hidden lg:block" size={32} />
            <UserCircle className="text-slate-500 lg:hidden" size={28} />
          </div>
        </header>

        {/* Messaging Pane */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 scrollbar-hide">
          <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8">
            <div className="flex justify-center">
              <span className="text-[10px] bg-slate-800/50 px-3 py-1 rounded-full text-slate-500 font-bold uppercase tracking-widest">
                Today
              </span>
            </div>

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 lg:gap-4 animate-in fade-in slide-in-from-bottom-2 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 lg:w-9 lg:h-9 rounded-xl shrink-0 flex items-center justify-center border ${msg.sender === "user" ? "bg-cyan-500/10 border-cyan-500/20" : "bg-slate-800 border-slate-700"}`}
                >
                  {msg.sender === "user" ? (
                    <User size={18} className="text-cyan-400" />
                  ) : (
                    <Bot size={18} className="text-cyan-400" />
                  )}
                </div>
                <div
                  className={`flex flex-col gap-1 ${msg.sender === "user" ? "items-end" : ""}`}
                >
                  <div
                    className={`p-3 lg:p-4 rounded-2xl text-xs lg:text-sm leading-relaxed ${msg.sender === "user" ? "bg-cyan-600 text-white rounded-tr-none shadow-lg" : "bg-slate-800/80 border border-slate-700/50 text-slate-200 rounded-tl-none backdrop-blur-md"}`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[8px] lg:text-[9px] text-slate-600 font-bold uppercase">
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
            {loading && <LoadingIndicator />}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input Bar & Advanced Features Section */}
        <div className="p-4 lg:p-6 bg-gradient-to-t from-[#020617] to-transparent">
          <div className="max-w-4xl mx-auto">
            {/* Quick Suggestion Chips */}
            <div className="flex overflow-x-auto gap-2 mb-4 pb-1 scrollbar-hide no-scrollbar">
              {[
                "What food should I eat?",
                "Is it contagious?",
                "When to see a doctor?",
                "Home remedies?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setInputText(q)}
                  className="whitespace-nowrap bg-slate-800/40 border border-slate-700/50 px-3 py-1.5 rounded-full text-[10px] text-slate-400 hover:text-cyan-400 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>

            <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl lg:rounded-2xl p-1.5 lg:p-2 flex items-center gap-2 shadow-2xl">
              <button className="p-2 text-slate-500 hover:text-cyan-400">
                <Paperclip size={20} />
              </button>
              <textarea
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Describe your symptoms in detail..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-xs lg:text-sm text-white py-2 lg:py-3 resize-none scrollbar-hide"
              />
              <button className="p-2 text-slate-500 hover:text-cyan-400">
                <Mic size={20} />
              </button>
              <button
                onClick={sendMessage}
                className="bg-cyan-500 text-slate-900 p-2 lg:p-2.5 rounded-lg lg:rounded-xl hover:scale-105 active:scale-95 transition-all"
              >
                <Send size={18} strokeWidth={3} />
              </button>
            </div>

            {/* Advanced Integrated Features - Precise compact grid for mobile */}
            <div className="mt-8 lg:mt-10 border-t border-slate-800/60 pt-6 lg:pt-8 pb-2">
              <h4 className="text-center text-cyan-400 font-bold text-[10px] lg:text-xs uppercase tracking-[0.2em] mb-6">
                Advanced Integrated Features
              </h4>
              <div className="grid grid-cols-3 lg:grid-cols-5 gap-y-6 gap-x-2">
                <FeatureItem icon={Mic} label="Voice Input" />
                <FeatureItem icon={ImageIcon} label="Image Analysis" />
                <FeatureItem icon={Bell} label="Med Reminders" />
                <FeatureItem icon={Video} label="Video Consult" />
                <FeatureItem icon={BarChart3} label="Health Insights" />
              </div>
              <p className="text-[9px] text-slate-600 mt-8 text-center italic leading-relaxed">
                ⚠️ For guidance only. Not a substitute for a doctor. Consult a
                professional in serious cases.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Styling for hiding scrollbars on suggestion chips */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

// Sub-component for Sidebar Navigation buttons
const NavItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-slate-400 hover:bg-slate-800/50"}`}
  >
    <Icon size={18} /> <span className="text-sm font-medium">{label}</span>
  </button>
);

// Sub-component for the feature grid icons
const FeatureItem = ({ icon: Icon, label }) => (
  <div className="flex flex-col items-center gap-2 group">
    <div className="p-3 lg:p-4 bg-slate-900 rounded-xl lg:rounded-2xl border border-slate-800 group-hover:border-cyan-500/30 transition-all">
      <Icon size={18} className="text-slate-500" />
    </div>
    <span className="text-[8px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-tighter text-center">
      {label}
    </span>
  </div>
);

// Sub-component for bot typing animation
const LoadingIndicator = () => (
  <div className="flex gap-3 lg:gap-4">
    <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
      <Bot className="text-cyan-400 animate-pulse" size={16} />
    </div>
    <div className="p-3 lg:p-4 bg-slate-800/50 rounded-2xl flex gap-1 items-center">
      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]" />
      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]" />
    </div>
  </div>
);
