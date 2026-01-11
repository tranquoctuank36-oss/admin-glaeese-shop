"use client";

import { Bell, LogOut } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import * as Popover from "@radix-ui/react-popover";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import LoginDialog from "../auth/LoginDialog";

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [open, setOpen] = useState(false);

  // ✅ Chỉ dùng firstName; nếu trống -> "You"
  const greetingName = useMemo(() => {
    const fn = (user as any)?.firstName;
    const clean = typeof fn === "string" ? fn.trim() : "";
    return clean || "Bạn";
  }, [user]);

  const handleUserPress = () => {
    if (!user) setIsLoginDialogOpen(true);
    else setOpen((v) => !v);
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      toast.success("Đã đăng xuất!", {
        duration: 2000,
        position: "top-center",
      });
      router.push('/');
    } finally {
      setLoggingOut(false);
      setOpen(false);
    }
  };

  return (
    <header className="bg-gradient-to-br from-blue-50 via-slate-50 to-gray-50 border-b mx-4 sm:sm-6 lg:mx-8 mt-4 mb-2 rounded-lg">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 flex items-center justify-between">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800">
          Tổng quan
        </h1>

        <div className="flex items-center space-x-3 sm:space-x-6">

          {user ? (
            <Popover.Root open={open} onOpenChange={setOpen}>
              <Popover.Trigger asChild>
                <button
                  onClick={handleUserPress}
                  className="flex items-center gap-2 sm:gap-3 group cursor-pointer"
                  aria-label="Account menu"
                >
                  <Image
                    src={"/avatar_user.png"}
                    alt="admin"
                    width={35}
                    height={35}
                    className="rounded-full border border-gray-600 bg-gray-300 group-hover:brightness-110 transition"
                  />
                  <span className="hidden sm:block text-gray-800 font-bold transition">
                    Chào,&nbsp;{greetingName}
                  </span>
                </button>
              </Popover.Trigger>

              <Popover.Portal>
                <Popover.Content
                  side="bottom"
                  align="end"
                  sideOffset={5}
                  className="z-[1000] w-70 p-4 rounded-xl border border-gray-200 bg-white shadow-xl "
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src={"/avatar_user.png"}
                      alt="avatar"
                      width={40}
                      height={40}
                      className="rounded-full border border-gray-200 bg-gray-300"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold truncate">Chào, {greetingName}</p>
                      {(user as any)?.email && (
                        <p className="text-xs text-gray-500 truncate">
                          {(user as any).email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 border-t pt-3 border-gray-400">
                    <Button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      variant="outline"
                      className="w-full justify-center gap-2 cursor-pointer border-gray-300 hover:border-gray-700 bg-white "
                    >
                      <LogOut className="h-4 w-4" />
                      {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
                    </Button>
                  </div>

                  <Popover.Arrow className="fill-white" />
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          ) : (
            <button
              onClick={handleUserPress}
              className="flex items-center gap-2 sm:gap-3 cursor-pointer"
              aria-label="Login"
            >
              <Image
                src={"/avatar_user.png"}
                alt="admin"
                width={35}
                height={35}
                className="rounded-full border border-gray-600 bg-gray-300 hover:brightness-110 transition"
              />
              <span className="hidden sm:block text-gray-700 font-semibold transition">
                Đăng nhập
              </span>
            </button>
          )}
        </div>
      </div>

      <LoginDialog
        open={isLoginDialogOpen}
        onOpenChange={setIsLoginDialogOpen}
        onLoginSuccess={() => setIsLoginDialogOpen(false)}
      />
    </header>
  );
}
