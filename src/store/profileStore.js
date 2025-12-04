// src/store/profileStore.js
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export const useProfileStore = create((set, get) => ({
  // เพิ่ม last_energy_updated_at ใน state เริ่มต้น
  profile: { coins: 0, energy: 0, full_name: 'Trainer', level: 1, avatar_url: null, poke_scale: 0, last_energy_updated_at: null },
  
  fetchProfile: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        // 🔥 บรรทัดนี้สำคัญมาก ต้องมี last_energy_updated_at
        .select("coins, energy, full_name, level, avatar_url, poke_scale, last_energy_updated_at")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      
      set({ profile: data });

    } catch (error) {
      console.error("Error fetching profile from store:", error);
    }
  },

  deductCoinsLocally: (amount) => {
    set((state) => ({
      profile: {
        ...state.profile,
        coins: state.profile.coins - amount,
      },
    }));
  },
}));