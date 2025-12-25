"use client";

import { motion } from "framer-motion";
import { Percent, Ticket, ArrowRight } from "lucide-react";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";
import { useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";

function SalesPage() {
  const router = useRouter();

  const salesModules = [
    {
      title: "Discount Management",
      description: "Create and manage product discounts, promotional pricing, and special offers",
      icon: Percent,
      color: "from-purple-50 to-white",
      borderColor: "border-purple-100",
      iconColor: "text-purple-500",
      path: Routes.sales.discounts.root,
    },
    {
      title: "Voucher Management",
      description: "Create and manage voucher codes, coupons, and promotional campaigns",
      icon: Ticket,
      color: "from-blue-50 to-white",
      borderColor: "border-blue-100",
      iconColor: "text-blue-500",
      path: Routes.sales.vouchers.root,
    },
  ];

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[1440px] mx-auto py-8 px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Sales Management</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage discounts, vouchers, and promotional campaigns
            </p>
          </div>

          {/* Module Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {salesModules.map((module, idx) => (
              <motion.div
                key={module.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => router.push(module.path)}
                className={`bg-gradient-to-br ${module.color} border-2 ${module.borderColor} rounded-2xl p-8 cursor-pointer hover:shadow-xl transition-all duration-300 group`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-4 rounded-xl bg-white shadow-sm ${module.iconColor}`}>
                    <module.icon size={32} />
                  </div>
                  <ArrowRight
                    size={24}
                    className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all"
                  />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {module.title}
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {module.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default withAuthCheck(SalesPage);
