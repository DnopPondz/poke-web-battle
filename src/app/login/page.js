"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Mail, Lock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState({ email: "", password: "" });

  // Login ด้วย Google (ยังคงไว้เพราะสะดวก)
  const handleSocialLogin = async (provider) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) setIsLoading(false);
  };

  // Login ด้วย Email/Password
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      setErrorMsg("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      setIsLoading(false);
    } else {
      router.push("/game");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl"
      >
        <Link href="/" className="inline-flex items-center text-slate-400 hover:text-white mb-6 text-sm transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" /> กลับหน้าหลัก
        </Link>

        <h2 className="text-3xl font-bold text-white mb-6">เข้าสู่ระบบ</h2>

        {errorMsg && (
          <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="h-4 w-4" /> {errorMsg}
          </div>
        )}

        {/* ฟอร์ม Login ปกติ */}
        <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">อีเมล</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
              <input
                type="email"
                required
                className="w-full rounded-lg bg-slate-800 border border-slate-700 py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">รหัสผ่าน</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
              <input
                type="password"
                required
                className="w-full rounded-lg bg-slate-800 border border-slate-700 py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : "เข้าสู่ระบบ"}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-500">หรือ</span></div>
        </div>

        {/* ปุ่ม Google */}
        <button
          onClick={() => handleSocialLogin("google")}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 text-slate-900 font-semibold hover:bg-slate-100 transition-all disabled:opacity-70"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-5 w-5" alt="Google" />
          Sign in with Google
        </button>

        <div className="mt-8 text-center text-sm text-slate-500">
          ยังไม่มีบัญชี?{" "}
          <Link href="/register" className="text-blue-400 hover:text-blue-300 hover:underline">
            สมัครสมาชิก
          </Link>
        </div>
      </motion.div>
    </div>
  );
}