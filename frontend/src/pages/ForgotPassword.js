import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch(
        "https://healthbot-production-3c7d.up.railway.app/api/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Request failed");
      setStatus("success");
      setMessage(data.message || "Reset link sent! Check your inbox.");
    } catch (err) {
      setStatus("error");
      setMessage(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] font-sans text-slate-50 relative flex flex-col items-center overflow-x-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      <nav className="flex items-center justify-between px-6 py-6 lg:px-12 w-full z-50">
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
          <Activity className="h-7 w-7 text-teal-400" />
          <span className="text-2xl font-bold tracking-tight text-white">
            HealthBot
          </span>
        </Link>
        <Link
          to="/login"
          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-teal-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
      </nav>

      <main className="flex-1 flex flex-col justify-center items-center w-full px-4 z-10 my-10">
        <div className="bg-[#111827]/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 sm:p-12 w-full max-w-[480px] shadow-[0_0_40px_rgba(13,148,136,0.1)] relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />

          {status !== "success" ? (
            <>
              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 rounded-full border border-teal-500/30 bg-teal-500/10 flex items-center justify-center mb-6">
                  <Mail className="h-8 w-8 text-teal-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-3">
                  Forgot Password?
                </h1>
                <p className="text-slate-400 text-center text-sm leading-relaxed max-w-[280px]">
                  Enter your email address and we will send you a password reset
                  link.
                </p>
              </div>

              <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                {status === "error" && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg text-center">
                    {message}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      type="email"
                      placeholder="Enter your registered email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-[#0B1120] border border-slate-700 rounded-lg py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full mt-2 bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 text-slate-900 font-bold py-3.5 rounded-lg transition-all shadow-[0_0_20px_rgba(45,212,191,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "loading" ? "Sending..." : "Send Reset Link"}
                </button>

                <div className="flex items-center gap-4 mt-2">
                  <div className="h-[1px] flex-1 bg-slate-700/50"></div>
                  <span className="text-xs text-slate-500">or</span>
                  <div className="h-[1px] flex-1 bg-slate-700/50"></div>
                </div>

                <div className="text-center">
                  <span className="text-sm text-slate-400">
                    Remember your password?{" "}
                  </span>
                  <Link
                    to="/login"
                    className="text-sm text-teal-400 hover:text-teal-300 font-medium transition-colors"
                  >
                    Log In
                  </Link>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-20 h-20 rounded-full border border-green-500/30 bg-green-500/10 flex items-center justify-center mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">
                Check Your Email!
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed mb-2">
                We have sent a password reset link to:
              </p>
              <p className="text-teal-400 font-medium mb-6">{email}</p>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 mb-6 text-left w-full">
                <p className="text-slate-300 text-sm font-medium mb-2">
                  What to do next:
                </p>
                <ul className="text-slate-400 text-sm space-y-1">
                  <li>1. Open your email inbox</li>
                  <li>2. Look for an email from HealthBot</li>
                  <li>3. Click the Reset My Password button</li>
                  <li>4. Create a new password</li>
                </ul>
              </div>
              <p className="text-slate-500 text-xs mb-4">
                The link will expire in 1 hour.
              </p>
              <button
                onClick={() => {
                  setStatus("idle");
                  setEmail("");
                  setMessage("");
                }}
                className="text-sm text-teal-400 hover:text-teal-300 font-medium transition-colors"
              >
                Send to a different email
              </button>
              <Link
                to="/login"
                className="mt-4 text-sm text-slate-500 hover:text-slate-400 transition-colors"
              >
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full pb-8 pt-4 flex flex-col items-center gap-3 z-10">
        <p className="text-slate-400 text-xs font-medium">
          © 2026 HealthBot. All rights reserved.
        </p>
      </footer>
    </div>
  );
}