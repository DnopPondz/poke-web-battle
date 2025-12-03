import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export const useProfileStore = create((set, get) => ({
  // 🔥 เพิ่ม poke_scale ใน State เริ่มต้น
  profile: { coins: 0, energy: 0, full_name: 'Trainer', level: 1, avatar_url: null, poke_scale: 0 },
  
  fetchProfile: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        // 🔥 เพิ่ม poke_scale ในการ Select
        .select("coins, energy, full_name, level, avatar_url, poke_scale")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      
      set({ profile: data });

    } catch (error) {
      console.error("Error fetching profile from store:", error);
    }
  },

  // === NEW FUNCTION: Deduct coins locally for immediate UI update ===
  deductCoinsLocally: (amount) => {
    set((state) => ({
      profile: {
        ...state.profile,
        coins: state.profile.coins - amount,
      },
    }));
  },
  // =================================================================
}));