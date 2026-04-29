import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, Mail, ArrowLeft, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes (300 seconds)
  
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  // Timer logic for Step 2
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
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- Step 1: Send OTP to Email ---
  const handleSendEmail = async (e) => {
    if (e) e.preventDefault();
    if (!email) return setErrorMessage("Please enter your email.");
    
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("https://healthbot-production-3c7d.up.railway.app/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) throw new Error("Failed to send OTP.");
      
      setStep(2);
      setTimeLeft(300); // Reset timer to 5:00
      setOtp(["", "", "", "", "", ""]); // Clear OTP boxes
    } catch (err) {
      setErrorMessage("Service Error: Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // --- Step 2: Handle 6-Box OTP Input ---
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
    if (otpString.length < 6) return setErrorMessage("Please enter the 6-digit code.");

    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("https://healthbot-production-3c7d.up.railway.app/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otpString }),
      });
      if (!res.ok) throw new Error("Invalid verification code.");
      
      setStep(3); // Move to set new password
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Step 3: Reset Password ---
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return setErrorMessage("Passwords do not match.");
    
    setLoading(true);
    setErrorMessage("");
    try {
      // NOTE: You may need to adjust this endpoint to match your specific backend reset route
      const res = await fetch("https://healthbot-production-3c7d.up.railway.app/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), newPassword: password }),
      });
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
    <div className="min-h-screen bg-[#020817] font-sans text-slate-50 relative flex flex-col items-center justify-center overflow-hidden">
      {/* Background Wavy Pattern & Glow */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,500 C200,400 300,600 500,500 C700,400 800,600 1000,500" stroke="#0ea5e9" fill="transparent" strokeWidth="0.5" />
          <path d="M0,520 C200,420 300,620 500,520 C700,420 800,620 1000,520" stroke="#0ea5e9" fill="transparent" strokeWidth="0.5" />
        </svg>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <nav className="absolute top-0 w-full flex items-center justify-between px-6 py-6 lg:px-16 max-w-[1400px] z-50">
        <Link to="/" className="flex items-center gap-2">
          <Activity className="h-8 w-8 text-cyan-400" />
          <span className="text-3xl font-bold tracking-tight text-white italic">HealthBot</span>
        </Link>
      </nav>

      {/* Main Card */}
      <main className="relative z-10 w-full max-w-[500px] px-4 pt-20">
        <div className="bg-[#020817]/90 backdrop-blur-xl border border-cyan-500/30 rounded-[40px] p-8 sm:p-12 shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col items-center w-full">
          
          {errorMessage && (
            <div className="mb-6 w-full bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-xl text-center font-bold">
              {errorMessage}
            </div>
          )}

          {/* ================= STEP 1: REQUEST OTP ================= */}
          {step === 1 && (
            <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 rounded-full border border-cyan-500/40 bg-cyan-500/5 flex items-center justify-center mb-6">
                <Lock className="h-10 w-10 text-cyan-400" strokeWidth={1.5} />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2 text-center">Reset Password</h1>
              <p className="text-slate-400 text-sm text-center mb-8">Enter your registered email address to receive a verification code.</p>

              <form className="w-full flex flex-col gap-6" onSubmit={handleSendEmail}>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-200">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <input 
                      type="email" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email" 
                      className="w-full bg-[#0B1120] border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500/50" 
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full py-4 mt-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2">
                  {loading ? "Sending..." : "Send OTP"} <span className="text-2xl leading-none">→</span>
                </button>
              </form>
            </div>
          )}

          {/* ================= STEP 2: VERIFY OTP (SPLIT 6-BOXES) ================= */}
          {step === 2 && (
            <div className="w-full flex flex-col items-center animate-in slide-in-from-right-8 duration-300">
              <div className="w-20 h-20 rounded-full border border-cyan-500/40 bg-cyan-500/5 flex items-center justify-center mb-6">
                <Mail className="h-10 w-10 text-cyan-400" strokeWidth={1.5} />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2 text-center">Verify Your Email</h1>
              <p className="text-slate-400 text-sm text-center mb-8 leading-relaxed">
                We have sent a 6-digit OTP to <br/><span className="text-cyan-400 font-medium">{email}</span>
              </p>

              <form className="w-full flex flex-col gap-6" onSubmit={handleVerifyOTP}>
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-semibold text-slate-200">Enter OTP</label>
                  <div className="flex justify-between gap-2 sm:gap-3">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-10 h-12 sm:w-12 sm:h-14 bg-[#0B1120] border border-slate-700 rounded-lg sm:rounded-xl text-center text-xl sm:text-2xl text-white font-semibold focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all"
                      />
                    ))}
                  </div>
                </div>
                
                <p className="text-center text-sm text-slate-400 mt-2">
                  OTP will expire in <span className="text-cyan-400 font-medium tracking-widest">{formatTime(timeLeft)}</span>
                </p>

                <button type="submit" disabled={loading} className="w-full py-4 mt-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2">
                  {loading ? "Verifying..." : "Verify OTP"} <span className="text-2xl leading-none">→</span>
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-400">
                  Didn't receive the code? {" "}
                  {timeLeft > 0 ? (
                    <span className="text-slate-500 font-medium">Resend OTP in {formatTime(timeLeft)}</span>
                  ) : (
                    <button onClick={() => handleSendEmail()} className="text-cyan-400 font-bold hover:underline">Resend OTP</button>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* ================= STEP 3: CREATE NEW PASSWORD ================= */}
          {step === 3 && (
            <div className="w-full flex flex-col items-center animate-in slide-in-from-right-8 duration-300">
              <div className="w-20 h-20 rounded-full border border-cyan-500/40 bg-cyan-500/5 flex items-center justify-center mb-6">
                <Lock className="h-10 w-10 text-cyan-400" strokeWidth={1.5} />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2 text-center">New Password</h1>
              <p className="text-slate-400 text-sm text-center mb-8">Secure your account with a new password.</p>

              <form className="w-full flex flex-col gap-6" onSubmit={handleResetPassword}>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-200">New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-cyan-400" />
                    <input type={showPassword ? "text" : "password"} required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#0B1120] border border-slate-800 rounded-xl py-3.5 pl-12 pr-12 text-white focus:outline-none focus:border-cyan-500/50" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-200">Confirm Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-cyan-400" />
                    <input type={showConfirmPassword ? "text" : "password"} required placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-[#0B1120] border border-slate-800 rounded-xl py-3.5 pl-12 pr-12 text-white focus:outline-none focus:border-cyan-500/50" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full py-4 mt-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2">
                  {loading ? "Updating..." : "Reset Password"} <span className="text-2xl leading-none">→</span>
                </button>
              </form>
            </div>
          )}

          {/* ================= STEP 4: SUCCESS ================= */}
          {step === 4 && (
            <div className="w-full flex flex-col items-center py-6 animate-in zoom-in duration-300">
              <CheckCircle2 className="h-20 w-20 text-emerald-400 mb-6" strokeWidth={1.5} />
              <h1 className="text-3xl font-bold text-white mb-3 text-center">Password Reset!</h1>
              <p className="text-slate-400 text-sm text-center">Your password has been successfully updated. Redirecting to login...</p>
            </div>
          )}

          {/* Bottom Back Link (Hidden on Success Screen) */}
          {step < 4 && (
            <div className="mt-8 text-center w-full">
              <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-cyan-400 font-medium transition-colors">
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full pb-8 pt-6 flex flex-col items-center gap-3 z-10 text-center text-slate-400 text-sm">
        <p>© 2026 HealthBot AI. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="text-cyan-500 hover:text-cyan-400 transition-colors">Privacy Policy</Link>
          <span className="text-slate-800">|</span>
          <Link to="/terms" className="text-cyan-500 hover:text-cyan-400 transition-colors">Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
}