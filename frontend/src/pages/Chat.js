import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  MessageSquarePlus,
  History,
  FolderHeart,
  User,
  Settings,
  LogOut,
  Send,
  Bot,
  CheckCheck,
  MessageSquare,
  ShieldCheck,
  Mail,
  X,
  Smartphone,
} from "lucide-react";

export default function Chat() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState("chat");
  const [isVerified, setIsVerified] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  // Chat Logic State (Connected to your Backend)
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);
  const navigate = useNavigate();
  const otpRefs = useRef([]);

  // Get User Data & Token from your teammate's Login logic
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  // Welcome Message
  useEffect(() => {
    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setMessages([
      {
        id: "welcome",
        sender: "bot",
        text: `Hello ${user.name ? user.name.split(" ")[0] : "there"}! I'm HealthBot 🤖\nDescribe your symptoms and I'll help analyze them. Example: "I have fever, cough and fatigue"`,
        time: now,
      },
    ]);
  }, [user.name]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Real Backend Connection Logic
  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const userMsg = {
      id: Date.now(),
      sender: "user",
      text: inputText,
      time: now,
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = inputText;
    setInputText("");
    setLoading(true);

    try {
      // Talking to your teammate's Railway Backend
      const res = await axios.post(
        "https://healthbot-production-3c7d.up.railway.app/api/chat/message",
        { text: currentInput },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const botNow = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: res.data.reply,
          time: botNow,
        },
      ]);
    } catch (error) {
      const botErrorNow = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          sender: "bot",
          text: "Sorry, I'm having trouble connecting to my brain. Please try again in a moment.",
          time: botErrorNow,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // OTP Logic
  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;
    let newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    if (element.value !== "" && index < 5) otpRefs.current[index + 1].focus();
  };

  const handleVerifyOtp = () => {
    if (otp.join("").length === 6) {
      setIsVerified(true);
      setShowVerifyModal(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#0B1120] font-sans text-slate-50 flex items-center justify-center p-0 lg:p-8 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* App Shell */}
      <div className="w-full max-w-[1440px] h-screen lg:h-[90vh] bg-[#0f1523]/80 backdrop-blur-2xl lg:border lg:border-teal-500/20 lg:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden relative z-10">
        {/* Navbar */}
        <header className="h-[72px] shrink-0 border-b border-slate-800/60 flex items-center justify-between px-6 lg:px-10 bg-[#0f1523]/50">
          <div className="flex items-center gap-2">
            <Activity className="h-7 w-7 text-teal-400" />
            <span className="text-2xl font-bold tracking-tight text-white">
              HealthBot
            </span>
          </div>

          <div className="flex items-center gap-4">
            {!isVerified && (
              <button
                onClick={() => setShowVerifyModal(true)}
                className="hidden md:flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full text-amber-400 text-xs font-bold animate-pulse hover:bg-amber-500/20 transition-all"
              >
                <ShieldCheck className="h-3.5 w-3.5" /> VERIFY EMAIL
              </button>
            )}
            <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white leading-none">
                  {user.name || "Guest"}
                </p>
                <p className="text-[10px] text-teal-400 font-bold mt-1 tracking-widest uppercase">
                  Patient Account
                </p>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-teal-500/30 bg-slate-800 flex items-center justify-center">
                <User className="h-5 w-5 text-slate-300" />
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-[280px] shrink-0 border-r border-slate-800/60 bg-[#0b1120]/50 hidden lg:flex flex-col">
            <div className="p-6">
              <button
                onClick={() => {
                  setActiveTab("chat");
                  window.location.reload();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-teal-500 text-slate-900 rounded-xl transition-all font-bold text-sm shadow-[0_0_20px_rgba(20,184,166,0.3)]"
              >
                <MessageSquarePlus className="h-4 w-4" /> New Consultation
              </button>
            </div>

            <nav className="px-4 py-2 flex flex-col gap-1 text-sm font-medium text-slate-400">
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "chat" ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "hover:bg-slate-800/50 hover:text-white"}`}
              >
                <MessageSquare className="h-4 w-4" /> AI Chat
              </button>
              <button className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800/50 hover:text-white transition-all">
                <History className="h-4 w-4" /> Chat History
              </button>
              <button className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800/50 hover:text-white transition-all">
                <FolderHeart className="h-4 w-4" /> Medical Records
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "profile" ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "hover:bg-slate-800/50 hover:text-white"}`}
              >
                <User className="h-4 w-4" /> My Profile
              </button>
              <button className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800/50 hover:text-white transition-all">
                <Settings className="h-4 w-4" /> Settings
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-500/10 text-rose-400 transition-all mt-4"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </nav>
          </aside>

          {/* Chat Window */}
          <main className="flex-1 flex flex-col bg-[#0f1523]/30 relative overflow-hidden">
            {activeTab === "chat" ? (
              <>
                <div className="h-20 shrink-0 border-b border-slate-800/60 px-8 flex items-center justify-between bg-[#0b1120]/30 backdrop-blur-md absolute top-0 w-full z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                      <Bot className="h-6 w-6 text-teal-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white leading-tight">
                        HealthBot AI
                      </h2>
                      <p className="text-[10px] text-emerald-500 font-bold mt-1 tracking-wide uppercase">
                        ● System Online
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 md:px-10 pb-6 pt-28 flex flex-col gap-6 scrollbar-hide">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-4 max-w-[85%] md:max-w-[70%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.sender === "bot" ? "bg-teal-500/20 border border-teal-500/30" : "bg-blue-500/20 border border-blue-500/30"}`}
                      >
                        {msg.sender === "bot" ? (
                          <Bot className="h-4 w-4 text-teal-400" />
                        ) : (
                          <User className="h-4 w-4 text-blue-400" />
                        )}
                      </div>
                      <div
                        className={`p-4 text-sm leading-relaxed shadow-lg ${msg.sender === "user" ? "bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-2xl rounded-tr-none" : "bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-2xl rounded-tl-none"}`}
                      >
                        {msg.text}
                        <div
                          className={`text-[9px] mt-2 opacity-50 flex items-center gap-1 ${msg.sender === "user" ? "justify-end" : ""}`}
                        >
                          {msg.time}{" "}
                          {msg.sender === "user" && (
                            <CheckCheck className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-4 max-w-[85%] mr-auto animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shrink-0 mt-1">
                        <Bot className="h-4 w-4 text-teal-400" />
                      </div>
                      <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl rounded-tl-none text-slate-400 text-xs italic">
                        Analyzing symptoms...
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                <div className="p-4 md:p-8 bg-gradient-to-t from-[#0f1523] via-[#0f1523]/95 to-transparent">
                  <div className="max-w-4xl mx-auto flex items-center gap-3 bg-[#111827]/80 backdrop-blur-md border border-slate-700 rounded-2xl p-2 pl-5">
                    <textarea
                      rows={1}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        !e.shiftKey &&
                        (e.preventDefault(), sendMessage())
                      }
                      placeholder="Describe your symptoms... (e.g. I have fever and cough)"
                      className="flex-1 bg-transparent border-none focus:outline-none text-sm text-white placeholder-slate-500 py-3 resize-none scrollbar-hide"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={loading}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${loading ? "bg-slate-700 cursor-not-allowed" : "bg-teal-500 text-slate-900 hover:scale-105 shadow-[0_0_15px_rgba(20,184,166,0.3)]"}`}
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Profile Dashboard */
              <div className="flex-1 overflow-y-auto p-6 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                  <div className="w-32 h-32 rounded-3xl border-2 border-teal-500/30 bg-slate-800 flex items-center justify-center relative shadow-2xl">
                    <User className="h-16 w-16 text-slate-600" />
                    <div
                      className="absolute -bottom-2 -right-2 bg-emerald-500 h-6 w-6 rounded-full border-4 border-[#0b1120]"
                      title="Online"
                    />
                  </div>
                  <div className="text-center md:text-left">
                    <h1 className="text-3xl font-bold text-white mb-2">
                      {user.name || "N/A"}
                    </h1>
                    <p className="text-slate-400 flex items-center justify-center md:justify-start gap-2">
                      <Mail className="h-4 w-4 text-teal-400" />{" "}
                      {user.email || "N/A"}
                    </p>
                    <div className="flex gap-3 mt-4">
                      <span className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-bold tracking-widest uppercase">
                        Verified Account
                      </span>
                      <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold tracking-widest uppercase">
                        Patient
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#111827]/50 border border-slate-800 p-6 rounded-3xl backdrop-blur-md">
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-teal-400" /> Contact
                      Details
                    </h3>
                    <div className="space-y-4 text-sm text-slate-400">
                      <div className="flex justify-between border-b border-slate-800/50 pb-2">
                        <span>Phone</span>
                        <span className="text-white">Not provided</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Region</span>
                        <span className="text-white">Kashmir</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* VERIFICATION MODAL */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#0B1120]/80 backdrop-blur-md"
            onClick={() => setShowVerifyModal(false)}
          />
          <div className="bg-[#111827] border border-slate-700 w-full max-w-md rounded-[2.5rem] p-8 relative z-10 shadow-2xl animate-in zoom-in duration-300">
            <button
              onClick={() => setShowVerifyModal(false)}
              className="absolute top-6 right-6 text-slate-500 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
                <Smartphone className="h-8 w-8 text-amber-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Verify Email
              </h3>
              <p className="text-slate-400 text-sm mb-8">
                Verification code sent to {user.email || "your email"}
              </p>
              <div className="flex gap-2 mb-8">
                {otp.map((data, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    ref={(el) => (otpRefs.current[index] = el)}
                    value={data}
                    onChange={(e) => handleOtpChange(e.target, index)}
                    className="w-12 h-14 bg-[#0B1120] border border-slate-700 rounded-xl text-center text-xl font-bold text-white focus:border-teal-500 focus:outline-none"
                  />
                ))}
              </div>
              <button
                onClick={handleVerifyOtp}
                className="w-full bg-teal-500 text-slate-900 font-bold py-4 rounded-xl shadow-lg hover:bg-teal-400 transition-all"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `,
        }}
      />
    </div>
  );
}
