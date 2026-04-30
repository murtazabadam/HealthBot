import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, CheckCircle2, XCircle } from "lucide-react";

export default function VerifyEmail() {
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      setMessage("No verification token found. Please check your email link.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch(
          `https://healthbot-production-3c7d.up.railway.app/api/auth/verify-email?token=${token}`
        );
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setMessage(data.message || "Verification failed.");
          return;
        }
        if (data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
        }
        setStatus("success");
        setMessage(data.message || "Email verified successfully!");
        setTimeout(() => navigate("/chat"), 3000);
      } catch (err) {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    };

    verifyEmail();
  }, [navigate]);

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
      </nav>

      <main className="flex-1 flex flex-col justify-center items-center w-full px-4 z-10">
        <div className="bg-[#111827]/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-10 w-full max-w-[480px] shadow-[0_0_40px_rgba(13,148,136,0.1)] relative text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />

          {/* Loading */}
          {status === "loading" && (
            <>
              <div className="w-20 h-20 rounded-full border border-teal-500/30 bg-teal-500/10 flex items-center justify-center mx-auto mb-6">
                <Activity className="h-10 w-10 text-teal-400 animate-pulse" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">
                Verifying your email...
              </h1>
              <p className="text-slate-400 text-sm">
                Please wait while we verify your account.
              </p>
            </>
          )}

          {/* Success */}
          {status === "success" && (
            <>
              <div className="w-20 h-20 rounded-full border border-green-500/30 bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">
                Email Verified!
              </h1>
              <p className="text-slate-400 text-sm mb-6">{message}</p>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-6">
                <p className="text-green-400 text-sm">
                  Redirecting you to chat in 3 seconds...
                </p>
              </div>
              <Link
                to="/chat"
                className="inline-block bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-900 font-bold py-3 px-8 rounded-lg transition-all"
              >
                Go to Chat Now
              </Link>
            </>
          )}

          {/* Error */}
          {status === "error" && (
            <>
              <div className="w-20 h-20 rounded-full border border-red-500/30 bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                <XCircle className="h-10 w-10 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">
                Verification Failed
              </h1>
              <p className="text-slate-400 text-sm mb-6">{message}</p>
              <div className="flex flex-col gap-3">
                <Link
                  to="/login"
                  className="inline-block bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-900 font-bold py-3 px-8 rounded-lg transition-all"
                >
                  Back to Login
                </Link>
                <p className="text-slate-500 text-xs">
                  Need a new link?{" "}
                  <Link
                    to="/login"
                    className="text-teal-400 hover:text-teal-300"
                  >
                    Login to resend
                  </Link>
                </p>
              </div>
            </>
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