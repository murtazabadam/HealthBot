import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Calendar,
} from "lucide-react";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    age: "",
    otp: "",
  });

  const navigate = useNavigate();

  const handleSendOTP = async () => {
    if (!formData.email) {
      setErrorMessage("Please enter your email first.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch(
        "https://healthbot-production-3c7d.up.railway.app/api/auth/send-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email }),
        },
      );

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to send OTP. Try again.");

      setOtpSent(true);
      setErrorMessage(""); // Clear error on success
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

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
      if (!res.ok) throw new Error(data.message || "Registration failed");

      navigate("/login");
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] font-sans text-slate-50 relative flex flex-col items-center overflow-x-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-6 lg:px-12 w-full z-50">
        <Link to="/" className="flex items-center gap-2">
          <Activity className="h-7 w-7 text-teal-400" />
          <span className="text-2xl font-bold tracking-tight text-white">
            HealthBot
          </span>
        </Link>
        <Link
          to="/login"
          className="px-6 py-2.5 text-sm font-bold text-white border border-teal-500 hover:bg-teal-500/10 rounded-xl transition-all"
        >
          Log In
        </Link>
      </nav>

      <main className="flex-1 flex flex-col justify-center items-center w-full px-4 z-10 my-10">
        <div className="bg-[#111827]/90 border border-slate-800 rounded-[2.5rem] p-8 sm:p-12 w-full max-w-[500px] shadow-2xl relative">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold mb-3 tracking-tight">
              Create Account
            </h2>
            <p className="text-slate-400 text-sm">
              Verified access to your personal AI Health Assistant.
            </p>
          </div>

          <form className="flex flex-col gap-6" onSubmit={handleRegister}>
            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-4 rounded-xl text-center font-medium animate-pulse">
                {errorMessage}
              </div>
            )}

            {/* Name Field */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest ml-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400" />
                <input
                  type="text"
                  placeholder="Enter full name"
                  required
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-[#0B1120] border border-slate-700 rounded-2xl py-4 pl-14 pr-4 text-base focus:border-teal-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest ml-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400" />
                <input
                  type="email"
                  placeholder="Enter email address"
                  required
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full bg-[#0B1120] border border-slate-700 rounded-2xl py-4 pl-14 pr-4 text-base focus:border-teal-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* Verify OTP Button */}
            <button
              type="button"
              onClick={handleSendOTP}
              disabled={loading || otpSent}
              className="w-full py-4 bg-teal-400 text-[#0B1120] font-extrabold rounded-2xl uppercase tracking-[0.1em] text-lg hover:bg-teal-300 transition-all shadow-lg shadow-teal-500/10 disabled:opacity-50"
            >
              {loading
                ? "Sending..."
                : otpSent
                  ? "OTP Sent Successfully"
                  : "Verify OTP"}
            </button>

            {otpSent && (
              <div className="flex flex-col gap-2 animate-in slide-in-from-top-2">
                <label className="text-[11px] font-bold text-teal-400 uppercase tracking-widest ml-1 text-center">
                  Enter Verification Code
                </label>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="0 0 0 0 0 0"
                  required
                  onChange={(e) =>
                    setFormData({ ...formData, otp: e.target.value })
                  }
                  className="w-full bg-teal-500/5 border-2 border-teal-500/30 rounded-2xl py-4 px-6 text-center text-3xl font-mono tracking-[0.5em] focus:border-teal-400 outline-none transition-all"
                />
              </div>
            )}

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest ml-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="•••••"
                  required
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
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

            {/* Confirm Password */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest ml-1">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  required
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full bg-[#0B1120] border border-slate-700 rounded-2xl py-4 pl-14 pr-12 text-base focus:border-teal-400 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Age Field */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest ml-1">
                Age <span className="text-rose-500">*</span>
              </label>
              <div className="relative group">
                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400" />
                <input
                  type="number"
                  placeholder="Enter your age"
                  required
                  onChange={(e) =>
                    setFormData({ ...formData, age: e.target.value })
                  }
                  className="w-full bg-[#0B1120] border border-slate-700 rounded-2xl py-4 pl-14 pr-4 text-base focus:border-teal-400 outline-none transition-all"
                />
              </div>
            </div>

            {otpSent && (
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-teal-400 text-[#0B1120] font-extrabold rounded-2xl uppercase tracking-[0.2em] text-xl hover:bg-teal-300 transition-all mt-4"
              >
                {loading ? "Creating..." : "Create Account"}
              </button>
            )}
          </form>

          <p className="mt-10 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-teal-400 font-bold hover:underline ml-1"
            >
              Log In
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full pb-8 pt-4 flex flex-col items-center gap-3 z-10 text-center text-slate-500 text-xs font-medium">
        <p>© 2026 HealthBot. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link
            to="/privacy"
            className="hover:text-slate-400 transition-colors"
          >
            Privacy Policy
          </Link>
          <span className="text-slate-700">|</span>
          <Link to="/terms" className="hover:text-slate-400 transition-colors">
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
}
