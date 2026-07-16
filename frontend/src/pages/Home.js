import React, { useState } from "react";
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
  X,
  Building,
  Store,
} from "lucide-react";

export default function Home() {
  const [showModal, setShowModal] = useState(false);

  // Fetch user data from local storage to personalize the Google Maps links
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const userAddress = userData.address ? `near ${userData.address}` : "near me";

  return (
    <div className="min-h-screen bg-[#0B1120] font-sans text-slate-50 selection:bg-teal-500 selection:text-white relative w-full">
      {/* --- MODAL FOR NEARBY FACILITIES --- */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
          <div className="bg-[#111827] border border-slate-700/50 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-slate-800/80">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <MapPin className="text-teal-400" /> Nearby Facilities
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-rose-500 transition-colors p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
              <ModalCard
                icon={Building}
                title="Hospitals"
                desc="Find general and specialized hospitals."
                query="hospitals"
                userAddress={userAddress}
              />
              <ModalCard
                icon={Activity}
                title="Health Centers"
                desc="Locate community health centers."
                query="health centers"
                userAddress={userAddress}
              />
              <ModalCard
                icon={HeartPulse}
                title="Clinics"
                desc="Discover walk-in clinics and outpatient care."
                query="clinics"
                userAddress={userAddress}
              />
              <ModalCard
                icon={Store}
                title="Medical Stores"
                desc="Find local pharmacies and 24/7 stores."
                query="pharmacies medical stores"
                userAddress={userAddress}
              />
            </div>
          </div>
        </div>
      )}

      {/* Background Glow Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 md:left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-teal-500/10 rounded-full blur-[80px] md:blur-[120px]" />
        <div className="absolute top-40 right-0 md:right-1/4 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-cyan-500/10 rounded-full blur-[60px] md:blur-[100px]" />
      </div>

      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 w-full z-[100] flex flex-col md:flex-row items-center justify-between px-4 py-3 lg:px-12 lg:py-5 border-b border-slate-800/60 bg-[#0B1120]/95 backdrop-blur-xl">
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

        {/* 5 Navigation Links - Scrollable on mobile */}
        <div className="flex items-center justify-start md:justify-center gap-4 sm:gap-6 lg:gap-8 text-[12px] lg:text-sm font-medium text-slate-300 w-full md:w-auto mt-3 md:mt-0 overflow-x-auto no-scrollbar pb-1">
          <a
            href="#home"
            className="px-2 py-2 hover:text-teal-400 active:text-teal-400 transition-colors whitespace-nowrap inline-block"
          >
            Home
          </a>
          <a
            href="#features"
            className="px-2 py-2 hover:text-teal-400 active:text-teal-400 transition-colors whitespace-nowrap inline-block"
          >
            Features
          </a>
          <button
            onClick={() => setShowModal(true)}
            className="px-2 py-2 hover:text-teal-400 active:text-teal-400 transition-colors whitespace-nowrap inline-block"
          >
            Facilities
          </button>
          <a
            href="#how-it-works"
            className="px-2 py-2 hover:text-teal-400 active:text-teal-400 transition-colors whitespace-nowrap inline-block"
          >
            How It Works
          </a>
          <a
            href="#about"
            className="px-2 py-2 hover:text-teal-400 active:text-teal-400 transition-colors whitespace-nowrap inline-block"
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
        className="relative pt-36 pb-10 px-6 lg:pt-40 lg:pb-16 max-w-[1200px] mx-auto flex flex-col items-center text-center z-10"
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
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 w-full">
          <Link
            to="/chat"
            className="px-8 py-3.5 text-base font-bold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-full transition-all flex items-center gap-2 w-full sm:w-auto justify-center shadow-[0_0_20px_rgba(45,212,191,0.2)]"
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
        <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-8 w-full max-w-3xl mx-auto opacity-80">
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
            link="/chat"
          />
          <FeatureCard
            icon={UserPlus}
            theme="blue"
            title="Smart Recommendations"
            desc="Severity-based advice for emergency care or self-care."
            link="/chat"
          />
          <FeatureCard
            icon={FileText}
            theme="purple"
            title="Health History"
            desc="Securely store and track your history and past conversations."
            link="/login"
          />
          <FeatureCard
            icon={MapPin}
            theme="rose"
            title="Nearby Facilities"
            desc="Instantly find the nearest hospitals and clinics when needed."
            onClick={() => setShowModal(true)}
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

      {/* --- FOOTER --- */}
      <footer className="pb-10 px-6 flex flex-col items-center justify-center w-full max-w-[1400px] mx-auto opacity-70 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <HeartPulse className="text-slate-400" size={24} />
          <span className="text-xl lg:text-2xl font-bold text-slate-400">
            HealthBot
          </span>
        </div>
        <p className="text-slate-500 text-[10px] sm:text-xs font-medium text-center">
          © 2026 Developed by Aarif, Junaid, and Murtaza.
        </p>
      </footer>
    </div>
  );
}

// Sub-Component for Modal Items
const ModalCard = ({ icon: Icon, title, desc, query, userAddress }) => {
  const mapUrl = `https://www.google.com/maps/search/${encodeURIComponent(query + " " + userAddress)}`;

  return (
    <a
      href={mapUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-[#0B1120] border border-slate-800 rounded-2xl p-5 hover:border-teal-500/50 hover:-translate-y-1 transition-all group flex flex-col gap-3 shadow-lg"
    >
      <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
        <Icon className="text-teal-400" size={24} />
      </div>
      <div>
        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        <p className="text-sm text-slate-400">{desc}</p>
      </div>
      <div className="mt-auto flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-teal-500 opacity-80 group-hover:opacity-100 transition-opacity">
        Open Map <ChevronRight size={12} />
      </div>
    </a>
  );
};

// Feature Card Component
const FeatureCard = ({ icon: Icon, theme, title, desc, link, onClick }) => {
  const themes = {
    teal: "hover:border-teal-500/50 bg-teal-500/20 text-teal-400",
    blue: "hover:border-blue-500/50 bg-blue-500/20 text-blue-400",
    purple: "hover:border-purple-500/50 bg-purple-500/20 text-purple-400",
    rose: "hover:border-rose-500/50 bg-rose-500/20 text-rose-400",
  };

  const CardContent = (
    <div
      className={`bg-[#111827] rounded-2xl p-6 border border-slate-800 transition-all duration-300 group cursor-pointer h-full flex flex-col hover:-translate-y-1 hover:shadow-xl hover:shadow-${theme}-500/10 ${themes[theme].split(" ")[0]}`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${themes[theme].split(" ")[1]}`}
      >
        <Icon className={`h-6 w-6 ${themes[theme].split(" ")[2]}`} />
      </div>
      <h3 className="text-lg font-bold mb-3 text-white flex-1">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed mb-4">{desc}</p>

      <div
        className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity mt-auto ${themes[theme].split(" ")[2]}`}
      >
        {onClick ? "View Options" : "Try it now"} <ChevronRight size={12} />
      </div>
    </div>
  );

  // If onClick is provided, use a div button
  if (onClick) {
    return (
      <div onClick={onClick} className="block h-full">
        {CardContent}
      </div>
    );
  }

  // Otherwise, standard React Router Link
  return (
    <Link to={link} className="block h-full">
      {CardContent}
    </Link>
  );
};

// Step Component
const Step = ({ number, title, desc }) => (
  <div className="flex flex-col items-center">
    <div className="text-5xl font-black text-teal-500/50 mb-4">{number}</div>
    <h4 className="text-xl font-bold text-white mb-2">{title}</h4>
    <p className="text-slate-400 text-sm text-center">{desc}</p>
  </div>
);
