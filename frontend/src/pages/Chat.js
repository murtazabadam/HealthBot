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
  Clock,
  Plus,
  Trash2,
  MapPin,
  Building,
  HeartPulse,
  LifeBuoy,
  PhoneCall,
  ArrowLeft,
  AlertCircle,
  Flame,
  Wind,
  Droplet,
  Mail,
  Store,
} from "lucide-react";

export default function Chat() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [page, setPage] = useState("chat");

  // Real-time Chat & Settings States
  const [activeSessionId, setActiveSessionId] = useState(Date.now());
  const [chatHistoryList, setChatHistoryList] = useState(() =>
    JSON.parse(localStorage.getItem("chatHistory") || "[]"),
  );
  const [appSettings, setAppSettings] = useState(() =>
    JSON.parse(
      localStorage.getItem("appSettings") ||
        '{"darkMode":true,"emailNotif":true,"smsAlerts":false,"saveHistory":true}',
    ),
  );

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);

  const [reminders, setReminders] = useState([
    { id: 1, name: "Drink Water", time: "Every 2 Hours", active: true },
    { id: 2, name: "Vitamin C Supplement", time: "09:00 AM", active: true },
  ]);

  const handleAddReminder = () => {
    const name = prompt("What is the reminder for? (e.g. Paracetamol)");
    const time = prompt("What time? (e.g. 08:00 AM)");
    if (name && time) {
      setReminders([
        ...reminders,
        { id: Date.now(), name, time, active: true },
      ]);
    }
  };

  const handleDeleteReminder = (id) => {
    setReminders(reminders.filter((r) => r.id !== id));
  };

  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const formatName = (str) => {
    if (!str) return "";
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const rawFullName = user.name || "User";
  const rawFirstName = rawFullName.trim().split(" ")[0];

  const fullName = formatName(rawFullName);
  const firstName = formatName(rawFirstName);

  // Initialize Welcome Message
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const name = user.name ? user.name.split(" ")[0] : "there";
    const hour = new Date().getHours();
    const greeting =
      hour < 12
        ? "Good morning"
        : hour < 17
          ? "Good afternoon"
          : "Good evening";
    setMessages([
      {
        sender: "bot",
        text: `${greeting}, ${name}! 👋 I'm HealthBot, your AI medical assistant.\n\nDescribe your symptoms and I'll analyze them. For example:\n"I have fever, headache and joint pain"\n\nThe more symptoms you mention, the more accurate my diagnosis! 🔍`,
      },
    ]);
  }, []);

  // Auto-Save Chat History System
  useEffect(() => {
    if (appSettings.saveHistory && messages.length > 1) {
      const title =
        messages.find((m) => m.sender === "user")?.text?.substring(0, 30) +
          "..." || "Health Consultation";
      const updatedSession = {
        id: activeSessionId,
        date: new Date().toLocaleDateString(),
        title: title,
        desc: `${messages.length} messages exchanged`,
        messages: messages,
      };

      setChatHistoryList((prev) => {
        const existingIndex = prev.findIndex((s) => s.id === activeSessionId);
        let newHistory;
        if (existingIndex >= 0) {
          newHistory = [...prev];
          newHistory[existingIndex] = updatedSession;
        } else {
          newHistory = [updatedSession, ...prev];
        }
        localStorage.setItem("chatHistory", JSON.stringify(newHistory));
        return newHistory;
      });
    }
  }, [messages, activeSessionId, appSettings.saveHistory]);

  useEffect(() => {
    if (page === "chat") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, page]);

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  if (recognition) {
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText((prev) => (prev ? prev + " " + transcript : transcript));
      setIsRecording(false);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
  }

  const toggleRecording = () => {
    if (!recognition)
      return alert("Speech recognition is not supported in this browser.");
    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
      setIsRecording(true);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUploadedImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleNavClick = (targetPage) => {
    setPage(targetPage);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  // Chat History Interactions
  const handleNewChat = () => {
    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setActiveSessionId(Date.now()); // Generate new ID for the new session
    setMessages([
      {
        id: "welcome",
        sender: "bot",
        text: `Hello ${firstName}! I am your HealthBot. How are you feeling today? Please describe your symptoms.`,
        time: now,
      },
    ]);
    handleNavClick("chat");
  };

  const loadChatSession = (session) => {
    setActiveSessionId(session.id);
    setMessages(session.messages);
    handleNavClick("chat");
  };

  const clearChatHistory = () => {
    if (
      window.confirm(
        "Are you sure you want to permanently delete all chat history?",
      )
    ) {
      setChatHistoryList([]);
      localStorage.removeItem("chatHistory");
      handleNewChat();
    }
  };

  // Settings Interaction
  const handleSettingChange = (key) => {
    const newSettings = { ...appSettings, [key]: !appSettings[key] };
    setAppSettings(newSettings);
    localStorage.setItem("appSettings", JSON.stringify(newSettings));
  };

  const sendMessage = async (textOverride = null) => {
    const textToSend = textOverride || inputText;
    if ((!textToSend.trim() && !uploadedImage) || loading) return;

    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "user",
        text: textToSend,
        image: uploadedImage,
        time: now,
      },
    ]);
    setInputText("");
    const currentImg = uploadedImage;
    setUploadedImage(null);
    setLoading(true);

    try {
      const res = await axios.post(
        "https://healthbot-production-3c7d.up.railway.app/api/chat/message",
        { text: textToSend, image: currentImg },
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
          text: "⚠️ Connection error. Please try again later.",
          time: now,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#020617] border-r border-slate-800/60 shadow-2xl relative z-[100]">
      <div className="p-6 flex items-center justify-between border-b border-slate-800/40 mb-2">
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
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar pb-6">
        <SidebarBtn
          icon={MessageSquare}
          label="New Chat"
          active={page === "chat"}
          onClick={handleNewChat}
        />
        <SidebarBtn
          icon={History}
          label="Chat History"
          active={page === "history"}
          onClick={() => handleNavClick("history")}
        />
        <SidebarBtn
          icon={Bookmark}
          label="Saved Advice"
          active={page === "saved"}
          onClick={() => handleNavClick("saved")}
        />
        <SidebarBtn
          icon={Bell}
          label="Reminders"
          active={page === "reminders"}
          onClick={() => handleNavClick("reminders")}
        />
        <SidebarBtn
          icon={LifeBuoy}
          label="First Aid"
          active={page === "first-aid"}
          onClick={() => handleNavClick("first-aid")}
        />
        <SidebarBtn
          icon={MapPin}
          label="Facilities"
          active={page === "facilities"}
          onClick={() => handleNavClick("facilities")}
        />

        <div className="pt-6 pb-2">
          <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Account
          </p>
        </div>
        <SidebarBtn
          icon={User}
          label="Profile"
          active={page === "profile"}
          onClick={() => handleNavClick("profile")}
        />
        <SidebarBtn
          icon={Settings}
          label="Settings"
          active={page === "settings"}
          onClick={() => handleNavClick("settings")}
        />

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
    <div className="fixed inset-0 bg-[#020617] text-slate-200 flex font-sans overflow-hidden selection:bg-teal-500/30">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-[100] transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isSidebarOpen ? "translate-x-0 w-72" : "-translate-x-full lg:w-0"}`}
      >
        {isSidebarOpen && (
          <div
            className="fixed inset-0 w-[100vw] bg-black/60 backdrop-blur-sm lg:hidden -z-10"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        <SidebarContent />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-[100dvh] min-w-0 relative">
        {/* HEADER */}
        <header className="fixed top-0 left-0 right-0 lg:static z-[90] h-[72px] border-b border-slate-800/60 flex items-center justify-between px-3 sm:px-4 lg:px-8 bg-[#020617]/95 backdrop-blur-md shadow-xl lg:w-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              className={`p-1.5 sm:p-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-all ${isSidebarOpen ? "lg:hidden" : "block"}`}
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-800 flex items-center justify-center border border-teal-500/20 shadow-[0_0_10px_rgba(45,212,191,0.1)]">
                <Activity size={20} className="text-teal-400" />
              </div>
              <div className="flex flex-col justify-center">
                <h3 className="text-white text-sm lg:text-base font-bold tracking-tight leading-tight">
                  HealthBot
                </h3>
                <p className="text-[9px] sm:text-[10px] text-teal-400 font-bold uppercase flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(45,212,191,0.8)]" />
                  Online
                </p>
              </div>
            </div>
          </div>

          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => handleNavClick("profile")}
          >
            <div className="flex flex-col items-end text-right">
              <span className="text-[11px] lg:text-xs font-black text-white tracking-wider max-w-[80px] sm:max-w-[150px] truncate">
                <span className="sm:hidden">{firstName}</span>
                <span className="hidden sm:inline">{fullName}</span>
              </span>
              <span className="text-[8px] text-slate-500 font-bold uppercase opacity-60 hidden sm:block">
                Verified User
              </span>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full border border-slate-700 flex items-center justify-center bg-slate-800/80 shadow-md">
              <UserCircle className="text-slate-400" size={24} />
            </div>
          </div>
        </header>

        {/* --- DYNAMIC VIEW SWITCHER --- */}
        <div className="flex-1 overflow-y-auto pt-[88px] lg:pt-6 pb-6 px-4 lg:px-6 no-scrollbar bg-gradient-to-b from-transparent to-[#020617]/50 relative z-0">
          {/* VIEW: CHAT */}
          {page === "chat" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex justify-center">
                <span className="text-[9px] bg-slate-800/50 px-3 py-1 rounded-full text-slate-500 font-bold uppercase tracking-widest border border-slate-700/50">
                  Session Started Today
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
                    className={`flex flex-col gap-1.5 ${msg.sender === "user" ? "items-end" : ""}`}
                  >
                    <div
                      className={`p-4 rounded-2xl text-xs lg:text-sm leading-relaxed shadow-lg ${msg.sender === "user" ? "bg-teal-600 text-white rounded-tr-none" : "bg-slate-800/90 border border-slate-700/50 text-slate-200 rounded-tl-none backdrop-blur-md"}`}
                    >
                      {msg.image && (
                        <img
                          src={msg.image}
                          alt="Upload"
                          className="max-w-full rounded-lg mb-3 border border-white/10 shadow-lg"
                        />
                      )}
                      {msg.text && (
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                      )}
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
                  <div className="bg-slate-800/40 p-4 rounded-2xl rounded-tl-none border border-slate-700/30 flex gap-1">
                    <span className="w-1 h-1 bg-teal-400 rounded-full animate-bounce" />
                    <span className="w-1 h-1 bg-teal-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1 h-1 bg-teal-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} className="h-2" />
            </div>
          )}

          {/* VIEW: FIRST AID */}
          {page === "first-aid" && <FirstAidView />}

          {/* VIEW: PROFILE */}
          {page === "profile" && (
            <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-6">
              <h2 className="text-3xl font-bold text-white mb-8">
                Patient Profile
              </h2>
              <div className="bg-[#111827]/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
                <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-8 border-b border-slate-700/50 text-center sm:text-left">
                  <div className="w-24 h-24 rounded-full bg-teal-500/10 border-2 border-teal-500/50 flex items-center justify-center text-teal-400 shrink-0">
                    <User size={40} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white tracking-tight">
                      {fullName}
                    </h3>
                    <p className="text-slate-400 font-medium mt-1 flex items-center justify-center sm:justify-start gap-2">
                      <Mail size={14} /> {user.email || "No email linked"}
                    </p>
                    <span className="inline-block mt-3 px-3 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-bold uppercase tracking-widest rounded-full">
                      Active Member
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <ProfileDetail
                    label="Age"
                    value={user.age ? `${user.age} years old` : "Not specified"}
                  />
                  <ProfileDetail
                    label="Gender"
                    value={user.gender || "Not specified"}
                    className="capitalize"
                  />
                  <ProfileDetail
                    label="Blood Group"
                    value={user.bloodGroup || "Not specified"}
                  />
                  <ProfileDetail
                    label="Phone Number"
                    value={user.phoneNumber || "Not specified"}
                  />
                  <ProfileDetail
                    label="Home Address"
                    value={user.address || "Not specified"}
                    className="sm:col-span-2"
                  />
                </div>
              </div>
            </div>
          )}

          {/* VIEW: CHAT HISTORY (NOW FULLY FUNCTIONAL) */}
          {page === "history" && (
            <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-6">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-white">
                  Consultation History
                </h2>
                {chatHistoryList.length > 0 && (
                  <button
                    onClick={clearChatHistory}
                    className="text-rose-400 hover:text-rose-300 text-sm font-bold flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={16} /> Clear All
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {chatHistoryList.length === 0 ? (
                  <div className="text-center py-10 bg-[#111827]/80 rounded-3xl border border-slate-700/50 shadow-lg">
                    <History className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">
                      No previous consultations found.
                    </p>
                  </div>
                ) : (
                  chatHistoryList.map((session) => (
                    <HistoryCard
                      key={session.id}
                      date={session.date}
                      title={session.title}
                      desc={session.desc}
                      onClick={() => loadChatSession(session)}
                    />
                  ))
                )}
                {chatHistoryList.length > 0 && (
                  <div className="text-center pt-8">
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">
                      End of history
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: SAVED ADVICE */}
          {page === "saved" && (
            <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-6">
              <h2 className="text-3xl font-bold text-white mb-8">
                Saved Prescriptions & Advice
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <SavedCard
                  title="Cold Remedies"
                  date="Oct 24, 2026"
                  icon={Activity}
                />
                <SavedCard
                  title="Hydration Schedule"
                  date="Oct 20, 2026"
                  icon={Clock}
                />
                <SavedCard
                  title="Emergency Contacts"
                  date="Pinned"
                  icon={Bell}
                />
              </div>
            </div>
          )}

          {/* VIEW: REMINDERS */}
          {page === "reminders" && (
            <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-6">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-white">Reminders</h2>
                <button
                  onClick={handleAddReminder}
                  className="bg-teal-500 text-slate-900 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:brightness-110 transition-all text-sm"
                >
                  <Plus size={16} /> Add New
                </button>
              </div>
              <div className="grid gap-4">
                {reminders.map((r) => (
                  <div
                    key={r.id}
                    className="bg-[#111827]/80 border border-slate-700/50 p-6 rounded-2xl flex items-center justify-between backdrop-blur-md hover:border-teal-500/30 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-teal-500/10 rounded-xl">
                        <Clock className="h-6 w-6 text-teal-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-lg">
                          {r.name}
                        </h4>
                        <p className="text-slate-400 text-sm">{r.time}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteReminder(r.id)}
                      className="p-2 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: FACILITIES (NOW INCLUDES MEDICAL STORES) */}
          {page === "facilities" && (
            <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-6">
              <h2 className="text-3xl font-bold text-white mb-8">
                Nearby Facilities
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FacilityCard
                  title="Hospitals"
                  desc="Find general and specialized hospitals near your location."
                  icon={Building}
                  query="hospitals"
                  userAddress={user.address}
                />
                <FacilityCard
                  title="Health Centers"
                  desc="Locate community health centers and primary care facilities."
                  icon={Activity}
                  query="health centers"
                  userAddress={user.address}
                />
                <FacilityCard
                  title="Clinics"
                  desc="Discover nearby walk-in clinics and outpatient care."
                  icon={HeartPulse}
                  query="clinics"
                  userAddress={user.address}
                />
                <FacilityCard
                  title="Medical Stores"
                  desc="Find local pharmacies and 24/7 medical stores."
                  icon={Store}
                  query="pharmacies medical stores"
                  userAddress={user.address}
                />
              </div>
            </div>
          )}

          {/* VIEW: SETTINGS (NOW FULLY FUNCTIONAL) */}
          {page === "settings" && (
            <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-6">
              <h2 className="text-3xl font-bold text-white mb-8">
                App Settings
              </h2>
              <div className="bg-[#111827]/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl space-y-8">
                <SettingToggle
                  label="Dark Mode"
                  desc="Enable sleek dark theme across the app."
                  checked={appSettings.darkMode}
                  onChange={() => handleSettingChange("darkMode")}
                />
                <div className="h-[1px] w-full bg-slate-800" />
                <SettingToggle
                  label="Email Notifications"
                  desc="Receive weekly health summaries."
                  checked={appSettings.emailNotif}
                  onChange={() => handleSettingChange("emailNotif")}
                />
                <div className="h-[1px] w-full bg-slate-800" />
                <SettingToggle
                  label="SMS Alerts"
                  desc="Get urgent reminders via text."
                  checked={appSettings.smsAlerts}
                  onChange={() => handleSettingChange("smsAlerts")}
                />
                <div className="h-[1px] w-full bg-slate-800" />
                <SettingToggle
                  label="Save Chat History"
                  desc="Securely save conversations to your device."
                  checked={appSettings.saveHistory}
                  onChange={() => handleSettingChange("saveHistory")}
                />
              </div>
            </div>
          )}
        </div>

        {/* --- INPUT BAR --- */}
        {page === "chat" && (
          <div className="flex-none p-3 sm:p-4 lg:p-6 bg-[#020617] border-t border-slate-800/40 w-full relative z-10 pb-4 sm:pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
            <div className="max-w-4xl mx-auto">
              <div className="flex overflow-x-auto gap-2 mb-3 no-scrollbar pb-1">
                {["Fever", "Headache", "Fatigue", "Cough"].map((symptom) => (
                  <button
                    key={symptom}
                    onClick={() => sendMessage(`I have a ${symptom}`)}
                    className="whitespace-nowrap bg-slate-800/40 border border-slate-700/50 px-3 py-1.5 rounded-full text-[10px] text-slate-400 hover:text-teal-400 hover:border-teal-500/30 transition-all flex items-center gap-1 font-bold"
                  >
                    {symptom} <ChevronRight size={10} />
                  </button>
                ))}
              </div>

              {uploadedImage && (
                <div className="mb-3 flex items-center gap-3 bg-slate-800 p-2 rounded-xl border border-slate-700 animate-in slide-in-from-bottom-2">
                  <img
                    src={uploadedImage}
                    alt="Preview"
                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover"
                  />
                  <span className="text-xs text-slate-300 flex-1 truncate font-medium">
                    Image attached
                  </span>
                  <button
                    onClick={() => setUploadedImage(null)}
                    className="p-1 hover:bg-slate-700 rounded-lg text-rose-400"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}

              <div className="bg-slate-900/90 border border-slate-700/50 rounded-2xl p-1.5 flex items-center gap-1 shadow-2xl focus-within:border-teal-500/40 transition-all">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                  accept="image/*"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-slate-500 hover:text-teal-400 transition-colors"
                >
                  <Paperclip size={18} />
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
                  className="flex-1 bg-transparent border-none focus:ring-0 text-xs sm:text-sm text-white py-3 resize-none no-scrollbar placeholder-slate-600"
                />
                <button
                  onClick={toggleRecording}
                  className={`p-2 transition-colors ${isRecording ? "text-rose-500 animate-pulse" : "text-slate-500 hover:text-teal-400"}`}
                >
                  <Mic size={18} />
                </button>
                <button
                  onClick={() => sendMessage()}
                  disabled={(!inputText.trim() && !uploadedImage) || loading}
                  className="bg-teal-500 text-slate-900 p-2 sm:p-2.5 rounded-xl transition-all shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-50"
                >
                  <Send size={18} strokeWidth={3} />
                </button>
              </div>

              <p className="mt-3 text-[9px] lg:text-[10px] text-teal-400 font-bold text-center italic opacity-80 leading-relaxed border-t border-slate-800/40 pt-3">
                🩺 For guidance only • Consult a doctor for emergencies
              </p>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

// --- First Aid Component ---
const FirstAidView = () => {
  const [selected, setSelected] = useState(null);

  const topics = [
    {
      id: "cpr",
      title: "CPR (Adult)",
      icon: HeartPulse,
      themeClasses: {
        bg: "bg-rose-500/10",
        border: "border-rose-500/30",
        iconBg: "bg-rose-500/20",
        text: "text-rose-400",
      },
      short: "Cardiopulmonary Resuscitation",
      steps: [
        "Check the scene for safety, then check the person for responsiveness.",
        "Call emergency services (e.g., 911 or 112) immediately.",
        "Place the heel of your hand on the center of the person's chest.",
        "Place your other hand on top and interlock your fingers.",
        "Push hard and fast (at least 2 inches deep, 100-120 compressions per minute).",
        "Continue until help arrives or the person starts breathing.",
      ],
    },
    {
      id: "choking",
      title: "Choking",
      icon: Wind,
      themeClasses: {
        bg: "bg-blue-500/10",
        border: "border-blue-500/30",
        iconBg: "bg-blue-500/20",
        text: "text-blue-400",
      },
      short: "Heimlich Maneuver for blocked airway",
      steps: [
        "Ask the person if they are choking. If they cannot cough or speak, take action.",
        "Stand behind the person and wrap your arms around their waist.",
        "Make a fist with one hand and place it just above their navel.",
        "Grab your fist with your other hand.",
        "Give 5 quick, upward thrusts into the stomach.",
        "Repeat thrusts until the object is expelled and they can breathe.",
      ],
    },
    {
      id: "bleeding",
      title: "Severe Bleeding",
      icon: Droplet,
      themeClasses: {
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        iconBg: "bg-red-500/20",
        text: "text-red-400",
      },
      short: "Stopping heavy blood loss",
      steps: [
        "Ensure safety and call emergency services immediately.",
        "Apply firm, direct pressure to the wound using a clean cloth or bandage.",
        "Maintain continuous pressure for at least 10 minutes without lifting to check.",
        "If blood soaks through, add more cloth on top—DO NOT remove the original layer.",
        "If possible, elevate the injured area above the heart.",
      ],
    },
    {
      id: "burns",
      title: "Burns",
      icon: Flame,
      themeClasses: {
        bg: "bg-orange-500/10",
        border: "border-orange-500/30",
        iconBg: "bg-orange-500/20",
        text: "text-orange-400",
      },
      short: "Thermal burns from heat or fire",
      steps: [
        "Stop the burning process and ensure safety.",
        "Cool the burn under cool (not ice-cold) running water for 10-15 minutes.",
        "Remove rings or tight items from the burned area before it swells.",
        "Do NOT break blisters or apply ointments, butter, or ice.",
        "Cover the burn loosely with a sterile, non-fluffy bandage or clean cloth.",
      ],
    },
  ];

  if (selected) {
    return (
      <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-right-4 duration-500 pb-6">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-slate-400 hover:text-teal-400 mb-6 transition-colors font-medium"
        >
          <ArrowLeft size={18} /> Back to First Aid Guide
        </button>
        <div
          className={`${selected.themeClasses.bg} border ${selected.themeClasses.border} rounded-3xl p-6 sm:p-8 backdrop-blur-md`}
        >
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-700/50">
            <div
              className={`p-4 ${selected.themeClasses.iconBg} rounded-2xl ${selected.themeClasses.text}`}
            >
              <selected.icon size={32} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                {selected.title}
              </h2>
              <p className="text-sm sm:text-base text-slate-400">
                {selected.short}
              </p>
            </div>
          </div>
          <div className="space-y-4 sm:space-y-6">
            {selected.steps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 bg-[#111827]/80 p-4 sm:p-5 rounded-2xl border border-slate-700/50 shadow-lg"
              >
                <div
                  className={`w-8 h-8 shrink-0 rounded-full ${selected.themeClasses.iconBg} ${selected.themeClasses.text} flex items-center justify-center font-black text-sm`}
                >
                  {idx + 1}
                </div>
                <p className="text-slate-200 leading-relaxed font-medium pt-1 text-sm sm:text-base">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">
            First Aid Guide
          </h2>
          <p className="text-slate-400">Emergency step-by-step instructions.</p>
        </div>
        <a
          href="tel:112"
          className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-500/20 active:scale-95"
        >
          <PhoneCall size={20} /> Emergency SOS
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {topics.map((topic) => (
          <div
            key={topic.id}
            onClick={() => setSelected(topic)}
            className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-6 hover:border-teal-500/30 hover:bg-slate-800/80 transition-all cursor-pointer group backdrop-blur-md shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-4 ${topic.themeClasses.iconBg} rounded-2xl ${topic.themeClasses.text} group-hover:scale-110 transition-transform`}
              >
                <topic.icon size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-teal-400 transition-colors">
                  {topic.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {topic.short}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex gap-4 backdrop-blur-md">
        <AlertCircle className="text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-amber-400 font-bold mb-1">Medical Disclaimer</h4>
          <p className="text-amber-400/80 text-xs sm:text-sm leading-relaxed">
            This guide provides basic first aid information for emergencies. It
            is not a substitute for professional medical training or immediate
            emergency services. Always call for professional help first in
            life-threatening situations.
          </p>
        </div>
      </div>
    </div>
  );
};

// --- Helper Components ---

const SidebarBtn = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium ${active ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"}`}
  >
    <Icon size={18} /> <span className="text-sm">{label}</span>
  </button>
);

const ProfileDetail = ({ label, value, className = "" }) => (
  <div
    className={`bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 hover:border-teal-500/30 transition-colors ${className}`}
  >
    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5">
      {label}
    </p>
    <p className="text-base text-white font-semibold">{value}</p>
  </div>
);

const HistoryCard = ({ date, title, desc, onClick }) => (
  <div
    onClick={onClick}
    className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/80 hover:border-teal-500/30 transition-all cursor-pointer flex items-center justify-between group backdrop-blur-md shadow-sm"
  >
    <div>
      <h4 className="text-white font-bold text-lg mb-1 group-hover:text-teal-400 transition-colors">
        {title}
      </h4>
      <p className="text-slate-400 text-sm mb-2">{desc}</p>
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
        {date}
      </span>
    </div>
    <ChevronRight className="text-slate-600 group-hover:text-teal-400 transition-colors" />
  </div>
);

const SavedCard = ({ title, date, icon: Icon }) => (
  <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-6 hover:border-teal-500/30 transition-all cursor-pointer flex items-start gap-4 backdrop-blur-md group">
    <div className="p-3 bg-teal-500/10 rounded-xl text-teal-400 group-hover:scale-110 transition-transform">
      <Icon size={24} />
    </div>
    <div>
      <h4 className="text-white font-bold text-lg mb-1">{title}</h4>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
        {date}
      </p>
    </div>
  </div>
);

const FacilityCard = ({ title, desc, icon: Icon, query, userAddress }) => {
  const location = userAddress ? `near ${userAddress}` : "near me";
  const mapUrl = `https://www.google.com/maps/search/${encodeURIComponent(query + " " + location)}`;

  return (
    <a
      href={mapUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-6 hover:border-teal-500/30 hover:-translate-y-1 transition-all flex flex-col items-start gap-4 backdrop-blur-md group shadow-lg"
    >
      <div className="p-3 bg-teal-500/10 rounded-xl text-teal-400 group-hover:scale-110 transition-transform">
        <Icon size={28} />
      </div>
      <div className="flex-1">
        <h4 className="text-white font-bold text-xl mb-2">{title}</h4>
        <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
      </div>
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-teal-400 mt-2 opacity-80 group-hover:opacity-100 transition-opacity">
        Open Map <ChevronRight size={12} />
      </div>
    </a>
  );
};

const SettingToggle = ({ label, desc, checked, onChange }) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <span className="text-white font-bold text-lg block mb-1">{label}</span>
        <span className="text-slate-400 text-sm">{desc}</span>
      </div>
      <button
        onClick={onChange}
        className={`w-14 h-7 rounded-full transition-colors relative shadow-inner flex-shrink-0 ${checked ? "bg-teal-500" : "bg-slate-700"}`}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-md ${checked ? "left-8" : "left-1"}`}
        />
      </button>
    </div>
  );
};
