"use client";

import { useAuth } from "@/context/AuthContext";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  // Nếu chưa đăng nhập, không hiển thị Sidebar và Header
  if (!user) {
    return (
      <div className="flex h-screen overflow-hidden items-center justify-center">
        <div className="w-full">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto w-full">
          <Header />
          {children}
        </div>
      </div>
    </div>
  );
}
