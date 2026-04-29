import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, Lock, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error | invalid
  const [message, setMessage] = useState("");
  const [token, setToken] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (!t) {
      setStatus("invalid");
      setMessage("No reset token found. Please request a new password reset link.");
    } else {
      setToken(t);
    }
  }, []);

  const validatePassword = () => {
    if (password.length < 8) return "Password must be at least 8 characters";
    if (password !== confirmPassword) return "Passwords do not match";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validatePassword();
    if (validationError) {
      setStatus("error");
      setMessage(validationError);
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(
        "https://healthbot-production-3c7d.up.railway.app/api/auth/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password }),
        }
      );
      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await res.json()
        : null;

      if (!res.ok) {
        setStatus("error");
        setMessage(
          data?.message ||
            "Reset failed. Please try again."
        );
        return;
      }

      setStatus("success");
      setMessage(data?.message || "Password reset successfully!");

      // Auto redirect to login after 3 seconds
      setTimeout(() => navigate("/login"), 3000);

    } catch (err) {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    if (password.length === 0) return { label: "", color: "" };
    if (password.length < 6) return { label: "Weak", color: "text-red-400" };
    if (password.length < 10) return { label: "Medium", color: "text-yellow-400" };
    return { label: "Strong", color: "text-green-400" };
  };

  const strength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-[#0B1120] font-sans text-slate-50 relative flex flex-col items-center overflow-x-hidden">
      {/* Background Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-6 lg:px-12 w-full z-50">
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
          <Activity className="h-7 w-7 text-teal-400" />
          <span className="text-2xl font-bold tracking-tight text-white">HealthBot</span>
        </Link>
      </nav>

      {/* Main */}
      <main className="flex-1 flex flex-col justify-center items-center w-full px-4 z-10 my-10">
        <div className="bg-[#111827]/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 sm:p-12 w-full max-w-[480px] shadow-[0_0_40px_rgba(13,148,136,0.1)] relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />

          {/* Invalid Token */}
          {status === "invalid" && (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-20 h-20 rounded-full border border-red-500/30 bg-red-500/10 flex items-center justify-center mb-6">
                <XCircle className="h-10 w-10 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Invalid Link</h1>
              <p className="text-slate-400 text-sm mb-6">{message}</p>
              <Link
                to="/forgot-password"
                className="bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-900 font-bold py-3 px-8 rounded-lg transition-all"
              >
                Request New Link
              </Link>
            </div>
          )}

          {/* Success */}
          {status === "success" && (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-20 h-20 rounded-full border border-green-500/30 bg-green-500/10 flex items-center justify-center mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Password Reset!</h1>
              <p className="text-slate-400 text-sm mb-6">{message}</p>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-6 w-full">
                <p className="text-green-400 text-sm">
                  Redirecting to login in 3 seconds...
                </p>
              </div>
              <Link
                to="/login"
                className="bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-900 font-bold py-3 px-8 rounded-lg transition-all"
              >
                Log In Now
              </Link>
            </div>
          )}

          {/* Form */}
          {(status === "idle" || status === "loading" || status === "error") && token && (
            <>
              {/* Header */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 rounded-full border border-teal-500/30 bg-teal-500/10 flex items-center justify-center mb-6">
                  <Lock className="h-8 w-8 text-teal-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-3">Reset Password</h1>
                <p className="text-slate-400 text-center text-sm leading-relaxed max-w-[280px]">
                  Create a strong new password for your HealthBot account.
                </p>
              </div>

              <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                {/* Error Message */}
                {status === "error" && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg text-center">
                    {message}
                  </div>
                )}

                {/* New Password */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-300">New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-[#0B1120] border border-slate-700 rounded-lg py-3.5 pl-12 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {/* Password Strength */}
                  {password.length > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex gap-1">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 w-8 rounded-full transition-all ${
                              i === 1
                                ? password.length >= 1 ? "bg-red-400" : "bg-slate-700"
                                : i === 2
                                ? password.length >= 6 ? "bg-yellow-400" : "bg-slate-700"
                                : password.length >= 10 ? "bg-green-400" : "bg-slate-700"
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`text-xs font-medium ${strength.color}`}>{strength.label}</span>
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-1">Must be at least 8 characters</p>
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-300">Confirm New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full bg-[#0B1120] border border-slate-700 rounded-lg py-3.5 pl-12 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {/* Match indicator */}
                  {confirmPassword.length > 0 && (
                    <p className={`text-xs mt-1 ${password === confirmPassword ? "text-green-400" : "text-red-400"}`}>
                      {password === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full mt-2 bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 text-slate-900 font-bold py-3.5 rounded-lg transition-all shadow-[0_0_20px_rgba(45,212,191,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "loading" ? "Resetting..." : "Reset Password"}
                </button>

                <div className="text-center mt-2">
                  <Link to="/login" className="text-sm text-slate-500 hover:text-slate-400 transition-colors">
                    Back to Login
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </main>

      <footer className="w-full pb-8 pt-4 flex flex-col items-center gap-3 z-10">
        <p className="text-slate-400 text-xs font-medium">© 2026 HealthBot. All rights reserved.</p>
      </footer>
    </div>
  );
}
