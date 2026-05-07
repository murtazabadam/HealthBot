import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { useNavigate, Link, MemoryRouter } from "react-router-dom";
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
  UserCircle,
  Menu,
  X,
  Building,
  HeartPulse,
  Mail,
  Store,
  Edit3,
  Save,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Calendar,
  Phone,
  Check,
  MapPin,
  Droplet,
} from "lucide-react";

function ChatDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [page, setPage] = useState("chat");

  const [chatHistoryList, setChatHistoryList] = useState(() =>
    JSON.parse(localStorage.getItem("chatHistory") || "[]"),
  );
  const [appSettings, setAppSettings] = useState(() =>
    JSON.parse(
      localStorage.getItem("appSettings") ||
        '{"darkMode":true,"emailNotif":true,"smsAlerts":false,"saveHistory":true}',
    ),
  );

  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "{}"),
  );

  // Profile States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user.name || "",
    age: user.age || "",
    gender: user.gender || "",
    bloodGroup: user.bloodGroup || "",
    address: user.address || "",
    phoneNumber: user.phoneNumber || "",
  });
  const [toastMessage, setToastMessage] = useState("");

  // Password States
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Real-time password requirements (MATCHED TO PROFILE.JS)
  const passwordRequirements = useMemo(
    () => [
      {
        label: "8+ characters",
        met: (passwordData.newPassword || "").length >= 8,
      },
      {
        label: "Uppercase letter",
        met: /[A-Z]/.test(passwordData.newPassword || ""),
      },
      {
        label: "Lowercase letter",
        met: /[a-z]/.test(passwordData.newPassword || ""),
      },
      {
        label: "Number or special character",
        met: /[0-9!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword || ""),
      },
    ],
    [passwordData.newPassword],
  );

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);

  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
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
  const firstName = formatName(rawFirstName);

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
          text: `Hello ${firstName}! I am your HealthBot. How are you feeling today?`,
          time: now,
        },
      ]);
    }
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  }, [firstName, messages.length]);

  useEffect(() => {
    if (page === "chat") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, page]);

  const handleNavClick = (targetPage) => {
    setPage(targetPage);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const showToast = (msg) => {
    const text = msg?.message || String(msg || "An error occurred");
    setToastMessage(text);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // --- Handlers ---
  const handleProfileChange = (e) =>
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });

  const handleSettingChange = (key) => {
    const newSettings = { ...appSettings, [key]: !appSettings[key] };
    setAppSettings(newSettings);
    localStorage.setItem("appSettings", JSON.stringify(newSettings));
    showToast("Settings Updated!");
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch(
        `https://healthbot-production-3c7d.up.railway.app/api/auth/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profileForm),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update profile");

      const updatedUser = { ...user, ...profileForm };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setIsEditingProfile(false);
      showToast("Profile Updated Successfully!");
    } catch (err) {
      showToast(err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("New passwords do not match!");
      return;
    }
    const allMet = passwordRequirements.every((req) => req.met);
    if (!allMet) {
      showToast("Please fulfill all password requirements.");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch(
        `https://healthbot-production-3c7d.up.railway.app/api/auth/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to change password");
      showToast("Password updated successfully!");
      setShowPasswordForm(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      showToast(err);
    } finally {
      setSavingPassword(false);
    }
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
    setUploadedImage(null);
    setLoading(true);
    try {
      const res = await axios.post(
        "https://healthbot-production-3c7d.up.railway.app/api/chat/message",
        { text: textToSend, image: uploadedImage },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const reply =
        typeof res.data.reply === "string"
          ? res.data.reply
          : JSON.stringify(res.data.reply || "No response received");
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: reply,
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUploadedImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const clearChatHistory = () => {
    if (window.confirm("Are you sure you want to delete history?")) {
      setChatHistoryList([]);
      localStorage.removeItem("chatHistory");
      showToast("History Cleared");
    }
  };

  const SidebarBtn = ({ icon: Icon, label, active, onClick }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium ${active ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"}`}
    >
      <Icon size={18} /> <span className="text-sm">{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 bg-[#020617] text-slate-200 flex font-sans overflow-hidden selection:bg-teal-500/30">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-[100] transform transition-transform duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? "translate-x-0 w-72" : "-translate-x-full lg:w-0"}`}
      >
        <div className="flex flex-col h-full bg-[#020617] border-r border-slate-800/60 shadow-2xl relative z-[100]">
          <div className="p-6 flex items-center justify-between border-b border-slate-800/40 mb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-7 w-7 text-teal-400" strokeWidth={3} />
              <span className="text-2xl font-bold text-white tracking-tight">
                HealthBot
              </span>
            </div>
            <button
              className="lg:hidden text-slate-400"
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
              onClick={() => {
                setPage("chat");
                if (messages.length > 0) setMessages([]);
              }}
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
              icon={Shield}
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
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 mt-8 hover:bg-rose-500/10 font-bold uppercase tracking-wider text-xs"
            >
              <LogOut size={18} /> <span>Log Out</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-[100dvh] min-w-0 relative">
        <header className="fixed top-0 left-0 right-0 lg:static z-[90] h-[72px] border-b border-slate-800/60 flex items-center justify-between px-4 lg:px-8 bg-[#020617]/95 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              className={`p-1.5 text-slate-400 hover:bg-slate-800 rounded-lg ${isSidebarOpen ? "lg:hidden" : "block"}`}
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center border border-teal-500/20">
                <Activity size={20} className="text-teal-400" />
              </div>
              <div>
                <h3 className="text-white text-sm lg:text-base font-bold tracking-tight">
                  HealthBot
                </h3>
                <p className="text-[10px] text-teal-400 font-bold uppercase flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
                  Online
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/profile"
              className="flex flex-col items-end text-right hidden sm:flex"
            >
              <span className="text-sm text-slate-400 hover:text-teal-400 transition-colors font-bold">
                {String(user.name || "User")}
              </span>
              <span className="text-[8px] text-slate-500 font-bold uppercase opacity-60">
                Verified User
              </span>
            </Link>
            <Link
              to="/profile"
              className="w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center bg-slate-800/80 hover:border-teal-500/50 transition-colors"
            >
              <UserCircle className="text-slate-400" size={24} />
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pt-[88px] lg:pt-6 pb-6 px-4 lg:px-6 no-scrollbar relative z-0">
          {page === "chat" && (
            <div className="max-w-4xl mx-auto space-y-6">
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
                      {msg.text && (
                        <div className="whitespace-pre-wrap">
                          {String(msg.text)}
                        </div>
                      )}
                    </div>
                    <span className="text-[8px] text-slate-600 font-bold uppercase tracking-tighter">
                      {String(msg.time)}
                    </span>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="text-teal-400 text-xs animate-pulse">
                  Bot is thinking...
                </div>
              )}
              <div ref={bottomRef} className="h-2" />
            </div>
          )}

          {/* VIEW: PROFILE */}
          {page === "profile" && (
            <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 pb-6">
              <div className="bg-[#111827]/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 sm:p-8 mb-6 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-4 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center shrink-0">
                      <User className="h-8 w-8 text-teal-400" />
                    </div>
                    <div className="overflow-hidden">
                      <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                        {String(user.name || "User Profile")}
                      </h1>
                      <p className="text-slate-400 text-sm truncate">
                        {String(user.email || "")}
                      </p>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto">
                    {!isEditingProfile ? (
                      <button
                        onClick={() => setIsEditingProfile(true)}
                        className="w-full sm:w-auto flex justify-center items-center gap-2 px-4 py-2 bg-teal-500/10 border border-teal-500/30 text-teal-400 rounded-xl text-sm font-bold hover:bg-teal-500/20 transition-all"
                      >
                        <Edit3 className="h-4 w-4" /> Edit Profile
                      </button>
                    ) : (
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={saveProfile}
                          disabled={savingProfile}
                          className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2 bg-teal-500 text-slate-900 rounded-xl text-sm font-bold hover:bg-teal-400 disabled:opacity-50"
                        >
                          <Save className="h-4 w-4" />{" "}
                          {savingProfile ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingProfile(false);
                            setToastMessage("");
                          }}
                          className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-600 transition-all"
                        >
                          <X className="h-4 w-4" /> Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <ProfileField
                    label="Full Name"
                    icon={User}
                    value={profileForm.name}
                    editing={isEditingProfile}
                    name="name"
                    onChange={handleProfileChange}
                  />
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Mail className="h-3 w-3" /> Email Address
                    </label>
                    <p className="text-slate-400 text-sm py-3 px-4 bg-slate-800/30 rounded-xl flex items-center gap-2">
                      {String(user.email || "")}{" "}
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    </p>
                  </div>
                  <ProfileField
                    label="Phone Number"
                    icon={Phone}
                    value={profileForm.phoneNumber}
                    editing={isEditingProfile}
                    name="phoneNumber"
                    onChange={handleProfileChange}
                  />
                  <ProfileField
                    label="Age"
                    icon={Calendar}
                    value={profileForm.age}
                    editing={isEditingProfile}
                    type="number"
                    name="age"
                    onChange={handleProfileChange}
                  />
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <User className="h-3 w-3" /> Gender
                    </label>
                    {isEditingProfile ? (
                      <select
                        name="gender"
                        value={profileForm.gender}
                        onChange={handleProfileChange}
                        className="bg-[#0B1120] border border-slate-700 rounded-xl py-3 px-4 text-sm text-white focus:border-teal-400 outline-none"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    ) : (
                      <p className="text-white text-sm py-3 px-4 bg-slate-800/30 rounded-xl capitalize">
                        {String(user.gender || "—")}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Droplet className="h-3 w-3" /> Blood Group
                    </label>
                    {isEditingProfile ? (
                      <select
                        name="bloodGroup"
                        value={profileForm.bloodGroup}
                        onChange={handleProfileChange}
                        className="bg-[#0B1120] border border-slate-700 rounded-xl py-3 px-4 text-sm text-white focus:border-teal-400 outline-none"
                      >
                        {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(
                          (bg) => (
                            <option key={bg} value={bg}>
                              {bg}
                            </option>
                          ),
                        )}
                      </select>
                    ) : (
                      <p className="text-white text-sm py-3 px-4 bg-slate-800/30 rounded-xl">
                        {String(user.bloodGroup || "—")}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <MapPin className="h-3 w-3" /> Address
                    </label>
                    {isEditingProfile ? (
                      <input
                        name="address"
                        type="text"
                        value={profileForm.address}
                        onChange={handleProfileChange}
                        className="bg-[#0B1120] border border-slate-700 rounded-xl py-3 px-4 text-sm text-white focus:border-teal-400 outline-none"
                      />
                    ) : (
                      <p className="text-white text-sm py-3 px-4 bg-slate-800/30 rounded-xl">
                        {String(user.address || "—")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-[#111827]/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-teal-400" />
                    <h2 className="text-lg font-bold text-white">
                      Security Settings
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="w-full sm:w-auto flex justify-center items-center gap-2 px-4 py-2 bg-slate-700/50 border border-slate-600 text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-700 transition-all"
                  >
                    <Lock className="h-4 w-4" />{" "}
                    {showPasswordForm ? "Cancel" : "Change Password"}
                  </button>
                </div>
                {showPasswordForm && (
                  <form
                    onSubmit={handlePasswordChange}
                    className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2"
                  >
                    <PasswordField
                      label="Current Password"
                      value={passwordData.currentPassword}
                      show={showCurrentPw}
                      onToggle={() => setShowCurrentPw(!showCurrentPw)}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                    />
                    <div className="flex flex-col gap-2">
                      <PasswordField
                        label="New Password"
                        value={passwordData.newPassword}
                        show={showNewPw}
                        onToggle={() => setShowNewPw(!showNewPw)}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                      />
                      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 mt-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                          Password Requirements:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                          {passwordRequirements.map((req, i) => (
                            <div
                              key={i}
                              className={`flex items-center gap-2 transition-colors duration-300 ${req.met ? "text-teal-400" : "text-slate-600"}`}
                            >
                              <div
                                className={`shrink-0 w-4 h-4 rounded-full border flex items-center justify-center ${req.met ? "bg-teal-500/20 border-teal-500/50" : "border-slate-700"}`}
                              >
                                {req.met && <Check size={10} strokeWidth={4} />}
                              </div>
                              <span className="text-[11px] font-medium">
                                {String(req.label)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <PasswordField
                      label="Confirm New Password"
                      value={passwordData.confirmPassword}
                      show={showConfirmPw}
                      onToggle={() => setShowConfirmPw(!showConfirmPw)}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="w-full bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-900 font-bold py-3 rounded-xl transition-all disabled:opacity-50 mt-4 shadow-lg shadow-teal-500/20"
                    >
                      {savingPassword ? "Updating..." : "Update Password"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* VIEW: FIRST AID */}
          {page === "first-aid" && <FirstAidView />}

          {/* VIEW: FACILITIES */}
          {page === "facilities" && (
            <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 pb-6">
              <h2 className="text-3xl font-bold text-white mb-8">
                Nearby Facilities
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FacilityCard
                  title="Hospitals"
                  icon={Building}
                  query="hospitals"
                  userAddress={user.address}
                />
                <FacilityCard
                  title="Clinics"
                  icon={HeartPulse}
                  query="clinics"
                  userAddress={user.address}
                />
                <FacilityCard
                  title="Pharmacies"
                  icon={Store}
                  query="pharmacies"
                  userAddress={user.address}
                />
                <FacilityCard
                  title="Blood Banks"
                  icon={Activity}
                  query="blood banks"
                  userAddress={user.address}
                />
              </div>
            </div>
          )}

          {/* VIEW: HISTORY */}
          {page === "history" && (
            <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 pb-6">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-white">
                  Consultation History
                </h2>
                <button
                  onClick={clearChatHistory}
                  className="text-rose-400 text-xs font-bold uppercase hover:underline"
                >
                  Clear All
                </button>
              </div>
              {chatHistoryList.length === 0 ? (
                <p className="text-slate-500 text-center py-20">
                  No consultations found.
                </p>
              ) : (
                chatHistoryList.map((s) => (
                  <div
                    key={s.id}
                    className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 mb-4"
                  >
                    {s.title}
                  </div>
                ))
              )}
            </div>
          )}

          {/* VIEW: SETTINGS */}
          {page === "settings" && (
            <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 pb-6">
              <h2 className="text-3xl font-bold text-white mb-8">
                App Settings
              </h2>
              <div className="bg-[#111827]/80 border border-slate-800 rounded-3xl p-8 space-y-6">
                <SettingToggle
                  label="Email Notifications"
                  checked={appSettings.emailNotif}
                  onChange={() => handleSettingChange("emailNotif")}
                />
                <SettingToggle
                  label="Save Chat History"
                  checked={appSettings.saveHistory}
                  onChange={() => handleSettingChange("saveHistory")}
                />
              </div>
            </div>
          )}

          {/* VIEW: REMINDERS (Empty Placeholder) */}
          {page === "reminders" && (
            <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 pb-6">
              <h2 className="text-3xl font-bold text-white mb-8">
                Health Reminders
              </h2>
              <div className="bg-slate-900/50 p-12 rounded-3xl border border-slate-800 text-center">
                <Bell className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">
                  No active reminders.
                </p>
              </div>
            </div>
          )}

          {/* VIEW: SAVED ADVICE (Empty Placeholder) */}
          {page === "saved" && (
            <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 pb-6">
              <h2 className="text-3xl font-bold text-white mb-8">
                Saved Advice
              </h2>
              <div className="bg-slate-900/50 p-12 rounded-3xl border border-slate-800 text-center">
                <Bookmark className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">
                  No saved conversations yet.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* INPUT BAR */}
        {page === "chat" && (
          <div className="flex-none p-3 sm:p-4 lg:p-6 bg-[#020617] border-t border-slate-800/40 w-full relative z-10 pb-4 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
            <div className="max-w-4xl mx-auto">
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
                  className="flex-1 bg-transparent border-none text-xs sm:text-sm text-white py-3 resize-none outline-none placeholder-slate-600"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={(!inputText.trim() && !uploadedImage) || loading}
                  className="bg-teal-500 text-slate-900 p-2 sm:p-2.5 rounded-xl transition-all shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-50"
                >
                  <Send size={18} strokeWidth={3} />
                </button>
              </div>
              <p className="mt-3 text-[9px] text-teal-400 font-bold text-center italic opacity-80 leading-relaxed border-t border-slate-800/40 pt-3">
                🩺 For guidance only • Consult a doctor for emergencies
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-teal-500 text-slate-900 px-5 py-3 rounded-2xl font-bold shadow-2xl flex items-center gap-3 z-[200] animate-in slide-in-from-bottom-5">
          <CheckCircle2 size={20} /> {String(toastMessage)}
        </div>
      )}
    </div>
  );
}

// --- Sub-components ---
const FirstAidView = () => {
  const topics = [
    {
      id: "cpr",
      title: "CPR",
      icon: HeartPulse,
      steps: ["Check safety.", "Call 112.", "Push center of chest."],
    },
    {
      id: "burns",
      title: "Burns",
      icon: Activity,
      steps: ["Cool with water.", "Remove jewelry.", "Cover loosely."],
    },
  ];
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h2 className="text-3xl font-bold text-white mb-8">First Aid Guide</h2>
      {topics.map((t) => (
        <div
          key={t.id}
          className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800"
        >
          <h3 className="font-bold flex items-center gap-2 mb-3 text-teal-400">
            <t.icon size={18} /> {t.title}
          </h3>
          {t.steps.map((s, i) => (
            <p key={i} className="text-sm text-slate-400">
              {i + 1}. {s}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
};

const ProfileField = ({
  label,
  icon: Icon,
  value,
  editing,
  onChange,
  type = "text",
  name,
}) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
      <Icon className="h-3 w-3" /> {String(label)}
    </label>
    {editing ? (
      <input
        name={name}
        type={type}
        value={String(value || "")}
        onChange={onChange}
        className="bg-[#0B1120] border border-slate-700 rounded-xl py-3 px-4 text-sm text-white focus:border-teal-400 outline-none transition-all"
      />
    ) : (
      <p className="text-white text-sm py-3 px-4 bg-slate-800/30 rounded-xl">
        {String(value || "—")}
      </p>
    )}
  </div>
);

const PasswordField = ({ label, value, show, onToggle, onChange }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
      {String(label)}
    </label>
    <div className="relative">
      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
      <input
        type={show ? "text" : "password"}
        required
        value={String(value || "")}
        onChange={onChange}
        placeholder={`Enter ${String(label).toLowerCase()}`}
        className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3 pl-12 pr-12 text-sm text-white focus:border-teal-400 outline-none transition-all"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  </div>
);

const FacilityCard = ({ title, icon: Icon, query, userAddress }) => {
  const url = `https://www.google.com/maps/search/${query}+near+${userAddress || "me"}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex items-center gap-4 hover:border-teal-500/30 transition-all"
    >
      <div className="p-3 bg-teal-500/10 rounded-xl text-teal-400">
        <Icon size={24} />
      </div>
      <span className="text-white font-bold">{title}</span>
    </a>
  );
};

const SettingToggle = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between">
    <span className="text-white font-bold">{label}</span>
    <button
      onClick={onChange}
      className={`w-12 h-6 rounded-full transition-colors ${checked ? "bg-teal-500" : "bg-slate-700"}`}
    >
      <div
        className={`w-4 h-4 bg-white rounded-full transition-all mx-1 ${checked ? "translate-x-6" : ""}`}
      />
    </button>
  </div>
);

export default function App() {
  const isPreviewWindow = window.location.hostname.includes("usercontent.goog");
  if (isPreviewWindow)
    return (
      <MemoryRouter>
        <ChatDashboard />
      </MemoryRouter>
    );
  return <ChatDashboard />;
}
