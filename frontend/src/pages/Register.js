import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  Phone,
  Users,
  UserPlus,
  Droplet,
  Calendar,
  ChevronDown,
  Send,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // OTP States
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
  });

  const navigate = useNavigate();

  // Resend Timer Logic
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOTP = async () => {
    if (!formData.email) {
      setErrorMessage("Please enter your email address first.");
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
          body: JSON.stringify({ email: formData.email.trim() }),
        },
      );
      if (!res.ok) throw new Error("Failed to send OTP.");
      setOtpSent(true);
      setTimer(60);
    } catch (err) {
      setErrorMessage("Error sending OTP. Please ensure backend is active.");
    } finally {
      setLoading(false);
    }
  };

  // OTP 6-box handlers
  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value !== "" && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setErrorMessage("Passwords do not match.");
    }
    if (!formData.gender) {
      return setErrorMessage("Please select your gender.");
    }
    if (!agreedToTerms) {
      return setErrorMessage("You must agree to the Terms of Service.");
    }

    const otpString = otp.join("");
    if (!otpSent || otpString.length < 6) {
      return setErrorMessage(
        "Please send and enter the 6-digit OTP to verify your email.",
      );
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const payload = { ...formData, otp: otpString };

      const res = await fetch(
        "https://healthbot-production-3c7d.up.railway.app/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();

      if (!res.ok)
        throw new Error(data.message || "Registration failed. Check your OTP.");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/chat");
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleSignUp = () => {
    window.location.href =
      "https://healthbot-production-3c7d.up.railway.app/api/auth/google";
  };

  return (
    <div className="min-h-screen bg-[#0B1120] font-sans text-slate-50 relative flex flex-col items-center overflow-x-hidden">
      {/* Global CSS fix for Chrome/Mobile Autofill white background bug */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px #0B1120 inset !important;
          -webkit-text-fill-color: white !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      {/* Background Decor - Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Dotted Pattern Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Navigation Bar - Sticky at top (Matches Login) */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-6 lg:px-12 w-full bg-[#0B1120]/80 backdrop-blur-md border-b border-slate-800/50">
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
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

      {/* Main Form Container */}
      <main className="flex-1 flex flex-col justify-center items-center w-full px-4 z-10 my-10">
        <div className="bg-[#111827]/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 sm:p-12 w-full max-w-[850px] shadow-2xl relative">
          {/* Top border highlight (Matches Login) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />

          {/* Header */}
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 rounded-full border border-teal-500/30 bg-teal-500/10 flex items-center justify-center mb-6">
              <UserPlus className="h-8 w-8 text-teal-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
              Create Account
            </h1>
            <p className="text-slate-400 text-sm">
              Join <span className="text-teal-400 font-bold">HealthBot</span>{" "}
              and start your smarter health journey today.
            </p>
          </div>

          <form onSubmit={handleRegister} className="flex flex-col gap-6">
            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-4 rounded-xl text-center font-bold animate-pulse">
                {errorMessage}
              </div>
            )}

            {/* Row 1: Name & Email + Send OTP */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Enter your full name"
                    onChange={handleChange}
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-teal-400 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1 group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="Enter your email address"
                      onChange={handleChange}
                      className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-teal-400 transition-all"
                      style={{ colorScheme: "dark" }}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={timer > 0 || loading}
                    onClick={handleSendOTP}
                    className="shrink-0 flex items-center justify-center gap-1.5 px-3 sm:px-4 bg-[#0B1120] border border-teal-500/50 text-teal-400 rounded-xl text-[11px] sm:text-xs font-bold hover:bg-teal-500/10 transition-all disabled:opacity-50 whitespace-nowrap shadow-sm"
                  >
                    <Send size={14} className="shrink-0" />
                    <span>{timer > 0 ? `${timer}s` : "Send OTP"}</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 text-center md:text-left mt-1">
                  We will send a 6-digit OTP to your email
                </p>
              </div>
            </div>

            {/* OTP Input (Appears when OTP is sent) */}
            {otpSent && (
              <div className="flex flex-col gap-3 animate-in fade-in zoom-in duration-300 md:col-start-2 md:-mt-4 mb-2 md:ml-[50%]">
                <label className="text-xs font-bold text-teal-400 flex items-center gap-2 uppercase tracking-wider">
                  <ShieldCheck size={14} /> Enter Verification Code
                </label>
                <div className="flex gap-2 sm:gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-10 h-12 sm:w-12 sm:h-12 bg-[#0B1120] border border-slate-700 rounded-lg text-center text-xl text-white font-bold focus:outline-none focus:border-teal-400 transition-all"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Row 2: Passwords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    placeholder="Create a password"
                    onChange={handleChange}
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3.5 pl-12 pr-12 text-sm text-white focus:outline-none focus:border-teal-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="flex items-start gap-2 mt-1 px-1">
                  <ShieldCheck className="h-3 w-3 text-teal-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Use at least 8 characters with a mix of letters, numbers &
                    symbols
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    required
                    placeholder="Confirm your password"
                    onChange={handleChange}
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3.5 pl-12 pr-12 text-sm text-white focus:outline-none focus:border-teal-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
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

            {/* Row 3: Age, Phone, Address */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Age
                </label>
                <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                  <input
                    type="number"
                    name="age"
                    placeholder="Enter your age"
                    onChange={handleChange}
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-teal-400 transition-all"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Phone Number
                </label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="Enter phone"
                    onChange={handleChange}
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-teal-400 transition-all"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Address
                </label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                  <input
                    type="text"
                    name="address"
                    placeholder="Enter address"
                    onChange={handleChange}
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-teal-400 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Gender, Blood Group */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Gender <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                  <select
                    name="gender"
                    onChange={handleChange}
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3.5 pl-12 pr-10 text-sm text-slate-400 focus:outline-none focus:border-teal-400 appearance-none transition-all cursor-pointer"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Blood Group
                </label>
                <div className="relative group">
                  <Droplet className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                  <select
                    name="bloodGroup"
                    onChange={handleChange}
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3.5 pl-12 pr-10 text-sm text-slate-400 focus:outline-none focus:border-teal-400 appearance-none transition-all cursor-pointer"
                  >
                    <option value="">Select blood group</option>
                    {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(
                      (bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ),
                    )}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div className="hidden sm:block"></div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-center gap-3 mt-2">
              <div
                className={`w-5 h-5 rounded border transition-all flex items-center justify-center cursor-pointer ${agreedToTerms ? "bg-teal-500 border-teal-500" : "bg-[#0B1120] border-slate-700"}`}
                onClick={() => setAgreedToTerms(!agreedToTerms)}
              >
                {agreedToTerms && (
                  <CheckCircle2
                    size={16}
                    className="text-[#0B1120]"
                    strokeWidth={3}
                  />
                )}
              </div>
              <label className="text-xs text-slate-300">
                I agree to the{" "}
                <Link
                  to="/terms"
                  className="text-teal-400 font-bold hover:underline"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="text-teal-400 font-bold hover:underline"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-gradient-to-r from-teal-400 to-blue-500 text-slate-900 font-extrabold py-4 rounded-xl shadow-lg uppercase tracking-wide hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? "Processing..." : "Create Account"}
            </button>

            {/* Social Divider */}
            <div className="relative flex items-center gap-4 my-3">
              <div className="h-[1px] flex-1 bg-slate-800"></div>
              <span className="text-xs text-slate-500 font-medium">
                or continue with
              </span>
              <div className="h-[1px] flex-1 bg-slate-800"></div>
            </div>

            {/* Google Button */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              className="w-full flex items-center justify-center gap-3 bg-[#0B1120] border border-slate-800 hover:bg-slate-800/50 rounded-xl py-3.5 transition-all text-sm font-semibold text-white"
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

            {/* Bottom Form Links */}
            <div className="mt-3 text-center flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-slate-400 font-medium">
              <span>
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-teal-400 font-extrabold hover:underline ml-1"
                >
                  Log In
                </Link>
              </span>
            </div>
          </form>
        </div>
      </main>

      {/* Page Footer */}
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
