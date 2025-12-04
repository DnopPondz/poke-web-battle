// src/app/game/layout.js
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useProfileStore } from "@/store/profileStore";
import { checkAndRegenerateEnergy } from "@/actions/energyActions";

export default function GameLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const { profile, fetchProfile } = useProfileStore();

  // 1. Check Login & Init
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }

      // เช็ค Energy ครั้งแรกทันทีที่เข้าเกม
      await checkAndRegenerateEnergy(session.user.id);
      await fetchProfile();

      // เช็ค Starter (Logic เดิม)
      const { count } = await supabase.from("inventory").select("*", { count: 'exact', head: true }).eq("user_id", session.user.id);
      const hasStarter = count > 0;
      const isStarterPage = pathname === "/game/starter";

      if (!hasStarter && !isStarterPage) router.replace("/game/starter");
      else if (hasStarter && isStarterPage) router.replace("/game");
      else setIsAuthenticated(true);
      
      setIsLoading(false);
    };
    init();
  }, []);

  // 2. 🔥 Loop เช็คเวลาทุก 1 วินาที
  useEffect(() => {
    if (!profile?.last_energy_updated_at || profile.energy >= 50) return;

    const timer = setInterval(async () => {
      const now = new Date();
      const lastUpdate = new Date(profile.last_energy_updated_at);
      const diffMinutes = (now - lastUpdate) / 1000 / 60;

      // ถ้าเวลาเกิน 5 นาที ให้เรียก Server Action
      if (diffMinutes >= 5) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await checkAndRegenerateEnergy(user.id);
            await fetchProfile(); // ดึงข้อมูลใหม่มาแสดง
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [profile]); // ทำงานเมื่อ profile เปลี่ยน

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-900 text-white">Loading...</div>;
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-900">
      {pathname !== "/game/starter" && <Navbar />}
      <div className={pathname !== "/game/starter" ? "pb-20" : ""}>{children}</div>
    </div>
  );
}