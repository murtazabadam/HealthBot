import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Send
} from "lucide-react";
import { API } from "../config";

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [timeLeft, setTimeLeft] = useState(0);
  const [resetToken, setResetToken] = useState("");
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  // Timer countdown for Resend OTP
  useEffect(() => {
    let interval;
    if (timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timeLeft]);

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value !== "" && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Step 1 — Send OTP
  const handleSendEmail = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API.FORGOT_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP.");
      
      setStep(2);
      setTimeLeft(60);
      setOtp(["", "", "", "", "", ""]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API.FORGOT_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (!res.ok) throw new Error("Failed to resend OTP.");
      
      setTimeLeft(60);
      setOtp(["", "", "", "", "", ""]);
      setError("A new OTP has been sent to your email."); // Show success as a message
    } catch (err) {
      setError("Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length < 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API.VERIFY_OTP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otpString }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid OTP.");
      
      setResetToken(data.resetToken);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3 — Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API.RESET_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), resetToken, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Reset failed.");
      
      setStep(4);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] font-sans text-slate-50 relative flex flex-col items-center overflow-x-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 flex items-center justify-start px-6 py-6 lg:px-12 w-full bg-[#0B1120]/80 backdrop-blur-md border-b border-slate-800/50">
        <Link to="/" className="flex items-center gap-2">
          <Activity className="h-7 w-7 text-teal-400" />
          <span className="text-2xl font-bold tracking-tight text-white">
            HealthBot
          </span>
        </Link>
      </nav>

      <main className="flex-1 flex flex-col justify-center items-center w-full px-4 z-10 my-10">
        <div className="bg-[#111827]/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 sm:p-12 w-full max-w-[550px] shadow-2xl relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />

          {error && (
            <div className={`mb-6 border text-xs p-4 rounded-xl text-center font-bold animate-pulse ${error.includes("A new OTP") ? "bg-teal-500/10 border-teal-500/50 text-teal-400" : "bg-red-500/10 border-red-500/50 text-red-400"}`}>
              {error}
            </div>
          )}

          {step === 1 && (
            /* =========================================
               STEP 1: ENTER EMAIL
               ========================================= */
            <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <h1 className="text-3xl font-bold text-white mb-2 text-center tracking-tight">
                Forgot Password
              </h1>
              <p className="text-slate-400 text-sm text-center mb-8">
                Enter your registered email address.<br/>
                We'll send a verification code to reset your password.
              </p>
              
              <form className="w-full flex flex-col gap-6" onSubmit={handleSendEmail}>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full bg-[#1F2937] border border-slate-600 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 transition-all"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-slate-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                  {loading ? "Sending..." : "Send OTP"}
                </button>
              </form>

              <div className="my-6 flex items-center gap-4 w-full">
                <div className="flex-1 h-px bg-slate-700"></div>
                <span className="text-slate-500 text-sm font-bold tracking-wider">OR</span>
                <div className="flex-1 h-px bg-slate-700"></div>
              </div>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-teal-400 hover:text-teal-300 font-semibold transition"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </div>
          )}

          {step === 2 && (
            /* =========================================
               STEP 2: VERIFY OTP (As per screenshot)
               ========================================= */
            <form onSubmit={handleVerifyOTP} className="flex flex-col w-full animate-in fade-in slide-in-from-right-4 duration-500">
              
              {/* Shield */}
              <div className="w-20 h-20 bg-teal-500/10 rounded-full flex items-center justify-center border border-teal-500/30 mb-6 mx-auto">
                <ShieldCheck className="h-10 w-10 text-teal-400" />
              </div>

              {/* Text */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">
                  Verify your Email
                </h2>
                <p className="text-slate-400 text-sm">
                  We sent a 6-digit code to <br />
                  <span className="text-white font-bold">{email}</span>
                </p>
              </div>

              {/* OTP Inputs */}
              <div className="flex gap-2 sm:gap-4 justify-center w-full mb-8">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputRefs.current[i] = el)}
                    type="text"
                    maxLength="1"
                    value={d}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 sm:w-14 sm:h-16 bg-transparent border border-slate-700 rounded-xl text-center text-white font-bold text-2xl focus:border-teal-400 outline-none transition-all"
                  />
                ))}
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-400 to-blue-500 text-slate-900 font-extrabold py-4 rounded-xl shadow-lg uppercase tracking-wide hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? "VERIFYING..." : "VERIFY OTP"}
              </button>

              {/* Resend Text */}
              <div className="mt-8 text-center">
                <p className="text-sm text-slate-400 font-medium">
                  Didn't receive the code?{" "}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={timeLeft > 0 || loading}
                    className={`font-bold transition-colors ${
                      timeLeft > 0
                        ? "text-slate-500 cursor-not-allowed"
                        : "text-teal-400 hover:text-teal-300"
                    }`}
                  >
                    {timeLeft > 0 ? `Resend in ${timeLeft}s` : "Resend"}
                  </button>
                </p>
              </div>
            </form>
          )}

          {step === 3 && (
            /* =========================================
               STEP 3: NEW PASSWORD
               ========================================= */
            <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="w-16 h-16 rounded-full border border-teal-500/30 bg-teal-500/10 flex items-center justify-center mb-6">
                <Lock className="h-8 w-8 text-teal-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2 text-center tracking-tight">
                New Password
              </h1>
              <p className="text-slate-400 text-sm text-center mb-8">
                Secure your account with a strong new password.
              </p>
              
              <form className="w-full flex flex-col gap-6" onSubmit={handleResetPassword}>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Create password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3.5 pl-12 pr-12 text-sm text-white focus:outline-none focus:border-teal-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3.5 pl-12 pr-12 text-sm text-white focus:outline-none focus:border-teal-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-gradient-to-r from-teal-400 to-blue-500 text-slate-900 font-extrabold py-4 rounded-xl shadow-lg uppercase tracking-wide hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? "UPDATING..." : "RESET PASSWORD"}
                </button>
              </form>
            </div>
          )}

          {step === 4 && (
            /* =========================================
               STEP 4: SUCCESS
               ========================================= */
            <div className="w-full flex flex-col items-center py-6 animate-in zoom-in duration-500">
              <CheckCircle2 className="h-24 w-24 text-teal-400 mb-6 drop-shadow-[0_0_15px_rgba(45,212,191,0.4)]" />
              <h1 className="text-3xl font-bold text-white mb-4 text-center tracking-tight">
                Password Reset!
              </h1>
              <p className="text-slate-400 text-sm text-center leading-relaxed font-medium">
                Your password has been successfully updated.<br />
                Redirecting you to login...
              </p>
            </div>
          )}

        </div>
      </main>

      {/* Non-Clickable Footer */}
      <footer className="w-full pb-8 pt-4 flex flex-col items-center gap-3 z-10 text-center text-slate-500 text-xs font-medium">
        <p>© 2026 HealthBot. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <span>Privacy Policy</span>
          <span className="text-slate-700">|</span>
          <span>Terms of Service</span>
        </div>
      </footer>
    </div>
  );
}