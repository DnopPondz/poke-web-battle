import { supabase } from './supabase';

export async function getPokemonData(id) {
  try {
    // 1. Check Cache
    const { data: cachedData, error: cacheError } = await supabase
      .from('pokemon_cache')
      .select('*')
      .eq('id', id)
      .single();

    if (cachedData && !cacheError) {
      return {
        id: cachedData.id,
        name: cachedData.name,
        types: cachedData.types,
        stats: cachedData.stats,
        image_url: cachedData.image_url
      };
    }

    // 2. Fetch from PokeAPI if not in cache
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!res.ok) {
      throw new Error(`PokeAPI status: ${res.status}`);
    }
    const data = await res.json();

    const stats = {
      hp: data.stats.find(s => s.stat.name === 'hp')?.base_stat || 0,
      atk: data.stats.find(s => s.stat.name === 'attack')?.base_stat || 0,
      def: data.stats.find(s => s.stat.name === 'defense')?.base_stat || 0,
      spd: data.stats.find(s => s.stat.name === 'speed')?.base_stat || 0,
    };

    const types = data.types.map(t => t.type.name);
    const image_url = data.sprites.other["official-artwork"].front_default;

    // 3. Insert into Cache
    const { error: insertError } = await supabase
      .from('pokemon_cache')
      .insert({
        id: data.id,
        name: data.name,
        types: types,
        stats: stats,
        image_url: image_url
      });

    if (insertError) {
      console.warn("Failed to cache pokemon data:", insertError);
    }

    return {
      id: data.id,
      name: data.name,
      types: types,
      stats: stats,
      image_url: image_url
    };

  } catch (error) {
    console.error(`Error in getPokemonData for ID ${id}:`, error);
    throw error;
  }
}
