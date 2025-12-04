"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, Swords, Shield, Zap, Heart, ArrowUpCircle, Loader2, Coins, Gem, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProfileStore } from "@/store/profileStore";
import EvolutionModal from "@/components/EvolutionModal"; 
import { getEvolutionCost } from "@/lib/evolutionLibrary";
import evolutionOverrides from "@/app/pokedexdata/evolution_settings.json";

// --- Helper Functions ---

async function fetchNextEvolutionInfo(pokemonId) {
    const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`);
    if (!speciesRes.ok) throw new Error(`Species API failed`);
    const speciesData = await speciesRes.json();
    
    const evoChainUrl = speciesData.evolution_chain?.url;
    if (!evoChainUrl) return { canEvolve: false };
    
    const evoChainRes = await fetch(evoChainUrl);
    if (!evoChainRes.ok) throw new Error(`Evo Chain API failed`);
    const evoChainData = await evoChainRes.json();

    const getIdFromUrl = (url) => parseInt(url.split('/').slice(-2, -1)[0], 10);
    
    function findNextEvolution(chain, currentId) {
        const fromId = getIdFromUrl(chain.species.url);
        
        if (fromId === currentId) {
            if (chain.evolves_to.length > 0) {
                const nextEvo = chain.evolves_to[0]; 
                const nextId = getIdFromUrl(nextEvo.species.url);
                const nextName = nextEvo.species.name;

                const levelDetail = nextEvo.evolution_details.find(d => d.trigger.name === 'level-up');
                const apiLevel = levelDetail?.min_level;

                let finalCost = getEvolutionCost(nextId);

                const override = evolutionOverrides[nextId.toString()];
                if (override && override.cost) {
                    finalCost = override.cost;
                }

                const finalLevel = override?.level || apiLevel || 20; 

                return { 
                    evolveTo: nextId, 
                    name: nextName,
                    level: finalLevel,
                    cost: finalCost 
                };
            }
            return null;
        }
        
        for (const nextChain of chain.evolves_to) {
            const result = findNextEvolution(nextChain, currentId);
            if (result) return result;
        }
        return null;
    }

    const nextEvoInfo = findNextEvolution(evoChainData.chain, pokemonId);

    if (nextEvoInfo) {
      return { canEvolve: true, ...nextEvoInfo };
    }

    return { canEvolve: false };
}

async function getBaseStats(id) {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!res.ok) throw new Error(`PokeAPI status: ${res.status}`); 
    const data = await res.json();
    const getStat = (name) => data.stats.find(s => s.stat.name === name)?.base_stat || 0;
    
    return {
        hp: getStat('hp'),
        atk: getStat('attack'),
        def: getStat('defense'),
        spd: getStat('speed'),
        image_url: data.sprites.other["official-artwork"].front_default,
        name: data.name
    };
}

// --- Main Component ---

export default function InventoryPage() {
  const router = useRouter();
  const { profile, fetchProfile } = useProfileStore();
  
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [filter, setFilter] = useState("All");
  
  // State for button loading
  const [evolutionLoadingId, setEvolutionLoadingId] = useState(null);
  const [activeLoadingId, setActiveLoadingId] = useState(null);
  // State for Modal
  const [evoCandidate, setEvoCandidate] = useState(null);
  
  // 🔥 New State: Cache button status for each pokemon
  // Format: { [inventoryId]: { status: 'MAX' | 'LOCKED' | 'READY', detail: object } }
  const [evoStatusCache, setEvoStatusCache] = useState({});

  const fetchInventory = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("user_id", user.id)
        .order("is_active", { ascending: false }) // Prioritize active pokemon
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

  const handleSetActive = async (pokemon) => {
    if (pokemon.is_active) return;
    setActiveLoadingId(pokemon.id);
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Optimistic update
        setInventory(prev => prev.map(p => ({
            ...p,
            is_active: p.id === pokemon.id
        })));

        // Reset all active pokemon for this user first
        await supabase
            .from('inventory')
            .update({ is_active: false })
            .eq('user_id', user.id);

        await supabase
            .from('inventory')
            .update({ is_active: true })
            .eq('id', pokemon.id);

        await fetchInventory(); // Sync with server
    } catch (err) {
        console.error("Set Active Error:", err);
        alert("Failed to set active pokemon");
        fetchInventory(); // Revert on error
    } finally {
        setActiveLoadingId(null);
    }
  };

  // Function to open Modal (reusable)
  const openEvoModal = async (pokemon, evoInfo) => {
    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${evoInfo.evolveTo}`);
        const nextData = await res.json();
        
        const nextPokePreview = {
            name: evoInfo.name,
            image_url: nextData.sprites.other["official-artwork"].front_default,
        };

        setEvoCandidate({
            pokemon,
            evoInfo, 
            nextPokePreview,
            loading: false,
        });
    } catch(e) {
        console.error(e);
        alert("ไม่สามารถโหลดข้อมูลร่างถัดไปได้");
    }
  };

  // 🔥 New Logic: Check status + Update button UI
  const handleCheckEvolution = async (pokemon) => {
    // 1. If cached as READY, open Modal immediately
    const cached = evoStatusCache[pokemon.id];
    if (cached?.status === 'READY') {
        openEvoModal(pokemon, cached.detail);
        return;
    }
    // 2. If cached as MAX or LOCKED, do nothing (button disabled anyway)
    if (cached) return;

    // 3. Start loading API
    setEvolutionLoadingId(pokemon.id);
    
    try {
        const evoInfo = await fetchNextEvolutionInfo(pokemon.pokemon_id);
        
        let status = 'READY';
        
        if (!evoInfo.canEvolve) {
            status = 'MAX';
        } else if (pokemon.level < evoInfo.level) {
            status = 'LOCKED';
        }

        // 4. Save status to cache
        setEvoStatusCache(prev => ({
            ...prev,
            [pokemon.id]: { status, detail: evoInfo }
        }));

        // 5. If ready, open Modal
        if (status === 'READY') {
            openEvoModal(pokemon, evoInfo);
        }

    } catch(e) {
        console.error("Evolution Check Error:", e);
        alert(`เกิดข้อผิดพลาด: ${e.message}`);
    } finally {
        setEvolutionLoadingId(null);
    }
  };

  const handleEvolveConfirm = async () => {
    const { pokemon, evoInfo } = evoCandidate;
    setEvoCandidate(prev => ({ ...prev, loading: true }));
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const userCoins = profile?.coins || 0;
        const userPokeScale = profile?.poke_scale || 0;
        const requiredCoins = 2500;

        if (userCoins < requiredCoins) throw new Error("Coins ไม่พอ!"); 
        if (userPokeScale < evoInfo.cost) throw new Error("Poke Scale ไม่พอ!");

        const oldBaseStats = await getBaseStats(pokemon.pokemon_id);
        const newBaseStats = await getBaseStats(evoInfo.evolveTo);

        const calculateNewStat = (statName) => {
            const oldBase = oldBaseStats[statName];
            const newBase = newBaseStats[statName];
            const currentStat = pokemon.stats[statName];
            if (oldBase === 0 || newBase === 0) return currentStat; 
            return Math.floor(currentStat * (newBase / oldBase));
        };

        const newStats = {
            hp: calculateNewStat('hp'),
            atk: calculateNewStat('atk'),
            def: calculateNewStat('def'),
            spd: calculateNewStat('spd'),
        };
        
        await supabase.from("profiles").update({ 
            poke_scale: userPokeScale - evoInfo.cost,
            coins: userCoins - requiredCoins 
        }).eq("id", user.id);

        await supabase.from("inventory").update({
            pokemon_id: evoInfo.evolveTo,
            name: evoInfo.name,
            image_url: evoCandidate.nextPokePreview.image_url,
            stats: newStats,
            rarity: "SR" 
        }).eq("id", pokemon.id);

        // Clear Cache ของตัวนี้ทิ้ง เพราะ ID เปลี่ยน หรือข้อมูลเปลี่ยน
        setEvoStatusCache(prev => {
            const newCache = { ...prev };
            delete newCache[pokemon.id];
            return newCache;
        });

        await fetchInventory();
        await fetchProfile(); 
        
        setEvoCandidate(null);
        alert(`สำเร็จ! ${pokemon.name} พัฒนาร่างเป็น ${evoInfo.name}!`);

    } catch (err) {
        console.error(err);
        setEvoCandidate(prev => ({ ...prev, loading: false })); 
        alert(`ล้มเหลว: ${err.message}`);
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
      {evoCandidate && (
          <EvolutionModal 
              candidate={evoCandidate}
              onConfirm={handleEvolveConfirm}
              onCancel={() => setEvoCandidate(null)}
          />
      )}

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

      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => <div key={i} className="aspect-[3/4] rounded-2xl bg-slate-900 animate-pulse border border-slate-800" />)
        ) : filteredItems.length > 0 ? (
          filteredItems.map((poke) => {
            const maxExp = poke.level * 100;
            const expPercent = Math.min(100, (poke.exp / maxExp) * 100);
            
            // 🔥 Logic for button display
            const checkStatus = evoStatusCache[poke.id];
            let buttonContent;
            let buttonStyle = "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-purple-500/20";
            let isDisabled = false;

            if (evolutionLoadingId === poke.id) {
                // Case 1: Loading
                buttonContent = <Loader2 className="w-3 h-3 animate-spin" />;
                isDisabled = true;
            } else if (checkStatus?.status === 'MAX') {
                // Case 2: Maxed out (no further evolution)
                buttonContent = <span className="font-black tracking-widest text-[10px]">MAX</span>;
                buttonStyle = "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed";
                isDisabled = true;
            } else if (checkStatus?.status === 'LOCKED') {
                // Case 3: Level too low
                buttonContent = <><AlertTriangle className="w-3 h-3" /> Need Lv.{checkStatus.detail.level}</>;
                buttonStyle = "bg-orange-900/40 text-orange-400 border border-orange-500/30 cursor-not-allowed";
                isDisabled = true;
            } else if (checkStatus?.status === 'READY') {
                // Case 4: Ready to Evo
                buttonContent = <><ArrowUpCircle className="w-4 h-4 animate-bounce" /> READY EVO</>;
                buttonStyle = "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/40 animate-pulse border border-emerald-400";
                isDisabled = false;
            } else {
                // Case 5: Not checked yet
                buttonContent = <><Search className="w-3 h-3" /> Check Evo</>;
                isDisabled = false;
            }

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

                <div className="w-full relative z-10">
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1"><span>EXP</span><span>{poke.exp} / {maxExp}</span></div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${expPercent}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 w-full mt-3">
                    <button
                        onClick={() => handleSetActive(poke)}
                        disabled={poke.is_active || activeLoadingId === poke.id}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 z-20 border ${
                            poke.is_active
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 cursor-default"
                            : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white"
                        }`}
                    >
                        {activeLoadingId === poke.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : poke.is_active ? (
                            <><CheckCircle2 className="w-3 h-3" /> Active</>
                        ) : (
                            "Set Active"
                        )}
                    </button>

                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => handleCheckEvolution(poke)}
                        disabled={isDisabled || evolutionLoadingId === poke.id}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 z-20 ${buttonStyle} ${!isDisabled ? 'hover:scale-105 active:scale-95' : ''}`}
                    >
                        {buttonContent}
                    </motion.button>
                </div>
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