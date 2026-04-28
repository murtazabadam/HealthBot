import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Activity,
  MessageSquare,
  History,
  User,
  LogOut,
  Send,
  UserCircle,
  Menu,
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Paperclip,
  Mic,
} from "lucide-react";

// --- HELPERS ---
const getFirstName = (name) => (name ? name.trim().split(" ")[0] : "User");

// --- COMPONENTS ---

// MATCHING IMAGE: WhatsApp Image 2026-04-28 at 22.33.51.jpeg
const Home = ({ setPage }) => (
  <div className="min-h-screen bg-[#0B1120] text-white flex flex-col items-center justify-center p-6 text-center relative overflow-hidden font-sans">
    {/* Subtle Background Glow */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

    <div className="relative z-10 flex flex-col items-center max-w-sm">
      <Activity
        className="h-32 w-32 text-teal-400 mb-16 animate-pulse"
        strokeWidth={1.5}
      />
      <h1 className="text-[3.5rem] font-bold mb-6 tracking-tight leading-none">
        HealthBot AI
      </h1>
      <p className="text-slate-400 text-lg mb-16 leading-relaxed">
        Your personal AI health assistant for symptoms, guidance, and wellness
        tracking.
      </p>

      <div className="flex gap-4 w-full">
        <button
          onClick={() => setPage("login")}
          className="flex-1 py-4 bg-teal-400 text-[#0B1120] font-bold rounded-xl text-xl hover:bg-teal-300 transition-all shadow-lg shadow-teal-500/10"
        >
          Log In
        </button>
        <button
          onClick={() => setPage("register")}
          className="flex-1 py-4 border-2 border-teal-400 text-teal-400 font-bold rounded-xl text-xl hover:bg-teal-400/10 transition-all"
        >
          Sign Up
        </button>
      </div>
    </div>
  </div>
);

// MATCHING IMAGE: WhatsApp Image 2026-04-28 at 22.33.53.jpeg
const Login = ({ setPage }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const res = await fetch(
        "https://healthbot-production-3c7d.up.railway.app/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );
      const data = await res.json();

      if (data.requiresVerification) {
        setErrorMessage("Please verify your email. Check your inbox.");
        setLoading(false);
        return;
      }

      if (!res.ok) throw new Error(data.message || "Login failed");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setPage("chat");
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-white flex flex-col items-center relative font-sans">
      <nav className="w-full p-6 flex items-center gap-2 z-50">
        <Activity className="h-7 w-7 text-teal-400" />
        <span className="text-2xl font-bold">HealthBot</span>
      </nav>

      <div className="flex-1 flex items-center justify-center w-full p-6 z-10">
        <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-10 w-full max-w-[440px] shadow-2xl">
          <div className="flex flex-col items-center mb-12">
            <h2 className="text-[2.75rem] font-bold mb-4 tracking-tight">
              Welcome Back
            </h2>
            <p className="text-slate-400 text-center text-base">
              Secure login to your health assistant.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            {errorMessage && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 text-red-400 text-xs rounded-xl text-center font-bold">
                {errorMessage}
              </div>
            )}

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-300 uppercase tracking-widest ml-1">
                Email
              </label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-400">
                  <Mail size={20} />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full bg-[#0B1120] border border-slate-700 rounded-2xl py-4 pl-14 pr-4 text-base focus:border-teal-400 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-300 uppercase tracking-widest ml-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-400">
                  <Lock size={20} />
                </div>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#0B1120] border border-slate-700 rounded-2xl py-4 pl-14 pr-12 text-base focus:border-teal-400 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full py-5 bg-teal-400 text-[#0B1120] font-extrabold rounded-2xl uppercase tracking-[0.2em] text-xl hover:bg-teal-300 transition-all mt-4"
            >
              {loading ? "AUTHENTICATING..." : "LOG IN"}
            </button>
          </form>

          <p className="mt-10 text-center text-base text-slate-400">
            Don't have an account?{" "}
            <button
              onClick={() => setPage("register")}
              className="text-teal-400 font-bold hover:underline ml-1"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// MATCHING IMAGE: WhatsApp Image 2026-04-28 at 22.33.53 (1).jpeg
const Register = ({ setPage }) => {
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    otp: "",
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(
        "https://healthbot-production-3c7d.up.railway.app/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );
      if (res.ok) {
        setPage("login");
      } else {
        const data = await res.json();
        alert(data.message || "Registration failed");
      }
    } catch (err) {
      alert("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-white flex flex-col items-center font-sans">
      <nav className="w-full p-6 flex items-center gap-2 z-50">
        <Activity className="h-7 w-7 text-teal-400" />
        <span className="text-2xl font-bold">HealthBot</span>
      </nav>

      <div className="flex-1 flex items-center justify-center w-full p-6 overflow-y-auto">
        <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-10 w-full max-w-[500px] shadow-2xl my-10">
          <div className="text-center mb-12">
            <h2 className="text-[2.75rem] font-bold mb-4 tracking-tight">
              Create Account
            </h2>
            <p className="text-slate-400 text-base">
              Personalized AI Health Assistant.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest ml-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Enter full name"
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-[#0B1120] border border-slate-700 rounded-2xl py-4 px-6 text-base focus:border-teal-400 outline-none transition-all"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest ml-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full bg-[#0B1120] border border-slate-700 rounded-2xl py-4 px-6 pr-32 text-base focus:border-teal-400 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(true);
                    alert("OTP sent!");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2.5 bg-[#1E293B] border border-slate-700 rounded-xl text-[11px] font-bold text-teal-400 uppercase tracking-tighter hover:bg-slate-700 transition-colors"
                >
                  {otpSent ? "Resend" : "Verify OTP"}
                </button>
              </div>
            </div>

            {otpSent && (
              <div className="space-y-3 animate-in slide-in-from-top-2">
                <label className="text-[11px] font-bold text-teal-400 uppercase tracking-widest ml-1">
                  Verification Code
                </label>
                <input
                  type="text"
                  required
                  maxLength="6"
                  placeholder="0 0 0 0 0 0"
                  onChange={(e) =>
                    setFormData({ ...formData, otp: e.target.value })
                  }
                  className="w-full bg-teal-500/5 border-2 border-teal-500/30 rounded-2xl py-4 px-6 text-center text-3xl font-mono tracking-[0.5em] focus:border-teal-400 outline-none transition-all"
                />
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest ml-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full bg-[#0B1120] border border-slate-700 rounded-2xl py-4 px-6 text-base focus:border-teal-400 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-teal-400 text-[#0B1120] font-extrabold rounded-2xl uppercase tracking-[0.2em] text-xl hover:bg-teal-300 transition-all mt-4"
            >
              {loading ? "CREATING..." : "CREATE ACCOUNT"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const Chat = ({ setPage }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const firstName = getFirstName(user.name);
    setMessages([
      {
        id: "welcome",
        sender: "bot",
        text: `Hello ${firstName}! I am your HealthBot. Please describe your symptoms.`,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
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
          text: "⚠️ Server connection error.",
          time: now,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#020617] text-slate-200 flex overflow-hidden font-sans">
      <aside
        className={`fixed inset-y-0 left-0 z-[60] transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? "translate-x-0 w-72" : "-translate-x-full w-0"}`}
      >
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden -z-10"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        <div className="h-full w-72 bg-[#020617] border-r border-slate-800/60 flex flex-col p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2">
              <Activity className="h-8 w-8 text-teal-400" strokeWidth={3} />
              <span className="text-2xl font-bold tracking-tight">
                HealthBot
              </span>
            </div>
            <X
              className="lg:hidden cursor-pointer text-slate-400"
              onClick={() => setIsSidebarOpen(false)}
            />
          </div>
          <nav className="flex-1 space-y-3">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold">
              <MessageSquare size={20} /> New Chat
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl text-slate-400 hover:bg-slate-800 transition-all font-medium">
              <History size={20} /> History
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl text-slate-400 hover:bg-slate-800 transition-all font-medium">
              <User size={20} /> Profile
            </div>
          </nav>
          <button
            onClick={() => {
              localStorage.clear();
              setPage("login");
            }}
            className="flex items-center gap-3 p-4 rounded-2xl text-rose-400 hover:bg-rose-500/10 mt-auto font-bold"
          >
            <LogOut size={20} /> Log Out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        <header className="sticky top-0 z-50 h-[72px] shrink-0 border-b border-slate-800/60 flex items-center justify-between px-6 lg:px-10 bg-[#020617]/95 backdrop-blur-md">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <Menu
                className="cursor-pointer text-slate-400"
                onClick={() => setIsSidebarOpen(true)}
              />
            )}
            <div className="w-11 h-11 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shadow-inner">
              <Activity size={24} className="text-teal-400" />
            </div>
            <div>
              <h3 className="text-white text-base font-bold leading-none">
                HealthBot
              </h3>
              <p className="text-[10px] text-teal-400 font-bold uppercase mt-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />{" "}
                Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-300 uppercase hidden sm:block tracking-widest">
              {user.name || "User"}
            </span>
            <div className="w-11 h-11 rounded-full border border-slate-700 bg-slate-800/50 flex items-center justify-center">
              <UserCircle size={32} className="text-slate-500" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-8 no-scrollbar">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-center">
              <span className="text-[10px] font-bold bg-slate-800/50 px-4 py-1.5 rounded-full text-slate-500 uppercase tracking-widest border border-slate-800">
                Today
              </span>
            </div>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-4 ${msg.sender === "user" ? "flex-row-reverse" : ""} animate-in fade-in slide-in-from-bottom-2`}
              >
                <div
                  className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center border ${msg.sender === "user" ? "bg-teal-500/10 border-teal-500/20" : "bg-slate-800 border-slate-700"}`}
                >
                  {msg.sender === "user" ? (
                    <User size={20} className="text-teal-400" />
                  ) : (
                    <Activity size={20} className="text-teal-400" />
                  )}
                </div>
                <div
                  className={`max-w-[85%] flex flex-col gap-2 ${msg.sender === "user" ? "items-end" : ""}`}
                >
                  <div
                    className={`p-5 rounded-[1.5rem] text-[15px] leading-relaxed shadow-xl ${msg.sender === "user" ? "bg-teal-600 text-white rounded-tr-none" : "bg-[#111827] border border-slate-800 text-slate-200 rounded-tl-none"}`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 p-5 bg-slate-900 border border-slate-800 rounded-[1.5rem] w-fit">
                <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="p-6 lg:p-10 bg-gradient-to-t from-[#020617] via-[#020617] to-transparent shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {["Headache", "Fever", "Fatigue", "Cough"].map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="bg-slate-900 border border-slate-800 px-6 py-2.5 rounded-full text-xs font-bold text-slate-400 hover:text-teal-400 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="bg-[#111827] border border-slate-800 rounded-[2rem] p-2.5 flex items-center gap-3 shadow-2xl focus-within:border-teal-500/30 transition-all">
              <button className="p-2.5 text-slate-500 hover:text-teal-400">
                <Paperclip size={22} />
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
                className="flex-1 bg-transparent border-none focus:ring-0 text-base text-white py-3 resize-none no-scrollbar"
              />
              <button className="p-2.5 text-slate-500 hover:text-teal-400">
                <Mic size={22} />
              </button>
              <button
                onClick={() => sendMessage()}
                className="bg-teal-400 text-[#020617] p-4 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-teal-500/20"
              >
                <Send size={24} strokeWidth={3} />
              </button>
            </div>
            <p className="text-[11px] text-teal-400 font-bold text-center italic mt-8 drop-shadow-[0_0_8px_rgba(45,212,191,0.2)] uppercase tracking-widest">
              🩺 General guidance only. Consult a professional if serious.
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
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [page, setPage] = useState("home");

  const renderPage = () => {
    switch (page) {
      case "home":
        return <Home setPage={setPage} />;
      case "login":
        return <Login setPage={setPage} />;
      case "register":
        return <Register setPage={setPage} />;
      case "chat":
        return <Chat setPage={setPage} />;
      default:
        return <Home setPage={setPage} />;
    }
  };

  return (
    <div className="font-sans antialiased bg-[#0B1120] selection:bg-teal-500/30 selection:text-teal-200">
      {renderPage()}
    </div>
  );
}
