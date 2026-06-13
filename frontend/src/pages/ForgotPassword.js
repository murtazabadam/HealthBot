import React, { useState, useEffect } from "react";

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  // 1. Logic to Send OTP
  const handleSendOtp = async () => {
    setLoading(true);
    try {
      // REPLACE with your actual backend endpoint
      const response = await fetch("YOUR_BACKEND_URL/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStep(2);
        setTimeLeft(45);
      } else {
        alert("Failed to send OTP. Please check the email.");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Logic to Resend OTP
  const handleResendOtp = async () => {
    handleSendOtp();
  };

  // 3. Logic to Verify OTP
  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      // REPLACE with your actual backend endpoint
      const response = await fetch("YOUR_BACKEND_URL/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      if (response.ok) {
        setStep(3); // Navigate to Password Reset step
      } else {
        alert("Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] font-sans text-slate-50 flex flex-col items-center">
      <main className="flex-1 flex flex-col justify-center items-center w-full px-4 my-10">
        <div className="bg-[#111827]/80 border border-slate-700/50 rounded-3xl p-8 w-full max-w-[480px] shadow-2xl">
          {step === 1 && (
            <div className="flex flex-col items-center">
              <h1 className="text-2xl font-bold mb-6">Forgot Password</h1>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full bg-[#1F2937] p-4 rounded-xl border border-slate-600 mb-6 focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full bg-teal-500 text-slate-900 font-bold py-3 rounded-xl hover:bg-teal-400 transition disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center">
              <h1 className="text-2xl font-bold mb-4">Verify OTP</h1>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                className="w-full bg-[#1F2937] p-4 rounded-xl border border-slate-600 mb-4 text-center tracking-widest text-xl focus:outline-none"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />

              <div className="mt-2 text-sm text-slate-400">
                Didn't receive the code?{" "}
                <button
                  onClick={handleResendOtp}
                  disabled={timeLeft > 0 || loading}
                  className={`font-bold ${timeLeft > 0 ? "text-slate-600" : "text-teal-400 hover:text-teal-300"}`}
                >
                  {timeLeft > 0 ? `Resend in ${timeLeft}s` : "Resend"}
                </button>
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-full mt-6 bg-teal-500 text-slate-900 font-bold py-3 rounded-xl hover:bg-teal-400 transition disabled:opacity-50"
              >
                {loading ? "Verifying..." : "VERIFY OTP"}
              </button>
            </div>
          )}

          <div className="mt-8 text-center text-xs text-slate-500">
            <p>© 2026 HealthBot. All rights reserved.</p>
            <div className="mt-2 flex justify-center gap-4">
              <a href="/privacy" className="hover:text-teal-400">
                Privacy Policy
              </a>
              <span>|</span>
              <a href="/terms" className="hover:text-terms">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
