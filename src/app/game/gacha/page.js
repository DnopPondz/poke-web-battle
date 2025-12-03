"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Coins, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProfileStore } from "@/store/profileStore"; // <<<< NEW IMPORT

export default function GachaPage() {
  const router = useRouter();
  const [status, setStatus] = useState("idle"); // idle, pulling, result
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // GET STATE AND LOCAL DEDUCT FUNCTION FROM STORE
  const { profile, deductCoinsLocally } = useProfileStore();
  const PULL_COST = 500;

  // ฟังก์ชันสุ่มกาชา
  const pullGacha = async () => {
    if (status === "pulling") return;
    setStatus("pulling");
    setErrorMsg("");
    setResult(null);

    try {
      // 1. เช็ค User ปัจจุบัน
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("กรุณาเข้าสู่ระบบใหม่");

      // 2. เช็คเงิน (ใช้ค่าจาก Store)
      const currentCoins = profile.coins; 
      
      if (currentCoins < PULL_COST) {
        // หากเงินไม่พอ จะไม่ทำ Optimistic Update และโยน Error
        throw new Error(`เงินไม่พอ! ต้องการ ${PULL_COST} Coins`);
      }

      // === OPTIMISTIC UPDATE: ลดเงินใน Navbar ทันที ===
      deductCoinsLocally(PULL_COST);
      // ===============================================

      // 3. เริ่มสุ่ม (RNG Logic: ใช้ API Data-driven Rarity)
      const randomId = Math.floor(Math.random() * 151) + 1;
      
      // ดึงข้อมูลจาก PokeAPI
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
      if (!res.ok) throw new Error(`PokeAPI call failed for ID ${randomId}`);
      
      const pokeData = await res.json();

      // คำนวณ Rarity (Dynamic logic จาก BST ของ API)
      const baseStat = pokeData.stats.reduce((acc, curr) => acc + curr.base_stat, 0);
      let rarity = "N";
      if (baseStat > 500) rarity = "SSR";
      else if (baseStat > 400) rarity = "SR";
      else if (baseStat > 300) rarity = "R";

      // 4. บันทึก Transaction (Persistent Update ใน DB)
      
      // 4.1 หักเงิน
      const newCoins = currentCoins - PULL_COST; // ใช้ currentCoins ที่ดึงมาจาก store ก่อนหัก local
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ coins: newCoins }) 
        .eq("id", user.id);
      
      if (updateError) throw updateError;

      // 4.2 เพิ่ม Pokemon เข้า Inventory
      const newPokemon = {
        user_id: user.id,
        pokemon_id: pokeData.id,
        name: pokeData.name,
        rarity: rarity,
        stats: {
          hp: pokeData.stats[0].base_stat,
          atk: pokeData.stats[1].base_stat,
          def: pokeData.stats[2].base_stat,
          spd: pokeData.stats[5].base_stat,
        },
        image_url: pokeData.sprites.other["official-artwork"].front_default,
      };

      const { error: insertError } = await supabase
        .from("inventory")
        .insert(newPokemon);

      if (insertError) throw insertError;

      // 5. สำเร็จ! แสดงผล
      setTimeout(() => {
        setResult(newPokemon);
        setStatus("result");
      }, 2000);

    } catch (err) {
      // Note: ในกรณีที่เกิด Error (เช่น DB Update ล้มเหลว)
      // Navbar.js จะทำการ fetchProfile ใหม่ ซึ่งจะซิงค์ค่าจาก DB กลับมาอัตโนมัติ
      console.error(err);
      setErrorMsg(err.message);
      setStatus("idle");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background Radial */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/40 via-slate-900 to-black -z-10" />

      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
        <Link href="/game">
          <button className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition">
            <ArrowLeft className="h-6 w-6" />
          </button>
        </Link>
        <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-full border border-slate-700">
          <Coins className="h-4 w-4 text-yellow-400" />
          <span className="font-bold text-sm">500 Coins / Pull</span>
        </div>
      </div>

      {/* Main Stage */}
      <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
        
        <AnimatePresence mode="wait">
          {/* STATE: IDLE (พร้อมสุ่ม) */}
          {status === "idle" && (
            <motion.div
              key="idle"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="text-center space-y-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full animate-pulse" />
                <img 
                  src="/egg.png" // เดี๋ยวเราไปหาภาพไข่มาใส่ หรือใช้ Emoji แทนไปก่อน
                  alt="Mystery Egg" 
                  className="w-48 h-48 mx-auto drop-shadow-2xl"
                  onError={(e) => e.target.src = "https://cdn-icons-png.flaticon.com/512/528/528101.png"} // Fallback image
                />
              </div>
              
              <h2 className="text-2xl font-bold text-purple-200">Mystery Summon</h2>
              
              {errorMsg && <p className="text-red-400 bg-red-900/20 p-2 rounded text-sm">{errorMsg}</p>}

              <button
                onClick={pullGacha}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold shadow-lg shadow-purple-500/30 transition-transform active:scale-95 flex items-center gap-2 mx-auto"
              >
                <Sparkles className="h-5 w-5" /> สุ่มเลย (500)
              </button>
            </motion.div>
          )}

          {/* STATE: PULLING (กำลังสุ่ม/ไข่สั่น) */}
          {status === "pulling" && (
            <motion.div
              key="pulling"
              className="text-center"
            >
              <motion.img 
                src="https://cdn-icons-png.flaticon.com/512/528/528101.png"
                alt="Shaking Egg"
                className="w-48 h-48 mx-auto"
                animate={{ 
                  rotate: [0, -10, 10, -10, 10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 0.5, 
                  repeat: Infinity,
                  repeatType: "loop"
                }}
              />
              <p className="mt-8 text-purple-300 animate-pulse font-medium">กำลังฟักไข่...</p>
            </motion.div>
          )}

          {/* STATE: RESULT (ได้ของ) */}
          {status === "result" && result && (
            <motion.div
              key="result"
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="text-center space-y-4 relative z-10"
            >
              {/* Light Burst Behind */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-yellow-500/40 to-transparent blur-3xl -z-10 animate-spin-slow" />

              <div className="bg-slate-800/90 backdrop-blur border border-slate-700 p-6 rounded-2xl shadow-2xl max-w-xs mx-auto">
                <div className={`text-xs font-bold px-2 py-1 rounded w-fit mx-auto mb-2 ${
                  result.rarity === 'SSR' ? 'bg-yellow-500 text-black' :
                  result.rarity === 'SR' ? 'bg-red-500 text-white' :
                  'bg-slate-600 text-white'
                }`}>
                  {result.rarity}
                </div>
                
                <img 
                  src={result.image_url} 
                  alt={result.name}
                  className="w-40 h-40 mx-auto drop-shadow-md"
                />
                
                <h3 className="text-2xl font-bold capitalize text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500">
                  {result.name}
                </h3>
                
                <div className="grid grid-cols-2 gap-2 mt-4 text-sm bg-slate-900/50 p-3 rounded-lg">
                  <div className="text-slate-400">HP <span className="text-white font-mono">{result.stats.hp}</span></div>
                  <div className="text-slate-400">ATK <span className="text-white font-mono">{result.stats.atk}</span></div>
                </div>
              </div>

              <button
                onClick={() => setStatus("idle")}
                className="mt-6 px-6 py-2 rounded-full bg-slate-700 hover:bg-slate-600 text-white transition"
              >
                สุ่มอีกครั้ง
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}