"use client";

import { motion } from "framer-motion";
import FrameTabs from "@/components/frames/FrameTabs";

export default function FramesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[1440px] mx-auto py-6 px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Tiêu đề */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Gọng Kính</h1>
            <p className="text-gray-600 mt-1">
              Tổng quan và quản lý tất cả các danh mục liên quan đến gọng kính
            </p>
          </div>

          {/* Các tab */}
          <FrameTabs />

          {/* Nội dung trang */}
          {children}
        </motion.div>
      </main>
    </div>
  );
}
