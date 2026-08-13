import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Activity, ShieldCheck, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { API } from "../config";

// This page recovers an account that was started (via /send-otp on the
// Register page) but never finished — e.g. the user closed the tab before
// submitting the final "create account" step, or their OTP expired. Login.js
// links here whenever the backend responds with requiresVerification: true.
//
// Because /api/auth/register requires { name, email, password, otp } all in
// one call (there is no separate "just mark this email verified" endpoint),
// this page collects whatever's missing (name/password) alongside the OTP,
// then completes registration in one shot — same contract Register.js step 2
// already uses.
export default function VerifyEmail() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";
  const prefillName = location.state?.name || "";
  const prefillPassword = location.state?.password || "";

  const maskEmail = (addr) => {
    if (!addr) return addr;
    const [namePart, domain] = addr.split("@");
    if (!domain) return addr;
    if (namePart.length <= 2) return `**@${domain}`;
    return `${namePart.substring(0, 2)}******${namePart.substring(namePart.length - 2)}@${domain}`;
  };

  // Send (or resend) the verification OTP. Used on mount and by the
  // "Resend" button.
  const sendOtp = async () => {
    if (!email) return;
    setResending(true);
    setErrorMessage("");
    try {
      const res = await fetch(API.RESEND_VERIFICATION, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Already verified — most likely they finished registering
        // elsewhere in the meantime. Send them to log in instead.
        if (/already verified/i.test(data.message || "")) {
          navigate("/login", { state: { verifiedElsewhere: true } });
          return;
        }
        throw new Error(data.message || "Failed to send verification code.");
      }

      setOtpSent(true);
      setTimeLeft(60);
      setOtp(["", "", "", "", "", ""]);
      setInfoMessage("A verification code has been sent to your email.");
    } catch (err) {
      setErrorMessage(err.message || "Failed to send verification code.");
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    if (prefillName) setName(prefillName);
    if (prefillPassword) setPassword(prefillPassword);
    if (email) sendOtp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleChange = (index, value) => {
    if (value && !/^\d+$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value !== "" && index < 5) inputRefs.current[index + 1].focus();
  };

  const handleBackspace = (index, e) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length < 6) {
      setErrorMessage("Please enter the complete 6-digit code.");
      return;
    }
    if (!name.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage("Please enter a password of at least 6 characters.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch(API.REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email,
          password,
          otp: otpString,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Verification failed.");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/chat");
    } catch (err) {
      setErrorMessage(err.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  // No email to verify (e.g. someone navigated here directly) — point them
  // to the normal entry points instead of showing a broken form.
  if (!email) {
    return (
      <div className="min-h-screen bg-[#0B1120] font-sans text-slate-50 flex flex-col items-center justify-center px-4 text-center">
        <ShieldCheck className="h-12 w-12 text-teal-400 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Nothing to verify</h1>
        <p className="text-slate-400 text-sm mb-8 max-w-sm">
          We don't have an email address to verify. Start a new signup, or log in if you already have an account.
        </p>
        <div className="flex gap-4">
          <Link to="/register" className="text-teal-400 font-semibold hover:underline">Sign up</Link>
          <span className="text-slate-700">|</span>
          <Link to="/login" className="text-teal-400 font-semibold hover:underline">Log in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120] font-sans text-slate-50 flex flex-col">
      <div className="w-full p-6 flex justify-start">
        <Link to="/" className="flex items-center gap-2">
          <Activity className="h-7 w-7 text-teal-400" />
          <span className="text-2xl font-bold text-white tracking-tight">
            HealthBot
          </span>
        </Link>
      </div>

      <main className="flex-1 flex flex-col justify-center items-center w-full px-4 max-w-[480px] mx-auto">
        <div className="bg-[#111827]/80 border border-slate-700/50 rounded-3xl p-8 w-full shadow-2xl relative">
          <Link
            to="/login"
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>

          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full border border-teal-500/30 bg-teal-500/10 flex items-center justify-center">
              <ShieldCheck className="h-10 w-10 text-teal-400" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-white mb-3">
            Verify your Email
          </h1>
          <p className="text-slate-400 text-sm text-center mb-8">
            {otpSent ? "We sent a 6-digit code to" : "Sending a 6-digit code to"}
            <br />
            <span className="font-semibold text-white">{maskEmail(email)}</span>
          </p>

          {errorMessage && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 text-xs p-3 rounded-lg text-center font-bold">
              {errorMessage}
            </div>
          )}
          {!errorMessage && infoMessage && (
            <div className="mb-6 bg-teal-500/10 border border-teal-500/50 text-teal-400 text-xs p-3 rounded-lg text-center font-bold">
              {infoMessage}
            </div>
          )}

          <div className="flex justify-between gap-2 mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                ref={(el) => (inputRefs.current[index] = el)}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleBackspace(index, e)}
                className="w-12 h-16 bg-[#1F2937] border border-slate-600 rounded-xl text-center text-2xl font-bold text-white focus:border-teal-500 focus:outline-none"
              />
            ))}
          </div>

          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Name
              </label>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-teal-400 transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Set a password (6+ characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-teal-400 transition-all"
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
          </div>

          <button
            onClick={handleVerify}
            disabled={loading || otp.includes("")}
            className="w-full bg-gradient-to-r from-teal-500 to-blue-600 text-white font-bold py-4 rounded-xl hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Verifying..." : "VERIFY & CREATE ACCOUNT"}
          </button>

          <p className="text-center text-sm mt-6 text-slate-400">
            Didn't receive the code?{" "}
            <button
              type="button"
              onClick={sendOtp}
              className={`font-semibold ${timeLeft > 0 || resending ? "text-slate-600" : "text-teal-400"}`}
              disabled={timeLeft > 0 || resending}
            >
              {resending ? "Sending..." : timeLeft > 0 ? `Resend in ${timeLeft}s` : "Resend"}
            </button>
          </p>
        </div>

        <div className="mt-8 text-center text-xs text-slate-500 pb-8">
          <p>© 2026 HealthBot. All rights reserved.</p>
          <div className="mt-2 flex justify-center gap-4">
            <span>Privacy Policy</span>
            <span>|</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </main>
    </div>
  );
}