"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Gamepad2, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (provider) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        // เดี๋ยวเราค่อยไปสร้างหน้า /game ทีหลัง ตอนนี้มันจะฟ้อง 404 ไม่ต้องตกใจ
        redirectTo: `${window.location.origin}/game`, 
      },
    });

    if (error) {
      console.error("Login Error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white p-4">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black z-0" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 w-full max-w-md space-y-8 text-center"
      >
        {/* Logo */}
        <div className="flex justify-center">
          <div className="rounded-full bg-blue-500/20 p-6 ring-1 ring-blue-500/50">
            <Gamepad2 className="h-12 w-12 text-blue-400" />
          </div>
        </div>

        <div>
          <h2 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            Monster Gacha
          </h2>
          <p className="mt-2 text-slate-400">
            สะสมมอนสเตอร์ และต่อสู้ในโลกเสมือนจริง
          </p>
        </div>

        {/* Login Buttons */}
        <div className="space-y-4 pt-4">
          <button
            onClick={() => handleLogin("google")}
            disabled={isLoading}
            className="group relative flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 text-slate-700 transition-all hover:bg-slate-50 hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              // Google Icon SVG
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            <span className="font-semibold">Sign in with Google</span>
          </button>
          
          {/* Facebook Button */}
           <button
            onClick={() => handleLogin("facebook")}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#1877F2] px-4 py-3 text-white transition-all hover:bg-[#1864D9] hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-70"
          >
             <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.048 0-2.733 1.379-2.733 2.892v1.08h3.943l-.502 3.667h-3.441v7.98h-4.982Z" />
             </svg>
             <span className="font-semibold">Sign in with Facebook</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}