import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Activity, ShieldCheck, ArrowLeft } from "lucide-react";

export default function VerifyEmail() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(57);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "your email";

  const maskEmail = (email) => {
    if (!email || email === "your email") return email;
    const [name, domain] = email.split("@");
    if (name.length <= 2) return `**@${domain}`;
    return `${name.substring(0, 2)}******${name.substring(name.length - 2)}@${domain}`;
  };

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input
    if (value !== "" && index < 5) inputRefs.current[index + 1].focus();
  };

  const handleBackspace = (index, e) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    // TODO: Connect your API
    setTimeout(() => {
      setLoading(false);
      navigate("/chat");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0B1120] font-sans text-slate-50 flex flex-col items-center">
      <nav className="w-full p-6">
        <Link to="/" className="flex items-center gap-2">
          <Activity className="h-7 w-7 text-teal-400" />
          <span className="text-2xl font-bold text-white">HealthBot</span>
        </Link>
      </nav>

      <main className="flex-1 flex flex-col justify-center items-center w-full px-4 max-w-[480px]">
        <div className="bg-[#111827]/80 border border-slate-700/50 rounded-3xl p-8 w-full shadow-2xl relative">
          <Link
            to="/login"
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to details
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
            We sent a 6-digit code to
            <br />
            <span className="font-semibold text-white">{maskEmail(email)}</span>
          </p>

          <div className="flex justify-between gap-2 mb-8">
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
              className={`font-semibold ${timeLeft > 0 ? "text-slate-600" : "text-teal-400"}`}
              disabled={timeLeft > 0}
            >
              {timeLeft > 0 ? `Resend in ${timeLeft}s` : "Resend"}
            </button>
          </p>
        </div>

        <div className="mt-8 text-center text-xs text-slate-500">
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
