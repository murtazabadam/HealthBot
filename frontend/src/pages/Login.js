import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Controlled input states to prevent Chrome from auto-filling
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    window.location.href =
      "https://healthbot-production-3c7d.up.railway.app/api/auth/google";
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const res = await fetch(
        "https://healthbot-production-3c7d.up.railway.app/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/chat");
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] font-sans text-slate-50 selection:bg-teal-500 selection:text-white relative flex flex-col items-center overflow-x-hidden">
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
          to="/register"
          className="px-6 py-2.5 text-sm font-semibold text-white bg-transparent border border-teal-500 hover:bg-teal-500/10 rounded-md transition-all"
        >
          Sign Up
        </Link>
      </nav>

      <main className="flex-1 flex flex-col justify-center items-center w-full px-4 z-10 my-10">
        <div className="bg-[#111827]/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 sm:p-12 w-full max-w-[480px] shadow-[0_0_40px_rgba(13,148,136,0.1)] relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />

          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full border border-teal-500/30 bg-teal-500/10 flex items-center justify-center mb-6">
              <Activity className="h-8 w-8 text-teal-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">
              Welcome Back!
            </h1>
            <p className="text-slate-400 text-center text-sm leading-relaxed max-w-[280px]">
              Login to your account and continue your health journey with{" "}
              <span className="text-teal-400 font-medium">HealthBot</span>.
            </p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={handleLogin}>
            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg text-center font-bold">
                {errorMessage}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Email or Username
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Enter your email or username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-teal-400 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  hidden
                  className="text-[10px] text-teal-400 hover:underline uppercase tracking-tighter font-bold"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3.5 pl-12 pr-12 text-sm text-white focus:outline-none focus:border-teal-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                title="Coming Soon"
                className="text-xs text-teal-400 hover:text-teal-300 font-medium transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 text-slate-900 font-bold py-4 rounded-xl shadow-lg uppercase tracking-wide hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Log In
            </button>

            <div className="relative flex items-center gap-4 my-2">
              <div className="h-[1px] flex-1 bg-slate-800"></div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                or
              </span>
              <div className="h-[1px] flex-1 bg-slate-800"></div>
            </div>
          </form>

          <div className="flex flex-col gap-4 mb-6">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-transparent border border-slate-700 hover:bg-slate-800 rounded-xl py-3.5 transition-all text-sm font-bold text-slate-300"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="text-center">
            <span className="text-sm text-slate-400">
              Don't have an account?{" "}
            </span>
            <Link
              to="/register"
              className="text-sm text-teal-400 font-extrabold hover:underline ml-1"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </main>

      <footer className="w-full pb-8 pt-4 flex flex-col items-center gap-3 z-10 text-center text-slate-500 text-xs font-medium">
        <p>© 2026 HealthBot. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="hover:text-slate-400 transition-colors bg-transparent border-none p-0"
          >
            Privacy Policy
          </button>
          <span className="text-slate-700">|</span>
          <button
            type="button"
            className="hover:text-slate-400 transition-colors bg-transparent border-none p-0"
          >
            Terms of Service
          </button>
        </div>
      </footer>
    </div>
  );
}
