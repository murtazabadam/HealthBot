import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  Activity,
  ShieldCheck,
  Loader2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("verifying"); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus("error");
        setMessage("No verification token found in the link.");
        return;
      }

      try {
        const res = await fetch(
          `https://healthbot-production-3c7d.up.railway.app/api/auth/verify-email?token=${token}`,
        );
        const data = await res.json();

        if (res.ok && data.token) {
          // Store session data exactly like the login page
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));

          setStatus("success");
          setMessage("Your email has been verified successfully!");

          // Auto-redirect after 3 seconds
          setTimeout(() => {
            navigate("/chat");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(
            data.message || "Verification failed. The link may be expired.",
          );
        }
      } catch (err) {
        setStatus("error");
        setMessage("Connection error. Please try again later.");
      }
    };

    verifyToken();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-[#0B1120] font-sans text-slate-50 relative flex flex-col items-center justify-center p-4">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="bg-[#111827]/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 sm:p-12 w-full max-w-[480px] shadow-2xl text-center z-10 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />

        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full border border-teal-500/30 bg-teal-500/10 flex items-center justify-center mb-8">
            <Activity className="h-10 w-10 text-teal-400" />
          </div>

          {status === "verifying" && (
            <div className="animate-in fade-in duration-500">
              <Loader2 className="h-12 w-12 text-teal-400 animate-spin mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-white mb-3">
                Verifying Account
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                Please wait while we secure your connection and verify your
                email address...
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="animate-in zoom-in duration-500">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                <ShieldCheck className="h-8 w-8 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Verified!</h1>
              <p className="text-slate-400 text-sm mb-8">
                {message} <br /> Redirecting you to the HealthBot chat...
              </p>
              <Link
                to="/chat"
                className="inline-flex items-center gap-2 bg-teal-500 text-slate-900 px-8 py-3 rounded-xl font-extrabold uppercase text-xs tracking-widest hover:brightness-110 transition-all"
              >
                Go to Chat <ArrowRight size={16} />
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="animate-in slide-in-from-top-4 duration-500">
              <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/30">
                <AlertCircle className="h-8 w-8 text-rose-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">
                Verification Failed
              </h1>
              <p className="text-rose-400/80 text-sm mb-8 font-medium italic">
                {message}
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  to="/register"
                  className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-slate-700 transition-all"
                >
                  Back to Sign Up
                </Link>
                <Link
                  to="/login"
                  className="text-teal-400 text-xs font-bold uppercase hover:underline"
                >
                  Already verified? Log In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="mt-8 text-slate-500 text-[10px] font-bold uppercase tracking-widest z-10">
        © 2026 HealthBot AI Assistant
      </footer>
    </div>
  );
}
