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

      {/* Navigation Bar - Hamburger Menu Removed as requested */}
      <nav className="flex items-center justify-between px-6 py-4 lg:px-12 lg:py-5 border-b border-slate-800/60 bg-[#0B1120]/80 backdrop-blur-md fixed w-full top-0 z-50">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer">
          <Activity className="h-6 w-6 lg:h-7 lg:w-7 text-teal-400" />
          <span className="text-xl lg:text-2xl font-bold tracking-tight text-white">
            HealthBot
          </span>
        </div>

        {/* Desktop Navigation Links (Hidden on Mobile) */}
        <div className="hidden md:flex items-center gap-10 text-sm font-medium text-slate-300">
          <a href="#home" className="text-teal-400 transition-colors">
            Home
          </a>
          <a href="#features" className="hover:text-teal-400 transition-colors">
            Features
          </a>
          <a
            href="#how-it-works"
            className="hover:text-teal-400 transition-colors"
          >
            How It Works
          </a>
          <a href="#about" className="hover:text-teal-400 transition-colors">
            About Us
          </a>
        </div>

        {/* Auth Buttons - Both visible on mobile now! */}
        <div className="flex items-center gap-4 lg:gap-6">
          <Link
            to="/login"
            className="text-xs lg:text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 lg:px-6 lg:py-2.5 text-xs lg:text-sm font-semibold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-md transition-all shadow-[0_0_15px_rgba(45,212,191,0.2)]"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 px-6 lg:pt-44 lg:pb-32 lg:px-12 max-w-[1200px] mx-auto flex flex-col items-center text-center z-10">
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 lg:px-4 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-400 text-[10px] lg:text-xs font-bold tracking-wider mb-6 mt-4 lg:mt-0">
          <Activity size={14} />
          AI POWERED HEALTH ASSISTANT
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-[4rem] font-extrabold tracking-tight text-white mb-6 leading-[1.2] lg:leading-[1.1] lg:whitespace-nowrap">
          Your AI-Powered <br className="block lg:hidden" />{" "}
          <span className="text-teal-400">Health</span> Assistant
        </h1>

        <p className="text-base lg:text-lg text-slate-300 mb-10 leading-relaxed max-w-2xl mx-auto">
          Get instant answers to your health questions, check symptoms, and
          receive smart, evidence-based recommendations – anytime, anywhere.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 lg:mb-16 w-full sm:w-auto">
          <Link
            to="/chat"
            className="w-full sm:w-auto px-8 py-3.5 text-base font-bold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-full transition-all flex items-center justify-center gap-2"
          >
            <MessageSquare className="h-5 w-5" />
            Start Chatting
          </Link>
          <button className="w-full sm:w-auto px-8 py-3.5 text-base font-bold text-white border border-slate-600 hover:bg-slate-800 rounded-full transition-all flex items-center justify-center gap-2">
            Learn More
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Trust Badges - Border removed to match photo exactly */}
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
      </main>

      {/* Features Section - Exact gap from the photo */}
      <section
        id="features"
        className="pt-8 pb-16 px-6 lg:pt-16 lg:pb-20 lg:px-12 relative z-20 max-w-[1400px] mx-auto"
      >
        <div className="text-center mb-16 lg:mb-20">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-white">
            Why Choose HealthBot?
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm lg:text-base">
            Comprehensive healthcare assistance bridging the gap between
            patients and medical knowledge.
          </p>
        </div>

        {/* Grid dynamically adapts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#111827] rounded-2xl p-6 lg:p-8 border border-slate-800 hover:border-teal-500/50 transition-all group text-left">
            <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageSquare className="h-6 w-6 text-teal-400" />
            </div>
            <h3 className="text-lg lg:text-xl font-bold mb-3 text-white">
              AI Symptom Checker
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Describe your symptoms naturally. Our advanced NLP engine analyzes
              patterns to suggest possible causes with confidence scores.
            </p>
          </div>

          <div className="bg-[#111827] rounded-2xl p-6 lg:p-8 border border-slate-800 hover:border-blue-500/50 transition-all group text-left">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <UserPlus className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-lg lg:text-xl font-bold mb-3 text-white">
              Smart Recommendations
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Receive severity-based advice indicating if you need emergency
              care, a routine checkup, or simple home self-care.
            </p>
          </div>

          <div className="bg-[#111827] rounded-2xl p-6 lg:p-8 border border-slate-800 hover:border-purple-500/50 transition-all group text-left">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FileText className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-lg lg:text-xl font-bold mb-3 text-white">
              Health History
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Securely store and track your symptom history and past
              conversations to easily share with your healthcare provider.
            </p>
          </div>

          <div className="bg-[#111827] rounded-2xl p-6 lg:p-8 border border-slate-800 hover:border-rose-500/50 transition-all group text-left">
            <div className="w-12 h-12 bg-rose-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MapPin className="h-6 w-6 text-rose-400" />
            </div>
            <h3 className="text-lg lg:text-xl font-bold mb-3 text-white">
              Nearby Facilities
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Integrated location services to instantly find the nearest
              hospitals, clinics, and emergency services when you need them.
            </p>
          </div>
        </div>
      </section>

      {/* Medical Disclaimer Box - Exact spacing from photo */}
      <div className="max-w-5xl mx-auto px-6 lg:px-12 pb-16 lg:pb-20 w-full">
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 lg:p-8 text-center w-full">
          <div className="flex items-center justify-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 lg:h-5 lg:w-5 text-teal-400" />
            <h4 className="text-teal-400 font-bold uppercase text-xs lg:text-sm tracking-widest">
              Appendix E: Medical Disclaimer
            </h4>
          </div>
          <p className="text-slate-300 text-xs lg:text-sm leading-relaxed max-w-3xl mx-auto">
            This system provides preliminary health information only and is not
            a substitute for professional medical advice, diagnosis, or
            treatment. Always seek the advice of qualified health providers with
            any questions regarding medical conditions. Never disregard
            professional medical advice or delay seeking it because of
            information provided by this system.
          </p>
        </div>
      </div>

      {/* Footer - Logo on Left, Copyright Centered, exact photo layout */}
      <footer className="pb-8 px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between w-full max-w-[1400px] mx-auto relative">
        {/* Logo at the far left on desktop, stacked on mobile */}
        <div className="flex items-center gap-2 opacity-60 mb-4 md:mb-0 md:absolute md:left-6 lg:left-12">
          <HeartPulse className="h-5 w-5 lg:h-6 lg:w-6 text-slate-400" />
          <span className="text-lg lg:text-xl font-bold text-slate-400">
            HealthBot
          </span>
        </div>

        {/* Copyright text perfectly centered */}
        <div className="w-full text-center">
          <p className="text-slate-500 text-[10px] sm:text-xs lg:text-sm font-medium leading-relaxed whitespace-nowrap">
            © Developed by Aarif Shameem, Junaid Nazeer, and Murtaza Badam.
          </p>
        </div>
      </footer>
    </div>
  );
}
