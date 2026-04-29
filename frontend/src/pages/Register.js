import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Phone,
  Users,
  UserPlus,
  Droplet,
  Calendar,
} from "lucide-react";

export default function Register() {
  const [regStep, setRegStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    age: "",
    gender: "",
    bloodGroup: "",
    address: "",
    phoneNumber: "",
    otp: "",
  });

  const navigate = useNavigate();

  // Defined handleGoogleSignUp to fix 'not defined' error
  const handleGoogleSignUp = () => {
    window.location.href =
      "https://healthbot-production-3c7d.up.railway.app/api/auth/google";
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch(
        "https://healthbot-production-3c7d.up.railway.app/api/auth/send-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email.trim() }),
        },
      );
      if (!res.ok) throw new Error("Failed to send OTP.");
      setRegStep(2);
    } catch (err) {
      setErrorMessage("OTP Service Error: Please ensure server is active.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(
        "https://healthbot-production-3c7d.up.railway.app/api/auth/verify-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email.trim(),
            otp: formData.otp,
          }),
        },
      );
      if (!res.ok) throw new Error("Invalid verification code.");
      setRegStep(3);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword)
      return setErrorMessage("Passwords do not match.");
    if (!formData.gender) return setErrorMessage("Please select a gender.");
    if (!agreedToTerms) return setErrorMessage("You must agree to the terms.");

    setLoading(true);
    try {
      const res = await fetch(
        "https://healthbot-production-3c7d.up.railway.app/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );
      if (!res.ok) throw new Error("Registration failed.");
      const data = await res.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/chat");
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] font-sans text-slate-50 relative flex flex-col items-center overflow-x-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

      <nav className="flex items-center justify-between px-6 py-6 lg:px-12 w-full z-50">
        <Link to="/" className="flex items-center gap-2">
          <Activity className="h-7 w-7 text-teal-400" />
          <span className="text-2xl font-bold tracking-tight text-white">
            HealthBot
          </span>
        </Link>
      </nav>

      <main className="flex-1 flex flex-col justify-center items-center w-full px-4 z-10 my-10">
        <div
          className={`bg-[#111827]/90 border border-slate-700/50 rounded-[2.5rem] p-8 sm:p-12 w-full shadow-2xl relative transition-all duration-500 ${regStep === 3 ? "max-w-[750px]" : "max-w-[540px]"}`}
        >
          {regStep > 1 && (
            <button
              onClick={() => setRegStep(regStep - 1)}
              className="absolute top-8 left-8 text-slate-500 hover:text-teal-400 flex items-center gap-1 text-xs font-bold uppercase tracking-widest"
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}

          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-full border border-teal-500/30 bg-teal-500/10 flex items-center justify-center mx-auto mb-6">
              <UserPlus className="h-8 w-8 text-teal-400" />
            </div>
            <h2 className="text-4xl font-bold mb-2 tracking-tight">
              {regStep === 1
                ? "Get Started"
                : regStep === 2
                  ? "Verify"
                  : "Final Profile"}
            </h2>
            <p className="text-slate-400 text-sm">
              {regStep === 1
                ? "Step 1: Identity"
                : regStep === 2
                  ? "Step 2: Verification"
                  : "Step 3: Medical Details"}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-4 rounded-xl text-center font-bold animate-pulse">
              {errorMessage}
            </div>
          )}

          {regStep === 1 && (
            <form className="flex flex-col gap-5" onSubmit={handleSendOTP}>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-2xl py-4 pl-14 pr-4 outline-none focus:border-teal-400 transition-all"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                  <input
                    type="email"
                    required
                    placeholder="Email"
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-2xl py-4 pl-14 pr-4 outline-none focus:border-teal-400 transition-all"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">
                  Phone Number
                </label>
                <div className="relative group">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400" />
                  <input
                    type="tel"
                    placeholder="Phone"
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-2xl py-4 pl-14 pr-4 outline-none focus:border-teal-400"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase ml-1">
                  Address
                </label>
                <div className="relative group">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400" />
                  <input
                    type="text"
                    placeholder="Full Address"
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-2xl py-4 pl-14 pr-4 outline-none focus:border-teal-400"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-teal-400 text-slate-900 font-black rounded-2xl uppercase tracking-[0.2em] mt-2 hover:bg-teal-300 transition-all shadow-lg shadow-teal-500/10"
              >
                {loading ? "Sending..." : "Continue"}
              </button>

              <div className="relative flex items-center gap-4 my-4">
                <div className="h-[1px] flex-1 bg-slate-800"></div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  or
                </span>
                <div className="h-[1px] flex-1 bg-slate-800"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignUp}
                className="w-full flex items-center justify-center gap-3 bg-transparent border border-slate-700 hover:bg-slate-800 rounded-2xl py-4 transition-all text-sm font-bold text-slate-300"
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
            </form>
          )}

          {regStep === 2 && (
            <form className="flex flex-col gap-6" onSubmit={handleVerifyOTP}>
              <div className="text-center">
                <ShieldCheck className="mx-auto h-12 w-12 text-teal-400 mb-4" />
                <label className="text-[11px] font-bold text-teal-400 uppercase tracking-[0.3em]">
                  Verification Code
                </label>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="000000"
                  required
                  autoFocus
                  onChange={(e) =>
                    setFormData({ ...formData, otp: e.target.value })
                  }
                  className="w-full bg-transparent border-b-2 border-slate-700 text-center text-5xl py-4 outline-none focus:border-teal-400 font-mono tracking-widest transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-teal-400 text-slate-900 font-black rounded-2xl uppercase tracking-[0.2em]"
              >
                {loading ? "Checking..." : "Verify Code"}
              </button>
            </form>
          )}

          {regStep === 3 && (
            <form className="flex flex-col gap-5" onSubmit={handleRegister}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="•••••"
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3 pl-10 pr-10 focus:border-teal-400 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    Confirm <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="•••••"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3 pl-10 pr-10 focus:border-teal-400 outline-none transition-all"
                    />
                    {/* Fixed unused setShowConfirmPassword by adding toggle here */}
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    Age
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 h-4 w-4 text-slate-500 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      placeholder="Age"
                      onChange={(e) =>
                        setFormData({ ...formData, age: e.target.value })
                      }
                      className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3 pl-9 pr-2 text-xs focus:border-teal-400 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    {/* Imported Users correctly now */}
                    <Users className="absolute left-3 h-4 w-4 text-slate-500 top-1/2 -translate-y-1/2" />
                    <select
                      required
                      onChange={(e) =>
                        setFormData({ ...formData, gender: e.target.value })
                      }
                      className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3 pl-9 pr-2 text-xs focus:border-teal-400 outline-none appearance-none transition-all"
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    Blood
                  </label>
                  <div className="relative">
                    <Droplet className="absolute left-3 h-4 w-4 text-slate-500 top-1/2 -translate-y-1/2" />
                    <select
                      onChange={(e) =>
                        setFormData({ ...formData, bloodGroup: e.target.value })
                      }
                      className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3 pl-9 pr-2 text-xs focus:border-teal-400 outline-none appearance-none transition-all"
                    >
                      <option value="">Select</option>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                        (bg) => (
                          <option key={bg} value={bg}>
                            {bg}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
              </div>
              <div
                className="flex items-start gap-3 mt-4 cursor-pointer"
                onClick={() => setAgreedToTerms(!agreedToTerms)}
              >
                <div
                  className={`mt-1 w-5 h-5 rounded border transition-all flex items-center justify-center ${agreedToTerms ? "bg-teal-500 border-teal-500" : "bg-[#0B1120] border-slate-700"}`}
                >
                  {agreedToTerms && (
                    <CheckCircle2
                      size={14}
                      className="text-slate-900"
                      strokeWidth={3}
                    />
                  )}
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Agree to the{" "}
                  <Link to="/terms" className="text-teal-400 hover:underline">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-teal-400 hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-teal-400 text-slate-900 font-black rounded-2xl uppercase tracking-[0.25em] text-xl mt-4 hover:bg-teal-300 transition-all shadow-lg shadow-teal-500/10"
              >
                {loading ? "CREATING..." : "CREATE ACCOUNT"}
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-teal-400 font-extrabold hover:underline ml-1"
            >
              Log In
            </Link>
          </p>
        </div>
      </main>

      <footer className="w-full pb-8 pt-4 text-center text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] relative z-10">
        © 2026 HealthBot. All rights reserved.
      </footer>
    </div>
  );
}
