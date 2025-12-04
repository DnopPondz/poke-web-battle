// src/actions/gameActions.js
"use server";

import { createClient } from "@supabase/supabase-js";

// สร้าง Supabase Client ด้วย Service Role Key เพื่อความปลอดภัยและสิทธิ์ระดับสูง
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function processBattleWin(userId, playerPokemonId, enemyLevel) {
  try {
    // 1. ตรวจสอบข้อมูลผู้เล่นและโปเกมอนจาก DB จริง (กันการมั่วข้อมูลส่งมา)
    const { data: profile } = await supabase
      .from("profiles")
      .select("coins, poke_scale")
      .eq("id", userId)
      .single();

    const { data: pokemon } = await supabase
      .from("inventory")
      .select("*")
      .eq("id", playerPokemonId)
      .eq("user_id", userId) // ต้องเป็นของ user คนนี้จริงๆ
      .single();

    if (!profile || !pokemon) {
      throw new Error("Validation failed: Data not found");
    }

    // 2. คำนวณรางวัล (Server Logic)
    const expGain = 50 * enemyLevel;
    const coinGain = 50 + (enemyLevel * 10);
    // สุ่ม Drop Scale 1-20 (logic เดิมของคุณ)
    const scaleDrop = Math.floor(Math.random() * 20) + 1; 

    // 3. คำนวณ Level Up และ Stat Growth
    let updatedStats = { ...pokemon.stats };
    let newLevel = pokemon.level;
    let newExp = pokemon.exp + expGain;
    let leveledUp = false;
    const oldLevel = pokemon.level;

    // Loop Level Up (ใช้ Logic เดิมของคุณ)
    while (newExp >= newLevel * 100) {
      newExp -= newLevel * 100;
      newLevel++;
      leveledUp = true;

      // Stat Growth Randomizer
      updatedStats.hp += Math.floor(Math.random() * 3) + 2;
      updatedStats.atk += Math.floor(Math.random() * 2) + 1;
      updatedStats.def += Math.floor(Math.random() * 2) + 1;
      updatedStats.spd += Math.floor(Math.random() * 2) + 1;
    }

    // 4. บันทึกข้อมูลลง Database (Transaction-like)
    // 4.1 อัปเดต Pokemon
    const { error: invError } = await supabase
      .from("inventory")
      .update({
        level: newLevel,
        exp: newExp,
        stats: updatedStats,
      })
      .eq("id", playerPokemonId);

    if (invError) throw new Error("Failed to update inventory");

    // 4.2 อัปเดต Profile (Coins + Scale)
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        coins: profile.coins + coinGain,
        poke_scale: profile.poke_scale + scaleDrop,
      })
      .eq("id", userId);

    if (profileError) throw new Error("Failed to update profile");

    // 5. ส่งผลลัพธ์กลับไปแสดงผลที่ Client
    return {
      success: true,
      data: {
        expGained: expGain,
        coinGained: coinGain,
        scaleDrop: scaleDrop,
        leveledUp: leveledUp,
        oldLevel: oldLevel,
        newLevel: newLevel,
      }
    };

  } catch (error) {
    console.error("Server Action Error:", error);
    return { success: false, error: error.message };
  }
}