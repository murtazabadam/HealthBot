import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  MessageSquare,
  History,
  Bookmark,
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);
  const navigate = useNavigate();

  // Safely get user data
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const firstName = user.name ? user.name.trim().split(" ")[0] : "User";

  useEffect(() => {
    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          sender: "bot",
          text: `Hello ${firstName}! I am your HealthBot. How are you feeling today? Please describe your symptoms.`,
          time: now,
        },
      ]);
    }

    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  }, [firstName, messages.length]);

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
          text: "⚠️ I'm having trouble connecting to my brain. Please check your internet or try again later.",
          time: now,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#020617] border-r border-slate-800/60 shadow-2xl">
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-7 w-7 text-teal-400" strokeWidth={3} />
          <span className="text-2xl font-bold text-white tracking-tight">
            HealthBot
          </span>
        </div>
        <button
          className="lg:hidden text-slate-400 p-1 hover:bg-slate-800 rounded-lg"
          onClick={() => setIsSidebarOpen(false)}
        >
          <X size={24} />
        </button>
      </div>
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
        <SidebarBtn icon={MessageSquare} label="New Chat" active />
        <SidebarBtn icon={History} label="Chat History" />
        <SidebarBtn icon={Bookmark} label="Saved Conversations" />
        <SidebarBtn icon={Bell} label="Reminders" />
        <SidebarBtn icon={User} label="Profile" />
        <SidebarBtn icon={Settings} label="Settings" />
        <button
          onClick={() => {
            localStorage.clear();
            navigate("/login");
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 mt-8 hover:bg-rose-500/10 transition-all font-bold uppercase tracking-wider text-xs"
        >
          <LogOut size={18} /> <span>Log Out</span>
        </button>
      </nav>
    </div>
  );

  return (
    <div className="h-screen w-full bg-[#020617] text-slate-200 flex font-sans overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-[60] transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? "translate-x-0 w-72" : "-translate-x-full lg:w-0"}`}
      >
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden -z-10"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        <SidebarContent />
      </div>

      <main className="flex-1 flex flex-col h-full relative z-10 overflow-hidden">
        {/* FIXED HEADER - NAME AT TOP RIGHT */}
        <header className="sticky top-0 left-0 right-0 z-50 h-[72px] shrink-0 border-b border-slate-800/60 flex items-center justify-between px-4 lg:px-8 bg-[#020617] backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              className={`p-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-all ${isSidebarOpen ? "lg:hidden" : "block"}`}
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700">
                <Activity size={22} className="text-teal-400" />
              </div>
              <h3 className="text-white text-sm lg:text-lg font-bold leading-none tracking-tight">
                HealthBot
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[11px] lg:text-xs font-bold text-slate-300 uppercase tracking-wide">
                {firstName}
              </span>
              <p className="text-[9px] text-teal-400 font-bold uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />{" "}
                ONLINE
              </p>
            </div>
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full border border-slate-700 flex items-center justify-center bg-slate-800/50">
              <UserCircle className="text-slate-500" size={24} />
            </div>
          </div>
        </header>

        {/* CHAT AREA */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 no-scrollbar bg-gradient-to-b from-transparent to-[#020617]/50">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-center">
              <span className="text-[9px] lg:text-[10px] bg-slate-800/50 px-3 py-1 rounded-full text-slate-500 font-bold uppercase tracking-widest border border-slate-700/50 backdrop-blur-sm">
                Session Started Today
              </span>
            </div>

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === "user" ? "flex-row-reverse" : ""} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center border shadow-sm ${msg.sender === "user" ? "bg-teal-500/10 border-teal-500/20" : "bg-slate-800 border-slate-700"}`}
                >
                  {msg.sender === "user" ? (
                    <User size={18} className="text-teal-400" />
                  ) : (
                    <Activity size={18} className="text-teal-400" />
                  )}
                </div>
                <div
                  className={`flex flex-col gap-1.5 ${msg.sender === "user" ? "items-end" : ""}`}
                >
                  <div
                    className={`p-4 rounded-2xl text-xs lg:text-sm leading-relaxed shadow-lg ${msg.sender === "user" ? "bg-teal-600 text-white rounded-tr-none" : "bg-slate-800/90 border border-slate-700/50 text-slate-200 rounded-tl-none backdrop-blur-md"}`}
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
              <div className="flex gap-3 animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <Activity size={18} className="text-teal-400 opacity-50" />
                </div>
                <div className="bg-slate-800/40 p-4 rounded-2xl rounded-tl-none border border-slate-700/30 flex gap-1 items-center">
                  <span className="w-1 h-1 bg-teal-400 rounded-full animate-bounce" />
                  <span className="w-1 h-1 bg-teal-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1 h-1 bg-teal-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* INPUT AREA */}
        <div className="p-4 lg:p-6 bg-[#020617] shrink-0 border-t border-slate-800/30">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {["Fever", "Headache", "Fatigue", "Cough"].map((symptom) => (
                <button
                  key={symptom}
                  onClick={() => sendMessage(`I have a ${symptom}`)}
                  className="bg-slate-800/40 border border-slate-700/50 px-3 py-1.5 rounded-full text-[10px] text-slate-400 hover:text-teal-400 hover:border-teal-500/30 transition-all flex items-center gap-1 font-bold"
                >
                  {symptom} <ChevronRight size={10} />
                </button>
              ))}
            </div>

            <div className="bg-slate-900/90 border border-slate-700/50 rounded-2xl p-1.5 flex items-center gap-1 shadow-2xl focus-within:border-teal-500/40 transition-all">
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
                placeholder="Describe your health concern..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-xs lg:text-sm text-white py-3 resize-none no-scrollbar"
              />
              <button className="p-2.5 text-slate-500 hover:text-teal-400 transition-colors">
                <Mic size={20} />
              </button>
              <button
                onClick={() => sendMessage()}
                className="bg-teal-500 text-slate-900 p-2.5 rounded-xl transition-all shadow-lg hover:brightness-110 active:scale-95"
              >
                <Send size={20} strokeWidth={3} />
              </button>
            </div>

            <p className="mt-4 text-[9px] lg:text-[10px] text-teal-400 font-bold text-center italic max-w-md mx-auto leading-relaxed drop-shadow-[0_0_8px_rgba(45,212,191,0.2)]">
              🩺 For guidance only • Consult a doctor for emergencies
            </p>
          </div>
        </div>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

const SidebarBtn = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "text-slate-400 hover:bg-slate-800/50"}`}
  >
    <Icon size={18} /> <span className="text-sm font-bold">{label}</span>
  </button>
);
