"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Swords,
  Backpack,
  Trophy,
  Map,
  BookOpen,
} from "lucide-react";

export default function GameDashboard() {
  const router = useRouter();

  return (
    // เปลี่ยน max-w-md เป็น max-w-7xl เพื่อให้กว้างเต็มจอ
    <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 text-white">
      {/* Banner / Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 to-indigo-900 p-8 md:p-12 shadow-2xl border border-blue-800/50"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-200 mb-2">
              Ready for Battle?
            </h1>
            <p className="text-blue-200 text-sm md:text-lg max-w-xl">
              โลกแห่งมอนสเตอร์รอคุณอยู่! สะสมทีมที่แข็งแกร่งที่สุด
              แล้วออกไปพิชิตหอคอยแห่งตำนาน
            </p>
            <button className="mt-6 px-6 py-3 bg-white text-indigo-900 font-bold rounded-full hover:bg-blue-50 transition shadow-lg">
              เริ่มภารกิจรายวัน
            </button>
          </div>
          {/* Decoration Image (ถ้ามี) */}
          <div className="hidden md:block">
            <Swords className="w-32 h-32 text-blue-500/20" />
          </div>
        </div>

        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      </motion.div>

      {/* Menu Grid System */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold mb-4 text-slate-300">
          Main Menu
        </h2>

        {/* Responsive Grid: 
            grid-cols-2 (มือถือ), 
            md:grid-cols-3 (แท็บเล็ต), 
            lg:grid-cols-4 (จอคอม) 
        */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          <MenuCard
            icon={
              <ShoppingBag className="h-8 w-8 md:h-10 md:w-10 text-purple-400" />
            }
            title="Gacha"
            desc="อัญเชิญมอนสเตอร์"
            color="bg-slate-800 hover:bg-slate-750 border-purple-500/30 hover:border-purple-500"
            onClick={() => router.push("/game/gacha")}
          />
          <MenuCard
            icon={
              <Backpack className="h-8 w-8 md:h-10 md:w-10 text-emerald-400" />
            }
            title="Inventory"
            desc="จัดการทีม & ไอเทม"
            color="bg-slate-800 hover:bg-slate-750 border-emerald-500/30 hover:border-emerald-500"
            // แก้ตรงนี้ 👇
            onClick={() => router.push("/game/inventory")}
          />
          {/* Battle Card - ทำให้เด่นขึ้น */}
          <MenuCard
            icon={<Swords className="h-8 w-8 md:h-10 md:w-10 text-red-400" />}
            title="Battle Arena"
            desc="ท้าประลอง PVE"
            color="bg-gradient-to-br from-red-900/20 to-slate-800 border-red-500/30 hover:border-red-500 col-span-2 md:col-span-1"
            onClick={() => router.push("/game/battle")}
          />
          {/* เมนูเสริม (Placeholder ให้ดูเต็ม) */}
          <MenuCard
            icon={
              <Trophy className="h-8 w-8 md:h-10 md:w-10 text-yellow-400" />
            }
            title="Leaderboard"
            desc="อันดับผู้เล่น"
            color="bg-slate-800 border-yellow-500/30 hover:border-yellow-500"
            onClick={() => alert("Leaderboard")}
          />
          <MenuCard
            icon={<Map className="h-8 w-8 md:h-10 md:w-10 text-blue-400" />}
            title="World Map"
            desc="เลือกด่านผจญภัย"
            color="bg-slate-800 border-blue-500/30 hover:border-blue-500"
            onClick={() => alert("Map")}
          />
          <MenuCard
            icon={
              <BookOpen className="h-8 w-8 md:h-10 md:w-10 text-pink-400" />
            }
            title="Pokedex"
            desc="สมุดภาพ"
            color="bg-slate-800 border-pink-500/30 hover:border-pink-500"
            onClick={() => alert("Dex")}
          />
        </div>
      </div>
    </main>
  );
}

// Component การ์ดที่ปรับแต่งให้สวยขึ้น
function MenuCard({ icon, title, desc, color, onClick, className }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative overflow-hidden group
        flex flex-col items-center justify-center gap-3 
        p-6 md:p-8 rounded-2xl border-2 transition-all duration-300
        shadow-lg hover:shadow-xl
        ${color}
        ${className}
      `}
    >
      <div className="p-3 rounded-full bg-slate-900/50 group-hover:bg-slate-900 transition-colors">
        {icon}
      </div>
      <div className="text-center z-10">
        <h3 className="font-bold text-lg md:text-xl text-white mb-1">
          {title}
        </h3>
        <p className="text-xs md:text-sm text-slate-400 group-hover:text-slate-300">
          {desc}
        </p>
      </div>

      {/* Effect แสงวิบวับตอน Hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.button>
  );
}
