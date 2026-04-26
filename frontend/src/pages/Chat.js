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
  ShieldCheck,
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

  // Get user data and token from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  // Initial welcome message
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

  // Auto-scroll to bottom
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

    // Add user message to UI
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: "user", text: currentInput, time: now },
    ]);

    setInputText("");
    setLoading(true);

    try {
      // Connect to your friend's backend dataset
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
          text: "I'm having trouble connecting to my knowledge base. Please try again.",
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

  // Helper component for Sidebar items
  const SidebarItem = ({ icon: Icon, label, active = false, onClick }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active
          ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
          : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
      }`}
    >
      <Icon size={18} />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex font-sans overflow-hidden relative">
      {/* Background Decorative Glow Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* SIDEBAR (Desktop) */}
      <aside className="w-72 border-r border-slate-800/60 bg-[#020617]/60 backdrop-blur-xl flex flex-col hidden lg:flex z-20">
        <div className="p-6 flex items-center gap-2 mb-4">
          <Activity className="h-7 w-7 text-cyan-400" strokeWidth={3} />
          <span className="text-2xl font-bold text-white tracking-tight">
            HealthBot
          </span>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <SidebarItem
            icon={MessageSquare}
            label="New Chat"
            active={activeTab === "chat"}
            onClick={() => setActiveTab("chat")}
          />
          <SidebarItem icon={History} label="Chat History" />
          <SidebarItem icon={Bookmark} label="Saved Conversations" />
          <SidebarItem icon={FolderHeart} label="Health Records" />
          <SidebarItem icon={Bell} label="Reminders" />
          <SidebarItem
            icon={User}
            label="Profile"
            active={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
          />
          <SidebarItem icon={Settings} label="Settings" />
          <SidebarItem icon={LogOut} label="Log Out" onClick={logout} />

          {/* Recent Chats Section */}
          <div className="mt-8 pt-6 border-t border-slate-800/60">
            <div className="flex items-center justify-between px-2 mb-4">
              <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                Recent Chats
              </h4>
              <button className="text-[10px] text-cyan-400 hover:underline">
                View all
              </button>
            </div>
            <div className="space-y-3 px-2">
              {["Fever and cough", "Headache relief", "Stomach pain"].map(
                (item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare
                        size={12}
                        className="text-slate-600 group-hover:text-cyan-400"
                      />
                      <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors truncate max-w-[120px]">
                        {item}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-600 uppercase font-bold">
                      6:19 PM
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
        </nav>
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col h-screen relative z-10">
        {/* Header */}
        <header className="h-[72px] shrink-0 border-b border-slate-800/60 flex items-center justify-between px-8 bg-[#020617]/40 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <Bot size={22} className="text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold leading-none">HealthBot</h3>
                <div className="flex items-center gap-1 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                  <span className="text-[9px] font-bold text-cyan-400 uppercase">
                    Online
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tight font-bold">
                AI Health Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="hidden md:flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full text-amber-400 text-[10px] font-bold uppercase">
              <ShieldCheck className="h-3.5 w-3.5" /> VERIFY EMAIL
            </button>
            <div className="w-10 h-10 rounded-full border-2 border-cyan-500/30 p-0.5">
              <UserCircle className="w-full h-full text-slate-600" />
            </div>
          </div>
        </header>

        {/* Message Container */}
        <div className="flex-1 overflow-y-auto px-6 py-8 scrollbar-hide">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-center mb-4">
              <span className="text-[10px] bg-slate-800/50 border border-slate-700/50 px-3 py-1 rounded-full text-slate-500 font-bold uppercase tracking-widest">
                Today
              </span>
            </div>

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-4 ${msg.sender === "user" ? "flex-row-reverse" : ""} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center border ${
                    msg.sender === "user"
                      ? "bg-cyan-500/10 border-cyan-500/20"
                      : "bg-slate-800 border-slate-700"
                  }`}
                >
                  {msg.sender === "user" ? (
                    <User className="text-cyan-400" size={18} />
                  ) : (
                    <Bot className="text-cyan-400" size={18} />
                  )}
                </div>
                <div
                  className={`flex flex-col gap-1.5 ${msg.sender === "user" ? "items-end" : ""}`}
                >
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed max-w-[85%] md:max-w-[70%] ${
                      msg.sender === "user"
                        ? "bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-tr-none shadow-lg shadow-cyan-500/10"
                        : "bg-slate-800/80 border border-slate-700/50 text-slate-200 rounded-tl-none backdrop-blur-md"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-600 font-bold px-1 uppercase tracking-tighter">
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-4">
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <Bot className="text-cyan-400 animate-pulse" size={18} />
                </div>
                <div className="p-4 bg-slate-800/50 rounded-2xl flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Bottom Input Area */}
        <div className="p-6 bg-gradient-to-t from-[#020617] to-transparent">
          <div className="max-w-4xl mx-auto">
            {/* Suggestion Chips */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {[
                "What food should I eat?",
                "Is it contagious?",
                "When to see a doctor?",
                "Home remedies?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setInputText(q)}
                  className="bg-slate-800/40 border border-slate-700/50 px-4 py-2 rounded-full text-[11px] text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>

            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-2 flex items-center gap-2 shadow-2xl focus-within:border-cyan-500/50 transition-all">
              <button className="p-3 text-slate-500 hover:text-cyan-400 transition-colors">
                <Paperclip size={20} />
              </button>
              <textarea
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  (e.preventDefault(), sendMessage())
                }
                placeholder="Type your symptoms here..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-white placeholder-slate-600 py-3 resize-none scrollbar-hide"
              />
              <div className="flex items-center gap-1">
                <button className="p-3 text-slate-500 hover:text-cyan-400 transition-colors">
                  <Mic size={20} />
                </button>
                <button
                  onClick={sendMessage}
                  disabled={!inputText.trim() || loading}
                  className="bg-cyan-500 text-slate-900 p-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:grayscale"
                >
                  <Send size={18} strokeWidth={3} />
                </button>
              </div>
            </div>

            {/* Advanced Features Footer Section */}
            <div className="mt-10 border-t border-slate-800/60 pt-8 pb-4 text-center">
              <h4 className="text-cyan-400 font-bold text-xs uppercase tracking-[0.2em] mb-2">
                Advanced Integrated Features
              </h4>
              <p className="text-slate-500 text-[10px] mb-8 max-w-lg mx-auto">
                Beyond the current scope, our vision includes these advanced
                medical capabilities.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <FeatureSmall
                  icon={Mic}
                  label="Voice Input"
                  desc="Speak symptoms"
                />
                <FeatureSmall
                  icon={ImageIcon}
                  label="Image Analysis"
                  desc="Report scanning"
                />
                <FeatureSmall
                  icon={Bell}
                  label="Med Reminders"
                  desc="Smart alerts"
                />
                <FeatureSmall
                  icon={Video}
                  label="Video Consult"
                  desc="Doctor bridge"
                />
                <FeatureSmall
                  icon={BarChart3}
                  label="Health Insights"
                  desc="Trend analysis"
                />
              </div>

              {/* Mandatory Medical Disclaimer added at the very bottom */}
              <p className="text-[10px] text-slate-600 mt-8 max-w-md mx-auto italic leading-relaxed">
                ⚠️ For guidance only. Not a substitute for a doctor. Consult a
                professional in serious cases.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Scrollbar CSS */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

const FeatureSmall = ({ icon: Icon, label, desc }) => (
  <div className="flex flex-col items-center gap-2 group">
    <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 group-hover:border-cyan-500/30 group-hover:bg-cyan-500/5 transition-all duration-300">
      <Icon className="h-5 w-5 text-slate-500 group-hover:text-cyan-400" />
    </div>
    <div className="space-y-0.5">
      <h5 className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
        {label}
      </h5>
      <p className="text-[8px] text-slate-600 leading-none">{desc}</p>
    </div>
  </div>
);
