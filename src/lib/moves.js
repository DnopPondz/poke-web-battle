// src/lib/moves.js
import { Swords, Zap, Flame, Droplets, Leaf, Star, ShieldPlus, Wind, Mountain, Skull, Moon, Sun } from "lucide-react";

export const MOVES_DB = {
  // Normal
  "Tackle": { name: "Tackle", type: "Normal", power: 40, accuracy: 100, cooldown: 0, icon: <Star className="w-4 h-4" /> },
  "Scratch": { name: "Scratch", type: "Normal", power: 40, accuracy: 100, cooldown: 0, icon: <Swords className="w-4 h-4" /> },
  "Quick Attack": { name: "Quick Attack", type: "Normal", power: 40, accuracy: 100, cooldown: 0, icon: <Wind className="w-4 h-4" /> },
  "Hyper Beam": { name: "Hyper Beam", type: "Normal", power: 150, accuracy: 90, cooldown: 3, icon: <Sun className="w-4 h-4 text-yellow-500" /> },
  
  // Fire
  "Ember": { name: "Ember", type: "Fire", power: 40, accuracy: 100, cooldown: 0, icon: <Flame className="w-4 h-4 text-orange-500" /> },
  "Flamethrower": { name: "Flamethrower", type: "Fire", power: 90, accuracy: 100, cooldown: 2, icon: <Flame className="w-4 h-4 text-red-500" /> },
  "Fire Blast": { name: "Fire Blast", type: "Fire", power: 110, accuracy: 85, cooldown: 3, icon: <Flame className="w-4 h-4 text-red-600" /> },

  // Water
  "Water Gun": { name: "Water Gun", type: "Water", power: 40, accuracy: 100, cooldown: 0, icon: <Droplets className="w-4 h-4 text-blue-400" /> },
  "Bubble Beam": { name: "Bubble Beam", type: "Water", power: 65, accuracy: 100, cooldown: 1, icon: <Droplets className="w-4 h-4 text-blue-300" /> },
  "Hydro Pump": { name: "Hydro Pump", type: "Water", power: 110, accuracy: 80, cooldown: 3, icon: <Droplets className="w-4 h-4 text-blue-600" /> },

  // Grass
  "Vine Whip": { name: "Vine Whip", type: "Grass", power: 45, accuracy: 100, cooldown: 0, icon: <Leaf className="w-4 h-4 text-green-500" /> },
  "Razor Leaf": { name: "Razor Leaf", type: "Grass", power: 55, accuracy: 95, cooldown: 1, icon: <Leaf className="w-4 h-4 text-emerald-600" /> },
  "Solar Beam": { name: "Solar Beam", type: "Grass", power: 120, accuracy: 100, cooldown: 3, icon: <Sun className="w-4 h-4 text-yellow-400" /> },

  // Electric
  "Thunder Shock": { name: "Thunder Shock", type: "Electric", power: 40, accuracy: 100, cooldown: 0, icon: <Zap className="w-4 h-4 text-yellow-400" /> },
  "Thunderbolt": { name: "Thunderbolt", type: "Electric", power: 90, accuracy: 100, cooldown: 2, icon: <Zap className="w-4 h-4 text-yellow-300" /> },
  "Thunder": { name: "Thunder", type: "Electric", power: 110, accuracy: 70, cooldown: 3, icon: <Zap className="w-4 h-4 text-yellow-500" /> },

  // Others
  "Rock Throw": { name: "Rock Throw", type: "Rock", power: 50, accuracy: 90, cooldown: 1, icon: <Mountain className="w-4 h-4 text-stone-500" /> },
  "Earthquake": { name: "Earthquake", type: "Ground", power: 100, accuracy: 100, cooldown: 3, icon: <Mountain className="w-4 h-4 text-amber-700" /> },
  "Psychic": { name: "Psychic", type: "Psychic", power: 90, accuracy: 100, cooldown: 2, icon: <Star className="w-4 h-4 text-pink-500" /> },
  "Shadow Ball": { name: "Shadow Ball", type: "Ghost", power: 80, accuracy: 100, cooldown: 2, icon: <Skull className="w-4 h-4 text-purple-700" /> },
  "Dragon Claw": { name: "Dragon Claw", type: "Dragon", power: 80, accuracy: 100, cooldown: 2, icon: <Swords className="w-4 h-4 text-indigo-500" /> },
  "Bite": { name: "Bite", type: "Dark", power: 60, accuracy: 100, cooldown: 1, icon: <Moon className="w-4 h-4 text-slate-800" /> },

  // Support
  "Heal": { name: "Heal", type: "Support", power: 0, accuracy: 100, effect: "heal", cooldown: 3, icon: <ShieldPlus className="w-4 h-4 text-pink-400" /> },
};

export const getMovesByType = (type) => {
  const t = type.toLowerCase();
  // กำหนด Default Moves ตามธาตุ
  let moves = ["Tackle", "Scratch", "Quick Attack", "Heal"];
  
  if (t === "fire") moves = ["Ember", "Flamethrower", "Fire Blast", "Heal"];
  else if (t === "water") moves = ["Water Gun", "Bubble Beam", "Hydro Pump", "Heal"];
  else if (t === "grass") moves = ["Vine Whip", "Razor Leaf", "Solar Beam", "Heal"];
  else if (t === "electric") moves = ["Thunder Shock", "Thunderbolt", "Thunder", "Heal"];
  else if (t === "rock" || t === "ground") moves = ["Rock Throw", "Earthquake", "Tackle", "Heal"];
  else if (t === "psychic") moves = ["Psychic", "Shadow Ball", "Heal", "Quick Attack"];
  else if (t === "dragon") moves = ["Dragon Claw", "Flamethrower", "Hyper Beam", "Heal"];
  
  // Mapping ชื่อท่าเป็น Object จริง
  return moves.map(m => MOVES_DB[m] || MOVES_DB["Tackle"]);
};