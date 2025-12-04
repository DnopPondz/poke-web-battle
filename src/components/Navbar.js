// src/components/Navbar.js
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Coins, Zap, User, LogOut, Gem, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useProfileStore } from "@/store/profileStore";

export default function Navbar() {
  const router = useRouter();
  const { profile, fetchProfile } = useProfileStore();
  const [timerText, setTimerText] = useState(null);

  useEffect(() => { fetchProfile(); }, []);

  // Logic นับถอยหลัง (UI Only)
  useEffect(() => {
    if (!profile || profile.energy >= 50 || !profile.last_energy_updated_at) {
      setTimerText(null);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const lastUpdate = new Date(profile.last_energy_updated_at);
      // เป้าหมาย: ครั้งล่าสุด + 5 นาที
      const nextUpdate = new Date(lastUpdate.getTime() + 5 * 60 * 1000);
      const diff = nextUpdate - now;

      if (diff <= 0) {
        setTimerText("..."); // กำลังโหลด
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimerText(`${m}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [profile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Profile */}
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full border-2 border-slate-700 bg-slate-800 overflow-hidden">
               {profile?.avatar_url ? <img src={profile.avatar_url} className="h-full w-full" /> : <User className="p-2 text-slate-400" />}
            </div>
            <span className="font-bold text-white truncate max-w-[100px]">{profile?.full_name}</span>
          </div>

          {/* Right: Resources */}
          <div className="flex items-center gap-3">
            
            {/* Energy Bar */}
            <div className="flex flex-col items-end">
               <span className="text-[10px] text-slate-400 uppercase hidden md:block">Energy</span>
               <div className="flex items-center bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700 min-h-[32px]">
                  <Zap className="h-4 w-4 text-blue-400 fill-blue-400 mr-1.5" />
                  <span className="text-sm font-bold text-blue-100">{profile?.energy || 0}<span className="text-slate-500 text-xs">/50</span></span>
                  
                  {/* Timer */}
                  {timerText && (
                    <div className="flex items-center ml-2 pl-2 border-l border-slate-600/50 h-4">
                        <span className="text-[10px] font-mono text-blue-300/90 flex items-center gap-1 min-w-[35px]">
                            <Clock className="w-3 h-3" /> {timerText}
                        </span>
                    </div>
                  )}
               </div>
            </div>

            {/* Coins */}
            <div className="flex flex-col items-end">
               <span className="text-[10px] text-slate-400 uppercase hidden md:block">Coins</span>
               <div className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700 h-[34px]">
                  <Coins className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-bold text-yellow-100">{profile?.coins.toLocaleString()}</span>
               </div>
            </div>

            {/* Scale */}
            <div className="flex flex-col items-end">
               <span className="text-[10px] text-slate-400 uppercase hidden md:block">Scale</span>
               <div className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700 h-[34px]">
                  <Gem className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-bold text-cyan-100">{profile?.poke_scale.toLocaleString()}</span>
               </div>
            </div>

            <div className="h-8 w-[1px] bg-slate-700 mx-2 hidden md:block"></div>
            
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition"><LogOut className="h-5 w-5" /></button>
          </div>
        </div>
      </div>
    </nav>
  );
}