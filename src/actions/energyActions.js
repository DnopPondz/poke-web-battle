

"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

const MAX_ENERGY = 50;
const REGEN_MINUTES = 1; // 5 นาที ได้ 1 แต้ม

export async function checkAndRegenerateEnergy(userId) {
  try {
    // 1. ดึงข้อมูล
    const { data: profile } = await supabase
      .from("profiles")
      .select("energy, last_energy_updated_at")
      .eq("id", userId)
      .single();

    if (!profile) return { success: false };

    // 2. ถ้าเวลาเป็น Null (เพิ่งสมัคร) ให้เริ่มนับจากตอนนี้
    const now = new Date();
    if (!profile.last_energy_updated_at) {
        await supabase.from("profiles").update({ last_energy_updated_at: now.toISOString() }).eq("id", userId);
        return { success: true, energy: profile.energy };
    }

    // 3. ถ้า Energy เต็มแล้ว ให้รีเซ็ตเวลาเป็นปัจจุบัน (หยุดนับ)
    if (profile.energy >= MAX_ENERGY) {
        // อัปเดตเวลาเป็นปัจจุบันเพื่อให้พร้อมนับใหม่เมื่อมีการใช้ Energy
        if (new Date(profile.last_energy_updated_at).getTime() < now.getTime() - 1000) {
            await supabase.from("profiles").update({ last_energy_updated_at: now.toISOString() }).eq("id", userId);
        }
        return { success: true, energy: profile.energy };
    }

    // 4. คำนวณเวลาที่ผ่านไป
    const lastUpdate = new Date(profile.last_energy_updated_at);
    const diffMs = now - lastUpdate;
    const diffMinutes = Math.floor(diffMs / 1000 / 60);

    // 5. ถ้ายังไม่ครบ 5 นาที ก็ไม่ต้องทำอะไร
    if (diffMinutes < REGEN_MINUTES) {
        return { success: true, energy: profile.energy };
    }

    // 6. คำนวณแต้มที่ได้
    const energyToAdd = Math.floor(diffMinutes / REGEN_MINUTES);
    const newEnergy = Math.min(profile.energy + energyToAdd, MAX_ENERGY);

    // 7. คำนวณเวลาที่จะบันทึกใหม่ (ทดเวลาที่เหลือไปรอบหน้า)
    const timeConsumedMs = energyToAdd * REGEN_MINUTES * 60 * 1000;
    const newLastUpdate = new Date(lastUpdate.getTime() + timeConsumedMs);

    // 8. บันทึก
    await supabase.from("profiles").update({
        energy: newEnergy,
        last_energy_updated_at: newLastUpdate.toISOString()
    }).eq("id", userId);

    return { success: true, energy: newEnergy };

  } catch (error) {
    console.error("Energy Error:", error);
    return { success: false };
  }
}