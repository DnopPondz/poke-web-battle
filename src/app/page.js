// src/app/page.js
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Gamepad2, Sparkles } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white p-6 relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-black z-0" />
      
      {/* Animated Particles (Decoration) */}
      <motion.div 
        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
        transition={{ duration: 5, repeat: Infinity }}
        className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl"
      />
      <motion.div 
        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
        transition={{ duration: 7, repeat: Infinity }}
        className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl"
      />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 flex flex-col items-center max-w-2xl text-center space-y-8"
      >
        {/* Game Icon */}
        <div className="relative">
          <div className="absolute inset-0 animate-pulse bg-blue-500/50 blur-xl rounded-full"></div>
          <Gamepad2 className="relative h-24 w-24 text-white drop-shadow-lg" />
        </div>

        {/* Title & Description */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-purple-400 to-emerald-400 filter drop-shadow-sm">
            Monster Gacha
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-lg mx-auto leading-relaxed">
            ผจญภัยในโลกมอนสเตอร์ สะสมตัวละครหายาก <br className="hidden md:block"/> และต่อสู้เพื่อเป็นที่หนึ่งในเซิร์ฟเวอร์!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-8">
          <Link href="/register" className="w-full sm:w-auto">
            <button className="w-full px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg shadow-lg shadow-blue-500/25 transition-all transform hover:scale-105 flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5" />
              เริ่มต้นผจญภัย (สมัครสมาชิก)
            </button>
          </Link>
          
          <Link href="/login" className="w-full sm:w-auto">
            <button className="w-full px-8 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-lg transition-all hover:scale-105">
              เข้าสู่ระบบ
            </button>
          </Link>
        </div>
      </motion.div>

      {/* Footer Info */}
      <footer className="absolute bottom-6 text-slate-500 text-sm z-10">
        © 2024 Monster Gacha Game. All rights reserved.
      </footer>
    </div>
  );
}