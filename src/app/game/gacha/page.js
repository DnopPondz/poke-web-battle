"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Box, Lock } from "lucide-react";
import Link from "next/link";
import Pack1 from "@/components/gacha/Pack1";
// import Pack2 from "@/components/gacha/Pack2"; // ไว้ import เมื่อทำ Gen 2 เสร็จ

export default function GachaPage() {
  const [activeTab, setActiveTab] = useState("gen1");

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 flex flex-col items-center">
      
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-black -z-10" />

      {/* Navbar */}
      <div className="w-full max-w-2xl flex items-center mb-8 pt-4">
        <Link href="/game">
          <button className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 transition border border-slate-700">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <h1 className="ml-4 text-2xl font-bold flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            <Box className="w-6 h-6 text-purple-400"/> Monster Gacha
        </h1>
      </div>

      {/* Tabs Selector (เมนูเลือกกล่อง) */}
      <div className="w-full max-w-md flex gap-2 mb-8 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700">
        
        {/* ปุ่ม Gen 1 */}
        <button 
            onClick={() => setActiveTab("gen1")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all relative overflow-hidden
                ${activeTab === "gen1" 
                    ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg" 
                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"}`}
        >
            Gen 1 (Kanto)
        </button>

        {/* ปุ่ม Gen 2 (ยังไม่เปิด) */}
        <button 
            disabled
            className="flex-1 py-2.5 rounded-lg text-sm font-bold text-slate-600 cursor-not-allowed flex items-center justify-center gap-2 bg-slate-800/30"
        >
            Gen 2 <Lock className="w-3 h-3" />
        </button>

        {/* ปุ่ม Gen 3 (ยังไม่เปิด) */}
        <button 
            disabled
            className="flex-1 py-2.5 rounded-lg text-sm font-bold text-slate-600 cursor-not-allowed flex items-center justify-center gap-2 bg-slate-800/30"
        >
            Gen 3 <Lock className="w-3 h-3" />
        </button>
      </div>

      {/* Display Active Box */}
      <motion.div 
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900/80 border border-slate-700 rounded-3xl p-6 shadow-2xl backdrop-blur-sm relative"
      >
        {/* แสงตกแต่ง */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent blur-sm"></div>
        
        {activeTab === "gen1" && <Pack1 />}
        {/* {activeTab === "gen2" && <Pack2 />} */}
      
      </motion.div>

    </div>
  );
}