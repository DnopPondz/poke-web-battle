"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation"; // เพิ่ม usePathname
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function GameLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname(); // เช็ค URL ปัจจุบัน
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSessionAndStarter = async () => {
      try {
        // 1. เช็ค Login
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.replace("/login");
          return;
        }

        // 2. เช็คว่ามี Starter หรือยัง (นับจำนวนโปเกมอนใน Inventory)
        const { count, error } = await supabase
          .from("inventory")
          .select("*", { count: 'exact', head: true }) // head: true คือนับอย่างเดียว ไม่ดึงข้อมูล ประหยัดเน็ต
          .eq("user_id", session.user.id);

        if (error) throw error;

        const hasStarter = count > 0;
        const isStarterPage = pathname === "/game/starter";

        // Logic การ Redirect
        if (!hasStarter && !isStarterPage) {
          // ถ้ายังไม่มีตัว และไม่ได้อยู่หน้าเลือก -> บังคับไปเลือก
          router.replace("/game/starter");
          return; // หยุดโหลดต่อ
        } else if (hasStarter && isStarterPage) {
          // ถ้ามีตัวแล้ว แต่อยู่หน้าเลือก -> ไล่กลับหน้าเกม
          router.replace("/game");
          return; // หยุดโหลดต่อ
        }

        // ถ้าผ่านทุกเงื่อนไข
        setIsAuthenticated(true);
        
      } catch (error) {
        console.error("Check Error:", error);
        router.replace("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkSessionAndStarter();
  }, [router, pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900 text-white">
        <Loader2 className="animate-spin h-10 w-10 text-emerald-500" />
        <p className="ml-3 text-emerald-500 animate-pulse">Loading World...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* ถ้าอยู่หน้าเลือก Starter ไม่ต้องโชว์ Navbar ก็ได้ จะได้ดู Cinematic */}
      {pathname !== "/game/starter" && <Navbar />}
      
      <div className={pathname !== "/game/starter" ? "pb-20" : ""}> 
        {children}
      </div>
    </div>
  );
}