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
  Menu,
  X
} from "lucide-react";

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-900 font-sans text-slate-50 selection:bg-teal-500 selection:text-white">
      {/* Navigation Bar */}
      <nav className="flex items-center justify-between px-6 py-4 lg:px-12 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md fixed w-full top-0 z-50">
        
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer">
          <Activity className="h-8 w-8 text-teal-400" />
          <span className="text-2xl font-bold tracking-tight text-white">
            HealthBot
          </span>
        </div>

        {/* Desktop Navigation Links (Hidden on Mobile) */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#home" className="hover:text-teal-400 transition-colors">
            Home
          </a>
          <a href="#features" className="hover:text-teal-400 transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-teal-400 transition-colors">
            How It Works
          </a>
          <a href="#about" className="hover:text-teal-400 transition-colors">
            About Us
          </a>
        </div>

        {/* Desktop Auth Buttons & Mobile Menu Toggle */}
        <div className="flex items-center gap-4">
          
          {/* Desktop Auth (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 text-sm font-semibold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-full transition-all shadow-[0_0_15px_rgba(45,212,191,0.3)] hover:shadow-[0_0_25px_rgba(45,212,191,0.5)]"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile Menu Button (Hamburger) */}
          <button 
            className="md:hidden text-slate-300 hover:text-white p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown Panel */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-slate-900 border-b border-slate-800 shadow-2xl flex flex-col py-6 px-6 gap-6 md:hidden z-50">
            <a href="#home" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-slate-300 hover:text-teal-400">
              Home
            </a>
            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-slate-300 hover:text-teal-400">
              Features
            </a>
            <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-slate-300 hover:text-teal-400">
              How It Works
            </a>
            <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-slate-300 hover:text-teal-400">
              About Us
            </a>
            <div className="flex flex-col gap-4 mt-2 pt-6 border-t border-slate-800">
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-center text-slate-300 py-2">
                Log In
              </Link>
              <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-bold text-center text-slate-900 bg-teal-400 py-3 rounded-full">
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 lg:px-12 max-w-4xl mx-auto flex flex-col items-center justify-center text-center z-10">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Your AI-Powered <br className="hidden lg:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
            Health
          </span>{" "}
          Assistant
        </h1>

        <p className="text-lg lg:text-xl text-slate-400 mb-10 leading-relaxed max-w-3xl mx-auto">
          Get instant answers to your health questions, check symptoms, and
          receive smart, evidence-based recommendations – anytime, anywhere.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 w-full">
          <Link
            to="/chat"
            className="w-full sm:w-auto px-8 py-4 text-base font-bold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-full transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(45,212,191,0.4)]"
          >
            <MessageSquare className="h-5 w-5" />
            Start Chatting
          </Link>
          <button className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white border border-slate-700 hover:border-slate-500 hover:bg-slate-800 rounded-full transition-all flex items-center justify-center gap-2">
            Learn More
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Restored Trust Badges */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-12 pt-8 border-t border-slate-800/50 w-full max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-teal-400" />
            <span className="text-sm font-medium text-slate-300">Secure & Private</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-medium text-slate-300">Instant Support</span>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-400" />
            <span className="text-sm font-medium text-slate-300">AI-Powered</span>
          </div>
        </div>
      </main>

      {/* Features Section (White Background) */}
      <section
        id="features"
        className="bg-white text-slate-900 py-24 px-6 lg:px-12 rounded-t-[3rem] lg:rounded-t-[5rem] relative z-20"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">
              Why Choose HealthBot?
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">
              Comprehensive healthcare assistance bridging the gap between
              patients and medical knowledge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl hover:border-teal-100 transition-all group">
              <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare className="h-7 w-7 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Symptom Checker</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Describe your symptoms naturally. Our advanced NLP engine
                analyzes patterns to suggest possible causes with confidence
                scores.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl hover:border-blue-100 transition-all group">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <UserPlus className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Smart Recommendations</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Receive severity-based advice indicating if you need emergency
                care, a routine checkup, or simple home self-care.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl hover:border-purple-100 transition-all group">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Health History</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Securely store and track your symptom history and past
                conversations to easily share with your healthcare provider.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl hover:border-rose-100 transition-all group">
              <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MapPin className="h-7 w-7 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Nearby Facilities</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Integrated location services to instantly find the nearest
                hospitals, clinics, and emergency services when you need them.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mandatory Medical Disclaimer & Footer */}
      <footer className="bg-slate-100 border-t border-slate-200 py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
          <div className="flex items-center gap-2 opacity-50 mb-6">
            <HeartPulse className="h-6 w-6 text-slate-800" />
            <span className="text-xl font-bold text-slate-800">HealthBot</span>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8 max-w-3xl">
            <h4 className="text-amber-800 font-bold mb-2 uppercase text-sm tracking-wider">
              Appendix E: Medical Disclaimer
            </h4>
            <p className="text-amber-700/80 text-sm leading-relaxed">
              This system provides preliminary health information only and is
              not a substitute for professional medical advice, diagnosis, or
              treatment. Always seek the advice of qualified health providers
              with any questions regarding medical conditions. Never disregard
              professional medical advice or delay seeking it because of
              information provided by this system.
            </p>
          </div>

          <p className="text-slate-400 text-sm">
            © 2024-2026 HealthBot Project. Developed by Aarif, Junaid, and
            Murtaza.
          </p>
        </div>
      </footer>
    </div>
  );
}