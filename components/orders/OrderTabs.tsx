"use client";

import { useRouter, usePathname } from "next/navigation";
import { Routes } from "@/lib/routes";
import { useEffect, useState } from "react";
import { getOrders } from "@/services/orderService";

export default function OrderTabs() {
  const router = useRouter();
  const pathname = usePathname();

  const [tabCounts, setTabCounts] = useState({
    all: 0,
    pending: 0,
    processing: 0,
  });

  // Fetch tab counts
  useEffect(() => {
    (async () => {
      try {
        const [allRes, pendingRes, processingRes] = await Promise.all([
          getOrders({ limit: 1, page: 1 }),
          getOrders({ limit: 1, page: 1, status: "pending" }),
          getOrders({ limit: 1, page: 1, status: "processing" }),
        ]);
        setTabCounts({
          all: allRes.meta?.totalItems || 0,
          pending: pendingRes.meta?.totalItems || 0,
          processing: processingRes.meta?.totalItems || 0,
        });
      } catch (e) {
        console.error("Failed to fetch tab counts:", e);
      }
    })();
  }, [pathname]); // Refresh counts when pathname changes

  const tabs = [
    { label: "Tất cả", count: tabCounts.all, path: Routes.orders.root },
    {
      label: "Chờ xác nhận",
      count: tabCounts.pending,
      path: Routes.orders.pending,
    },
    {
      label: "Chờ đóng gói",
      count: tabCounts.processing,
      path: Routes.orders.packing,
    },
  ];

  return (
    <div className="mb-6 bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.path}
            onClick={() => router.push(tab.path)}
            className={`px-6 py-3 text-sm font-medium transition-colors relative cursor-pointer ${
              pathname === tab.path
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}{" "}
            {tab.count > 0 && (
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  pathname === tab.path
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
