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
      // Assuming your backend expects the full object including the otp code
      const payload = { ...formData, otp: otpString };

      const res = await fetch(
        "https://healthbot-production-3c7d.up.railway.app/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok)
        throw new Error("Registration failed. Check your OTP and try again.");
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleSignUp = () => {
    window.location.href =
      "https://healthbot-production-3c7d.up.railway.app/api/auth/google";
  };

  return (
    <div className="min-h-screen bg-[#020817] font-sans text-slate-50 relative flex flex-col items-center overflow-x-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <svg
          className="w-full h-full"
          viewBox="0 0 1000 1000"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,500 C200,400 300,600 500,500 C700,400 800,600 1000,500"
            stroke="#0ea5e9"
            fill="transparent"
            strokeWidth="0.5"
          />
          <path
            d="M0,520 C200,420 300,620 500,520 C700,420 800,620 1000,520"
            stroke="#0ea5e9"
            fill="transparent"
            strokeWidth="0.5"
          />
        </svg>
      </div>

      {/* Top Navbar */}
      <nav className="relative z-10 w-full flex items-center justify-between px-6 py-6 lg:px-16 max-w-[1400px]">
        <Link to="/" className="flex items-center gap-2">
          <Activity className="h-8 w-8 text-cyan-400" />
          <span className="text-3xl font-bold tracking-tight text-white italic">
            HealthBot
          </span>
        </Link>
      </nav>

      {/* Main Form */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center w-full px-4 py-8">
        <div className="w-full max-w-[900px] bg-[#020817]/90 backdrop-blur-sm border border-cyan-500/40 rounded-[40px] p-8 sm:p-12 shadow-[0_0_50px_rgba(6,182,212,0.15)] relative">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-20 h-20 rounded-full border border-cyan-500/40 bg-cyan-500/5 flex items-center justify-center mb-6">
              <UserPlus className="h-10 w-10 text-cyan-400" strokeWidth={1.5} />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
              Create Account
            </h1>
            <p className="text-slate-400 text-lg">
              Join <span className="text-cyan-400 font-medium">HealthBot</span>{" "}
              and start your smarter health journey today.
            </p>
          </div>

          <form onSubmit={handleRegister} className="flex flex-col gap-7">
            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-4 rounded-xl text-center font-bold">
                {errorMessage}
              </div>
            )}

            {/* Row 1: Name & Email + Send OTP */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-200">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-cyan-400" />
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Enter your full name"
                    onChange={handleChange}
                    className="w-full bg-[#0B1120] border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-200">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative flex gap-2">
                  <div className="relative flex-1 group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-cyan-400" />
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="Enter your email address"
                      onChange={handleChange}
                      className="w-full bg-[#0B1120] border border-slate-800 rounded-xl py-4 pl-12 pr-[110px] text-white focus:outline-none focus:border-cyan-500/50"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <button
                        type="button"
                        disabled={timer > 0 || loading}
                        onClick={handleSendOTP}
                        className="flex items-center gap-1.5 h-10 px-3 bg-transparent border border-cyan-500/50 text-cyan-400 rounded-lg text-xs font-bold hover:bg-cyan-500/10 transition-all disabled:opacity-50 whitespace-nowrap"
                      >
                        <Send size={14} />
                        {timer > 0 ? `${timer}s` : "Send OTP"}
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 text-center md:text-left mt-1">
                  We will send a 6-digit OTP to your email
                </p>
              </div>
            </div>

            {/* OTP Input (Appears when OTP is sent) */}
            {otpSent && (
              <div className="flex flex-col gap-3 animate-in fade-in zoom-in duration-300 md:col-start-2 md:-mt-4 mb-2 md:ml-[50%]">
                <label className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                  <ShieldCheck size={16} /> Enter Verification Code
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
                      className="w-10 h-12 sm:w-12 sm:h-14 bg-[#0B1120] border border-slate-700 rounded-lg sm:rounded-xl text-center text-xl sm:text-2xl text-white font-semibold focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Row 2: Passwords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-200">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-cyan-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    placeholder="Create a password"
                    onChange={handleChange}
                    className="w-full bg-[#0B1120] border border-slate-800 rounded-xl py-4 pl-12 pr-12 text-white focus:outline-none focus:border-cyan-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="flex items-start gap-2 mt-1 px-1">
                  <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0" />
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Use at least 8 characters with a mix of letters, numbers &
                    symbols
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-200">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-cyan-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    required
                    placeholder="Confirm your password"
                    onChange={handleChange}
                    className="w-full bg-[#0B1120] border border-slate-800 rounded-xl py-4 pl-12 pr-12 text-white focus:outline-none focus:border-cyan-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
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

            {/* Row 3: Age, Phone, Address */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-200">
                  Age
                </label>
                <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-cyan-400" />
                  <input
                    type="number"
                    name="age"
                    placeholder="Enter your age"
                    onChange={handleChange}
                    className="w-full bg-[#0B1120] border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-200">
                  Phone Number
                </label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-cyan-400" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="Enter your phone number"
                    onChange={handleChange}
                    className="w-full bg-[#0B1120] border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-200">
                  Address
                </label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-cyan-400" />
                  <input
                    type="text"
                    name="address"
                    placeholder="Enter your address"
                    onChange={handleChange}
                    className="w-full bg-[#0B1120] border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Gender, Blood Group */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-200">
                  Gender <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-cyan-400" />
                  <select
                    name="gender"
                    onChange={handleChange}
                    className="w-full bg-[#0B1120] border border-slate-800 rounded-xl py-3.5 pl-12 pr-10 text-slate-400 focus:outline-none appearance-none"
                  >
                    <option value="">Select your gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-200">
                  Blood Group
                </label>
                <div className="relative group">
                  <Droplet className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-cyan-400" />
                  <select
                    name="bloodGroup"
                    onChange={handleChange}
                    className="w-full bg-[#0B1120] border border-slate-800 rounded-xl py-3.5 pl-12 pr-10 text-slate-400 focus:outline-none appearance-none"
                  >
                    <option value="">Select your blood group</option>
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

            {/* Terms and Checkbox */}
            <div className="flex items-center gap-3 mt-2">
              <div
                className={`w-5 h-5 rounded border transition-all flex items-center justify-center cursor-pointer ${agreedToTerms ? "bg-cyan-500 border-cyan-500" : "bg-[#0B1120] border-slate-700"}`}
                onClick={() => setAgreedToTerms(!agreedToTerms)}
              >
                {agreedToTerms && (
                  <CheckCircle2
                    size={14}
                    className="text-[#020817]"
                    strokeWidth={3}
                  />
                )}
              </div>
              <label className="text-sm text-slate-300">
                I agree to the{" "}
                <Link
                  to="/terms"
                  className="text-cyan-400 font-medium hover:underline"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="text-cyan-400 font-medium hover:underline"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-white font-bold text-lg rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2"
            >
              {loading ? "Processing..." : "Create Account"}{" "}
              <span className="text-2xl leading-none">→</span>
            </button>

            {/* Social Divider */}
            <div className="relative flex items-center gap-4 my-2">
              <div className="h-[1px] flex-1 bg-slate-800"></div>
              <span className="text-xs text-slate-500 font-medium uppercase tracking-widest">
                or continue with
              </span>
              <div className="h-[1px] flex-1 bg-slate-800"></div>
            </div>

            {/* Google Button */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              className="w-full py-4 border border-slate-800 hover:bg-slate-800/50 rounded-xl transition-all flex items-center justify-center gap-3 text-white font-semibold"
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
            <div className="mt-4 text-center flex items-center justify-center text-sm">
              <span className="text-slate-400">Already have an account?</span>
              <Link
                to="/login"
                className="text-cyan-400 font-bold hover:underline ml-2"
              >
                Log In
              </Link>
              <span className="text-slate-700 mx-4">|</span>
              <Link
                to="/forgot-password"
                className="text-cyan-400 font-bold hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
          </form>
        </div>
      </main>

      {/* Outer Footer */}
      <footer className="w-full pb-8 pt-4 flex flex-col items-center gap-3 z-10 text-center text-slate-400 text-sm"></footer>
    </div>
  );
}
