"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, CheckCircle, Dices } from "lucide-react";

// รายชื่อ ID โปเกมอน (คงเดิม)
const STARTER_POOL = [
  1, 4, 7, 10, 13, 16, 19, 21, 23, 25, 27, 29, 32, 35, 37, 39, 41, 43, 46, 48, 50, 52, 54, 56, 58, 60, 63, 66, 69, 72, 74, 77, 79, 81, 83, 84, 86, 88, 90, 92, 95, 96, 98, 100, 102, 104, 106, 108, 109, 111, 114, 116, 118, 120, 122, 123, 124, 125, 126, 127, 128, 129, 132, 133, 137, 138, 140, 147
];

export default function StarterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true); // เริ่มต้นเป็น true เพื่อรอโหลดข้อมูล user
  const [candidates, setCandidates] = useState([]);
  const [rerollsLeft, setRerollsLeft] = useState(0); // ค่าเริ่มต้น 0 รอ fetch จาก db
  const [userId, setUserId] = useState(null);

  // 1. โหลดข้อมูล User และสิทธิ์ Reroll จาก Database
  useEffect(() => {
    const initData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No user found");
        setUserId(user.id);

        // ดึงค่า reroll_count ล่าสุด
        const { data: profile } = await supabase
          .from("profiles")
          .select("reroll_count")
          .eq("id", user.id)
          .single();

        if (profile) {
          setRerollsLeft(profile.reroll_count);
        }

        // สุ่มครั้งแรกทันที
        await rollStarters();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  // ฟังก์ชันสุ่มโปเกมอน
  const rollStarters = async () => {
    setLoading(true);
    setCandidates([]);

    try {
      const shuffled = [...STARTER_POOL].sort(() => 0.5 - Math.random());
      const selectedIds = shuffled.slice(0, 3);

      const promises = selectedIds.map(async (id) => {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        const data = await res.json();
        
        const type = data.types[0].type.name;
        let colorClass = "from-slate-600 to-slate-800";
        let borderClass = "border-slate-500";
        if (type === 'fire') { colorClass = "from-orange-500 to-red-700"; borderClass = "border-orange-500"; }
        else if (type === 'water') { colorClass = "from-blue-500 to-cyan-700"; borderClass = "border-blue-500"; }
        else if (type === 'grass') { colorClass = "from-green-500 to-emerald-700"; borderClass = "border-green-500"; }
        else if (type === 'electric') { colorClass = "from-yellow-400 to-amber-600"; borderClass = "border-yellow-400"; }
        else if (type === 'psychic') { colorClass = "from-pink-500 to-purple-700"; borderClass = "border-pink-500"; }
        
        return {
          id: data.id,
          name: data.name,
          type: type,
          stats: {
            hp: data.stats[0].base_stat,
            atk: data.stats[1].base_stat,
            def: data.stats[2].base_stat,
            spd: data.stats[5].base_stat,
          },
          image_url: data.sprites.other["official-artwork"].front_default,
          color: colorClass,
          border: borderClass,
        };
      });

      const results = await Promise.all(promises);
      setCandidates(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันกดปุ่ม Reroll (ตัดสิทธิ์ใน DB ด้วย)
  const handleReroll = async () => {
    if (rerollsLeft > 0 && !loading) {
      setLoading(true);
      try {
        // 1. ลดจำนวนสิทธิ์ใน Database ก่อน
        const newCount = rerollsLeft - 1;
        const { error } = await supabase
          .from("profiles")
          .update({ reroll_count: newCount })
          .eq("id", userId);

        if (error) throw error;

        // 2. อัปเดต State หน้าเว็บและสุ่มใหม่
        setRerollsLeft(newCount);
        await rollStarters();

      } catch (err) {
        console.error("Error updating reroll count:", err);
        alert("เกิดข้อผิดพลาดในการใช้สิทธิ์สุ่มใหม่");
        setLoading(false);
      }
    }
  };

  const handleSelect = async (pokemon) => {
    if (confirm(`ยืนยันเลือก ${pokemon.name} ใช่ไหม? (เลือกแล้วเปลี่ยนไม่ได้นะ!)`)) {
      setLoading(true);
      try {
        const newPokemon = {
          user_id: userId,
          pokemon_id: pokemon.id,
          name: pokemon.name,
          rarity: "R", 
          stats: pokemon.stats,
          image_url: pokemon.image_url,
          level: 5, 
        };

        const { error } = await supabase.from("inventory").insert(newPokemon);
        if (error) throw error;

        router.replace("/game");
      } catch (err) {
        console.error(err);
        alert("เกิดข้อผิดพลาด");
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-black -z-10" />

      <div className="text-center mb-8 z-10 space-y-2">
        <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
          เลือกคู่หูของคุณ
        </h1>
        <p className="text-slate-400 text-sm md:text-base">
          โชคชะตาจะกำหนดตัวเลือก... แต่คุณเป็นคนตัดสินใจ!
        </p>
      </div>

      {/* Reroll Status Bar */}
      <div className="mb-8 flex items-center gap-4 bg-slate-900/80 px-6 py-2 rounded-full border border-slate-700 z-10">
        <span className="text-slate-400 text-sm">สิทธิ์สุ่มใหม่:</span>
        <div className="flex gap-1">
          {/* แสดงจุดตามจำนวนจริงที่เหลือ */}
          {[...Array(3)].map((_, i) => (
            <div 
              key={i} 
              className={`w-3 h-3 rounded-full transition-colors duration-300 ${i < rerollsLeft ? 'bg-emerald-500 shadow-emerald-500/50 shadow-sm' : 'bg-slate-700'}`} 
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full z-10 min-h-[400px]">
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="col-span-3 flex flex-col items-center justify-center h-full text-slate-500">
              <Loader2 className="animate-spin w-12 h-12 mb-4" />
              <p>กำลังค้นหามอนสเตอร์...</p>
            </div>
          ) : (
            candidates.map((poke) => (
              <motion.div
                key={poke.id}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                whileHover={{ scale: 1.03 }}
                className="relative group"
              >
                <div className="relative bg-slate-900 border border-slate-700 rounded-3xl p-6 h-full flex flex-col items-center overflow-hidden hover:border-slate-500 transition-colors">
                  <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-b ${poke.color} opacity-20 group-hover:opacity-30 transition-opacity`} />
                  <div className="relative z-10 w-40 h-40 mt-4 mb-2">
                    <img src={poke.image_url} alt={poke.name} className="w-full h-full object-contain drop-shadow-xl" />
                  </div>
                  <div className="z-10 text-center w-full">
                    <span className={`inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${poke.border} bg-black/30 text-white mb-2`}>
                      {poke.type}
                    </span>
                    <h2 className="text-2xl font-bold text-white capitalize mb-4">{poke.name}</h2>
                    <div className="grid grid-cols-3 gap-2 text-xs bg-black/20 p-3 rounded-xl border border-white/5">
                      <div className="text-center">
                        <p className="text-slate-400">HP</p>
                        <p className="font-bold text-emerald-400">{poke.stats.hp}</p>
                      </div>
                      <div className="text-center border-l border-white/10">
                        <p className="text-slate-400">ATK</p>
                        <p className="font-bold text-red-400">{poke.stats.atk}</p>
                      </div>
                      <div className="text-center border-l border-white/10">
                        <p className="text-slate-400">SPD</p>
                        <p className="font-bold text-blue-400">{poke.stats.spd}</p>
                      </div>
                    </div>
                    <button onClick={() => handleSelect(poke)} className="w-full mt-6 py-3 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-emerald-900/50">
                      <CheckCircle className="w-4 h-4" /> เลือกตัวนี้
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="mt-10 z-10">
        <button
          onClick={handleReroll}
          disabled={rerollsLeft === 0 || loading}
          className={`
            flex items-center gap-2 px-8 py-3 rounded-full font-bold text-white shadow-xl transition-all
            ${rerollsLeft > 0 
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 hover:shadow-purple-500/25 cursor-pointer' 
              : 'bg-slate-700 cursor-not-allowed opacity-50 grayscale'}
          `}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Dices className={`w-5 h-5 ${rerollsLeft > 0 ? 'animate-bounce' : ''}`} />}
          {rerollsLeft > 0 ? `สุ่มใหม่ (${rerollsLeft})` : "หมดสิทธิ์สุ่ม"}
        </button>
      </div>
    </div>
  );
}