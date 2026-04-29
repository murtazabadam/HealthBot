import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Droplet,
  Users,
  MapPin,
  Phone,
} from "lucide-react";

export default function Register() {
  const [regStep, setRegStep] = useState(1); // 1: Info, 2: OTP, 3: Security & Health
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

  // STEP 1: SEND OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.name) {
      setErrorMessage("Please fill in your name and email.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch(
        "https://healthbot-production-3c7d.up.railway.app/api/auth/send-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP.");

      setRegStep(2);
    } catch (err) {
      setErrorMessage(
        err.message || "Connection error. Ensure backend is live.",
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: VERIFY OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!formData.otp) {
      setErrorMessage("Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch(
        "https://healthbot-production-3c7d.up.railway.app/api/auth/verify-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, otp: formData.otp }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid or expired OTP.");

      setRegStep(3);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: FINAL REGISTRATION
  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (!formData.gender) {
      setErrorMessage("Please select your gender.");
      return;
    }
    if (!agreedToTerms) {
      setErrorMessage("You must agree to the Terms and Privacy Policy.");
      return;
    }

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

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");

      navigate("/login");
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
        <Link
          to="/login"
          className="px-6 py-2.5 text-sm font-bold text-white border border-teal-500 hover:bg-teal-500/10 rounded-xl transition-all"
        >
          Log In
        </Link>
      </nav>

      <main className="flex-1 flex flex-col justify-center items-center w-full px-4 z-10 my-10">
        <div
          className={`bg-[#111827]/90 border border-slate-800 rounded-[2.5rem] p-8 sm:p-12 w-full shadow-2xl relative transition-all duration-500 ${regStep === 3 ? "max-w-[680px]" : "max-w-[540px]"}`}
        >
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-8 px-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${regStep >= s ? "bg-teal-400 text-[#0B1120]" : "bg-slate-800 text-slate-500 border border-slate-700"}`}
                >
                  {regStep > s ? <CheckCircle2 size={16} /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`h-[2px] flex-1 mx-2 transition-all ${regStep > s ? "bg-teal-400" : "bg-slate-800"}`}
                  />
                )}
              </div>
            ))}
          </div>

          {regStep > 1 && (
            <button
              onClick={() => setRegStep(regStep - 1)}
              className="absolute top-8 left-8 text-slate-500 hover:text-teal-400 transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-widest"
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}

          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold mb-3 tracking-tight">
              {regStep === 1 && "Basic Information"}
              {regStep === 2 && "Verification"}
              {regStep === 3 && "Complete Profile"}
            </h2>
            <p className="text-slate-400 text-sm">
              {regStep === 1 &&
                "Let's start with your identity and contact details."}
              {regStep === 2 &&
                `Enter the 6-digit code sent to ${formData.email}`}
              {regStep === 3 && "Secure your account and provide medical info."}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-4 rounded-xl text-center font-medium animate-pulse">
              {errorMessage}
            </div>
          )}

          {/* STEP 1: IDENTITY & CONTACT */}
          {regStep === 1 && (
            <form className="flex flex-col gap-5" onSubmit={handleSendOTP}>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest ml-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400" />
                  <input
                    type="text"
                    placeholder="Enter full name"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-2xl py-4 pl-14 pr-4 text-base focus:border-teal-400 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest ml-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-2xl py-4 pl-14 pr-4 text-base focus:border-teal-400 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest ml-1">
                  Phone Number
                </label>
                <div className="relative group">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400" />
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-2xl py-4 pl-14 pr-4 text-base focus:border-teal-400 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest ml-1">
                  Address
                </label>
                <div className="relative group">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400" />
                  <input
                    type="text"
                    placeholder="Enter full address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-2xl py-4 pl-14 pr-4 text-base focus:border-teal-400 outline-none transition-all"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-teal-400 text-[#0B1120] font-extrabold rounded-2xl uppercase tracking-[0.1em] text-lg hover:bg-teal-300 transition-all shadow-lg shadow-teal-500/10 mt-2"
              >
                {loading ? "Sending..." : "SEND OTP"}
              </button>
            </form>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {regStep === 2 && (
            <form className="flex flex-col gap-6" onSubmit={handleVerifyOTP}>
              <div className="flex flex-col gap-3 text-center">
                <div className="w-16 h-16 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-teal-500/20">
                  <ShieldCheck className="text-teal-400 h-8 w-8" />
                </div>
                <label className="text-[11px] font-bold text-teal-400 uppercase tracking-widest">
                  Verification Code
                </label>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="0 0 0 0 0 0"
                  required
                  autoFocus
                  onChange={(e) =>
                    setFormData({ ...formData, otp: e.target.value })
                  }
                  className="w-full bg-teal-500/5 border-2 border-teal-500/30 rounded-2xl py-5 px-6 text-center text-3xl font-mono tracking-[0.5em] focus:border-teal-400 outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-teal-400 text-[#0B1120] font-extrabold rounded-2xl uppercase tracking-[0.1em] text-lg hover:bg-teal-300 transition-all"
              >
                {loading ? "Verifying..." : "VERIFY OTP"}
              </button>
            </form>
          )}

          {/* STEP 3: SECURITY & MEDICAL */}
          {regStep === 3 && (
            <form className="flex flex-col gap-5" onSubmit={handleRegister}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-300 uppercase ml-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-teal-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="•••••"
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3.5 pl-11 pr-10 text-sm focus:border-teal-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-300 uppercase ml-1">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-teal-400" />
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
                      className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3.5 pl-11 pr-10 text-sm focus:border-teal-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-300 uppercase ml-1">
                    Age
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="number"
                      placeholder="Age"
                      onChange={(e) =>
                        setFormData({ ...formData, age: e.target.value })
                      }
                      className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3.5 pl-9 pr-2 text-sm focus:border-teal-400 outline-none"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-300 uppercase ml-1">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <select
                      required
                      onChange={(e) =>
                        setFormData({ ...formData, gender: e.target.value })
                      }
                      className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3.5 pl-9 pr-2 text-sm focus:border-teal-400 outline-none appearance-none text-slate-300"
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-300 uppercase ml-1">
                    Blood Group
                  </label>
                  <div className="relative">
                    <Droplet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <select
                      onChange={(e) =>
                        setFormData({ ...formData, bloodGroup: e.target.value })
                      }
                      className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3.5 pl-9 pr-2 text-sm focus:border-teal-400 outline-none appearance-none text-slate-300"
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
                className="flex items-start gap-3 mt-4 group cursor-pointer"
                onClick={() => setAgreedToTerms(!agreedToTerms)}
              >
                <div
                  className={`mt-1 w-5 h-5 rounded border transition-all flex items-center justify-center ${agreedToTerms ? "bg-teal-500 border-teal-500" : "bg-[#0B1120] border-slate-700 group-hover:border-teal-500"}`}
                >
                  {agreedToTerms && (
                    <CheckCircle2
                      size={14}
                      className="text-slate-900"
                      strokeWidth={3}
                    />
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  I agree to the{" "}
                  <span className="text-teal-400 font-bold hover:underline">
                    Terms of Service
                  </span>{" "}
                  and{" "}
                  <span className="text-teal-400 font-bold hover:underline">
                    Privacy Policy
                  </span>
                  .
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-teal-400 text-[#0B1120] font-extrabold rounded-2xl uppercase tracking-[0.2em] text-xl hover:bg-teal-300 transition-all shadow-lg shadow-teal-500/10 mt-4"
              >
                {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
              </button>
            </form>
          )}

          <p className="mt-10 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-teal-400 font-bold hover:underline ml-1"
            >
              Log In
            </Link>
          </p>
        </div>
      </main>

      <footer className="w-full pb-8 pt-4 flex flex-col items-center gap-3 z-10 text-center text-slate-500 text-xs font-medium">
        <p>© 2026 HealthBot. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link
            to="/privacy"
            className="hover:text-slate-400 transition-colors"
          >
            Privacy Policy
          </Link>
          <span className="text-slate-700">|</span>
          <Link to="/terms" className="hover:text-slate-400 transition-colors">
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
}
