"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Box } from "lucide-react";
import Pack1 from "@/components/gacha/Pack1";
import Pack2 from "@/components/gacha/Pack2";
// import Pack3 from "@/components/gacha/Pack3"; ... เพิ่มตามต้องการ

export default function GachaPage() {
  const [activeTab, setActiveTab] = useState("pack1");

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 flex flex-col items-center">
      
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900 to-black -z-10" />

      {/* Navbar */}
      <div className="w-full max-w-2xl flex items-center mb-6">
        <Link href="/game">
          <button className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition">
            <ArrowLeft className="h-6 w-6" />
          </button>
        </Link>
        <h1 className="ml-4 text-xl font-bold flex items-center gap-2">
            <Box className="w-6 h-6 text-purple-400"/> Gacha Shop
        </h1>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2 mb-8 bg-slate-800 p-1 rounded-lg">
        <button 
            onClick={() => setActiveTab("pack1")}
            className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === "pack1" ? "bg-purple-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
        >
            Gen 1
        </button>
        <button 
            onClick={() => setActiveTab("pack2")}
            className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === "pack2" ? "bg-yellow-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
        >
            Gen 2
        </button>
      </div>

      {/* Render Active Pack Component */}
      <div className="w-full max-w-md bg-slate-900/50 border border-slate-700 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Decorative Light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent blur-sm"></div>
        
        {activeTab === "pack1" && <Pack1 />}
        {activeTab === "pack2" && <Pack2 />}
      </div>

    </div>
  );
}