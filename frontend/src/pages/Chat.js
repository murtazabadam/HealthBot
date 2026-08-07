import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { useNavigate, MemoryRouter } from "react-router-dom";
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
  CalendarDays,
  Volume2,
  AlertTriangle,
  Pause,
  Mail,
} from "lucide-react";

function SymptomConfirmationCard({
  msg,
  options,
  isDark,
  onRemove,
  onAdd,
  onConfirm,
}) {
  const [search, setSearch] = useState("");
  const suggestions =
    search.trim().length > 0
      ? options
          .filter(
            (o) =>
              o.label.toLowerCase().includes(search.toLowerCase()) &&
              !msg.detectedSymptoms.some((s) => s.id === o.id),
          )
          .slice(0, 6)
      : [];

  return (
    <div
      className={`p-4 rounded-2xl text-xs lg:text-sm shadow-lg w-full max-w-md ${isDark ? "bg-slate-800/90 border border-slate-700/50 text-slate-200" : "bg-slate-50 border border-slate-200 text-slate-800"}`}
    >
      <p className="font-semibold mb-3">We detected:</p>

      {msg.detectedSymptoms.length === 0 && (
        <p className="text-slate-500 italic mb-3">
          No symptoms recognised yet — add one below.
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        {msg.detectedSymptoms.map((s) => (
          <span
            key={s.id}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${isDark ? "bg-teal-500/15 text-teal-300 border border-teal-500/30" : "bg-teal-50 text-teal-700 border border-teal-200"}`}
          >
            {s.label}
            {!msg.resolved && (
              <button
                onClick={() => onRemove(msg.id, s.id)}
                className="hover:text-rose-400"
                aria-label={`Remove ${s.label}`}
              >
                <X size={12} />
              </button>
            )}
          </span>
        ))}
      </div>

      {!msg.resolved && (
        <>
          <div className="relative mb-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Add another symptom..."
              className={`w-full text-xs px-3 py-2 rounded-lg border outline-none ${isDark ? "bg-[#0B1120] border-slate-700 text-white placeholder-slate-500" : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"}`}
            />
            {suggestions.length > 0 && (
              <div
                className={`absolute z-10 mt-1 w-full rounded-lg border shadow-lg overflow-hidden ${isDark ? "bg-[#0B1120] border-slate-700" : "bg-white border-slate-200"}`}
              >
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onAdd(msg.id, s);
                      setSearch("");
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-teal-500/10 flex items-center gap-2`}
                  >
                    <Plus size={12} className="text-teal-500" /> {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onConfirm(msg)}
            disabled={msg.detectedSymptoms.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 font-bold py-2 rounded-xl transition-all text-xs"
          >
            <CheckCircle2 size={16} /> Confirm & Analyze
          </button>
        </>
      )}

      {msg.resolved && (
        <p className="text-teal-500 text-xs font-medium flex items-center gap-1.5">
          <CheckCircle2 size={14} /> Confirmed — analyzing...
        </p>
      )}
    </div>
  );
}

const BmiCalculatorView = ({ isDark, onBack }) => {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [unit, setUnit] = useState("metric");
  const [result, setResult] = useState(null);

  const calculateBMI = () => {
    const w = parseFloat(weight);
    const hStr = height.toString();
    if (!w || !hStr || w <= 0) return;

    let bmi = 0;
    if (unit === "metric") {
      const h = parseFloat(hStr);
      if (h <= 0) return;
      const heightM = h < 3 ? h : h / 100;
      bmi = w / (heightM * heightM);
    } else {
      let totalInches = 0;
      if (hStr.includes(".")) {
        const [feet, inches] = hStr.split(".");
        totalInches = parseInt(feet || 0) * 12 + parseInt(inches || 0);
      } else {
        const rawH = parseFloat(hStr);
        totalInches = rawH < 10 ? rawH * 12 : rawH;
      }
      if (totalInches <= 0) return;
      bmi = (w / (totalInches * totalInches)) * 703;
    }

    let category = "";
    let color = "";
    let indicatorColor = "";
    let advice = [];

    if (bmi < 18.5) {
      category = "Underweight";
      color = "text-blue-400";
      indicatorColor = "bg-blue-400";
      advice = [
        "Focus on nutrient-dense foods like nuts, avocados, and healthy proteins.",
        "Incorporate strength training to safely build muscle mass.",
        "Consider consulting a dietitian for a healthy weight-gain plan.",
      ];
    } else if (bmi < 25.0) {
      category = "Normal Weight";
      color = "text-teal-400";
      indicatorColor = "bg-teal-400";
      advice = [
        "Great job! Keep maintaining your current healthy lifestyle.",
        "Continue eating a balanced diet rich in fruits and vegetables.",
        "Aim for at least 150 minutes of moderate exercise per week.",
      ];
    } else if (bmi < 30.0) {
      category = "Overweight";
      color = "text-amber-400";
      indicatorColor = "bg-amber-400";
      advice = [
        "Focus on portion control and reducing intake of processed sugars.",
        "Incorporate more physical activity, like brisk walking or cycling.",
        "Stay hydrated and aim for 7-8 hours of quality sleep per night.",
      ];
    } else {
      category = "Obesity";
      color = "text-rose-400";
      indicatorColor = "bg-rose-400";
      advice = [
        "Consult a healthcare provider for a personalized, safe health plan.",
        "Start with low-impact exercises like swimming or walking to protect joints.",
        "Focus on whole, unprocessed foods and practice mindful eating habits.",
      ];
    }

    setResult({
      bmi: bmi.toFixed(1),
      category,
      color,
      indicatorColor,
      advice,
    });
  };

  return (
    <div className="max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-teal-500 mb-6 transition-colors font-medium"
      >
        <ArrowLeft size={18} /> Back to Saved Advice
      </button>

      <div
        className={`rounded-3xl shadow-2xl overflow-hidden border ${isDark ? "bg-[#0B1120] border-slate-800/80" : "bg-white border-slate-200"}`}
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2
                className={`text-2xl sm:text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                BMI Calculator
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Calculate your Body Mass Index and know your health status
              </p>
            </div>
            <div
              className={`flex rounded-xl p-1 border ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-slate-100 border-slate-200"}`}
            >
              <button
                onClick={() => {
                  setUnit("metric");
                  setResult(null);
                  setHeight("");
                  setWeight("");
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${unit === "metric" ? "bg-teal-500 text-slate-900 shadow-sm" : "text-slate-500 hover:text-teal-500"}`}
              >
                Metric
              </button>
              <button
                onClick={() => {
                  setUnit("imperial");
                  setResult(null);
                  setHeight("");
                  setWeight("");
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${unit === "imperial" ? "bg-teal-500 text-slate-900 shadow-sm" : "text-slate-500 hover:text-teal-500"}`}
              >
                Imperial
              </button>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div
              className={`flex items-center rounded-2xl border p-2 transition-all ${isDark ? "bg-slate-900/50 border-slate-700/50" : "bg-slate-50 border-slate-200"}`}
            >
              <div
                className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center mr-3 ${isDark ? "bg-slate-800 text-teal-400" : "bg-white text-teal-500 shadow-sm"}`}
              >
                <User size={24} />
              </div>
              <div className="flex-1 min-w-0 pr-3">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                  Height
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    onKeyDown={(e) => {
                      if (["-", "+", "e", "E"].includes(e.key))
                        e.preventDefault();
                    }}
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder={
                      unit === "metric" ? "e.g. 171" : "e.g. 5.6 for 5'6\""
                    }
                    className="w-full bg-transparent border-none outline-none text-base font-semibold text-slate-200 placeholder-slate-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-teal-500 font-bold text-sm ml-2 shrink-0">
                    {unit === "metric" ? "cm" : "ft.in"}
                  </span>
                </div>
              </div>
            </div>

            <div
              className={`flex items-center rounded-2xl border p-2 transition-all ${isDark ? "bg-slate-900/50 border-slate-700/50" : "bg-slate-50 border-slate-200"}`}
            >
              <div
                className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center mr-3 ${isDark ? "bg-slate-800 text-teal-400" : "bg-white text-teal-500 shadow-sm"}`}
              >
                <Activity size={24} />
              </div>
              <div className="flex-1 min-w-0 pr-3">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                  Weight
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    onKeyDown={(e) => {
                      if (["-", "+", "e", "E"].includes(e.key))
                        e.preventDefault();
                    }}
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder={unit === "metric" ? "e.g. 73" : "e.g. 160"}
                    className="w-full bg-transparent border-none outline-none text-base font-semibold text-slate-200 placeholder-slate-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-teal-500 font-bold text-sm ml-2 shrink-0">
                    {unit === "metric" ? "kg" : "lbs"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={calculateBMI}
            className="w-full bg-teal-500 hover:bg-teal-400 text-slate-900 font-black py-4 rounded-2xl transition-all shadow-lg text-sm uppercase tracking-wider"
          >
            Calculate BMI
          </button>

          {result && (
            <div
              className={`mt-6 p-6 rounded-2xl border animate-in fade-in zoom-in duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 ${isDark ? "bg-[#0B1120] border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}
            >
              <div className="relative w-32 h-32 flex items-center justify-center shrink-0 mx-auto sm:mx-0">
                <svg
                  className="w-full h-full transform -rotate-90"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={isDark ? "#1e293b" : "#e2e8f0"}
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray="283"
                    strokeDashoffset={
                      283 - (283 * Math.min(result.bmi, 40)) / 40
                    }
                    className={`${result.color} transition-all duration-1000 ease-out`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-black ${result.color}`}>
                    {result.bmi}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Your BMI
                  </span>
                </div>
              </div>

              <div className="flex-1 text-left w-full">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 mb-3 border border-slate-700/50">
                  <span
                    className={`w-2 h-2 rounded-full animate-pulse ${result.indicatorColor}`}
                  />
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${result.color}`}
                  >
                    {result.category}
                  </span>
                </div>

                <div className="text-sm text-slate-400 leading-relaxed mt-2 space-y-2">
                  <p className="font-semibold text-slate-300">
                    Actionable Advice:
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    {result.advice.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          className={`p-6 border-t ${isDark ? "bg-slate-900/30 border-slate-800/80" : "bg-slate-50 border-slate-200"}`}
        >
          <h4
            className={`text-sm font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            BMI Categories
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <span className="text-slate-400 font-medium">Underweight</span>
              </div>
              <span className="font-mono text-slate-300">&lt; 18.5</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                <span className="text-slate-400 font-medium">
                  Normal Weight
                </span>
              </div>
              <span className="font-mono text-slate-300">18.5 - 24.9</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-slate-400 font-medium">Overweight</span>
              </div>
              <span className="font-mono text-slate-300">25.0 - 29.9</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="text-slate-400 font-medium">Obesity</span>
              </div>
              <span className="font-mono text-slate-300">&ge; 30.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export function ChatDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [page, setPage] = useState("chat");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [playingMessageId, setPlayingMessageId] = useState(null);

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

  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "{}"),
  );

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

  const [accountAction, setAccountAction] = useState({
    isOpen: false,
    email: "",
    password: "",
    loading: false,
  });
  const [showAccountActionPw, setShowAccountActionPw] = useState(false);

  const [emergencyAlert, setEmergencyAlert] = useState(false);

  const isDark = appSettings.darkMode;

  useEffect(() => {
    document.body.style.backgroundColor = isDark ? "#020617" : "#ffffff";
  }, [isDark]);

  useEffect(() => {
    const fetchLatestProfile = async () => {
      if (!token) return;
      try {
        const res = await fetch(
          "https://healthbot-backend-ezxv.onrender.com/api/auth/profile",
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (res.status === 401) {
          localStorage.clear();
          window.location.href = "/login";
          return;
        }

        if (res.ok) {
          const data = await res.json();
          const userData = data.user || data;

          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));

          setProfileForm({
            name: userData.name || "",
            age: userData.age || "",
            gender: userData.gender || "",
            bloodGroup: userData.bloodGroup || "",
            address: userData.address || "",
            phoneNumber: userData.phoneNumber || "",
          });
        }
      } catch (err) {
        console.error("Failed to sync profile data from server.", err);
      }
    };

    fetchLatestProfile();
  }, [token]);

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
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);

  const [reminders, setReminders] = useState([
    {
      id: 1,
      name: "Drink Water",
      date: "2026-06-01",
      time: "08:00",
      active: true,
    },
    {
      id: 2,
      name: "Vitamin C Supplement",
      date: "2026-06-02",
      time: "09:00",
      active: true,
    },
  ]);

  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [editingReminderId, setEditingReminderId] = useState(null);
  const [reminderForm, setReminderForm] = useState({
    name: "",
    date: "",
    time: "",
  });

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const today = now.toISOString().split("T")[0];

      reminders.forEach(async (reminder) => {
        if (
          reminder.date === today &&
          reminder.time === currentTime &&
          reminder.active
        ) {
          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification("HealthBot Reminder", {
              body: `It's time for: ${reminder.name}`,
              icon: "/favicon.ico",
            });
          }

          if (appSettings.emailNotif && token) {
            try {
              await axios.post(
                "https://healthbot-backend-ezxv.onrender.com/api/chat/email-reminder",
                { reminderName: reminder.name, time: reminder.time },
                { headers: { Authorization: `Bearer ${token}` } },
              );
            } catch (err) {
              console.error("Failed to send automatic reminder email", err);
            }
          }
        }
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [reminders, appSettings.emailNotif, token]);

  const formatTimeAMPM = (timeStr) => {
    if (!timeStr) return "";
    let [h, m] = timeStr.split(":");
    let hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  };

  const openAddReminderModal = () => {
    setEditingReminderId(null);
    setReminderForm({ name: "", date: "", time: "" });
    setIsReminderModalOpen(true);
  };

  const openEditReminderModal = (id) => {
    const r = reminders.find((rem) => rem.id === id);
    if (r) {
      setEditingReminderId(id);
      setReminderForm({ name: r.name, date: r.date, time: r.time });
      setIsReminderModalOpen(true);
    }
  };

  const saveReminder = (e) => {
    e.preventDefault();
    if (
      !reminderForm.name.trim() ||
      !reminderForm.date.trim() ||
      !reminderForm.time.trim()
    ) {
      showToast("Name, Date, and Time are required!");
      return;
    }

    if (editingReminderId) {
      setReminders(
        reminders.map((r) =>
          r.id === editingReminderId
            ? {
                ...r,
                name: reminderForm.name,
                date: reminderForm.date,
                time: reminderForm.time,
              }
            : r,
        ),
      );
      showToast("Reminder updated!");
    } else {
      setReminders([
        ...reminders,
        {
          id: Date.now(),
          name: reminderForm.name,
          date: reminderForm.date,
          time: reminderForm.time,
          active: true,
        },
      ]);
      showToast("Reminder added!");
    }
    setIsReminderModalOpen(false);
  };

  const handleDeleteReminder = (id) => {
    setReminders(reminders.filter((r) => r.id !== id));
  };

  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

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

  const isNewUser = user?.createdAt
    ? Date.now() - new Date(user.createdAt).getTime() < 5 * 60 * 1000
    : chatHistoryList.length === 0;

  useEffect(() => {
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  }, []);

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

  const speakText = (text, id) => {
    const synth = window.speechSynthesis;

    if (!synth) {
      showToast("Text-to-speech is not supported in this browser.");
      return;
    }

    if (playingMessageId === id) {
      synth.cancel();
      setPlayingMessageId(null);
      return;
    }

    synth.cancel();
    setPlayingMessageId(id);

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.pitch = 0.8;
    utterance.rate = 0.95;

    utterance.onend = () => {
      setPlayingMessageId(null);
    };

    utterance.onerror = (e) => {
      console.error("TTS Error:", e);
      setPlayingMessageId(null);
    };

    const voices = synth.getVoices();
    let preferredVoice = voices.find((v) => v.name.includes("Google"));
    if (!preferredVoice) {
      preferredVoice =
        voices.find((v) => v.name.toLowerCase().includes("male")) || voices[0];
    }

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    synth.speak(utterance);
  };

  const recognitionRef = useRef(null);

  const toggleRecording = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return showToast("Speech recognition is not supported in this browser.");
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? prev + " " + transcript : transcript));

        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = `${Math.min(
            textareaRef.current.scrollHeight,
            120,
          )}px`;
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
        setIsRecording(true);
      } catch (error) {
        console.error("Failed to start recording:", error);
        setIsRecording(false);
      }
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

  const showToast = (msg) => {
    const text =
      typeof msg === "object"
        ? msg.message || "An error occurred"
        : String(msg);
    setToastMessage(text);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch(
        `https://healthbot-backend-ezxv.onrender.com/api/auth/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profileForm),
        },
      );

      if (res.status === 401) {
        localStorage.clear();
        window.location.href = "/login";
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      const updatedUser = { ...user, ...profileForm };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setIsEditingProfile(false);
      showToast("Profile Successfully Updated!");
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
        `https://healthbot-backend-ezxv.onrender.com/api/auth/change-password`,
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

      if (res.status === 401) {
        localStorage.clear();
        window.location.href = "/login";
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showToast("Password changed successfully!");
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

  const confirmAccountAction = async (e) => {
    e.preventDefault();
    setAccountAction((prev) => ({ ...prev, loading: true }));

    try {
      const res = await fetch(
        "https://healthbot-backend-ezxv.onrender.com/api/auth/delete-account",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: accountAction.email,
            password: accountAction.password,
          }),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Invalid credentials or server error.");
      }

      showToast("Account successfully deleted.");
      localStorage.clear();
      window.location.href = "/register";
    } catch (err) {
      showToast(err.message);
      setAccountAction((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleSettingChange = (key) => {
    const newSettings = { ...appSettings, [key]: !appSettings[key] };
    setAppSettings(newSettings);
    localStorage.setItem("appSettings", JSON.stringify(newSettings));
    showToast(
      key === "darkMode"
        ? `Theme switched to ${newSettings.darkMode ? "Dark" : "Light"}`
        : "Settings Updated!",
    );
  };

  const handleNewChat = () => {
    setActiveSessionId(Date.now());
    setMessages([]);
    handleNavClick("chat");
  };

  const loadChatSession = (session) => {
    setActiveSessionId(session.id);
    setMessages(session.messages);
    handleNavClick("chat");
  };

  const deleteSession = (e, id) => {
    e.stopPropagation();
    if (
      window.confirm(
        "Are you sure you want to permanently delete this chat session?",
      )
    ) {
      const updatedHistory = chatHistoryList.filter((s) => s.id !== id);
      setChatHistoryList(updatedHistory);
      localStorage.setItem("chatHistory", JSON.stringify(updatedHistory));

      if (activeSessionId === id) {
        handleNewChat();
      }
      showToast("Chat session deleted.");
    }
  };

  const loadSavedAdvice = (title) => {
    if (title === "BMI Calculator") {
      handleNavClick("bmi");
      return;
    }

    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    let text = "";
    if (title === "Emergency Contacts") {
      text = `🚨 Your Emergency Contacts:\n- Ambulance/Emergency: 108\n- Your Registered Location: ${user.address || "Please update address in Profile"}\n\nTip: In a severe emergency, call 108 immediately and provide them with your registered location.`;
    }

    setActiveSessionId(Date.now());
    setMessages([{ id: Date.now(), sender: "bot", text, time: now }]);
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
      showToast("History Cleared");
    }
  };

  const [symptomOptions, setSymptomOptions] = useState([]);

  useEffect(() => {
    if (!token) return;
    axios
      .get(
        "https://healthbot-backend-ezxv.onrender.com/api/chat/symptom-options",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      .then((res) => setSymptomOptions(res.data || []))
      .catch(() => {});
  }, [token]);

  const removeConfirmSymptom = (msgId, symptomId) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              detectedSymptoms: m.detectedSymptoms.filter(
                (s) => s.id !== symptomId,
              ),
            }
          : m,
      ),
    );
  };

  const addConfirmSymptom = (msgId, symptom) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId && !m.detectedSymptoms.some((s) => s.id === symptom.id)
          ? { ...m, detectedSymptoms: [...m.detectedSymptoms, symptom] }
          : m,
      ),
    );
  };

  const confirmSymptoms = async (msg) => {
    if (!msg.detectedSymptoms.length || loading) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, resolved: true } : m)),
    );
    setLoading(true);
    try {
      const res = await axios.post(
        "https://healthbot-backend-ezxv.onrender.com/api/chat/confirm-symptoms",
        {
          symptoms: msg.detectedSymptoms.map((s) => s.id),
          originalText: msg.originalText,
          saveHistory: appSettings.saveHistory,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const botReply = res.data.reply;

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: botReply,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        localStorage.clear();
        window.location.href = "/login";
        return;
      }
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          sender: "bot",
          text: "⚠️ Connection error. Please try again later.",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (textOverride = null) => {
    const textToSend = textOverride || inputText;
    if ((!textToSend.trim() && !uploadedImage) || loading) return;

    const emergencyKeywords = [
      "heart attack",
      "stroke",
      "bleeding heavily",
      "suicide",
      "unconscious",
      "can't breathe",
      "shortness of breath",
      "getting worse",
      "condition is worsening",
      "severe pain",
      "unbearable",
      "fainting",
      "losing consciousness",
      "massive accident",
    ];
    const isEmergency = emergencyKeywords.some((keyword) =>
      textToSend.toLowerCase().includes(keyword),
    );

    if (isEmergency) {
      setEmergencyAlert(true);
      speakText(
        "Emergency alert. Please select an option to get immediate help.",
        "emergency",
      );
    }

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
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const currentImg = uploadedImage;
    setUploadedImage(null);
    setLoading(true);

    try {
      const res = await axios.post(
        "https://healthbot-backend-ezxv.onrender.com/api/chat/message",
        {
          text: textToSend,
          image: currentImg,
          saveHistory: appSettings.saveHistory,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data.needsConfirmation) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: "bot",
            type: "confirmation",
            originalText: res.data.originalText,
            detectedSymptoms: res.data.detectedSymptoms,
            resolved: false,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
        setLoading(false);
        return;
      }

      const botReply = res.data.reply;

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: botReply,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        localStorage.clear();
        window.location.href = "/login";
        return;
      }

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
    <div
      className={`flex flex-col h-full border-r shadow-2xl relative z-[100] transition-colors duration-300 ${isDark ? "bg-[#020617] border-slate-800/60" : "bg-slate-50 border-slate-200"}`}
    >
      <div
        className={`p-6 flex items-center justify-between border-b mb-2 transition-colors duration-300 ${isDark ? "border-slate-800/40" : "border-slate-200"}`}
      >
        <div className="flex items-center gap-2">
          <Activity className="h-7 w-7 text-teal-500" strokeWidth={3} />
          <span
            className={`text-2xl font-bold tracking-tight transition-colors duration-300 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            HealthBot
          </span>
        </div>
        <button
          className={`lg:hidden p-1 rounded-lg transition-colors ${isDark ? "text-slate-400 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-200"}`}
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
          isDark={isDark}
          onClick={handleNewChat}
        />
        <SidebarBtn
          icon={History}
          label="Chat History"
          active={page === "history"}
          isDark={isDark}
          onClick={() => handleNavClick("history")}
        />
        <SidebarBtn
          icon={Bookmark}
          label="Saved Advice"
          active={page === "saved" || page === "bmi"}
          isDark={isDark}
          onClick={() => handleNavClick("saved")}
        />
        <SidebarBtn
          icon={Bell}
          label="Reminders"
          active={page === "reminders"}
          isDark={isDark}
          onClick={() => handleNavClick("reminders")}
        />
        <SidebarBtn
          icon={LifeBuoy}
          label="First Aid"
          active={page === "first-aid"}
          isDark={isDark}
          onClick={() => handleNavClick("first-aid")}
        />
        <SidebarBtn
          icon={MapPin}
          label="Facilities"
          active={page === "facilities"}
          isDark={isDark}
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
          isDark={isDark}
          onClick={() => handleNavClick("profile")}
        />
        <SidebarBtn
          icon={Settings}
          label="Settings"
          active={page === "settings"}
          isDark={isDark}
          onClick={() => handleNavClick("settings")}
        />

        <button
          onClick={() => {
            localStorage.clear();
            navigate("/login");
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 mt-8 hover:bg-rose-500/10 transition-all font-bold uppercase tracking-wider text-xs"
        >
          <LogOut size={18} /> <span>Log Out</span>
        </button>
      </nav>
    </div>
  );

  return (
    <div
      className={`fixed inset-0 flex font-sans overflow-hidden selection:bg-teal-500/30 transition-colors duration-300 ${isDark ? "bg-[#020617] text-slate-200" : "bg-white text-slate-900"}`}
    >
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-teal-500 text-slate-900 px-5 py-3 rounded-2xl font-bold shadow-2xl flex items-center gap-3 z-[200] animate-in slide-in-from-bottom-5">
          <CheckCircle2 size={20} /> {toastMessage}
        </div>
      )}

      {emergencyAlert && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-red-900/80 backdrop-blur-md animate-in fade-in zoom-in duration-300">
          <div className="w-full max-w-lg p-8 rounded-3xl shadow-2xl bg-white border-4 border-red-500 text-center relative">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-3xl font-black text-red-600 mb-4 uppercase tracking-tight">
              Emergency Detected
            </h2>
            <p className="text-slate-700 text-lg font-medium mb-8">
              Please select an immediate action below.
            </p>

            <div className="flex flex-col gap-3">
              <a
                href="tel:108"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl text-lg flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <PhoneCall size={24} /> Call 108 (Ambulance)
              </a>
              <button
                onClick={() => {
                  const location = user.address
                    ? `near ${user.address}`
                    : "near me";
                  window.open(
                    `https://www.google.com/maps/search/hospitals+${encodeURIComponent(location)}`,
                    "_blank",
                  );
                }}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-black py-4 rounded-xl text-lg flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <MapPin size={24} /> Find Nearby Hospitals
              </button>
              <button
                onClick={() => {
                  setEmergencyAlert(false);
                  window.speechSynthesis.cancel();
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition-all mt-2"
              >
                Dismiss Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {isReminderModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-md p-6 rounded-3xl shadow-2xl ${isDark ? "bg-[#111827] border border-slate-700/50" : "bg-white border-slate-200"}`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3
                className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {editingReminderId ? "Edit Reminder" : "New Reminder"}
              </h3>
              <button
                onClick={() => setIsReminderModalOpen(false)}
                className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveReminder} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Reminder Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Medicine, Water, etc."
                  value={reminderForm.name}
                  onChange={(e) =>
                    setReminderForm({ ...reminderForm, name: e.target.value })
                  }
                  className={`border rounded-xl py-3 px-4 text-sm focus:border-teal-400 outline-none transition-all ${isDark ? "bg-[#0B1120] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={reminderForm.date}
                    onChange={(e) =>
                      setReminderForm({ ...reminderForm, date: e.target.value })
                    }
                    className={`border rounded-xl py-3 px-4 text-sm focus:border-teal-400 outline-none transition-all ${isDark ? "bg-[#0B1120] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Time
                  </label>
                  <input
                    type="time"
                    required
                    value={reminderForm.time}
                    onChange={(e) =>
                      setReminderForm({ ...reminderForm, time: e.target.value })
                    }
                    className={`border rounded-xl py-3 px-4 text-sm focus:border-teal-400 outline-none transition-all ${isDark ? "bg-[#0B1120] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Save size={18} />{" "}
                {editingReminderId ? "Save Changes" : "Add Reminder"}
              </button>
            </form>
          </div>
        </div>
      )}

      {accountAction.isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-md p-6 rounded-3xl shadow-2xl ${isDark ? "bg-[#111827] border border-slate-700/50" : "bg-white border border-slate-200"}`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-rose-500">
                Delete Account
              </h3>
              <button
                onClick={() =>
                  setAccountAction({
                    isOpen: false,
                    email: "",
                    password: "",
                    loading: false,
                  })
                }
                className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <p
              className={`text-sm mb-6 ${isDark ? "text-slate-400" : "text-slate-600"}`}
            >
              Please enter your email and password to verify your identity
              before we delete your account.{" "}
              <strong className="text-rose-500">
                This action is irreversible.
              </strong>
            </p>

            <form
              onSubmit={confirmAccountAction}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={accountAction.email}
                  onChange={(e) =>
                    setAccountAction((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className={`w-full border rounded-xl py-3 px-4 text-sm focus:border-teal-400 outline-none transition-all ${isDark ? "bg-[#0B1120] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showAccountActionPw ? "text" : "password"}
                    required
                    placeholder="Enter your password"
                    value={accountAction.password}
                    onChange={(e) =>
                      setAccountAction((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    className={`w-full border rounded-xl py-3 pl-4 pr-12 text-sm focus:border-teal-400 outline-none transition-all ${isDark ? "bg-[#0B1120] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccountActionPw(!showAccountActionPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-500"
                  >
                    {showAccountActionPw ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={accountAction.loading}
                className="w-full mt-4 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white"
              >
                {accountAction.loading ? "Verifying..." : "Confirm Deletion"}
              </button>
            </form>
          </div>
        </div>
      )}

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

      <main className="flex-1 flex flex-col h-[100dvh] min-w-0 relative overflow-hidden bg-transparent z-0">
        {/* Ambient Background Glow centered in the chat area */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] rounded-full blur-[100px] pointer-events-none z-[-1] ${isDark ? "bg-teal-500/15" : "bg-teal-500/20"}`}
        />

        <header
          className={`flex-none z-[90] h-[72px] border-b flex items-center justify-between px-3 sm:px-4 lg:px-8 backdrop-blur-md transition-colors duration-300 ${isDark ? "bg-[#020617]/95 border-slate-800/60 shadow-xl" : "bg-white/95 border-slate-200 shadow-sm"}`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              className={`p-1.5 sm:p-2 rounded-lg transition-all ${isDark ? "text-slate-400 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"} ${isSidebarOpen ? "lg:hidden" : "block"}`}
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border transition-colors duration-300 ${isDark ? "bg-slate-800 border-teal-500/20" : "bg-slate-100 border-teal-500/30"}`}
              >
                <Activity size={20} className="text-teal-500" />
              </div>
              <div className="flex flex-col justify-center">
                <h3
                  className={`text-sm lg:text-base font-bold tracking-tight leading-tight ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  HealthBot
                </h3>
                <p className="text-[9px] sm:text-[10px] text-teal-500 font-bold uppercase flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(45,212,191,0.8)]" />
                  Online
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex flex-col items-end text-right">
              <span
                className={`text-sm font-bold transition-colors ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                {user.name || "User"}
              </span>
              <span className="text-[8px] text-slate-500 font-bold uppercase opacity-60">
                Verified User
              </span>
            </div>
            <button
              onClick={() => handleNavClick("profile")}
              className={`w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full border flex items-center justify-center transition-colors duration-300 shadow-md ${isDark ? "bg-slate-800/80 border-slate-700 hover:border-teal-500/50" : "bg-slate-100 border-slate-200 hover:border-teal-500/50"}`}
            >
              <UserCircle className="text-slate-400" size={24} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pt-6 pb-6 px-4 lg:px-6 no-scrollbar relative z-0">
          {page === "chat" && (
            <div
              className={`max-w-4xl mx-auto flex flex-col space-y-6 pb-12 ${messages.length === 0 ? "h-full justify-center" : ""}`}
            >
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center my-auto animate-in fade-in zoom-in duration-500 pb-20 relative z-10">
                  {/* HIGH-CONTRAST LOGO: Solid Teal Circle forces visibility on all Laptop Monitors */}
                  <div
                    className={`w-20 h-20 sm:w-28 sm:h-28 rounded-full flex items-center justify-center mb-6 transition-all shadow-[0_0_50px_rgba(45,212,191,0.4)] ${isDark ? "bg-teal-500" : "bg-teal-100"}`}
                  >
                    <Activity
                      className={`h-10 w-10 sm:h-14 sm:w-14 ${isDark ? "text-[#020617]" : "text-teal-600"}`}
                      strokeWidth={3}
                    />
                  </div>
                  <h2
                    className={`text-3xl md:text-4xl font-bold mb-3 text-center tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {isNewUser
                      ? `Hello ${firstName}!`
                      : `Welcome back, ${firstName}`}
                  </h2>
                  <p
                    className={`text-center max-w-md text-sm md:text-base ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    {isNewUser
                      ? "I am your HealthBot. How are you feeling today? Please describe your symptoms."
                      : "I am your AI health assistant. How can I help you today?"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex justify-center mt-4">
                    <span
                      className={`text-[9px] px-3 py-1 rounded-full font-bold uppercase tracking-widest border transition-colors duration-300 ${isDark ? "bg-slate-800/50 text-slate-500 border-slate-700/50" : "bg-slate-100 text-slate-400 border-slate-200"}`}
                    >
                      Session Started Today
                    </span>
                  </div>

                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.sender === "user" ? "flex-row-reverse" : ""} animate-in fade-in slide-in-from-bottom-2`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center border ${msg.sender === "user" ? "bg-teal-500/10 border-teal-500/20" : isDark ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200"}`}
                      >
                        {msg.sender === "user" ? (
                          <User size={18} className="text-teal-500" />
                        ) : (
                          <Activity size={18} className="text-teal-500" />
                        )}
                      </div>
                      <div
                        className={`flex flex-col gap-1.5 ${msg.sender === "user" ? "items-end" : ""}`}
                      >
                        {msg.type === "confirmation" ? (
                          <SymptomConfirmationCard
                            msg={msg}
                            options={symptomOptions}
                            isDark={isDark}
                            onRemove={removeConfirmSymptom}
                            onAdd={addConfirmSymptom}
                            onConfirm={confirmSymptoms}
                          />
                        ) : (
                          <div
                            className={`p-4 rounded-2xl text-xs lg:text-sm leading-relaxed shadow-lg ${msg.sender === "user" ? "bg-teal-600 text-white rounded-tr-none" : isDark ? "bg-slate-800/90 border border-slate-700/50 text-slate-200 rounded-tl-none backdrop-blur-md" : "bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none"}`}
                          >
                            {msg.image && (
                              <img
                                src={msg.image}
                                alt="Upload"
                                className="max-w-full rounded-lg mb-3 border border-white/10 shadow-lg"
                              />
                            )}
                            {msg.text && (
                              <div className="whitespace-pre-wrap">
                                {msg.text}
                              </div>
                            )}
                          </div>
                        )}

                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter flex items-center gap-1 mt-1">
                          {msg.time}
                          {msg.sender === "bot" &&
                            msg.type !== "confirmation" && (
                              <div className="flex items-center gap-1 ml-1">
                                <button
                                  onClick={() => speakText(msg.text, msg.id)}
                                  className={`p-2.5 sm:p-1.5 transition-colors rounded-lg sm:rounded-md ${playingMessageId === msg.id ? "text-teal-400 bg-teal-500/10 sm:bg-transparent" : isDark ? "hover:text-teal-400 hover:bg-slate-800" : "hover:text-teal-600 hover:bg-slate-200"}`}
                                  title={
                                    playingMessageId === msg.id
                                      ? "Stop playing"
                                      : "Play message"
                                  }
                                >
                                  {playingMessageId === msg.id ? (
                                    <Pause
                                      size={18}
                                      className="sm:w-3.5 sm:h-3.5"
                                    />
                                  ) : (
                                    <Volume2
                                      size={18}
                                      className="sm:w-3.5 sm:h-3.5"
                                    />
                                  )}
                                </button>
                              </div>
                            )}
                        </span>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-3 animate-pulse">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200"}`}
                      >
                        <Activity
                          size={18}
                          className="text-teal-500 opacity-50"
                        />
                      </div>
                      <div
                        className={`p-4 rounded-2xl rounded-tl-none border flex gap-1 ${isDark ? "bg-slate-800/40 border-slate-700/30" : "bg-slate-50 border-slate-200"}`}
                      >
                        <span className="w-1 h-1 bg-teal-500 rounded-full animate-bounce" />
                        <span className="w-1 h-1 bg-teal-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1 h-1 bg-teal-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} className="h-2" />
                </>
              )}
            </div>
          )}

          {page === "bmi" && (
            <BmiCalculatorView
              isDark={isDark}
              onBack={() => handleNavClick("saved")}
            />
          )}

          {page === "first-aid" && <FirstAidView isDark={isDark} />}

          {page === "profile" && (
            <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-6">
              <div
                className={`border rounded-3xl p-6 sm:p-8 mb-6 relative overflow-hidden transition-colors duration-300 ${isDark ? "bg-[#111827]/80 backdrop-blur-xl border-slate-700/50" : "bg-white border-slate-200 shadow-sm"}`}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-4 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center shrink-0">
                      <User className="h-8 w-8 text-teal-400" />
                    </div>
                    <div className="overflow-hidden">
                      <h1
                        className={`text-xl sm:text-2xl font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {user?.name || "User Profile"}
                      </h1>
                      <p className="text-slate-400 text-sm truncate">
                        {user?.email}
                      </p>
                      <p className="text-xs text-teal-500 mt-1">
                        Member since{" "}
                        {new Date(
                          user?.createdAt || Date.now(),
                        ).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto">
                    {!isEditingProfile ? (
                      <button
                        onClick={() => {
                          setIsEditingProfile(true);
                          setToastMessage("");
                        }}
                        className="w-full sm:w-auto flex justify-center items-center gap-2 px-4 py-2 bg-teal-500/10 border border-teal-500/30 text-teal-500 rounded-xl text-sm font-bold hover:bg-teal-500/20 transition-all"
                      >
                        <Edit3 className="h-4 w-4" /> Edit Profile
                      </button>
                    ) : (
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={saveProfile}
                          disabled={savingProfile}
                          className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2 bg-teal-500 text-slate-900 rounded-xl text-sm font-bold hover:bg-teal-400 transition-all disabled:opacity-50"
                        >
                          <Save className="h-4 w-4" />{" "}
                          {savingProfile ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingProfile(false);
                            setProfileForm({
                              name: user.name || "",
                              age: user.age || "",
                              gender: user.gender || "",
                              bloodGroup: user.bloodGroup || "",
                              address: user.address || "",
                              phoneNumber: user.phoneNumber || "",
                            });
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
                    isDark={isDark}
                    name="name"
                    onChange={handleProfileChange}
                  />

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Mail className="h-3 w-3" /> Email Address
                    </label>
                    <p
                      className={`text-sm py-3 px-4 rounded-xl flex items-center gap-2 ${isDark ? "bg-slate-800/30 text-slate-400" : "bg-slate-50 text-slate-500 border border-slate-200"}`}
                    >
                      {user?.email}
                      {user?.isVerified && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                    </p>
                  </div>

                  <ProfileField
                    label="Phone Number"
                    icon={Phone}
                    value={profileForm.phoneNumber}
                    editing={isEditingProfile}
                    isDark={isDark}
                    name="phoneNumber"
                    onChange={handleProfileChange}
                  />
                  <ProfileField
                    label="Age"
                    icon={Calendar}
                    value={profileForm.age}
                    editing={isEditingProfile}
                    isDark={isDark}
                    name="age"
                    type="number"
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
                        className={`border rounded-xl py-3 px-4 text-sm focus:border-teal-400 transition-all outline-none ${isDark ? "bg-[#0B1120] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    ) : (
                      <p
                        className={`text-sm py-3 px-4 rounded-xl capitalize ${isDark ? "bg-slate-800/30 text-white" : "bg-slate-50 text-slate-900 border border-slate-200"}`}
                      >
                        {user?.gender || "—"}
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
                        className={`border rounded-xl py-3 px-4 text-sm focus:border-teal-400 transition-all outline-none ${isDark ? "bg-[#0B1120] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}
                      >
                        <option value="">Select blood group</option>
                        {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(
                          (bg) => (
                            <option key={bg} value={bg}>
                              {bg}
                            </option>
                          ),
                        )}
                      </select>
                    ) : (
                      <p
                        className={`text-sm py-3 px-4 rounded-xl ${isDark ? "bg-slate-800/30 text-white" : "bg-slate-50 text-slate-900 border border-slate-200"}`}
                      >
                        {user?.bloodGroup || "—"}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <MapPin className="h-3 w-3" /> Address
                    </label>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        name="address"
                        value={profileForm.address}
                        onChange={handleProfileChange}
                        placeholder="Enter address"
                        className={`border rounded-xl py-3 px-4 text-sm focus:border-teal-400 transition-all outline-none ${isDark ? "bg-[#0B1120] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}
                      />
                    ) : (
                      <p
                        className={`text-sm py-3 px-4 rounded-xl ${isDark ? "bg-slate-800/30 text-white" : "bg-slate-50 text-slate-900 border border-slate-200"}`}
                      >
                        {user?.address || "—"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div
                className={`border rounded-3xl p-6 sm:p-8 transition-colors duration-300 ${isDark ? "bg-[#111827]/80 backdrop-blur-xl border-slate-700/50" : "bg-white border-slate-200 shadow-sm"}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-teal-500" />
                    <h2
                      className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      Security Settings
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setShowPasswordForm(!showPasswordForm);
                      setToastMessage("");
                    }}
                    className={`flex justify-center items-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold transition-all ${isDark ? "bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700" : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"}`}
                  >
                    <Lock className="h-4 w-4" />
                    {showPasswordForm ? "Cancel" : "Change Password"}
                  </button>
                </div>

                {!showPasswordForm ? (
                  <p className="text-slate-400 text-sm">
                    Your password is securely encrypted. Click "Change Password"
                    to update it.
                  </p>
                ) : (
                  <form
                    onSubmit={handlePasswordChange}
                    className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2"
                  >
                    <PasswordField
                      label="Current Password"
                      value={passwordData.currentPassword}
                      isDark={isDark}
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
                        isDark={isDark}
                        show={showNewPw}
                        onToggle={() => setShowNewPw(!showNewPw)}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                      />

                      <div
                        className={`p-4 rounded-xl border mt-2 ${isDark ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}
                      >
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                          Password Requirements:
                        </p>
                        <div className="flex flex-col gap-2.5">
                          {passwordRequirements.map((req, i) => (
                            <div
                              key={i}
                              className={`flex items-center gap-2 transition-colors duration-300 ${req.met ? "text-teal-400" : "text-red-400"}`}
                            >
                              <div
                                className={`shrink-0 w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold ${req.met ? "bg-teal-500/20 border-teal-500/50" : "bg-red-500/10 border-red-500/40"}`}
                              >
                                {req.met ? "✓" : "✗"}
                              </div>
                              <span className="text-xs font-medium tracking-wide">
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
                      isDark={isDark}
                      show={showConfirmPw}
                      onToggle={() => setShowConfirmPw(!showConfirmPw)}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                    />

                    {passwordData.confirmPassword && (
                      <p
                        className={`text-xs ${passwordData.newPassword === passwordData.confirmPassword ? "text-green-500" : "text-rose-500"}`}
                      >
                        {passwordData.newPassword ===
                        passwordData.confirmPassword
                          ? "✓ Passwords match"
                          : "✗ Passwords do not match"}
                      </p>
                    )}

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

              <div
                className={`border rounded-3xl p-6 sm:p-8 mt-6 transition-colors duration-300 ${isDark ? "bg-[#111827]/80 border-rose-900/30" : "bg-white border-rose-100"}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="h-5 w-5 text-rose-500" />
                  <h2
                    className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Account Management
                  </h2>
                </div>
                <p
                  className={`text-sm mb-6 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  You can permanently delete your account here. You will need to
                  verify your email and password to proceed.{" "}
                  <strong className="text-rose-500">
                    This action is irreversible.
                  </strong>
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() =>
                      setAccountAction({
                        isOpen: true,
                        email: "",
                        password: "",
                        loading: false,
                      })
                    }
                    className={`w-full sm:w-auto px-8 py-3 border font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2 ${isDark ? "bg-slate-800 text-rose-400 border-slate-700 hover:bg-rose-500/10 hover:border-rose-500/30" : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"}`}
                  >
                    <Trash2 size={18} /> Delete Account Permanently
                  </button>
                </div>
              </div>
            </div>
          )}

          {page === "history" && (
            <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-6">
              <div className="flex justify-between items-center mb-8">
                <h2
                  className={`text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Consultation History
                </h2>
                {chatHistoryList.length > 0 && (
                  <button
                    onClick={clearChatHistory}
                    className="text-rose-500 hover:text-rose-600 text-sm font-bold flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={16} /> Clear All
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {chatHistoryList.length === 0 ? (
                  <div
                    className={`text-center py-10 rounded-3xl border shadow-lg ${isDark ? "bg-[#111827]/80 border-slate-700/50" : "bg-slate-50 border-slate-200"}`}
                  >
                    <History className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">
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
                      isDark={isDark}
                      onClick={() => loadChatSession(session)}
                      onDelete={(e) => deleteSession(e, session.id)}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {page === "saved" && (
            <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-6">
              <h2
                className={`text-3xl font-bold mb-8 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Saved Prescriptions & Advice
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <SavedCard
                  title="BMI Calculator"
                  date="Interactive Tool"
                  icon={Activity}
                  isDark={isDark}
                  onClick={() => loadSavedAdvice("BMI Calculator")}
                />
                <SavedCard
                  title="Emergency Contacts"
                  date="Pinned"
                  icon={Bell}
                  isDark={isDark}
                  onClick={() => loadSavedAdvice("Emergency Contacts")}
                />
              </div>
            </div>
          )}

          {page === "reminders" && (
            <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-6">
              <div className="flex justify-between items-center mb-8">
                <h2
                  className={`text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Reminders
                </h2>
                <button
                  onClick={openAddReminderModal}
                  className="bg-teal-500 text-slate-900 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:brightness-110 transition-all text-sm"
                >
                  <Plus size={16} /> Add New
                </button>
              </div>
              <div className="grid gap-4">
                {reminders.map((r) => (
                  <div
                    key={r.id}
                    className={`border p-4 sm:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md transition-all ${isDark ? "bg-[#111827]/80 border-slate-700/50 hover:border-teal-500/30" : "bg-slate-50 border-slate-200 hover:border-teal-500/50 shadow-sm"}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-teal-500/10 rounded-xl">
                        <Clock className="h-6 w-6 text-teal-500" />
                      </div>
                      <div>
                        <h4
                          className={`font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}
                        >
                          {r.name}
                        </h4>
                        <div className="flex gap-3 text-slate-500 text-sm mt-0.5">
                          <span className="flex items-center gap-1">
                            <CalendarDays size={14} /> {r.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} /> {formatTimeAMPM(r.time)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 sm:gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => openEditReminderModal(r.id)}
                        className="p-2 text-slate-400 hover:bg-teal-500/10 hover:text-teal-500 rounded-lg transition-colors"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteReminder(r.id)}
                        className="p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {page === "facilities" && (
            <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-6">
              <h2
                className={`text-3xl font-bold mb-8 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Nearby Facilities
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FacilityCard
                  title="Hospitals"
                  desc="Find general and specialized hospitals near your location."
                  icon={Building}
                  query="hospitals"
                  isDark={isDark}
                  userAddress={user.address}
                />
                <FacilityCard
                  title="Health Centers"
                  desc="Locate community health centers and primary care facilities."
                  icon={Activity}
                  query="health centers"
                  isDark={isDark}
                  userAddress={user.address}
                />
                <FacilityCard
                  title="Clinics"
                  desc="Discover nearby walk-in clinics and outpatient care."
                  icon={HeartPulse}
                  query="clinics"
                  isDark={isDark}
                  userAddress={user.address}
                />
                <FacilityCard
                  title="Medical Stores"
                  desc="Find local pharmacies and 24/7 medical stores."
                  icon={Store}
                  query="pharmacies medical stores"
                  isDark={isDark}
                  userAddress={user.address}
                />
              </div>
            </div>
          )}

          {page === "settings" && (
            <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-6">
              <h2
                className={`text-3xl font-bold mb-8 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                App Settings
              </h2>
              <div
                className={`border rounded-3xl p-8 shadow-2xl space-y-8 transition-colors duration-300 ${isDark ? "bg-[#111827]/80 backdrop-blur-xl border-slate-700/50" : "bg-white border-slate-200"}`}
              >
                <SettingToggle
                  label="Dark Mode"
                  desc="Enable sleek dark theme across the app."
                  checked={appSettings.darkMode}
                  isDark={isDark}
                  onChange={() => handleSettingChange("darkMode")}
                />
                <div
                  className={`h-[1px] w-full ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
                />
                <SettingToggle
                  label="Email Notifications"
                  desc="Receive reminder alerts via email."
                  checked={appSettings.emailNotif}
                  isDark={isDark}
                  onChange={() => handleSettingChange("emailNotif")}
                />
                <div
                  className={`h-[1px] w-full ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
                />
                <SettingToggle
                  label={
                    <div className="flex items-center gap-2">
                      SMS Alerts
                      <span className="text-[9px] bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded uppercase font-bold tracking-widest border border-teal-500/30">
                        Coming Soon
                      </span>
                    </div>
                  }
                  desc="Get urgent reminders via text."
                  checked={false}
                  isDark={isDark}
                  onChange={() =>
                    showToast("SMS Alerts are coming in the next update!")
                  }
                />
                <div
                  className={`h-[1px] w-full ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
                />
                <SettingToggle
                  label="Save Chat History"
                  desc="Securely save conversations to your device."
                  checked={appSettings.saveHistory}
                  isDark={isDark}
                  onChange={() => handleSettingChange("saveHistory")}
                />
              </div>
            </div>
          )}
        </div>

        {page === "chat" && (
          <div
            className={`flex-none p-3 sm:p-4 lg:p-6 border-t w-full relative z-10 pb-4 sm:pb-6 transition-colors duration-300 ${isDark ? "bg-[#020617] border-slate-800/40 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]" : "bg-white border-slate-200 shadow-sm"}`}
          >
            <div className="max-w-4xl mx-auto">
              {messages.length === 0 && (
                <div className="flex overflow-x-auto gap-2 mb-3 no-scrollbar pb-1 justify-center w-full">
                  {["Fever", "Headache", "Fatigue", "Cough"].map((symptom) => (
                    <button
                      key={symptom}
                      onClick={() => sendMessage(`I have a ${symptom}`)}
                      className={`whitespace-nowrap border px-3 py-1.5 rounded-full text-[10px] transition-all flex items-center gap-1 font-bold ${isDark ? "bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-teal-400 hover:border-teal-500/30" : "bg-slate-100 border-slate-200 text-slate-600 hover:text-teal-600 hover:border-teal-400"}`}
                    >
                      {symptom} <ChevronRight size={10} />
                    </button>
                  ))}
                </div>
              )}

              {uploadedImage && (
                <div
                  className={`mb-3 flex items-center gap-3 p-2 rounded-xl border animate-in slide-in-from-bottom-2 ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}
                >
                  <img
                    src={uploadedImage}
                    alt="Preview"
                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover"
                  />
                  <span className="text-xs text-slate-400 flex-1 truncate font-medium">
                    Image attached
                  </span>
                  <button
                    onClick={() => setUploadedImage(null)}
                    className="p-1 hover:bg-slate-200 rounded-lg text-rose-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}

              <div
                className={`border rounded-2xl p-1.5 flex items-center gap-1 shadow-2xl focus-within:border-teal-500/40 transition-all ${isDark ? "bg-slate-900/90 border-slate-700/50" : "bg-slate-50 border-slate-200"}`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                  accept="image/*"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-slate-400 hover:text-teal-500 transition-colors shrink-0"
                >
                  <Paperclip size={18} />
                </button>

                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                  }}
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    (e.preventDefault(), sendMessage())
                  }
                  placeholder={
                    isRecording ? "Listening..." : "Describe symptoms..."
                  }
                  style={{ maxHeight: "120px" }}
                  className={`flex-1 bg-transparent border-none focus:ring-0 text-xs sm:text-sm py-3 resize-none no-scrollbar outline-none transition-all ${isRecording ? "placeholder-emerald-400" : "placeholder-slate-400"} ${isDark ? "text-white" : "text-slate-900"}`}
                />

                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`relative p-2 sm:p-2.5 rounded-xl transition-all shrink-0 flex items-center justify-center ${
                    isRecording
                      ? "bg-emerald-500/10 text-emerald-500 shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                      : "text-slate-400 hover:text-teal-500"
                  }`}
                >
                  {isRecording && (
                    <span className="absolute top-1 right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                  <Mic
                    size={18}
                    className={isRecording ? "animate-pulse" : ""}
                  />
                </button>

                <button
                  onClick={() => sendMessage()}
                  disabled={(!inputText.trim() && !uploadedImage) || loading}
                  className="bg-teal-500 text-slate-900 p-2 sm:p-2.5 rounded-xl transition-all shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-50 shrink-0"
                >
                  <Send size={18} strokeWidth={3} />
                </button>
              </div>

              <p className="mt-3 text-[9px] lg:text-[10px] text-teal-500 font-bold text-center italic opacity-80 leading-relaxed border-t border-slate-800/10 pt-3">
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

const FirstAidView = ({ isDark }) => {
  const [selected, setSelected] = useState(null);

  const topics = [
    {
      id: "cpr",
      title: "CPR (Adult)",
      icon: HeartPulse,
      themeClasses: {
        bg: isDark ? "bg-rose-500/10" : "bg-rose-50",
        border: isDark ? "border-rose-500/30" : "border-rose-200",
        iconBg: "bg-rose-500/20",
        text: "text-rose-500",
      },
      short: "Cardiopulmonary Resuscitation",
      steps: [
        "Check the scene for safety, then check the person for responsiveness.",
        "Call emergency services (e.g., 911 or 108) immediately.",
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
        bg: isDark ? "bg-blue-500/10" : "bg-blue-50",
        border: isDark ? "border-blue-500/30" : "border-blue-200",
        iconBg: "bg-blue-500/20",
        text: "text-blue-500",
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
        bg: isDark ? "bg-red-500/10" : "bg-red-50",
        border: isDark ? "border-red-500/30" : "border-red-200",
        iconBg: "bg-red-500/20",
        text: "text-red-500",
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
        bg: isDark ? "bg-orange-500/10" : "bg-orange-50",
        border: isDark ? "border-orange-500/30" : "border-orange-200",
        iconBg: "bg-orange-500/20",
        text: "text-orange-500",
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
          className="flex items-center gap-2 text-slate-500 hover:text-teal-500 mb-6 transition-colors font-medium"
        >
          <ArrowLeft size={18} /> Back to First Aid Guide
        </button>
        <div
          className={`${selected.themeClasses.bg} border ${selected.themeClasses.border} rounded-3xl p-6 sm:p-8 backdrop-blur-md transition-colors duration-300`}
        >
          <div
            className={`flex items-center gap-4 mb-8 pb-6 border-b ${isDark ? "border-slate-700/50" : "border-slate-200"}`}
          >
            <div
              className={`p-4 ${selected.themeClasses.iconBg} rounded-2xl ${selected.themeClasses.text}`}
            >
              <selected.icon size={32} />
            </div>
            <div>
              <h2
                className={`text-2xl sm:text-3xl font-bold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {selected.title}
              </h2>
              <p className="text-sm sm:text-base text-slate-500">
                {selected.short}
              </p>
            </div>
          </div>
          <div className="space-y-4 sm:space-y-6">
            {selected.steps.map((step, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-4 p-4 sm:p-5 rounded-2xl border shadow-lg transition-colors duration-300 ${isDark ? "bg-[#111827]/80 border-slate-700/50" : "bg-white border-slate-100"}`}
              >
                <div
                  className={`w-8 h-8 shrink-0 rounded-full ${selected.themeClasses.iconBg} ${selected.themeClasses.text} flex items-center justify-center font-black text-sm`}
                >
                  {idx + 1}
                </div>
                <p
                  className={`leading-relaxed font-medium pt-1 text-sm sm:text-base ${isDark ? "text-slate-200" : "text-slate-700"}`}
                >
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
          <h2
            className={`text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            First Aid Guide
          </h2>
          <p className="text-slate-500">Emergency step-by-step instructions.</p>
        </div>
        <a
          href="tel:108"
          className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-500/20 active:scale-95"
        >
          <PhoneCall size={20} /> Emergency SOS (108)
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {topics.map((topic) => (
          <div
            key={topic.id}
            onClick={() => setSelected(topic)}
            className={`border rounded-2xl p-6 transition-all cursor-pointer group backdrop-blur-md shadow-lg ${isDark ? "bg-[#111827]/80 border-slate-700/50 hover:border-teal-500/30 hover:bg-slate-800/80" : "bg-white border-slate-200 hover:border-teal-500/50 hover:bg-slate-50"}`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-4 ${topic.themeClasses.iconBg} rounded-2xl ${topic.themeClasses.text} group-hover:scale-110 transition-transform`}
              >
                <topic.icon size={28} />
              </div>
              <div>
                <h3
                  className={`text-xl font-bold mb-1 transition-colors ${isDark ? "text-white group-hover:text-teal-400" : "text-slate-900 group-hover:text-teal-500"}`}
                >
                  {topic.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {topic.short}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex gap-4 backdrop-blur-md">
        <AlertCircle className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-amber-600 font-bold mb-1">Medical Disclaimer</h4>
          <p className="text-amber-700/80 text-xs sm:text-sm leading-relaxed">
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

const SidebarBtn = ({ icon: Icon, label, active, onClick, isDark }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium ${active ? "bg-teal-500/10 text-teal-500 border border-teal-500/20" : isDark ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200" : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"}`}
  >
    <Icon size={18} /> <span className="text-sm">{label}</span>
  </button>
);

const HistoryCard = ({ date, title, desc, onClick, onDelete, isDark }) => (
  <div
    onClick={onClick}
    className={`border rounded-2xl p-6 transition-all cursor-pointer flex items-center justify-between group backdrop-blur-md shadow-sm ${isDark ? "bg-slate-900/80 border-slate-700/50 hover:bg-slate-800/80 hover:border-teal-500/30" : "bg-white border-slate-200 hover:bg-slate-50 hover:border-teal-500/50"}`}
  >
    <div>
      <h4
        className={`font-bold text-lg mb-1 transition-colors ${isDark ? "text-white group-hover:text-teal-400" : "text-slate-900 group-hover:text-teal-500"}`}
      >
        {title}
      </h4>
      <p className="text-slate-500 text-sm mb-2">{desc}</p>
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {date}
      </span>
    </div>
    <div className="flex items-center gap-3">
      {onDelete && (
        <button
          onClick={onDelete}
          className="p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg transition-colors"
          title="Delete Chat"
        >
          <Trash2 size={18} />
        </button>
      )}
      <ChevronRight className="text-slate-400 group-hover:text-teal-500 transition-colors" />
    </div>
  </div>
);

const SavedCard = ({ title, date, icon: Icon, onClick, isDark }) => (
  <div
    onClick={onClick}
    className={`border rounded-2xl p-6 transition-all cursor-pointer flex items-start gap-4 backdrop-blur-md group ${isDark ? "bg-slate-900/80 border-slate-700/50 hover:border-teal-500/30" : "bg-white border-slate-200 hover:border-teal-500/50 shadow-sm"}`}
  >
    <div className="p-3 bg-teal-500/10 rounded-xl text-teal-500 group-hover:scale-110 transition-transform">
      <Icon size={24} />
    </div>
    <div>
      <h4
        className={`font-bold text-lg mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
      >
        {title}
      </h4>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {date}
      </p>
    </div>
  </div>
);

const FacilityCard = ({
  title,
  desc,
  icon: Icon,
  query,
  userAddress,
  isDark,
}) => {
  const location = userAddress ? `near ${userAddress}` : "near me";
  const mapUrl = `https://www.google.com/maps/search/${encodeURIComponent(query + " " + location)}`;

  return (
    <a
      href={mapUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`border rounded-2xl p-6 transition-all flex flex-col items-start gap-4 backdrop-blur-md group shadow-lg ${isDark ? "bg-[#111827]/80 border-slate-700/50 hover:border-teal-500/30 hover:-translate-y-1" : "bg-white border-slate-200 hover:border-teal-500/50 hover:-translate-y-1"}`}
    >
      <div className="p-3 bg-teal-500/10 rounded-xl text-teal-500 group-hover:scale-110 transition-transform">
        <Icon size={28} />
      </div>
      <div className="flex-1">
        <h4
          className={`font-bold text-xl mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
        >
          {title}
        </h4>
        <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
      </div>
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-teal-500 mt-2 opacity-80 group-hover:opacity-100 transition-opacity">
        Open Map <ChevronRight size={12} />
      </div>
    </a>
  );
};

const SettingToggle = ({ label, desc, checked, onChange, isDark }) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <span
          className={`font-bold text-lg block mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
        >
          {label}
        </span>
        <span className="text-slate-500 text-sm">{desc}</span>
      </div>
      <button
        onClick={onChange}
        className={`w-14 h-7 rounded-full transition-colors relative shadow-inner flex-shrink-0 ${checked ? "bg-teal-500" : "bg-slate-300"}`}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-md ${checked ? "left-8" : "left-1"}`}
        />
      </button>
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
  isDark,
}) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
      <Icon className="h-3 w-3" /> {label}
    </label>
    {editing ? (
      <input
        name={name}
        type={type}
        min={type === "number" ? "1" : undefined}
        onKeyDown={
          type === "number"
            ? (e) => {
                if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault();
              }
            : undefined
        }
        value={String(value || "")}
        onChange={onChange}
        className={`border rounded-xl py-3 px-4 text-sm focus:border-teal-400 outline-none transition-all ${isDark ? "bg-[#0B1120] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"} ${type === "number" ? "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" : ""}`}
      />
    ) : (
      <p
        className={`text-sm py-3 px-4 rounded-xl transition-colors duration-300 ${isDark ? "bg-slate-800/30 text-white" : "bg-slate-50 text-slate-900 border border-slate-100"}`}
      >
        {String(value || "—")}
      </p>
    )}
  </div>
);

const PasswordField = ({ label, value, show, onToggle, onChange, isDark }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
      {label}
    </label>
    <div className="relative">
      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <input
        type={show ? "text" : "password"}
        required
        value={String(value || "")}
        onChange={onChange}
        placeholder={`Enter ${label.toLowerCase()}`}
        className={`w-full border rounded-xl py-3 pl-12 pr-12 text-sm focus:border-teal-400 outline-none transition-all ${isDark ? "bg-[#0B1120] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-500"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
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
