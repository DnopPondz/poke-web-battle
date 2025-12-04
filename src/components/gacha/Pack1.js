"use client";

import GachaInterface from "./GachaInterface";
import gen1Raw from "@/app/pokedexdata/gen1.json"; // นำเข้าไฟล์ JSON ที่คุณอัปโหลด

export default function Pack1() {
  // กำหนด % การออกของกล่องนี้
  const RATES = {
    SSR: 0.001, // 5%
    SR: 0.025,  // 15%
    R: 0.010,   // 30%
    N: 0.70,   // 50%
  };

  return (
    <GachaInterface 
      boxName="Kanto Region (Gen 1)"
      rates={RATES}
      poolData={gen1Raw.GENERATION_I} // ส่งข้อมูล Gen 1 ไปให้ Engine
      cost={500}
      colorTheme="red" // ธีมสีแดง (Kanto)
    />
  );
}