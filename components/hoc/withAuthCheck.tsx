"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LockKeyhole, LogIn } from "lucide-react";
import { Button } from "../ui/button";
import LoginDialog from "../LoginDialog";

export function withAuthCheck<T extends object>(Component: React.ComponentType<T>) {
  return function AuthCheckWrapper(props: T) {
    const { user, loading } = useAuth();
    const [seconds, setSeconds] = useState(0);
    const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);

    // Timer hiển thị loading
    useEffect(() => {
      if (!loading) return;
      const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
      return () => clearInterval(timer);
    }, [loading]);

    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");

    // Nếu đang loading context
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-gray-600">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-gray-200"></div>
            <div className="h-12 w-12 rounded-full border-4 border-transparent border-t-gray-500 animate-spin absolute inset-0"></div>
          </div>
          <p className="text-lg">Loading...</p>
        </div>
      );
    }

    // Nếu chưa đăng nhập
    if (!user) {
      return (
        <>
          <div className="flex items-center justify-center h-[60vh]">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm flex flex-col items-center text-center"
            >
              <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
                <LockKeyhole className="h-6 w-6 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Please Login</h3>
              <p className="text-gray-700 mb-6">
                You need to log in to view Dashboard data and administrative features.
              </p>
              <Button
                onClick={() => setIsLoginDialogOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 hover:border-gray-500 
                  transition text-gray-500 hover:text-gray-800"
              >
                <LogIn className="h-4 w-4" />
                Log in
              </Button>
              <span className="text-sm text-gray-600 mt-3">
                Don't have an account? Contact the administrator.
              </span>
            </motion.div>
          </div>

          <LoginDialog
            open={isLoginDialogOpen}
            onOpenChange={setIsLoginDialogOpen}
            onLoginSuccess={() => {
              setIsLoginDialogOpen(false);
            }}
          />
        </>
      );
    }

    return <Component {...props} />;
  };
}
