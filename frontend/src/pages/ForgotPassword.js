import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, Mail, Send, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Add your API call here
    console.log("Sending OTP to:", email);

    // Simulate API delay, then navigate to verify email
    setTimeout(() => {
      setLoading(false);
      navigate("/verify-email", { state: { email } });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0B1120] font-sans text-slate-50 flex flex-col">
      {/* Top Logo */}
      <div className="w-full p-6 flex justify-start">
        <Link to="/" className="flex items-center gap-2">
          <Activity className="h-7 w-7 text-teal-400" />
          <span className="text-2xl font-bold text-white tracking-tight">
            HealthBot
          </span>
        </Link>
      </div>

      <main className="flex-1 flex flex-col justify-center items-center w-full px-4 max-w-[480px] mx-auto">
        <div className="bg-[#111827]/80 border border-slate-700/50 rounded-3xl p-8 w-full shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-3 text-center">
            Forgot Password
          </h1>
          <p className="text-slate-400 text-sm text-center mb-8">
            Enter your registered email address.
            <br />
            We'll send a verification code to reset your password.
          </p>

          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1F2937] border border-slate-600 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-500 hover:bg-teal-600 text-slate-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-700"></div>
            <span className="text-slate-500 text-sm">OR</span>
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

        {/* Non-Clickable Footer */}
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
