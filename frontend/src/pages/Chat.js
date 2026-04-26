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
  Paperclip,
  Mic,
  UserCircle,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

export default function Chat() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);
  const navigate = useNavigate();

  // Get user data from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  // Initial greeting with Full Name
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (textOverride = null) => {
    const textToSend = textOverride || inputText;
    if (!textToSend.trim() || loading) return;

    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: "user", text: textToSend, time: now },
    ]);
    setInputText("");
    setLoading(true);

    try {
      const res = await axios.post(
        "https://healthbot-production-3c7d.up.railway.app/api/chat/message",
        { text: textToSend },
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
          text: "⚠️ Connection error. Please ensure the Python backend is live.",
          time: now,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Sidebar Component used for both Desktop and Mobile
  const SidebarContent = ({ isMobile }) => (
    <div className="flex flex-col h-full bg-[#020617] border-r border-slate-800/60 z-50">
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-7 w-7 text-teal-400" strokeWidth={3} />
          <span className="text-2xl font-bold text-white tracking-tight">
            HealthBot
          </span>
        </div>
        {isMobile && (
          <button
            className="text-slate-400 p-1 hover:bg-slate-800 rounded-lg"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        <SidebarBtn icon={MessageSquare} label="New Chat" active />
        <SidebarBtn icon={History} label="Chat History" />
        <SidebarBtn icon={Bookmark} label="Saved Conversations" />
        <SidebarBtn icon={FolderHeart} label="Health Records" />
        <SidebarBtn icon={Bell} label="Reminders" />
        <SidebarBtn icon={User} label="Profile" />
        <SidebarBtn icon={Settings} label="Settings" />
        <button
          onClick={() => {
            localStorage.clear();
            navigate("/login");
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 mt-8 hover:bg-rose-500/10 transition-all font-bold"
        >
          <LogOut size={18} /> <span className="text-sm">Log Out</span>
        </button>
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex font-sans overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* MOBILE SIDEBAR OVERLAY */}
      <div
        className={`fixed inset-0 z-[60] transition-opacity duration-300 lg:hidden ${isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
        <div
          className={`absolute left-0 top-0 bottom-0 w-72 transition-transform duration-300 ease-in-out transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <SidebarContent isMobile />
        </div>
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside className="w-72 hidden lg:flex flex-col z-20">
        <SidebarContent isMobile={false} />
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen relative z-10">
        <header className="h-[72px] shrink-0 border-b border-slate-800/60 flex items-center justify-between px-4 lg:px-8 bg-[#020617]/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {/* Hamburger only shows when sidebar is not permanently visible */}
            <button
              className="lg:hidden p-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>

            {/* Logo and Status */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700">
                <Activity size={22} className="text-teal-400" />
              </div>
              <div>
                <h3 className="text-white text-sm lg:text-base font-bold leading-none">
                  HealthBot
                </h3>
                <p className="text-[10px] text-teal-400 font-bold uppercase mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />{" "}
                  Online
                </p>
              </div>
            </div>
          </div>

          {/* Header Right: Name + Profile Icon */}
          <div className="flex items-center gap-2 lg:gap-3">
            <span className="text-[10px] lg:text-xs font-bold text-slate-100 uppercase tracking-wide truncate max-w-[100px] lg:max-w-none">
              {user.name || "User"}
            </span>
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full border border-slate-700 flex items-center justify-center bg-slate-800/50">
              <UserCircle className="text-slate-500" size={24} />
            </div>
          </div>
        </header>

        {/* MESSAGES VIEW */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 scrollbar-hide no-scrollbar">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-center">
              <span className="text-[9px] lg:text-[10px] bg-slate-800/50 px-3 py-1 rounded-full text-slate-500 font-bold uppercase tracking-widest border border-slate-700/50">
                Today
              </span>
            </div>

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === "user" ? "flex-row-reverse" : ""} animate-in fade-in slide-in-from-bottom-2`}
              >
                <div
                  className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center border ${msg.sender === "user" ? "bg-teal-500/10 border-teal-500/20" : "bg-slate-800 border-slate-700"}`}
                >
                  {msg.sender === "user" ? (
                    <User size={18} className="text-teal-400" />
                  ) : (
                    <Activity size={18} className="text-teal-400" />
                  )}
                </div>
                <div
                  className={`flex flex-col gap-1 ${msg.sender === "user" ? "items-end" : ""}`}
                >
                  <div
                    className={`p-4 rounded-2xl text-xs lg:text-sm leading-relaxed ${msg.sender === "user" ? "bg-teal-600 text-white rounded-tr-none shadow-lg shadow-teal-500/10" : "bg-slate-800/80 border border-slate-700/50 text-slate-200 rounded-tl-none backdrop-blur-md"}`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[8px] text-slate-600 font-bold uppercase tracking-tighter">
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-4">
                <div className="p-4 bg-slate-800/50 rounded-2xl flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* INPUT BAR & SUGGESTIONS */}
        <div className="p-4 lg:p-6 bg-gradient-to-t from-[#020617] via-[#020617] to-transparent">
          <div className="max-w-4xl mx-auto">
            {/* Symptom Chips - Matching requested labels */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {[
                "I have a fever",
                "stomach pain",
                "fatigue",
                "headache",
                "itching",
              ].map((symptom) => (
                <button
                  key={symptom}
                  onClick={() => sendMessage(symptom)}
                  className="bg-slate-800/60 border border-slate-700/50 px-4 py-2 rounded-full text-[10px] lg:text-[11px] text-slate-400 hover:text-teal-400 hover:border-teal-500/30 transition-all flex items-center gap-1.5"
                >
                  {symptom} <ChevronRight size={10} />
                </button>
              ))}
            </div>

            <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-1 lg:p-2 flex items-center gap-1 lg:gap-2 shadow-2xl">
              <button className="p-2.5 text-slate-500 hover:text-teal-400 transition-colors">
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
                placeholder="Describe symptoms..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-xs lg:text-sm text-white py-2 lg:py-3 resize-none scrollbar-hide no-scrollbar"
              />
              <button className="p-2.5 text-slate-500 hover:text-teal-400 transition-colors">
                <Mic size={20} />
              </button>
              <button
                onClick={() => sendMessage()}
                className="bg-teal-500 text-slate-900 p-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-teal-500/20"
              >
                <Send size={20} strokeWidth={3} />
              </button>
            </div>

            {/* BRIGHTER Disclaimer at the very bottom */}
            <div className="flex justify-center mt-6 border-t border-slate-800/60 pt-6">
              <p className="text-[10px] lg:text-[11px] text-slate-100 font-bold text-center italic max-w-md mx-auto leading-relaxed drop-shadow-sm">
                ⚠️ For guidance only. Not a substitute for a doctor. Consult a
                professional in serious cases.
              </p>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}</style>
    </div>
  );
}

const SidebarBtn = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? "bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-sm" : "text-slate-400 hover:bg-slate-800/50"}`}
  >
    <Icon size={18} /> <span className="text-sm font-bold">{label}</span>
  </button>
);
