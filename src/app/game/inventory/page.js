"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, Swords, Shield, Zap, Heart, Sparkles, ArrowUpCircle, Loader2 } from "lucide-react";
import Link from "next/link";

// ฐานข้อมูล Evolution (ย้ายมาที่นี่)
const EVOLUTION_CHAIN = {
  1: { evolveTo: 2, level: 16, name: "Ivysaur" },
  2: { evolveTo: 3, level: 32, name: "Venusaur" },
  4: { evolveTo: 5, level: 16, name: "Charmeleon" },
  5: { evolveTo: 6, level: 36, name: "Charizard" },
  7: { evolveTo: 8, level: 16, name: "Wartortle" },
  8: { evolveTo: 9, level: 36, name: "Blastoise" },
};

export default function InventoryPage() {
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [filter, setFilter] = useState("All");
  const [evolvingId, setEvolvingId] = useState(null);

  // Function: Fetch Inventory (ดึงข้อมูลล่าสุด)
  const fetchInventory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("user_id", user.id)
        .order("obtained_at", { ascending: false });

      if (error) throw error;
      setInventory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // ฟังก์ชันกดปุ่มเปลี่ยนร่าง
  const handleEvolve = async (pokemon) => {
    const evoInfo = EVOLUTION_CHAIN[pokemon.pokemon_id];
    if (!evoInfo || pokemon.level < evoInfo.level) return;

    if (!confirm(`ต้องการพัฒนาร่าง ${pokemon.name} เป็น ${evoInfo.name} ใช่หรือไม่?`)) return;

    setEvolvingId(pokemon.id);

    try {
      // 1. ดึงข้อมูลร่างใหม่จาก API
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${evoInfo.evolveTo}`);
      const newData = await res.json();

      // 2. คำนวณ Stat โบนัส
      const newStats = {
        hp: pokemon.stats.hp + 20,
        atk: pokemon.stats.atk + 10,
        def: pokemon.stats.def + 10,
        spd: pokemon.stats.spd + 10,
      };

      // 3. อัปเดต Database
      const { error } = await supabase
        .from("inventory")
        .update({
          pokemon_id: evoInfo.evolveTo,
          name: evoInfo.name,
          image_url: newData.sprites.other["official-artwork"].front_default,
          stats: newStats,
          rarity: "SR" 
        })
        .eq("id", pokemon.id);

      if (error) throw error;

      // 4. อัปเดต State หน้าเว็บทันที (สำคัญ: เรียก fetchInventory ใหม่)
      await fetchInventory(); 
      alert(`ยินดีด้วย! ${pokemon.name} เปลี่ยนร่างเป็น ${evoInfo.name} แล้ว!`);

    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการเปลี่ยนร่าง");
    } finally {
      setEvolvingId(null);
    }
  };

  const filteredItems = filter === "All" ? inventory : inventory.filter(item => item.rarity === filter);

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case "SSR": return "border-yellow-400 bg-yellow-400/10 text-yellow-400";
      case "SR": return "border-red-400 bg-red-400/10 text-red-400";
      case "R": return "border-blue-400 bg-blue-400/10 text-blue-400";
      default: return "border-slate-400 bg-slate-400/10 text-slate-400";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 pb-24 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/game">
            <button className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition">
              <ArrowLeft className="h-6 w-6" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">My Collection</h1>
            <p className="text-slate-400 text-sm">สะสมทั้งหมด {inventory.length} ตัว</p>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {["All", "SSR", "SR", "R", "N"].map((r) => (
            <button key={r} onClick={() => setFilter(r)} className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-all whitespace-nowrap ${filter === r ? "bg-white text-slate-900 border-white" : "bg-transparent text-slate-400 border-slate-700 hover:border-slate-500"}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Display */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => <div key={i} className="aspect-[3/4] rounded-2xl bg-slate-900 animate-pulse border border-slate-800" />)
        ) : filteredItems.length > 0 ? (
          filteredItems.map((poke) => {
            const maxExp = poke.level * 100;
            const expPercent = Math.min(100, (poke.exp / maxExp) * 100);
            
            const evoInfo = EVOLUTION_CHAIN[poke.pokemon_id];
            const canEvolve = evoInfo && poke.level >= evoInfo.level;

            return (
              <motion.div
                key={poke.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -5 }}
                className="relative group rounded-2xl bg-slate-900 border border-slate-800 p-4 flex flex-col items-center hover:border-slate-600 transition-all overflow-hidden"
              >
                <div className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded border ${getRarityColor(poke.rarity)}`}>{poke.rarity}</div>
                <div className="absolute top-3 left-3 text-[10px] font-mono text-slate-400 bg-black/40 px-1.5 py-0.5 rounded">Lv.{poke.level}</div>

                <div className="w-28 h-28 my-2 relative z-10">
                  <img src={poke.image_url} alt={poke.name} className="w-full h-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
                </div>

                <h3 className="text-white font-bold capitalize text-lg truncate w-full text-center mb-2 relative z-10">{poke.name}</h3>

                <div className="w-full grid grid-cols-2 gap-2 text-xs bg-slate-950/50 p-2 rounded-lg relative z-10 mb-2">
                  <div className="flex items-center gap-1 text-emerald-400"><Heart className="w-3 h-3" /> <span>{poke.stats.hp}</span></div>
                  <div className="flex items-center gap-1 text-red-400"><Swords className="w-3 h-3" /> <span>{poke.stats.atk}</span></div>
                  <div className="flex items-center gap-1 text-yellow-400"><Shield className="w-3 h-3" /> <span>{poke.stats.def}</span></div>
                  <div className="flex items-center gap-1 text-blue-400"><Zap className="w-3 h-3" /> <span>{poke.stats.spd}</span></div>
                </div>

                {/* EXP Bar */}
                <div className="w-full relative z-10">
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1"><span>EXP</span><span>{poke.exp} / {maxExp}</span></div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${expPercent}%` }} />
                  </div>
                </div>

                {/* ปุ่ม EVOLVE */}
                {canEvolve && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleEvolve(poke)}
                    disabled={evolvingId === poke.id}
                    className="mt-3 w-full py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold shadow-lg shadow-purple-500/20 flex items-center justify-center gap-1 z-20 hover:scale-105 transition-transform"
                  >
                    {evolvingId === poke.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <ArrowUpCircle className="w-3 h-3" /> EVOLVE
                      </>
                    )}
                  </motion.button>
                )}

                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-t ${poke.rarity === 'SSR' ? 'from-yellow-500' : poke.rarity === 'SR' ? 'from-red-500' : 'from-blue-500'}`} />
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center text-slate-500"><Search className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>ไม่พบโปเกมอนในหมวดนี้</p></div>
        )}
      </div>
    </div>
  );
}