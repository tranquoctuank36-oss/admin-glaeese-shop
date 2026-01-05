"use client";

import { motion } from "framer-motion";
import OrderTabs from "@/components/orders/OrderTabs";

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[1440px] mx-auto py-8 px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">
              Quản lý đơn hàng
            </h1>
            <p className="text-gray-600 mt-1">
              Quản lý và theo dõi đơn hàng của khách hàng
            </p>
          </div>

          {/* Tabs */}
          <OrderTabs />

          {/* Page Content */}
          {children}
        </motion.div>
      </main>
    </div>
  );
}
