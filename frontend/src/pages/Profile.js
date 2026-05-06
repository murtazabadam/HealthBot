import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  User,
  Mail,
  Phone,
  MapPin,
  Droplet,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowLeft,
  Edit3,
  Save,
  X,
  Shield,
} from "lucide-react";

const API = "https://healthbot-production-3c7d.up.railway.app";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false); // Added 3rd eye state
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    bloodGroup: "",
    address: "",
    phoneNumber: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    // Moved fetchProfile inside useEffect to fix ESLint warning
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setProfile(data);
        setFormData({
          name: data.name || "",
          age: data.age || "",
          gender: data.gender || "",
          bloodGroup: data.bloodGroup || "",
          address: data.address || "",
          phoneNumber: data.phoneNumber || "",
        });
      } catch (err) {
        setMessage({ text: err.message, type: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, navigate]);

  const handleSave = async () => {
    setSaving(true);
    setMessage({ text: "", type: "" });
    try {
      const res = await fetch(`${API}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setProfile((prev) => ({ ...prev, ...formData }));
      localStorage.setItem("user", JSON.stringify(data.user));
      setEditing(false);
      setMessage({ text: "Profile updated successfully!", type: "success" });
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ text: "New passwords do not match", type: "error" });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setMessage({
        text: "Password must be at least 8 characters",
        type: "error",
      });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage({ text: "Password changed successfully!", type: "success" });
      setShowPasswordForm(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <Activity className="h-10 w-10 text-teal-400 animate-pulse" />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0B1120] font-sans text-slate-50">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 lg:px-12 w-full bg-[#0B1120]/80 backdrop-blur-md border-b border-slate-800/50">
        <Link to="/" className="flex items-center gap-2">
          <Activity className="h-7 w-7 text-teal-400" />
          <span className="text-xl font-bold text-white">HealthBot</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to="/chat"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-teal-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Chat
          </Link>
          <button
            onClick={logout}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-10 z-10 relative">
        {/* Message */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm font-medium text-center ${
              message.type === "success"
                ? "bg-green-500/10 border border-green-500/30 text-green-400"
                : "bg-red-500/10 border border-red-500/30 text-red-400"
            }`}
          >
            {message.type === "success" && (
              <CheckCircle2 className="inline h-4 w-4 mr-2" />
            )}
            {message.text}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-[#111827]/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 mb-6">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
                <User className="h-8 w-8 text-teal-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {profile?.name}
                </h1>
                <p className="text-slate-400 text-sm">{profile?.email}</p>
                <p className="text-xs text-teal-400 mt-1">
                  Member since{" "}
                  {new Date(profile?.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            {!editing ? (
              <button
                onClick={() => {
                  setEditing(true);
                  setMessage({ text: "", type: "" });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-teal-500/10 border border-teal-500/30 text-teal-400 rounded-xl text-sm font-bold hover:bg-teal-500/20 transition-all"
              >
                <Edit3 className="h-4 w-4" /> Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-slate-900 rounded-xl text-sm font-bold hover:bg-teal-400 transition-all disabled:opacity-50"
                >
                  <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setMessage({ text: "", type: "" });
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-600 transition-all"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
              </div>
            )}
          </div>

          {/* Profile Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Name */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <User className="h-3 w-3" /> Full Name
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="bg-[#0B1120] border border-slate-700 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-teal-400 transition-all"
                />
              ) : (
                <p className="text-white text-sm py-3 px-4 bg-slate-800/30 rounded-xl">
                  {profile?.name || "—"}
                </p>
              )}
            </div>

            {/* Email (readonly) */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Mail className="h-3 w-3" /> Email Address
              </label>
              <p className="text-slate-400 text-sm py-3 px-4 bg-slate-800/30 rounded-xl flex items-center gap-2">
                {profile?.email}
                {profile?.isVerified && (
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                )}
              </p>
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Phone className="h-3 w-3" /> Phone Number
              </label>
              {editing ? (
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  placeholder="Enter phone number"
                  className="bg-[#0B1120] border border-slate-700 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-teal-400 transition-all"
                />
              ) : (
                <p className="text-white text-sm py-3 px-4 bg-slate-800/30 rounded-xl">
                  {profile?.phoneNumber || "—"}
                </p>
              )}
            </div>

            {/* Age */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="h-3 w-3" /> Age
              </label>
              {editing ? (
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) =>
                    setFormData({ ...formData, age: e.target.value })
                  }
                  placeholder="Enter age"
                  className="bg-[#0B1120] border border-slate-700 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-teal-400 transition-all"
                />
              ) : (
                <p className="text-white text-sm py-3 px-4 bg-slate-800/30 rounded-xl">
                  {profile?.age || "—"}
                </p>
              )}
            </div>

            {/* Gender */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <User className="h-3 w-3" /> Gender
              </label>
              {editing ? (
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                  className="bg-[#0B1120] border border-slate-700 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-teal-400 transition-all"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <p className="text-white text-sm py-3 px-4 bg-slate-800/30 rounded-xl capitalize">
                  {profile?.gender || "—"}
                </p>
              )}
            </div>

            {/* Blood Group */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Droplet className="h-3 w-3" /> Blood Group
              </label>
              {editing ? (
                <select
                  value={formData.bloodGroup}
                  onChange={(e) =>
                    setFormData({ ...formData, bloodGroup: e.target.value })
                  }
                  className="bg-[#0B1120] border border-slate-700 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-teal-400 transition-all"
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
                <p className="text-white text-sm py-3 px-4 bg-slate-800/30 rounded-xl">
                  {profile?.bloodGroup || "—"}
                </p>
              )}
            </div>

            {/* Address */}
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="h-3 w-3" /> Address
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Enter address"
                  className="bg-[#0B1120] border border-slate-700 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-teal-400 transition-all"
                />
              ) : (
                <p className="text-white text-sm py-3 px-4 bg-slate-800/30 rounded-xl">
                  {profile?.address || "—"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-[#111827]/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-teal-400" />
              <h2 className="text-lg font-bold text-white">Security</h2>
            </div>
            <button
              onClick={() => {
                setShowPasswordForm(!showPasswordForm);
                setMessage({ text: "", type: "" });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 border border-slate-600 text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-700 transition-all"
            >
              <Lock className="h-4 w-4" />
              {showPasswordForm ? "Cancel" : "Change Password"}
            </button>
          </div>

          {!showPasswordForm ? (
            <p className="text-slate-400 text-sm">
              Your password is securely encrypted. Click "Change Password" to
              update it.
            </p>
          ) : (
            <form
              onSubmit={handlePasswordChange}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type={showCurrentPw ? "text" : "password"}
                    required
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    placeholder="Enter current password"
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3 pl-12 pr-12 text-sm text-white focus:outline-none focus:border-teal-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type={showNewPw ? "text" : "password"}
                    required
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    placeholder="Enter new password (min 8 chars)"
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3 pl-12 pr-12 text-sm text-white focus:outline-none focus:border-teal-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type={showConfirmPw ? "text" : "password"}
                    required
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Confirm new password"
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3 pl-12 pr-12 text-sm text-white focus:outline-none focus:border-teal-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordData.confirmPassword && (
                  <p
                    className={`text-xs ${passwordData.newPassword === passwordData.confirmPassword ? "text-green-400" : "text-red-400"}`}
                  >
                    {passwordData.newPassword === passwordData.confirmPassword
                      ? "✓ Passwords match"
                      : "✗ Passwords do not match"}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-900 font-bold py-3 rounded-xl transition-all disabled:opacity-50 mt-2"
              >
                {saving ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
