import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Mail, ArrowLeft, ShieldCheck, Lock } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    // Mock API call to send password reset link
    console.log("Sending password reset link to:", email);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#0B1120] font-sans text-slate-50 selection:bg-teal-500 selection:text-white relative flex flex-col items-center overflow-x-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Navigation Bar */}
      <nav className="flex items-center justify-between px-6 py-6 lg:px-12 w-full z-50">
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
          <Activity className="h-7 w-7 text-teal-400" />
          <span className="text-2xl font-bold tracking-tight text-white">
            HealthBot
          </span>
        </Link>
      </nav>

      {/* Main Container */}
      <main className="flex-1 flex flex-col justify-center items-center w-full px-4 z-10 my-10">
        {/* Glassmorphism Card */}
        <div className="bg-[#111827]/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 sm:p-12 w-full max-w-[480px] shadow-[0_0_40px_rgba(13,148,136,0.1)] relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />

          {/* Header */}
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 rounded-full border border-teal-500/30 bg-teal-500/10 flex items-center justify-center mb-6">
              <Lock className="h-8 w-8 text-teal-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">
              Reset Password
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-[280px]">
              Enter the email address associated with your account and we'll
              send you a link to reset your password.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg text-center">
              {errorMessage}
            </div>
          )}

          {/* Conditional Rendering: Show Form OR Success Message */}
          {!isSubmitted ? (
            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              {/* Email Field */}
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-lg py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full mt-2 bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 text-slate-900 font-bold py-3.5 rounded-lg transition-all shadow-[0_0_20px_rgba(45,212,191,0.3)] flex items-center justify-center gap-2"
              >
                Send Reset Link
              </button>
            </form>
          ) : (
            // Success State UI
            <div className="flex flex-col items-center bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl text-center animate-in fade-in zoom-in duration-300">
              <ShieldCheck className="h-12 w-12 text-emerald-400 mb-3" />
              <h3 className="text-white font-bold text-lg mb-2">
                Check your email
              </h3>
              <p className="text-slate-400 text-sm">
                We've sent a secure password reset link to{" "}
                <span className="text-white font-medium">{email}</span>.
              </p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="mt-6 text-sm text-teal-400 hover:text-teal-300 transition-colors font-medium"
              >
                Didn't receive the email? Try again
              </button>
            </div>
          )}

          {/* Back to Login Link */}
          <div className="mt-8 flex justify-center">
            <Link
              to="/login"
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors font-medium"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Login
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full pb-8 pt-4 flex flex-col items-center gap-3 z-10">
        <p className="text-slate-400 text-xs font-medium">
          © 2024 HealthBot. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
