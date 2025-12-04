// src/lib/evolutionLibrary.js

// นำเข้าข้อมูล Rarity ของทุก Gen
import gen1 from "@/app/pokedexdata/gen1.json";
import gen2 from "@/app/pokedexdata/gen2.json";
import gen3 from "@/app/pokedexdata/gen3.json";
import gen4 from "@/app/pokedexdata/gen4.json";
import gen5 from "@/app/pokedexdata/gen5.json";
import gen6 from "@/app/pokedexdata/gen6.json";
import gen7 from "@/app/pokedexdata/gen7.json";
import gen8 from "@/app/pokedexdata/gen8.json";
import gen9 from "@/app/pokedexdata/gen9.json";

const ALL_GENS = [gen1, gen2, gen3, gen4, gen5, gen6, gen7, gen8, gen9];

// Cache เก็บข้อมูล ID -> Rarity เพื่อความเร็วในการค้นหา
let rarityMap = null;

// ฟังก์ชันสร้าง Map (ทำครั้งเดียว)
const buildRarityMap = () => {
  if (rarityMap) return;
  rarityMap = {};

  ALL_GENS.forEach((genData) => {
    // genData เช่น { GENERATION_I: { NORMAL: { SSR: [...] } } }
    Object.values(genData).forEach((genContent) => {
      Object.values(genContent).forEach((typeGroup) => {
        // typeGroup เช่น { SSR: [...], SR: [...] }
        Object.entries(typeGroup).forEach(([rarity, ids]) => {
          ids.forEach((id) => {
            rarityMap[id] = rarity;
          });
        });
      });
    });
  });
};

export function getEvolutionCost(pokemonId) {
  // สร้าง Map ถ้ายังไม่มี
  if (!rarityMap) buildRarityMap();

  const rarity = rarityMap[pokemonId] || "N"; // ถ้าหาไม่เจอให้เป็น N

  // === กำหนดราคาตามระดับความหายากของร่างถัดไป ===
  switch (rarity) {
    case "SSR":
      return 5000; // ร่างเทพ/ร่าง 3 ที่เก่งมาก
    case "SR":
      return 1500; // ร่าง 2 หรือร่าง 3 ทั่วไป
    case "R":
      return 500;  // ร่าง 1 ทั่วไป
    case "N":
      return 200;  // หาง่าย
    default:
      return 1000;
  }
}