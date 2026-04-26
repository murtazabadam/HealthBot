import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Activity,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Calendar,
  Droplet,
  ChevronDown,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    confirmEmail: "",
    password: "",
    confirmPassword: "",
    age: "",
    phone: "",
    gender: "",
    bloodGroup: "",
    address: "",
    otp: "",
  });

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const sendOTP = async () => {
    if (!formData.email || formData.email !== formData.confirmEmail) {
      setErrorMessage("Please enter and confirm a valid email address first.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      // Pointing to your Railway backend OTP service
      await axios.post(
        "https://healthbot-production-3c7d.up.railway.app/api/auth/send-otp",
        {
          email: formData.email,
        },
      );
      setOtpSent(true);
      setSuccessMessage("Verification code sent to your email!");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Failed to send OTP. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!otpSent) {
      setErrorMessage("Please verify your email with an OTP first.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        "https://healthbot-production-3c7d.up.railway.app/api/auth/register",
        formData,
      );
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        navigate("/chat");
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Registration failed. Check your OTP.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] font-sans text-slate-50 relative flex flex-col items-center overflow-x-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <nav className="flex items-center justify-start px-6 py-6 lg:px-12 w-full z-50">
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
          <Activity className="h-7 w-7 text-teal-400" />
          <span className="text-2xl font-bold tracking-tight text-white">
            HealthBot
          </span>
        </Link>
      </nav>

      <main className="flex-1 flex flex-col justify-center items-center w-full px-4 z-10 my-8">
        <div className="bg-[#111827]/90 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 sm:p-10 w-full max-w-[900px] shadow-2xl relative">
          <div className="flex flex-col items-center mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Create Account
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm">
              Verified access to your personal AI Health Assistant.
            </p>
          </div>

          <form onSubmit={handleRegister} className="flex flex-col gap-6">
            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-xs p-3 rounded-lg text-center font-bold animate-pulse">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="bg-teal-500/10 border border-teal-500/50 text-teal-400 text-xs p-3 rounded-lg text-center font-bold">
                {successMessage}
              </div>
            )}

            {/* Row 1: Name & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                  <input
                    type="text"
                    name="name"
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    required
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-teal-500 transition-all"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                  <input
                    type="email"
                    name="email"
                    onChange={handleInputChange}
                    placeholder="name@example.com"
                    required
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-teal-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Confirm Email & OTP Trigger */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Confirm Email
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                  <input
                    type="email"
                    name="confirmEmail"
                    onChange={handleInputChange}
                    placeholder="Repeat email"
                    required
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-teal-500 transition-all"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={sendOTP}
                disabled={loading || otpSent}
                className={`py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  otpSent
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default"
                    : "bg-teal-500 text-slate-900 hover:brightness-110 shadow-lg shadow-teal-500/10"
                }`}
              >
                {loading ? (
                  "Sending..."
                ) : otpSent ? (
                  <>
                    <CheckCircle2 size={16} /> Code Sent
                  </>
                ) : (
                  "Send Verification Code"
                )}
              </button>
            </div>

            {/* Conditional Row: OTP Input */}
            {otpSent && (
              <div className="flex flex-col gap-2 animate-in slide-in-from-top-2 duration-300">
                <label className="text-xs font-bold text-teal-400 uppercase tracking-widest">
                  Enter 6-Digit OTP
                </label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-teal-500" />
                  <input
                    type="text"
                    name="otp"
                    maxLength="6"
                    onChange={handleInputChange}
                    placeholder="0 0 0 0 0 0"
                    className="w-full bg-[#0B1120] border-2 border-teal-500/30 rounded-xl py-4 pl-12 pr-4 text-lg tracking-[0.5em] font-mono text-white focus:outline-none focus:border-teal-500 transition-all text-center"
                  />
                </div>
              </div>
            )}

            {/* Row 3: Passwords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    onChange={handleInputChange}
                    placeholder="Create password"
                    required
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3.5 pl-12 pr-12 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    onChange={handleInputChange}
                    placeholder="Repeat password"
                    required
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3.5 pl-12 pr-12 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
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

            {/* Row 4: Age, Gender, Blood Group (8 types) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Age
                </label>
                <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    type="number"
                    name="age"
                    onChange={handleInputChange}
                    placeholder="Years"
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Gender
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
                  <select
                    name="gender"
                    onChange={handleInputChange}
                    required
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3.5 pl-12 pr-10 text-sm text-white focus:outline-none focus:border-teal-500 appearance-none cursor-pointer"
                  >
                    <option value="" disabled selected>
                      Select
                    </option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Blood Group
                </label>
                <div className="relative">
                  <Droplet className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
                  <select
                    name="bloodGroup"
                    onChange={handleInputChange}
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl py-3.5 pl-12 pr-10 text-sm text-white focus:outline-none focus:border-teal-500 appearance-none cursor-pointer"
                  >
                    <option value="" disabled selected>
                      Group
                    </option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !otpSent}
              className="w-full bg-gradient-to-r from-teal-400 to-blue-500 text-slate-900 font-extrabold py-4 rounded-xl shadow-lg uppercase tracking-wide hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
            >
              {loading ? "Registering..." : "Complete Registration →"}
            </button>

            <p className="text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-teal-400 font-extrabold hover:underline transition-all"
              >
                Log In
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
