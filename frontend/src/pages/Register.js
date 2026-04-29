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
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function Register() {
  const [regStep, setRegStep] = useState(1); // 1: Identity, 2: OTP, 3: Security/Final
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    age: "",
    otp: "",
  });

  const navigate = useNavigate();

  // STEP 1: SEND OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.name) {
      setErrorMessage("Please fill in your name and email.");
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
        throw new Error(
          data.message || "Failed to send OTP. Please check your connection.",
        );

      setRegStep(2); // Move to OTP tab
    } catch (err) {
      setErrorMessage(
        err.message || "Failed to fetch. Ensure the backend server is online.",
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: VERIFY OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!formData.otp) {
      setErrorMessage("Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch(
        "https://healthbot-production-3c7d.up.railway.app/api/auth/verify-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, otp: formData.otp }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid or expired OTP.");

      setRegStep(3); // Move to Password/Age tab
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: FINAL REGISTRATION
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
          {/* Back Button for multi-step */}
          {regStep > 1 && (
            <button
              onClick={() => setRegStep(regStep - 1)}
              className="absolute top-8 left-8 text-slate-500 hover:text-teal-400 transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-widest"
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}

          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold mb-3 tracking-tight">
              {regStep === 1 && "Create Account"}
              {regStep === 2 && "Verify Email"}
              {regStep === 3 && "Final Details"}
            </h2>
            <p className="text-slate-400 text-sm">
              {regStep === 1 && "Start your journey to better health with AI."}
              {regStep === 2 &&
                `We've sent a 6-digit code to ${formData.email}`}
              {regStep === 3 && "Secure your account and provide your age."}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-4 rounded-xl text-center font-medium animate-pulse">
              {errorMessage}
            </div>
          )}

          {/* STEP 1: IDENTITY */}
          {regStep === 1 && (
            <form className="flex flex-col gap-6" onSubmit={handleSendOTP}>
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
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-2xl py-4 pl-14 pr-4 text-base focus:border-teal-400 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest ml-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-2xl py-4 pl-14 pr-4 text-base focus:border-teal-400 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-teal-400 text-[#0B1120] font-extrabold rounded-2xl uppercase tracking-[0.1em] text-lg hover:bg-teal-300 transition-all shadow-lg shadow-teal-500/10 disabled:opacity-50"
              >
                {loading ? "Sending..." : "SEND OTP"}
              </button>
            </form>
          )}

          {/* STEP 2: VERIFICATION */}
          {regStep === 2 && (
            <form
              className="flex flex-col gap-6 animate-in fade-in zoom-in duration-300"
              onSubmit={handleVerifyOTP}
            >
              <div className="flex flex-col gap-3">
                <div className="w-16 h-16 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-teal-500/20">
                  <ShieldCheck className="text-teal-400 h-8 w-8" />
                </div>
                <label className="text-[11px] font-bold text-teal-400 uppercase tracking-widest text-center">
                  Verification Code
                </label>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="0 0 0 0 0 0"
                  required
                  autoFocus
                  onChange={(e) =>
                    setFormData({ ...formData, otp: e.target.value })
                  }
                  className="w-full bg-teal-500/5 border-2 border-teal-500/30 rounded-2xl py-5 px-6 text-center text-3xl font-mono tracking-[0.5em] focus:border-teal-400 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-teal-400 text-[#0B1120] font-extrabold rounded-2xl uppercase tracking-[0.1em] text-lg hover:bg-teal-300 transition-all shadow-lg shadow-teal-500/10 disabled:opacity-50"
              >
                {loading ? "Verifying..." : "VERIFY OTP"}
              </button>

              <p className="text-center text-xs text-slate-500 font-medium">
                Didn't receive the code?
                <button
                  type="button"
                  onClick={handleSendOTP}
                  className="text-teal-400 hover:underline ml-1 uppercase font-bold"
                >
                  Resend
                </button>
              </p>
            </form>
          )}

          {/* STEP 3: SECURITY & FINAL */}
          {regStep === 3 && (
            <form
              className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300"
              onSubmit={handleRegister}
            >
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl mb-2">
                <CheckCircle2 className="text-emerald-400 h-5 w-5" />
                <span className="text-emerald-400 text-xs font-bold uppercase">
                  Email Verified Successfully
                </span>
              </div>

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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-teal-400 text-[#0B1120] font-extrabold rounded-2xl uppercase tracking-[0.2em] text-xl hover:bg-teal-300 transition-all mt-4"
              >
                {loading ? "Creating..." : "CREATE ACCOUNT"}
              </button>
            </form>
          )}

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
