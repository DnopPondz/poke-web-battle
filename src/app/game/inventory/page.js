"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, Swords, Shield, Zap, Heart, ArrowUpCircle, Loader2, Coins, Gem, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProfileStore } from "@/store/profileStore";
import EvolutionModal from "@/components/EvolutionModal"; 

// ฐานข้อมูล Evolution
const EVOLUTION_CHAIN = {
  1: { evolveTo: 2, level: 16, name: "Ivysaur", cost: 500 }, 
  2: { evolveTo: 3, level: 32, name: "Venusaur", cost: 1500 }, 
  4: { evolveTo: 5, level: 16, name: "Charmeleon", cost: 500 },
  5: { evolveTo: 6, level: 36, name: "Charizard", cost: 1500 },
  7: { evolveTo: 8, level: 16, name: "Wartortle", cost: 500 },
  8: { evolveTo: 9, level: 36, name: "Blastoise", cost: 1500 },
  // 🔥 FIX: Magikarp Level ปรับเป็น 15 เพื่อให้ Level 16 ทดสอบได้
  129: { evolveTo: 130, level: 15, name: "Gyarados", cost: 5000 }, 
};

function getEvolutionInfo(pokemonId) {
    const info = EVOLUTION_CHAIN[pokemonId];
    if (!info) return { canEvolve: false, nextId: null, nextName: null, cost: 0, level: 999 };
    return {
        canEvolve: true,
        ...info,
    };
}

// Helper function to fetch base stats (Used for stat recalculation)
async function getBaseStats(id) {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!res.ok) throw new Error(`PokeAPI status: ${res.status}`); // 🔥 ยืนยันการเช็คสถานะ
    const data = await res.json();
    return {
        hp: data.stats.find(s => s.stat.name === 'hp').base_stat,
        atk: data.stats.find(s => s.stat.name === 'attack').base_stat,
        def: data.stats.find(s => s.stat.name === 'defense').base_stat,
        spd: data.stats.find(s => s.stat.name === 'speed').base_stat,
        image_url: data.sprites.other["official-artwork"].front_default,
        name: data.name
    };
}


export default function InventoryPage() {
  const router = useRouter();
  const { profile, fetchProfile } = useProfileStore();
  
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [filter, setFilter] = useState("All");
  const [evolutionLoadingId, setEvolutionLoadingId] = useState(null);
  const [evoCandidate, setEvoCandidate] = useState(null);

  const userPokeScale = profile?.poke_scale || 0;
  const userCoins = profile?.coins || 0;
  const requiredCoins = 2500;


  const fetchInventory = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("user_id", user.id)
        .order("level", { ascending: false });

      if (error) throw error;
      setInventory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Logic เปิด Modal (Pre-Fetch Preview และเช็ค res.ok)
  const handleOpenEvolution = async (pokemon) => {
    const evoInfo = getEvolutionInfo(pokemon.pokemon_id);
    if (!evoInfo.canEvolve || pokemon.level < evoInfo.level) return;

    setEvolutionLoadingId(pokemon.id);
    
    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${evoInfo.nextId}`);
        
        // 🔥 FIX: เช็คสถานะ HTTP ก่อนแปลง JSON
        if (!res.ok) {
             throw new Error(`API failed: Status ${res.status}`);
        }
        
        const nextData = await res.json();
        
        const nextPokePreview = {
            name: evoInfo.nextName,
            image_url: nextData.sprites.other["official-artwork"].front_default,
        };

        setEvoCandidate({
            pokemon,
            evoInfo,
            nextPokePreview,
            loading: false,
        });

    } catch(e) {
        console.error("Evolution Preview Error:", e);
        // แสดงข้อความที่ชัดเจนขึ้น
        alert(`ไม่สามารถโหลดข้อมูลร่างถัดไปได้: ${e.message || "PokeAPI Call Failed"}`);
    } finally {
        setEvolutionLoadingId(null);
    }
  };


  // Logic ยืนยัน Evolution (จาก Modal)
  const handleEvolveConfirm = async () => {
    const { pokemon, evoInfo } = evoCandidate;
    setEvoCandidate(prev => ({ ...prev, loading: true }));
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (userCoins < requiredCoins) throw new Error("Coins ไม่พอ!"); 
        if (userPokeScale < evoInfo.cost) throw new Error("Poke Scale ไม่พอ!");

        // 1. ดึง Base Stats ร่างเก่า/ใหม่
        const oldBaseStats = await getBaseStats(pokemon.pokemon_id);
        const newBaseStats = await getBaseStats(evoInfo.nextId);

        // 2. คำนวณ Stats ใหม่
        const calculateNewStat = (statName) => {
            const oldBase = oldBaseStats[statName];
            const newBase = newBaseStats[statName];
            const currentStat = pokemon.stats[statName];

            if (oldBase === 0) return currentStat; 
            const newStatValue = Math.floor(currentStat * (newBase / oldBase));
            return newStatValue;
        };

        const newStats = {
            hp: calculateNewStat('hp'),
            atk: calculateNewStat('atk'),
            def: calculateNewStat('def'),
            spd: calculateNewStat('spd'),
        };
        
        // 3. หัก Scale & Coins
        const { error: profileError } = await supabase
            .from("profiles")
            .update({ 
                poke_scale: userPokeScale - evoInfo.cost,
                coins: userCoins - requiredCoins 
            })
            .eq("id", user.id);

        if (profileError) throw profileError;

        // 4. Update Inventory
        const { error: invError } = await supabase
            .from("inventory")
            .update({
                pokemon_id: evoInfo.nextId,
                name: evoInfo.nextName,
                image_url: evoCandidate.nextPokePreview.image_url,
                stats: newStats,
                rarity: "SR" 
            })
            .eq("id", pokemon.id);

        if (invError) throw invError;
        
        // 5. Refetch Data
        await fetchInventory();
        await fetchProfile(); 
        
        setEvoCandidate(null);
        alert(`ยินดีด้วย! ${pokemon.name} พัฒนาร่างเป็น ${evoInfo.nextName} แล้ว!`);

    } catch (err) {
        console.error(err);
        setEvoCandidate(prev => ({ ...prev, loading: false })); 
        alert(`วิวัฒนาการล้มเหลว: ${err.message}`);
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
      
      {/* ⚠️ MODAL COMPONENT ⚠️ */}
      {evoCandidate && (
          <EvolutionModal 
              candidate={evoCandidate}
              onConfirm={handleEvolveConfirm}
              onCancel={() => setEvoCandidate(null)}
          />
      )}

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
          // 1. Loading state
          [...Array(6)].map((_, i) => <div key={i} className="aspect-[3/4] rounded-2xl bg-slate-900 animate-pulse border border-slate-800" />)
        ) : filteredItems.length > 0 ? (
          // 2. Content state
          filteredItems.map((poke) => {
            const maxExp = poke.level * 100;
            const expPercent = Math.min(100, (poke.exp / maxExp) * 100);
            
            const evoInfo = getEvolutionInfo(poke.pokemon_id);
            const canEvolve = evoInfo.canEvolve && poke.level >= evoInfo.level;

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
                {canEvolve ? (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleOpenEvolution(poke)}
                    disabled={evolutionLoadingId === poke.id}
                    className="mt-3 w-full py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold shadow-lg shadow-purple-500/20 flex items-center justify-center gap-1 z-20 hover:scale-105 transition-transform"
                  >
                    {evolutionLoadingId === poke.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <ArrowUpCircle className="w-3 h-3" /> EVOLVE (LV {evoInfo.level})
                      </>
                    )}
                  </motion.button>
                ) : evoInfo.canEvolve && (
                   <div className="mt-3 w-full py-1.5 rounded-lg bg-slate-800 text-slate-500 text-xs font-bold flex items-center justify-center gap-1">
                      Need LV {evoInfo.level}
                   </div>
                )}
              </motion.div>
            );
          })
        ) : (
          // 3. Empty state
          <div className="col-span-full py-20 text-center text-slate-500"><Search className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>ไม่พบโปเกมอนในหมวดนี้</p></div>
        )}
      </div>
    </div>
  );
}