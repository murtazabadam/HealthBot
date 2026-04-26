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

  // Initial greeting with Full Name - No other chips or suggestions
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
          text: "⚠️ Could not reach the ML service. Please ensure the backend is live.",
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

      {/* Sidebar - Matches 2nd Photo exactly */}
      <aside className="w-72 border-r border-slate-800/60 bg-[#020617]/60 backdrop-blur-xl flex flex-col hidden lg:flex z-20">
        <div className="p-6 flex items-center gap-2 mb-4">
          <Activity className="h-7 w-7 text-cyan-400" strokeWidth={3} />
          <span className="text-2xl font-bold text-white tracking-tight">
            HealthBot
          </span>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <SidebarBtn
            icon={MessageSquare}
            label="New Chat"
            active={activeTab === "chat"}
            onClick={() => setActiveTab("chat")}
          />
          <SidebarBtn icon={History} label="Chat History" />
          <SidebarBtn icon={Bookmark} label="Saved Conversations" />
          <SidebarBtn icon={FolderHeart} label="Health Records" />
          <SidebarBtn icon={Bell} label="Reminders" />
          <SidebarBtn
            icon={User}
            label="Profile"
            active={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
          />
          <SidebarBtn icon={Settings} label="Settings" />
          <button
            onClick={() => {
              localStorage.clear();
              navigate("/login");
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 mt-8 hover:bg-rose-500/10 transition-all"
          >
            <LogOut size={18} />{" "}
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </nav>
        <div className="p-6 border-t border-slate-800/60">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              Recent Chats
            </h4>
            <button className="text-[10px] text-cyan-400">View all</button>
          </div>
          <div className="space-y-3">
            {["Fever and cough", "Headache relief", "Stomach pain"].map(
              (c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare size={12} /> {c}
                  </div>
                  <span>{6 + i}:19 PM</span>
                </div>
              ),
            )}
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col h-screen relative z-10">
        <header className="h-[72px] shrink-0 border-b border-slate-800/60 flex items-center justify-between px-8 bg-[#020617]/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <Bot size={22} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="text-white font-bold leading-none">HealthBot</h3>
              <p className="text-[10px] text-cyan-400 font-bold uppercase mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />{" "}
                Online
              </p>
            </div>
          </div>
          <UserCircle className="text-slate-500" size={32} />
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-8 scrollbar-hide">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-center">
              <span className="text-[10px] bg-slate-800/50 px-3 py-1 rounded-full text-slate-500 font-bold uppercase tracking-widest">
                Today
              </span>
            </div>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-4 ${msg.sender === "user" ? "flex-row-reverse" : ""} animate-in fade-in slide-in-from-bottom-2`}
              >
                <div
                  className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center border ${msg.sender === "user" ? "bg-cyan-500/10 border-cyan-500/20" : "bg-slate-800 border-slate-700"}`}
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
                    className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.sender === "user" ? "bg-cyan-600 text-white rounded-tr-none" : "bg-slate-800/80 border border-slate-700/50 text-slate-200 rounded-tl-none"}`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-600 font-bold uppercase">
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

        {/* Input & Features - No suggestions */}
        <div className="p-6 bg-gradient-to-t from-[#020617] to-transparent">
          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-2 flex items-center gap-2 shadow-2xl mb-8">
              <button className="p-3 text-slate-500 hover:text-cyan-400">
                <Paperclip size={20} />
              </button>
              <textarea
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Describe your symptoms in detail..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-white py-3 resize-none scrollbar-hide"
              />
              <button className="p-3 text-slate-500 hover:text-cyan-400">
                <Mic size={20} />
              </button>
              <button
                onClick={sendMessage}
                className="bg-cyan-500 text-slate-900 p-2.5 rounded-xl transition-all"
              >
                <Send size={18} strokeWidth={3} />
              </button>
            </div>

            {/* Features Row - Exactly from Photo 2 bottom */}
            <div className="mt-10 border-t border-slate-800/60 pt-8">
              <div className="flex flex-col items-center mb-8">
                <h4 className="text-cyan-400 font-bold text-xs uppercase tracking-[0.2em] mb-2">
                  These are more features we couldn't add
                </h4>
                <p className="text-slate-500 text-[10px] text-center max-w-lg">
                  Due to time constraints and project scope, we couldn't
                  implement the following advanced features.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <Feature
                  icon={Mic}
                  label="Voice Input"
                  desc="Speak your symptoms using voice"
                />
                <Feature
                  icon={ImageIcon}
                  label="Image Analysis"
                  desc="Upload reports for AI analysis"
                />
                <Feature
                  icon={Bell}
                  label="Medicine Reminder"
                  desc="Smart reminders for medicines"
                />
                <Feature
                  icon={Video}
                  label="Video Consultation"
                  desc="Connect with doctors via video"
                />
                <Feature
                  icon={BarChart3}
                  label="Health Insights"
                  desc="Personalized insights and trends"
                />
              </div>
              <p className="text-[9px] text-slate-600 mt-8 text-center italic">
                ⚠️ For guidance only. Not a substitute for a doctor. Consult a
                professional in serious cases.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const SidebarBtn = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-slate-400 hover:bg-slate-800/50"}`}
  >
    <Icon size={18} /> <span className="text-sm font-medium">{label}</span>
  </button>
);

const Feature = ({ icon: Icon, label, desc }) => (
  <div className="flex flex-col items-center gap-2 text-center group">
    <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
      <Icon size={20} className="text-slate-500 group-hover:text-cyan-400" />
    </div>
    <div className="space-y-0.5 px-2">
      <h5 className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
        {label}
      </h5>
      <p className="text-[8px] text-slate-600 leading-tight">{desc}</p>
    </div>
  </div>
);
