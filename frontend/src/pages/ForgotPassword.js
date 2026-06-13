import React, { useState, useEffect, useRef } from "react";
import { Activity } from "lucide-react";

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const inputRefs = useRef([]);

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

  const handleSendEmail = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStep(2);
      setTimeLeft(45); // Set to 45s as per your reference image
      setOtp(["", "", "", "", "", ""]);
    } catch (err) {
      setError("Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError("");
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setTimeLeft(45);
      setOtp(["", "", "", "", "", ""]);
    } catch (err) {
      setError("Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] font-sans text-slate-50 flex flex-col items-center">
      <nav className="flex items-center gap-2 p-6 w-full max-w-lg">
        <Activity className="h-7 w-7 text-teal-400" />
        <span className="text-2xl font-bold text-white">HealthBot</span>
      </nav>

      <main className="flex-1 flex flex-col justify-center items-center w-full px-4 my-10">
        <div className="bg-[#111827]/80 border border-slate-700/50 rounded-3xl p-8 w-full max-w-[480px] shadow-2xl">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-xs p-3 rounded-xl text-center font-bold mb-6">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col items-center">
              <h1 className="text-2xl font-bold mb-6">Forgot Password</h1>
              <form onSubmit={handleSendEmail} className="w-full">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3 px-4 text-white focus:border-teal-400 outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 bg-teal-500 text-slate-900 font-bold py-3 rounded-xl"
                >
                  {loading ? "Sending..." : "Send OTP"}
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center">
              <h1 className="text-2xl font-bold mb-6">Verify OTP</h1>
              <div className="flex gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-10 h-12 bg-[#0B1120] border border-slate-700 rounded-lg text-center text-white focus:border-teal-400 outline-none"
                  />
                ))}
              </div>

              {/* Matching the UI from IMG-20260613-WA0004.jpg */}
              <div className="mt-4 text-sm text-slate-400">
                Didn't receive the code?{" "}
                <button
                  onClick={handleResendOtp}
                  disabled={timeLeft > 0 || loading}
                  className={`font-bold ${
                    timeLeft > 0
                      ? "text-slate-600 cursor-not-allowed"
                      : "text-teal-400 hover:text-teal-300"
                  }`}
                >
                  {timeLeft > 0 ? `Resend in ${timeLeft}s` : "Resend"}
                </button>
              </div>

              <button
                onClick={() => setStep(3)}
                className="w-full mt-6 bg-teal-500 text-slate-900 font-bold py-3 rounded-xl"
              >
                VERIFY & CREATE ACCOUNT
              </button>

              {/* Footer from IMG-20260613-WA0004.jpg */}
              <div className="mt-8 text-center text-xs text-slate-500">
                <p>© 2026 HealthBot. All rights reserved.</p>
                <div className="mt-2 flex justify-center gap-4">
                  <a href="/privacy" className="hover:text-teal-400">
                    Privacy Policy
                  </a>
                  <span>|</span>
                  <a href="/terms" className="hover:text-teal-400">
                    Terms of Service
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
