"use client";

import { useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Sparkles, Loader2 } from "lucide-react";
import { useProfileStore } from "@/store/profileStore";

// Helper Function: แปลงข้อมูล JSON ที่แยกตามธาตุ ให้กลายเป็น Pool รายชื่อ ID รวมตามระดับความหายาก
const extractPools = (genData) => {
  const pools = { SSR: [], SR: [], R: [], N: [] };
  
  if (!genData) return pools;

  // วนลูปทุกธาตุ (NORMAL, FIRE, ...)
  Object.values(genData).forEach((typeGroup) => {
    // วนลูปทุกระดับ (SSR, SR, ...)
    Object.keys(pools).forEach((rarity) => {
      if (typeGroup[rarity] && Array.isArray(typeGroup[rarity])) {
        pools[rarity].push(...typeGroup[rarity]);
      }
    });
  });

  // ลบ ID ที่ซ้ำกันออก (เผื่อมี)
  Object.keys(pools).forEach((r) => {
    pools[r] = [...new Set(pools[r])];
  });

  return pools;
};

export default function GachaInterface({ rates, poolData, boxName, cost = 500, colorTheme = "purple" }) {
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  
  const { profile, deductCoinsLocally } = useProfileStore();

  // คำนวณ Pool อัตโนมัติจาก JSON ที่ส่งเข้ามา
  const currentPools = useMemo(() => extractPools(poolData), [poolData]);

  // ฟังก์ชันสุ่ม Rarity ตาม Rate ที่ส่งเข้ามา
  const rollRarity = () => {
    const roll = Math.random();
    let cumulativeRate = 0;
    
    // เรียงลำดับโอกาสจากน้อยไปมาก หรือตาม key ก็ได้ แต่ต้องบวกสะสม
    const keys = ["SSR", "SR", "R", "N"];
    for (const rarity of keys) {
      cumulativeRate += rates[rarity];
      if (roll <= cumulativeRate) return rarity;
    }
    return "N"; // กันพลาด
  };

  const pullGacha = async () => {
    if (status === "pulling") return;
    setStatus("pulling");
    setErrorMsg("");
    setResult(null);

    try {
      // 1. เช็ค User
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("กรุณาเข้าสู่ระบบใหม่");

      // 2. เช็คเงิน
      if (profile.coins < cost) {
        throw new Error(`เงินไม่พอ! ต้องการ ${cost} Coins`);
      }

      // 3. Optimistic Update (ลดเงิน UI ทันที)
      deductCoinsLocally(cost);

      // 4. สุ่ม Rarity -> สุ่ม ID จาก Pool
      const rarity = rollRarity();
      const pool = currentPools[rarity];

      if (!pool || pool.length === 0) {
         // Fallback ถ้าไม่มีตัวในระดับนั้น ให้ลงไป N
         console.warn(`No pokemon in pool ${rarity}, falling back to N`);
         // (ในทางปฏิบัติควรจัดการดีกว่านี้ แต่เพื่อความง่ายขอข้าม)
         throw new Error(`ระบบขัดข้อง: ไม่มีข้อมูล Pokemon ระดับ ${rarity}`);
      }

      const randomId = pool[Math.floor(Math.random() * pool.length)];

      // 5. ดึงข้อมูลจริงจาก API
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
      if (!res.ok) throw new Error(`PokeAPI Error ID: ${randomId}`);
      const pokeData = await res.json();

      // 6. บันทึกลง DB
      // 6.1 ลดเงินจริง
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ coins: profile.coins - cost }) 
        .eq("id", user.id);
      
      if (updateError) throw updateError;

      // 6.2 เพิ่มลง Inventory
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

      // 7. แสดงผล
      setTimeout(() => {
        setResult(newPokemon);
        setStatus("result");
      }, 2000);

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
      setStatus("idle");
    }
  };

  // สีธีม
  const themeColors = {
    purple: "from-purple-600 to-indigo-600 shadow-purple-500/30",
    red: "from-red-500 to-orange-500 shadow-red-500/30",
    green: "from-emerald-500 to-teal-500 shadow-emerald-500/30",
  };
  const btnClass = themeColors[colorTheme] || themeColors.purple;

  return (
    <div className="w-full flex flex-col items-center">
        {/* Header ของตู้ */}
        <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-white mb-1">{boxName}</h2>
            <div className="flex items-center justify-center gap-2 text-yellow-300">
                <Coins className="w-4 h-4" />
                <span className="font-mono">{cost} Coins</span>
            </div>
        </div>

        {/* Rate Display */}
        <div className="flex gap-3 text-xs text-slate-400 mb-8 bg-black/20 px-4 py-2 rounded-full border border-slate-700/50">
            {/* ใช้ Number(...) เพื่อแปลงกลับ ถ้าเป็น 3.00 จะเหลือ 3 ถ้าเป็น 3.50 จะเหลือ 3.5 */}
            <span className="text-yellow-400">SSR: {Number((rates.SSR * 100).toFixed(2))}%</span>
            <span className="text-red-400">SR: {Number((rates.SR * 100).toFixed(2))}%</span>
            <span className="text-blue-400">R: {Number((rates.R * 100).toFixed(2))}%</span>
            <span>N: {Number((rates.N * 100).toFixed(2))}%</span>
        </div>

        {/* Animation Stage */}
        <div className="relative w-64 h-64 flex items-center justify-center mb-6">
            <AnimatePresence mode="wait">
                {status === "idle" && (
                    <motion.div
                        key="idle"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="text-center cursor-pointer group relative"
                        onClick={pullGacha}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-r ${btnClass} blur-3xl opacity-20 rounded-full group-hover:opacity-40 transition-opacity`} />
                        <img 
                            src="/egg.png" 
                            alt="Egg" 
                            className="w-40 h-40 drop-shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-3 relative z-10"
                            onError={(e) => e.target.src = "https://cdn-icons-png.flaticon.com/512/528/528101.png"}
                        />
                        <div className="mt-6">
                             <button className={`px-8 py-2 rounded-full bg-gradient-to-r text-white font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2 mx-auto ${btnClass}`}>
                                <Sparkles className="h-4 w-4" /> สุ่มเลย
                            </button>
                        </div>
                    </motion.div>
                )}

                {status === "pulling" && (
                    <motion.div key="pulling" className="text-center">
                        <motion.img 
                            src="https://cdn-icons-png.flaticon.com/512/528/528101.png"
                            className="w-40 h-40 mx-auto"
                            animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                        />
                        <p className="mt-6 text-white font-bold animate-pulse">กำลังเรียกข้อมูล...</p>
                    </motion.div>
                )}

                {status === "result" && result && (
                    <motion.div
                        key="result"
                        initial={{ scale: 0, rotate: 180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="text-center relative z-10"
                    >
                        <div className="bg-slate-800 border border-slate-600 p-6 rounded-2xl shadow-2xl min-w-[220px]">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block shadow-sm
                                ${result.rarity === 'SSR' ? 'bg-yellow-500 text-black shadow-yellow-500/50' : 
                                  result.rarity === 'SR' ? 'bg-red-500 text-white shadow-red-500/50' : 
                                  'bg-slate-600 text-white'}`}>
                                {result.rarity}
                            </span>
                            
                            <img src={result.image_url} alt={result.name} className="w-32 h-32 mx-auto drop-shadow-md my-2" />
                            
                            <h3 className="text-xl font-bold capitalize text-white mb-2">{result.name}</h3>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs bg-black/30 p-2 rounded-lg">
                                <div className="text-slate-300">HP: <span className="text-white">{result.stats.hp}</span></div>
                                <div className="text-slate-300">ATK: <span className="text-white">{result.stats.atk}</span></div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setStatus("idle")}
                            className="mt-6 px-8 py-2 bg-slate-700 hover:bg-slate-600 rounded-full text-white font-bold transition shadow-lg"
                        >
                            ตกลง
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
        
        {errorMsg && <p className="mt-4 text-red-400 bg-red-900/20 px-4 py-2 rounded-lg text-sm border border-red-900/50">{errorMsg}</p>}
    </div>
  );
}