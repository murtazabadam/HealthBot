import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  Mail,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP (Split Screen), 3: New Password, 4: Success
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(299); // 04:59

  const navigate = useNavigate();
  const inputRefs = useRef([]);

  // Timer logic for Step 2 (OTP Verification)
  useEffect(() => {
    let timer;
    if (step === 2 && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // --- Step 1: Send OTP to Email ---
  const handleSendEmail = async (e) => {
    if (e) e.preventDefault();
    if (!email) return setErrorMessage("Please enter your email address.");

    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch(
        "https://healthbot-production-3c7d.up.railway.app/api/auth/send-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        },
      );
      if (!res.ok) throw new Error("Failed to send verification code.");

      setStep(2);
      setTimeLeft(299); // Reset timer to 04:59
      setOtp(["", "", "", "", "", ""]); // Clear boxes
    } catch (err) {
      setErrorMessage("Error: Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  // --- Step 2: 6-Box OTP Handlers ---
  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return; // Only allow numbers

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value !== "" && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Auto-focus previous input on backspace if current is empty
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length < 6)
      return setErrorMessage("Please enter the full 6-digit code.");

    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch(
        "https://healthbot-production-3c7d.up.railway.app/api/auth/verify-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), otp: otpString }),
        },
      );
      if (!res.ok) throw new Error("Invalid or expired code.");

      setStep(3); // Move to New Password screen
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Step 3: Reset Password ---
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword)
      return setErrorMessage("Passwords do not match.");
    if (password.length < 8)
      return setErrorMessage("Password must be at least 8 characters long.");

    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch(
        "https://healthbot-production-3c7d.up.railway.app/api/auth/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), newPassword: password }),
        },
      );
      if (!res.ok) throw new Error("Failed to reset password.");

      setStep(4); // Success screen
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] font-sans text-slate-50 relative flex flex-col items-center justify-center overflow-hidden">
      {/* Background Decor - Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Dotted Pattern Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Top Navbar */}
      <nav className="absolute top-0 w-full flex items-center justify-between px-6 py-6 lg:px-16 max-w-[1400px] z-50">
        <Link to="/" className="flex items-center gap-2">
          <Activity className="h-8 w-8 text-teal-400" />
          <span className="text-3xl font-bold tracking-tight text-white italic">
            HealthBot
          </span>
        </Link>
      </nav>

      {/* Main Card Container */}
      <main className="relative z-10 w-full max-w-[540px] px-4 pt-16">
        <div className="bg-[#111827]/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col items-center w-full relative">
          {/* Top border highlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />

          {errorMessage && (
            <div className="mb-6 w-full bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-4 rounded-xl text-center font-bold animate-pulse">
              {errorMessage}
            </div>
          )}

          {/* ================= STEP 1: REQUEST OTP ================= */}
          {step === 1 && (
            <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 rounded-full border border-teal-500/30 bg-teal-500/10 flex items-center justify-center mb-6">
                <Lock className="h-8 w-8 text-teal-400" strokeWidth={1.5} />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2 text-center">
                Forgot Password
              </h1>
              <p className="text-slate-400 text-sm text-center mb-8">
                Enter your registered email to reset your password.
              </p>

              <form
                className="w-full flex flex-col gap-6 text-left"
                onSubmit={handleSendEmail}
              >
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-teal-400 transition-all"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 bg-gradient-to-r from-teal-400 to-blue-500 text-slate-900 font-extrabold py-4 rounded-xl shadow-lg uppercase tracking-wide hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send OTP"}
                </button>
              </form>
            </div>
          )}

          {/* ================= STEP 2: VERIFY OTP (6-BOX SPLIT SCREEN) ================= */}
          {step === 2 && (
            <div className="w-full flex flex-col items-center animate-in slide-in-from-right-8 duration-300">
              <div className="w-16 h-16 rounded-full border border-teal-500/30 bg-teal-500/10 flex items-center justify-center mb-6">
                <Mail className="h-8 w-8 text-teal-400" strokeWidth={1.5} />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2 text-center">
                Verify Your Email
              </h1>
              <p className="text-slate-400 text-sm text-center mb-8 leading-relaxed">
                We have sent a 6-digit OTP to <br />
                <span className="text-teal-400 font-bold">{email}</span>
              </p>

              <form
                className="w-full flex flex-col gap-8 text-left"
                onSubmit={handleVerifyOTP}
              >
                <div className="flex flex-col gap-3 w-full">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Enter OTP
                  </label>
                  <div className="flex justify-between w-full gap-2 sm:gap-3">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-12 h-14 sm:w-14 sm:h-16 bg-[#0B1120] border border-slate-700 rounded-xl text-center text-2xl text-white font-bold focus:outline-none focus:border-teal-400 transition-all"
                      />
                    ))}
                  </div>
                </div>

                <p className="text-center text-sm text-slate-400">
                  OTP will expire in{" "}
                  <span className="text-teal-400 font-bold tracking-widest ml-1">
                    {formatTime(timeLeft)}
                  </span>
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-teal-400 to-blue-500 text-slate-900 font-extrabold py-4 rounded-xl shadow-lg uppercase tracking-wide hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm text-slate-400 font-medium">
                  Didn't receive the code?{" "}
                  {timeLeft > 0 ? (
                    <span className="text-slate-500 font-bold">Resend OTP</span>
                  ) : (
                    <button
                      onClick={() => handleSendEmail()}
                      className="text-teal-400 font-extrabold hover:underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* ================= STEP 3: CREATE NEW PASSWORD ================= */}
          {step === 3 && (
            <div className="w-full flex flex-col items-center animate-in slide-in-from-right-8 duration-300">
              <div className="w-16 h-16 rounded-full border border-teal-500/30 bg-teal-500/10 flex items-center justify-center mb-6">
                <ShieldCheck
                  className="h-8 w-8 text-teal-400"
                  strokeWidth={1.5}
                />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2 text-center">
                New Password
              </h1>
              <p className="text-slate-400 text-sm text-center mb-8">
                Secure your account with a strong new password.
              </p>

              <form
                className="w-full flex flex-col gap-6 text-left"
                onSubmit={handleResetPassword}
              >
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    New Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
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
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3.5 pl-12 pr-12 text-sm text-white focus:outline-none focus:border-teal-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 bg-gradient-to-r from-teal-400 to-blue-500 text-slate-900 font-extrabold py-4 rounded-xl shadow-lg uppercase tracking-wide hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Reset Password"}
                </button>
              </form>
            </div>
          )}

          {/* ================= STEP 4: SUCCESS ================= */}
          {step === 4 && (
            <div className="w-full flex flex-col items-center py-6 animate-in zoom-in duration-300">
              <CheckCircle2
                className="h-20 w-20 text-emerald-400 mb-6 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                strokeWidth={1.5}
              />
              <h1 className="text-3xl font-bold text-white mb-4 text-center">
                Password Reset!
              </h1>
              <p className="text-slate-400 text-sm text-center leading-relaxed font-medium">
                Your password has been successfully updated.
                <br />
                Redirecting you to login...
              </p>
            </div>
          )}

          {/* Bottom Back Link (Hidden on Success) */}
          {step < 4 && (
            <div className="mt-10 pt-6 border-t border-slate-800/60 w-full text-center">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-teal-400 font-extrabold transition-colors"
              >
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Page Footer (Matches Login Exactly) */}
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
