// src/components/EvolutionModal.js
"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Gem, Loader2, ArrowRight } from 'lucide-react';
import { useProfileStore } from '@/store/profileStore';

export default function EvolutionModal({ candidate, onConfirm, onCancel }) {
    if (!candidate) return null;

    const { pokemon, evoInfo, nextPokePreview } = candidate;
    const { profile } = useProfileStore();
    
    const userPokeScale = profile?.poke_scale || 0;
    const canAfford = userPokeScale >= evoInfo.cost;
    const requiredCoins = 2500; // Hardcoded requirement for Coins for demo
    
    const isEvolving = candidate.loading;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.8, y: 50 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.8, y: 50 }}
                    className="bg-slate-900 border-2 border-purple-600/70 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden text-white"
                >
                    <div className="p-6 md:p-8">
                        <h2 className="text-3xl font-extrabold text-center text-purple-400 mb-6">
                            Evolution Readiness Check
                        </h2>

                        {/* === PREVIEW SECTION === */}
                        <div className="grid grid-cols-5 items-center justify-center text-center">
                            {/* Current Form */}
                            <div className="col-span-2 space-y-3">
                                <p className="text-sm text-slate-400">CURRENT</p>
                                <img src={pokemon.image_url} alt={pokemon.name} className="w-24 h-24 mx-auto" />
                                <span className="font-bold capitalize">{pokemon.name}</span>
                            </div>

                            {/* Arrow */}
                            <div className="col-span-1 text-3xl text-purple-400 font-extrabold flex flex-col items-center">
                                <ArrowRight className="w-8 h-8 animate-pulse mb-1" />
                                <span className="text-sm">LV {evoInfo.level}</span>
                            </div>

                            {/* Next Form */}
                            <div className="col-span-2 space-y-3 opacity-80">
                                <p className="text-sm text-slate-400">NEXT FORM</p>
                                <img src={nextPokePreview.image_url} alt={nextPokePreview.name} className="w-24 h-24 mx-auto" />
                                <span className="font-bold capitalize text-purple-300">{nextPokePreview.name}</span>
                            </div>
                        </div>

                        {/* === COST SECTION === */}
                        <div className="mt-8 pt-6 border-t border-slate-700/50 space-y-4">
                            <h3 className="text-2xl font-bold text-white">Evolution Cost</h3>

                            <CostRow 
                                icon={<Gem className="w-6 h-6 text-cyan-400" />}
                                name="Poke Scale"
                                required={evoInfo.cost.toLocaleString()}
                                owned={userPokeScale.toLocaleString()}
                                canAfford={canAfford}
                            />
                            
                            <CostRow 
                                icon={<Coins className="w-6 h-6 text-yellow-400" />}
                                name="Coins"
                                required={requiredCoins.toLocaleString()}
                                owned={profile?.coins.toLocaleString() || 0}
                                canAfford={profile?.coins >= requiredCoins}
                            />

                        </div>
                    </div>

                    {/* === ACTIONS === */}
                    <div className="flex justify-between p-4 bg-slate-950/50 border-t border-slate-700">
                        <button 
                            onClick={onCancel}
                            disabled={isEvolving}
                            className="px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isEvolving || !canAfford || (profile?.coins < requiredCoins)}
                            className="px-6 py-2 rounded-lg font-bold bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 flex items-center gap-2 transition"
                        >
                            {isEvolving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    กำลังวิวัฒนาการ...
                                </>
                            ) : (
                                "ยืนยันการพัฒนาร่าง"
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

function CostRow({ name, required, owned, icon, canAfford }) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-b-0">
            <div className="flex items-center gap-3">
                {icon}
                <span className="text-slate-300">{name} (Req: {required})</span>
            </div>
            <span className={`font-bold ${canAfford ? 'text-emerald-400' : 'text-red-400'}`}>
                {owned}
            </span>
        </div>
    );
}