"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, ArrowLeft, RotateCcw, Trophy, Zap, Flame, Droplets, Leaf, Star, ShieldPlus, ArrowUpCircle, Clock, Gem } from "lucide-react";
import Link from "next/link";
import { useProfileStore } from "@/store/profileStore";

const MOVES_DB = {
  "Tackle": { name: "Tackle", type: "Normal", power: 50, accuracy: 100, cooldown: 0, icon: <Star className="w-4 h-4" /> },
  "Scratch": { name: "Scratch", type: "Normal", power: 50, accuracy: 100, cooldown: 0, icon: <Swords className="w-4 h-4" /> },
  "Quick Attack": { name: "Quick Attack", type: "Normal", power: 50, accuracy: 100, cooldown: 0, icon: <Zap className="w-4 h-4" /> },
  "Ember": { name: "Ember", type: "Fire", power: 55, accuracy: 100, cooldown: 0, icon: <Flame className="w-4 h-4 text-orange-500" /> },
  "Water Gun": { name: "Water Gun", type: "Water", power: 55, accuracy: 100, cooldown: 0, icon: <Droplets className="w-4 h-4 text-blue-400" /> },
  "Vine Whip": { name: "Vine Whip", type: "Grass", power: 55, accuracy: 100, cooldown: 0, icon: <Leaf className="w-4 h-4 text-green-500" /> },
  "Thunder Shock": { name: "Thunder Shock", type: "Electric", power: 55, accuracy: 100, cooldown: 0, icon: <Zap className="w-4 h-4 text-yellow-400" /> },
  "Flamethrower": { name: "Flamethrower", type: "Fire", power: 100, accuracy: 100, cooldown: 2, icon: <Flame className="w-4 h-4 text-red-500" /> },
  "Hydro Pump": { name: "Hydro Pump", type: "Water", power: 120, accuracy: 85, cooldown: 2, icon: <Droplets className="w-4 h-4 text-blue-600" /> },
  "Razor Leaf": { name: "Razor Leaf", type: "Grass", power: 70, accuracy: 95, cooldown: 1, icon: <Leaf className="w-4 h-4 text-emerald-600" /> },
  "Heal": { name: "Heal", type: "Support", power: 0, accuracy: 100, effect: "heal", cooldown: 3, icon: <ShieldPlus className="w-4 h-4 text-pink-400" /> },
};

const EVOLUTION_CHAIN = {
  1: { evolveTo: 2, level: 16, name: "Ivysaur" },
  2: { evolveTo: 3, level: 32, name: "Venusaur" },
  4: { evolveTo: 5, level: 16, name: "Charmeleon" },
  5: { evolveTo: 6, level: 36, name: "Charizard" },
  7: { evolveTo: 8, level: 16, name: "Wartortle" },
  8: { evolveTo: 9, level: 36, name: "Blastoise" },
};

export default function BattlePage() {
  const router = useRouter();
  const { fetchProfile } = useProfileStore(); 
  
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState(null);
  const [enemy, setEnemy] = useState(null);
  const [turn, setTurn] = useState(1);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [logs, setLogs] = useState([]);
  const [gameState, setGameState] = useState("playing"); 
  
  const [battleResult, setBattleResult] = useState({
    expGained: 0,
    coinGained: 0,
    leveledUp: false,
    oldLevel: 0,
    newLevel: 0,
    scaleDrop: 0 // 🔥 เพิ่ม scaleDrop
  });

  // AI Turn Logic
  useEffect(() => {
    if (!isPlayerTurn && gameState === "playing" && enemy) {
      const timer = setTimeout(() => {
        const randomMove = enemy.moves[Math.floor(Math.random() * enemy.moves.length)];
        handleTurn(enemy, player, setPlayer, randomMove, "enemy");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, gameState]);

  // Init Battle
  useEffect(() => {
    const initBattle = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.replace("/login");

        // 1. Energy Check & Deduct
        const { data: profile } = await supabase.from("profiles").select("energy").eq("id", user.id).single();
        if (!profile || profile.energy < 1) {
          alert("พลังงานหมด! (Energy 0/50)");
          return router.replace("/game");
        }
        await supabase.from("profiles").update({ energy: profile.energy - 1 }).eq("id", user.id);
        fetchProfile(); // อัปเดต Navbar ทันทีหลังตัด Energy

        // 2. Load Player Pokemon
        const { data: myPoke } = await supabase
          .from("inventory")
          .select("*")
          .eq("user_id", user.id)
          .order("level", { ascending: false })
          .limit(1)
          .single();

        if (!myPoke) {
          alert("ไม่พบโปเกมอนในกระเป๋า!");
          return router.replace("/game/gacha");
        }

        const pRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${myPoke.pokemon_id}`);
        const pData = await pRes.json();
        const pType = pData.types[0].type.name;
        const initMoves = getMovesByType(pType).map(m => ({ ...m, currentCooldown: 0 }));

        setPlayer({
          ...myPoke,
          type: pType,
          currentHp: myPoke.stats.hp,
          maxHp: myPoke.stats.hp,
          moves: initMoves,
        });

        // 3. Random Enemy (Balanced)
        const randomId = Math.floor(Math.random() * 151) + 1;
        const eRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
        const eData = await eRes.json();
        const eType = eData.types[0].type.name;
        
        const enemyLevel = Math.max(1, myPoke.level - Math.floor(Math.random() * 2)); 
        const scaleStat = (base) => Math.floor((base * 2 * enemyLevel) / 100 + enemyLevel + 5);

        const enemyStats = {
          hp: Math.floor((eData.stats[0].base_stat * 1.8 * enemyLevel) / 100 + enemyLevel + 10),
          atk: scaleStat(eData.stats[1].base_stat),
          def: scaleStat(eData.stats[2].base_stat),
          spd: scaleStat(eData.stats[5].base_stat),
        };

        setEnemy({
          name: eData.name,
          image_url: eData.sprites.front_default,
          level: enemyLevel,
          type: eType,
          currentHp: enemyStats.hp,
          maxHp: enemyStats.hp,
          stats: enemyStats,
          moves: getMovesByType(eType),
        });

        setLogs([`Wild ${eData.name} (Lv.${enemyLevel}) appeared!`, "Battle Start!"]);
        setLoading(false);

      } catch (err) {
        console.error(err);
        router.replace("/game");
      }
    };

    initBattle();
  }, []);

  const getMovesByType = (type) => {
    let moves = ["Tackle", "Scratch"];
    if (type === "fire") moves = ["Scratch", "Ember", "Flamethrower", "Heal"];
    else if (type === "water") moves = ["Tackle", "Water Gun", "Hydro Pump", "Heal"];
    else if (type === "grass") moves = ["Tackle", "Vine Whip", "Razor Leaf", "Heal"];
    else if (type === "electric") moves = ["Quick Attack", "Thunder Shock", "Tackle", "Heal"];
    else moves = ["Tackle", "Scratch", "Quick Attack", "Heal"];
    return moves.map(m => MOVES_DB[m]);
  };

  const handleTurn = (attacker, defender, setDefenderState, move, role) => {
    if (role === "player" && move.currentCooldown > 0) return;

    if (role === "player") {
      setPlayer(prev => ({
        ...prev,
        moves: prev.moves.map(m => m.name === move.name ? { ...m, currentCooldown: m.cooldown } : m)
      }));
    }

    const hitChance = Math.random() * 100;
    if (hitChance > move.accuracy) {
      setLogs(prev => [`${attacker.name} used ${move.name}... but missed!`, ...prev.slice(0, 3)]);
      nextTurn(role);
      return;
    }

    if (move.effect === "heal") {
      const healAmount = Math.floor(attacker.maxHp * 0.5); 
      if (role === "player") {
        setPlayer(prev => ({ ...prev, currentHp: Math.min(prev.maxHp, prev.currentHp + healAmount) }));
      } else {
        setEnemy(prev => ({ ...prev, currentHp: Math.min(prev.maxHp, prev.currentHp + healAmount) }));
      }
      setLogs(prev => [`${attacker.name} used Heal! (+${healAmount} HP)`, ...prev.slice(0, 3)]);
      nextTurn(role);
      return;
    }

    const levelFactor = (2 * attacker.level / 5) + 2;
    const statFactor = attacker.stats.atk / defender.stats.def;
    const baseDamage = ((levelFactor * move.power * statFactor) / 50) + 2;
    const random = (Math.floor(Math.random() * 16) + 85) / 100;
    const isCrit = Math.random() < 0.0625;
    const critMult = isCrit ? 1.5 : 1;

    let finalDamage = Math.floor(baseDamage * random * critMult);
    
    const minDamage = Math.max(2, Math.floor(attacker.level / 2));
    if (finalDamage < minDamage) finalDamage = minDamage;

    const newHp = Math.max(0, defender.currentHp - finalDamage);
    setDefenderState(prev => ({ ...prev, currentHp: newHp }));

    setLogs(prev => [`${attacker.name} used ${move.name}! ${isCrit ? "(Crit!)" : ""} -${finalDamage} HP`, ...prev.slice(0, 3)]);

    if (newHp === 0) {
      setGameState(role === "player" ? "win" : "lose");
      handleEndGame(role === "player");
    } else {
      nextTurn(role);
    }
  };

  const nextTurn = (currentRole) => {
    if (currentRole === "player") {
      setIsPlayerTurn(false);
    } else {
      setIsPlayerTurn(true);
      setTurn(t => t + 1);
      setPlayer(prev => ({
        ...prev,
        moves: prev.moves.map(m => ({ ...m, currentCooldown: Math.max(0, m.currentCooldown - 1) }))
      }));
    }
  };

  // 🔥 ฟังก์ชันจบเกม: EXP, Coin, และ SCALE Drop 🔥
  const handleEndGame = async (isWin) => {
    if (!isWin) return;
    
    try {
      const expGain = 50 * enemy.level;
      const coinGain = 50 + (enemy.level * 10);
      const scaleDrop = Math.floor(Math.random() * 20) + 1; // 🔥 Drop Scale 1-20

      let updatedStats = { ...player.stats };
      let newLevel = player.level;
      let newExp = player.exp + expGain;
      let leveledUp = false;
      const oldLevel = player.level;

      // Loop Level Up
      while (newExp >= newLevel * 100) {
        newExp -= newLevel * 100;
        newLevel++;
        leveledUp = true;

        // Stat Growth
        updatedStats.hp += Math.floor(Math.random() * 3) + 2;
        updatedStats.atk += Math.floor(Math.random() * 2) + 1;
        updatedStats.def += Math.floor(Math.random() * 2) + 1;
        updatedStats.spd += Math.floor(Math.random() * 2) + 1;
      }

      // 1. อัปเดต Inventory
      const { error: invError } = await supabase
        .from("inventory")
        .update({
          level: newLevel,
          exp: newExp,
          stats: updatedStats, 
        })
        .eq("id", player.id); 

      if (invError) throw invError;

      // 2. อัปเดตเงินและ Poke Scale User
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from("profiles").select("coins, poke_scale").eq("id", user.id).single();

      const { error: profileError } = await supabase
          .from("profiles")
          .update({ 
              coins: profile.coins + coinGain,
              poke_scale: profile.poke_scale + scaleDrop // 🔥 บันทึก Scale
          })
          .eq("id", user.id);

      if (profileError) throw profileError;

      // 3. สั่งให้ Global Store ดึงข้อมูล Coins/Energy/Scale ล่าสุดทันที
      fetchProfile(); 

      setBattleResult({
        expGained: expGain,
        coinGained: coinGain,
        leveledUp,
        oldLevel,
        newLevel,
        scaleDrop // 🔥 ส่ง Scale Drop ไปแสดงผล
      });

    } catch (error) {
      console.error("Save Error:", error);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500"></div></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 relative overflow-hidden flex flex-col items-center">
      <div className="absolute inset-0 opacity-30 bg-[url('https://wallpaperaccess.com/full/5818315.png')] bg-cover bg-center -z-10" />
      
      <div className="w-full max-w-4xl flex justify-between items-center mb-4 z-10">
        <Link href="/game" className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition"><ArrowLeft className="w-6 h-6" /></Link>
        <div className="bg-black/50 backdrop-blur px-4 py-1 rounded-full text-sm font-mono text-emerald-400 border border-emerald-500/30">Turn {turn}</div>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 w-full max-w-5xl flex flex-col justify-center items-center gap-12 md:gap-4 md:flex-row md:justify-between px-4 md:px-20 relative">
        <div className="relative w-full max-w-xs flex flex-col items-center md:items-end order-1 md:order-2">
          <BattleCard pokemon={enemy} isEnemy={true} isAttacking={!isPlayerTurn && gameState === 'playing'} />
        </div>
        <div className="relative w-full max-w-xs flex flex-col items-center md:items-start order-2 md:order-1">
          <BattleCard pokemon={player} isEnemy={false} isAttacking={isPlayerTurn && gameState === 'playing'} />
        </div>
      </div>

      <div className="w-full max-w-3xl mt-auto z-20 pb-4">
        {gameState === "playing" && (
          <div className="bg-black/70 backdrop-blur-md p-3 rounded-t-2xl h-20 overflow-y-auto border-t border-x border-white/10 text-sm font-mono">
            {logs.map((log, i) => (
              <motion.p key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={i === 0 ? "text-yellow-300" : "text-slate-400"}>{`> ${log}`}</motion.p>
            ))}
          </div>
        )}

        <div className="bg-slate-900 border-t border-slate-800 p-4 rounded-b-2xl shadow-2xl">
          {gameState === "playing" ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {player.moves.map((move, i) => {
                const isReady = isPlayerTurn && move.currentCooldown === 0;
                return (
                  <button key={i} onClick={() => isReady && handleTurn(player, enemy, setEnemy, move, "player")} disabled={!isReady} className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all overflow-hidden group h-20 ${isReady ? "bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-emerald-500 cursor-pointer" : "bg-slate-900 border-slate-800 opacity-60 cursor-not-allowed"}`}>
                    {move.currentCooldown > 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                        <div className="flex flex-col items-center"><span className="text-2xl font-bold text-white">{move.currentCooldown}</span><span className="text-[10px] text-slate-300">TURNS</span></div>
                        </div>
                      )}
                      <div className="mb-1 text-slate-300 group-hover:text-white transition-colors">{move.icon}</div>
                      <span className="font-bold text-sm text-white">{move.name}</span>
                      {move.cooldown > 0 && <div className="absolute top-1 right-1"><Clock className="w-3 h-3 text-slate-500" /></div>}
                  </button>
                );
              })}
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-2 bg-slate-900/90 border border-slate-700 p-6 rounded-2xl shadow-2xl">
              {gameState === 'win' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 text-yellow-400">
                    <Trophy className="w-8 h-8" />
                    <h2 className="text-3xl font-bold">VICTORY!</h2>
                  </div>
                  <div className="flex justify-center gap-4 text-sm">
                    <span className="bg-slate-800 px-3 py-1 rounded text-emerald-400">+{battleResult.expGained} EXP</span>
                    <span className="bg-slate-800 px-3 py-1 rounded text-yellow-400">+{battleResult.coinGained} Coins</span>
                    <span className="bg-slate-800 px-3 py-1 rounded text-cyan-400">+{battleResult.scaleDrop} Scale</span>
                  </div>
                  {battleResult.leveledUp && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 rounded-xl mx-auto max-w-sm shadow-lg border border-blue-400">
                      <div className="flex items-center justify-center gap-2 font-bold text-lg mb-2"><ArrowUpCircle className="w-6 h-6 animate-bounce" /> Level Up!</div>
                      <div className="flex justify-center items-center gap-4">
                        <div className="text-right"><p className="text-sm opacity-80">Lv.{battleResult.oldLevel}</p></div>
                        <div className="text-2xl">➔</div>
                        <div className="text-left"><p className="text-sm text-yellow-300 font-bold">Lv.{battleResult.newLevel}</p></div>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div><h2 className="text-3xl font-bold text-red-500 mb-2">DEFEATED</h2><p className="text-slate-400 text-sm">กลับไปฝึกฝนมาใหม่นะ...</p></div>
              )}
              <div className="flex gap-4 justify-center mt-6">
                <button onClick={() => window.location.reload()} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold flex items-center gap-2 transition"><RotateCcw className="w-4 h-4" /> Battle Again</button>
                <Link href="/game"><button className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold transition">Return Home</button></Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function BattleCard({ pokemon, isEnemy, isAttacking }) {
  if (!pokemon) return null;
  const hpPercent = (pokemon.currentHp / pokemon.maxHp) * 100;
  return (
    <div className={`w-full ${isEnemy ? "text-right" : "text-left"}`}>
      <div className="bg-slate-800/80 backdrop-blur px-4 py-2 rounded-xl border border-slate-600 shadow-lg mb-4 inline-block min-w-[200px]">
        <div className="flex justify-between items-baseline gap-4 mb-1">
          <h3 className="font-bold text-white text-lg capitalize">{pokemon.name}</h3>
          <span className="text-xs text-yellow-400 font-mono">Lv.{pokemon.level}</span>
        </div>
        <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden mb-1">
          <motion.div className={`h-full ${hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 20 ? 'bg-yellow-500' : 'bg-red-500'}`} initial={{ width: "100%" }} animate={{ width: `${hpPercent}%` }} transition={{ duration: 0.5 }} />
        </div>
        <div className="text-right text-[10px] text-slate-400">{pokemon.currentHp}/{pokemon.maxHp} HP</div>
      </div>
      <div className="relative h-40 md:h-56 flex items-center justify-center">
        <motion.img src={pokemon.image_url} alt={pokemon.name} className={`w-40 h-40 md:w-56 md:h-56 object-contain drop-shadow-2xl z-10 ${!isEnemy ? "scale-x-[-1]" : ""}`} animate={isAttacking ? { x: isEnemy ? -50 : 50, scale: 1.1 } : { x: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }} />
        <div className="absolute bottom-4 w-32 h-8 bg-black/50 rounded-full blur-xl -z-10" />
      </div>
    </div>
  );
}