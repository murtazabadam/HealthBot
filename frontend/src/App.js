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
} from "lucide-react";

// --- HELPERS ---
const getFirstName = (name) => (name ? name.trim().split(" ")[0] : "User");

// --- COMPONENTS ---

const Home = ({ setPage }) => (
  <div className="min-h-screen bg-[#0B1120] text-white flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
    <Activity className="h-20 w-20 text-teal-400 mb-8 relative z-10" />
    <h1 className="text-5xl font-bold mb-4 relative z-10">HealthBot AI</h1>
    <p className="text-slate-400 max-w-lg mb-8 leading-relaxed relative z-10">
      Your personal AI health assistant for symptoms, guidance, and wellness
      tracking.
    </p>
    <div className="flex gap-4 relative z-10">
      <button
        onClick={() => setPage("login")}
        className="px-8 py-3 bg-teal-500 text-slate-900 font-bold rounded-xl hover:brightness-110 transition-all"
      >
        Log In
      </button>
      <button
        onClick={() => setPage("register")}
        className="px-8 py-3 border border-teal-500 text-teal-400 font-bold rounded-xl hover:bg-teal-500/10 transition-all"
      >
        Sign Up
      </button>
    </div>
  </div>
);

const Login = ({ setPage }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);
    const email = e.target[0].value;
    const password = e.target[1].value;

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
    <div className="min-h-screen bg-[#0B1120] text-white flex flex-col items-center">
      <nav className="w-full p-6 flex justify-between items-center border-b border-slate-800/50">
        <div
          onClick={() => setPage("home")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Activity className="h-7 w-7 text-teal-400" />
          <span className="text-2xl font-bold">HealthBot</span>
        </div>
      </nav>
      <div className="flex-1 flex items-center justify-center w-full p-4">
        <div className="bg-[#111827]/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-700/50 w-full max-w-md shadow-2xl">
          <h2 className="text-3xl font-bold mb-2 text-center">Welcome Back</h2>
          <p className="text-slate-400 text-center text-sm mb-8">
            Secure login to your health assistant.
          </p>
          <form onSubmit={handleLogin} className="space-y-5">
            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 text-red-400 text-xs rounded-xl text-center font-bold">
                {errorMessage}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 uppercase">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-teal-400 outline-none"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 uppercase">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3 pl-12 pr-12 text-sm focus:border-teal-400 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              disabled={loading}
              className="w-full py-4 bg-teal-500 text-slate-900 font-extrabold rounded-xl uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <button
              onClick={() => setPage("register")}
              className="text-teal-400 font-bold hover:underline"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

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
      const data = await res.json();
      if (res.ok) {
        setPage("login");
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (err) {
      alert("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async () => {
    if (!formData.email) return alert("Enter email first");
    setOtpSent(true);
    alert("Verification code sent to your email!");
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-white flex flex-col items-center">
      <nav className="w-full p-6 flex justify-between items-center border-b border-slate-800/50">
        <div
          onClick={() => setPage("home")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Activity className="h-7 w-7 text-teal-400" />
          <span className="text-2xl font-bold">HealthBot</span>
        </div>
      </nav>
      <div className="flex-1 flex items-center justify-center w-full p-4 overflow-y-auto">
        <div className="bg-[#111827]/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-700/50 w-full max-w-lg shadow-2xl my-10">
          <h2 className="text-3xl font-bold mb-2 text-center">
            Create Account
          </h2>
          <p className="text-slate-400 text-center text-sm mb-8">
            Personalized AI Health Assistant.
          </p>
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 uppercase">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3 px-4 text-sm focus:border-teal-400 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 uppercase">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="flex-1 bg-[#0B1120] border border-slate-700 rounded-xl py-3 px-4 text-sm focus:border-teal-400 outline-none"
                />
                <button
                  type="button"
                  onClick={sendOTP}
                  className="px-4 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-teal-400"
                >
                  Verify OTP
                </button>
              </div>
            </div>
            {otpSent && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-teal-400 uppercase tracking-widest">
                  Enter Code
                </label>
                <input
                  type="text"
                  required
                  maxLength="6"
                  onChange={(e) =>
                    setFormData({ ...formData, otp: e.target.value })
                  }
                  className="w-full bg-[#0B1120] border-2 border-teal-500/20 rounded-xl py-3 px-4 text-center text-xl font-mono focus:border-teal-400 outline-none"
                />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 uppercase">
                Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3 px-4 text-sm focus:border-teal-400 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-teal-500 text-slate-900 font-extrabold rounded-xl uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50"
            >
              {loading ? "Registering..." : "Create Account"}
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
          text: "⚠️ Connection error.",
          time: now,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#020617] text-slate-200 flex overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-[60] transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? "translate-x-0 w-72" : "-translate-x-full w-0"}`}
      >
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden -z-10"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        <div className="h-full w-72 bg-[#020617] border-r border-slate-800/60 flex flex-col p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Activity className="h-7 w-7 text-teal-400" />
              <span className="text-2xl font-bold">HealthBot</span>
            </div>
            <X
              className="lg:hidden cursor-pointer text-slate-400"
              onClick={() => setIsSidebarOpen(false)}
            />
          </div>
          <nav className="flex-1 space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <MessageSquare size={18} /> New Chat
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:bg-slate-800/50">
              <History size={18} /> History
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:bg-slate-800/50">
              <User size={18} /> Profile
            </div>
          </nav>
          <button
            onClick={() => {
              localStorage.clear();
              setPage("login");
            }}
            className="flex items-center gap-3 p-3 rounded-xl text-rose-400 hover:bg-rose-500/10 mt-auto"
          >
            <LogOut size={18} /> Log Out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* FIXED HEADER: Logo and user info stay at top during scroll */}
        <header className="sticky top-0 z-50 h-[72px] shrink-0 border-b border-slate-800/60 flex items-center justify-between px-4 lg:px-8 bg-[#020617]/95 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <Menu
                className="cursor-pointer text-slate-400"
                onClick={() => setIsSidebarOpen(true)}
              />
            )}
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <Activity size={20} className="text-teal-400" />
            </div>
            <div>
              <h3 className="text-white text-sm font-bold leading-none">
                HealthBot
              </h3>
              <p className="text-[10px] text-teal-400 font-bold uppercase mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />{" "}
                Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-300 uppercase hidden sm:block">
              {user.name || "User"}
            </span>
            <UserCircle size={32} className="text-slate-500" />
          </div>
        </header>

        {/* Scrollable chat area */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 no-scrollbar">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-center">
              <span className="text-[9px] bg-slate-800/50 px-3 py-1 rounded-full text-slate-500 font-bold uppercase tracking-widest">
                Today
              </span>
            </div>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}
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
                  className={`max-w-[80%] flex flex-col gap-1 ${msg.sender === "user" ? "items-end" : ""}`}
                >
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.sender === "user" ? "bg-teal-600 text-white rounded-tr-none" : "bg-slate-800/80 border border-slate-700 text-slate-200 rounded-tl-none"}`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[8px] text-slate-600 font-bold uppercase">
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 p-4 bg-slate-800/50 rounded-2xl w-fit">
                <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Footer Input Area */}
        <div className="p-4 lg:p-6 bg-gradient-to-t from-[#020617] via-[#020617] to-transparent shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {["Headache", "Fever", "Fatigue", "Cough"].map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="bg-slate-800/60 border border-slate-700/50 px-4 py-2 rounded-full text-[10px] text-slate-400 hover:text-teal-400 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-2 flex items-center gap-2 shadow-2xl mb-4">
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
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-white py-3 resize-none no-scrollbar"
              />
              <button
                onClick={() => sendMessage()}
                className="bg-teal-500 text-slate-900 p-2.5 rounded-xl"
              >
                <Send size={20} strokeWidth={3} />
              </button>
            </div>
            <p className="text-[10px] text-teal-400 font-bold text-center italic drop-shadow-[0_0_8px_rgba(45,212,191,0.2)]">
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
    <div className="font-sans antialiased bg-[#0B1120]">{renderPage()}</div>
  );
}
