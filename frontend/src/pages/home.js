import React from "react";
import { Link } from "react-router-dom";
import {
  HeartPulse,
  MessageSquare,
  UserPlus,
  FileText,
  MapPin,
  Activity,
  ChevronRight,
  Shield,
  Clock,
  Brain,
  AlertTriangle,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0B1120] font-sans text-slate-50 selection:bg-teal-500 selection:text-white overflow-x-hidden relative w-full">
      {/* Background Glow Orbs */}
      <div className="absolute top-0 left-0 md:left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-teal-500/10 rounded-full blur-[80px] md:blur-[120px] pointer-events-none" />
      <div className="absolute top-40 right-0 md:right-1/4 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-cyan-500/10 rounded-full blur-[60px] md:blur-[100px] pointer-events-none" />

      {/* Navigation Bar - Hamburger Removed, Links Always Visible */}
      <nav className="flex flex-col md:flex-row items-center justify-between px-4 py-3 lg:px-12 lg:py-5 border-b border-slate-800/60 bg-[#0B1120]/80 backdrop-blur-md fixed w-full top-0 z-50">
        {/* Top Row on Mobile (Logo & Auth) */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-2 cursor-pointer">
            <Activity className="h-6 w-6 lg:h-7 lg:w-7 text-teal-400" />
            <span className="text-xl lg:text-2xl font-bold tracking-tight text-white">
              HealthBot
            </span>
          </div>

          <div className="flex md:hidden items-center gap-3">
            <Link
              to="/login"
              className="text-[11px] font-medium text-slate-300 hover:text-white"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="px-3 py-1.5 text-[11px] font-semibold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-md transition-all"
            >
              Sign Up
            </Link>
          </div>
        </div>

        {/* 4 Navigation Links - Always visible on Mobile & Desktop */}
        <div className="flex items-center justify-center gap-4 sm:gap-8 lg:gap-10 text-[11px] lg:text-sm font-medium text-slate-300 w-full md:w-auto mt-3 md:mt-0 overflow-x-auto no-scrollbar">
          <a
            href="#home"
            className="hover:text-teal-400 transition-colors whitespace-nowrap"
          >
            Home
          </a>
          <a
            href="#features"
            className="hover:text-teal-400 transition-colors whitespace-nowrap"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="hover:text-teal-400 transition-colors whitespace-nowrap"
          >
            How It Works
          </a>
          <a
            href="#about"
            className="hover:text-teal-400 transition-colors whitespace-nowrap"
          >
            About Us
          </a>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/login"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="px-6 py-2.5 text-sm font-semibold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-md transition-all"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* --- SECTION 1: HOME --- */}
      <section
        id="home"
        className="relative pt-32 pb-10 px-6 lg:pt-40 lg:pb-16 max-w-[1200px] mx-auto flex flex-col items-center text-center z-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 lg:px-4 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-400 text-[10px] lg:text-xs font-bold tracking-wider mb-6 mt-4 lg:mt-0">
          <Activity size={14} /> AI POWERED HEALTH ASSISTANT
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-[4rem] font-extrabold tracking-tight text-white mb-6 leading-[1.2] lg:leading-[1.1]">
          Your AI-Powered <span className="text-teal-400">Health</span>{" "}
          Assistant
        </h1>
        <p className="text-base lg:text-lg text-slate-300 mb-10 leading-relaxed max-w-2xl mx-auto">
          Get instant answers to your health questions, check symptoms, and
          receive smart recommendations – anytime, anywhere.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link
            to="/chat"
            className="px-8 py-3.5 text-base font-bold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-full transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <MessageSquare size={20} /> Start Chatting
          </Link>
          <a
            href="#features"
            className="px-8 py-3.5 text-base font-bold text-white border border-slate-600 hover:bg-slate-800 rounded-full transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            Learn More <ChevronRight size={20} />
          </a>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-8 w-full max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 lg:h-5 lg:w-5 text-teal-400" />
            <span className="text-xs lg:text-sm font-medium text-slate-200">
              Secure & Private
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 lg:h-5 lg:w-5 text-blue-400" />
            <span className="text-xs lg:text-sm font-medium text-slate-200">
              Instant Support
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 lg:h-5 lg:w-5 text-purple-400" />
            <span className="text-xs lg:text-sm font-medium text-slate-200">
              AI-Powered
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 lg:h-5 lg:w-5 text-rose-400" />
            <span className="text-xs lg:text-sm font-medium text-slate-200">
              24/7 Available
            </span>
          </div>
        </div>
      </section>

      {/* --- SECTION 2: FEATURES --- */}
      <section
        id="features"
        className="pt-12 pb-12 px-6 lg:pt-16 lg:pb-16 relative z-20 max-w-[1400px] mx-auto"
      >
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-white">
            Why Choose HealthBot?
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Comprehensive healthcare assistance bridging the gap between
            patients and medical knowledge.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={MessageSquare}
            theme="teal"
            title="AI Symptom Checker"
            desc="Describe symptoms naturally. Our engine suggests possible causes."
          />
          <FeatureCard
            icon={UserPlus}
            theme="blue"
            title="Smart Recommendations"
            desc="Severity-based advice for emergency care or self-care."
          />
          <FeatureCard
            icon={FileText}
            theme="purple"
            title="Health History"
            desc="Securely store and track your history and past conversations."
          />
          <FeatureCard
            icon={MapPin}
            theme="rose"
            title="Nearby Facilities"
            desc="Instantly find the nearest hospitals and clinics when needed."
          />
        </div>
      </section>

      {/* --- SECTION 3: HOW IT WORKS --- */}
      <section
        id="how-it-works"
        className="py-12 lg:py-16 px-6 lg:px-12 bg-[#111827]/30 border-y border-slate-800/50"
      >
        <div className="max-w-[1200px] mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-10 text-white">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <Step
              number="01"
              title="Register"
              desc="Create your secure profile in seconds."
            />
            <Step
              number="02"
              title="Chat"
              desc="Describe your symptoms to our AI bot."
            />
            <Step
              number="03"
              title="Get Advice"
              desc="Receive instant medical guidance."
            />
          </div>
        </div>
      </section>

      {/* --- SECTION 4: ABOUT US --- */}
      <section
        id="about"
        className="pt-10 pb-6 lg:pt-14 lg:pb-8 px-6 lg:px-12 max-w-[1200px] mx-auto"
      >
        <div className="bg-[#111827] border border-slate-800 p-8 lg:p-12 rounded-3xl flex flex-col md:flex-row items-center gap-10 shadow-lg">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-bold text-white mb-4 lg:mb-6">
              About HealthBot
            </h2>
            <p className="text-slate-400 leading-relaxed text-sm lg:text-base">
              HealthBot leverages artificial intelligence to make healthcare
              information accessible, providing evidence-based insights to users
              worldwide.
            </p>
          </div>
          <Activity
            size={80}
            className="text-teal-400 opacity-20 hidden md:block"
          />
        </div>
      </section>

      {/* Disclaimer */}
      <div className="max-w-5xl mx-auto px-6 pb-16 mt-2 lg:mt-4">
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 lg:p-8 text-center shadow-lg">
          <div className="flex items-center justify-center gap-2 mb-3 lg:mb-4">
            <AlertTriangle className="text-teal-400" size={18} />
            <h4 className="text-teal-400 font-bold uppercase text-[10px] lg:text-xs tracking-widest">
              Medical Disclaimer
            </h4>
          </div>
          <p className="text-slate-400 text-[10px] lg:text-xs leading-relaxed max-w-3xl mx-auto">
            This system provides preliminary information only and is not a
            substitute for professional medical advice.
          </p>
        </div>
      </div>

      <footer className="pb-8 px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between w-full max-w-[1400px] mx-auto opacity-60">
        <div className="flex items-center gap-2">
          <HeartPulse className="text-slate-400" size={20} />
          <span className="text-xl font-bold text-slate-400">HealthBot</span>
        </div>
        <p className="text-slate-500 text-xs mt-4 md:mt-0">
          © 2026 Developed by Aarif, Junaid, and Murtaza.
        </p>
      </footer>
    </div>
  );
}

const FeatureCard = ({ icon: Icon, theme, title, desc }) => {
  const themes = {
    teal: "hover:border-teal-500/50 bg-teal-500/20 text-teal-400",
    blue: "hover:border-blue-500/50 bg-blue-500/20 text-blue-400",
    purple: "hover:border-purple-500/50 bg-purple-500/20 text-purple-400",
    rose: "hover:border-rose-500/50 bg-rose-500/20 text-rose-400",
  };
  return (
    <div
      className={`bg-[#111827] rounded-2xl p-6 border border-slate-800 transition-all group ${themes[theme].split(" ")[0]}`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${themes[theme].split(" ")[1]}`}
      >
        <Icon className={`h-6 w-6 ${themes[theme].split(" ")[2]}`} />
      </div>
      <h3 className="text-lg font-bold mb-3 text-white">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
};

const Step = ({ number, title, desc }) => (
  <div className="flex flex-col items-center">
    <div className="text-5xl font-black text-teal-500/10 mb-4">{number}</div>
    <h4 className="text-xl font-bold text-white mb-2">{title}</h4>
    <p className="text-slate-400 text-sm text-center">{desc}</p>
  </div>
);
