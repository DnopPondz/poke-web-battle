"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Mail, Lock, User, AlertCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("รหัสผ่านไม่ตรงกัน");
      setIsLoading(false);
      return;
    }

   try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          // เพิ่มบรรทัดนี้ครับ 👇
          emailRedirectTo: `${window.location.origin}/login`, 
          data: {
            full_name: formData.fullName,
            avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${formData.fullName}`,
          },
        },
      });

      if (error) throw error;
      alert("สมัครสมาชิกสำเร็จ! กรุณาเช็คอีเมลเพื่อยืนยันตัวตน");
      router.push("/login");

    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // ใช้ Grid เพื่อแบ่งครึ่งจอ
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-slate-950">
      
      {/* ส่วนที่ 1: ฟอร์มสมัคร (ซ้าย) */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 relative">
        
        <Link href="/" className="absolute top-8 left-8 inline-flex items-center text-slate-400 hover:text-white text-sm transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" /> กลับหน้าหลัก
        </Link>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center lg:text-left">
            <h2 className="text-4xl font-extrabold text-white tracking-tight">สร้างบัญชีใหม่ 🚀</h2>
            <p className="mt-2 text-slate-400">เริ่มต้นการผจญภัยในโลก Monster Gacha</p>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0" /> {errorMsg}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            {/* ชื่อในเกม */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">ชื่อในเกม (Display Name)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  name="fullName"
                  type="text"
                  required
                  placeholder="เช่น Satoshi"
                  className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl leading-5 bg-slate-900 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition sm:text-sm"
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* อีเมล */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">อีเมล</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl leading-5 bg-slate-900 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition sm:text-sm"
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* รหัสผ่าน (2 ช่องคู่กันบนจอใหญ่) */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">รหัสผ่าน</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl leading-5 bg-slate-900 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition sm:text-sm"
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">ยืนยันรหัสผ่าน</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    name="confirmPassword"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl leading-5 bg-slate-900 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition sm:text-sm"
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all transform hover:scale-[1.02]"
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "สมัครสมาชิก"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            มีบัญชีอยู่แล้ว?{" "}
            <Link href="/login" className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
              เข้าสู่ระบบเลย
            </Link>
          </p>
        </motion.div>
      </div>

      {/* ส่วนที่ 2: รูปภาพ Art (ขวา - ซ่อนบนมือถือ) */}
      <div className="hidden lg:flex relative bg-slate-900 items-center justify-center overflow-hidden">
        {/* ใส่พื้นหลัง หรือรูปภาพเกม */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/50 via-slate-950 to-black z-0" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="z-10 text-center p-8"
        >
          <div className="w-64 h-64 mx-auto bg-emerald-500/20 rounded-full blur-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
          {/* คุณสามารถหารูป Pokemon หรือ Artwork เกมมาใส่ตรงนี้ */}
          <Sparkles className="w-32 h-32 text-emerald-400 mx-auto mb-6 relative z-10" />
          <h3 className="text-3xl font-bold text-white mb-4">เข้าร่วมกับผู้เล่นนับหมื่น!</h3>
          <p className="text-slate-400 max-w-sm mx-auto">
            สุ่มกาชา สะสมตัวละครระดับ SSR และจัดทีมเพื่อเป็นเจ้าแห่งเซิร์ฟเวอร์
          </p>
        </motion.div>
      </div>

    </div>
  );
}