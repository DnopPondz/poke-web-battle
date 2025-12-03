"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Coins, Zap, User, LogOut, Menu } from "lucide-react"; // เพิ่ม Menu icon เผื่อใช้
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-xl">
      {/* เปลี่ยน max-w-md เป็น max-w-7xl หรือ container เพื่อให้กว้างขึ้นบน Desktop */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* ฝั่งซ้าย: ข้อมูลผู้เล่น */}
          <div className="flex items-center gap-4">
            <div className="relative h-10 w-10 md:h-12 md:w-12 overflow-hidden rounded-full border-2 border-slate-700 bg-slate-800 shadow-md">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User className="h-full w-full p-2 text-slate-400" />
              )}
            </div>
            
            <div className="flex flex-col">
              <span className="font-bold text-sm md:text-base text-white truncate max-w-[120px] md:max-w-xs">
                {profile?.full_name || "Trainer"}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-400 font-mono bg-emerald-400/10 px-1.5 rounded">
                  Lv. {profile?.level || 1}
                </span>
                {/* Exp Bar เล็กๆ (โชว์เฉพาะจอใหญ่กว่ามือถือ) */}
                <div className="hidden md:block w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[40%]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* ฝั่งขวา: ทรัพยากร */}
          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end mr-1">
                 <span className="text-[10px] text-slate-400 uppercase tracking-wider hidden md:block">Energy</span>
                 <div className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">
                    <Zap className="h-4 w-4 text-blue-400 fill-blue-400" />
                    <span className="text-sm font-bold text-blue-100">
                      {profile?.energy || 0}<span className="text-slate-500 text-xs">/50</span>
                    </span>
                 </div>
              </div>

              <div className="flex flex-col items-end">
                 <span className="text-[10px] text-slate-400 uppercase tracking-wider hidden md:block">Coins</span>
                 <div className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">
                    <Coins className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-bold text-yellow-100">
                      {profile ? profile.coins.toLocaleString() : 0}
                    </span>
                 </div>
              </div>
            </div>
            
            <div className="h-8 w-[1px] bg-slate-700 hidden md:block"></div>

            <button 
              onClick={handleLogout}
              className="p-2 md:px-4 md:py-2 rounded-lg text-slate-400 hover:text-white hover:bg-red-500/10 transition-colors flex items-center gap-2"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden md:inline text-sm font-medium">Logout</span>
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}