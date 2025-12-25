"use client";

import { motion } from "framer-motion";
import StatCard from "@/components/StatCard";
import Link from "next/link";
import { Routes } from "@/lib/routes";
import { ICONS } from "@/config/sidebarItems";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";
import { useEffect, useState } from "react";
import { getFrameCounts } from "@/services/frameService/frameCommon";

function FramesPage() {
  const [counts, setCounts] = useState({
    frameShapes: 0,
    frameTypes: 0,
    frameMaterials: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getFrameCounts();
        setCounts(data);
      } catch (e) {
        console.error("Failed to load frame counts:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[1440px] mx-auto py-6 px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Glasses Frames</h1>
              <p className="text-gray-600 mt-1">
                Overview and management of all frame-related categories
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stat Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <Link href={Routes.productsManagement.frames.frameShapes.root}>
            <StatCard
              name="Frame Shapes"
              value={loading ? "..." : "Manage"}
              icon={ICONS.Shapes}
              count={counts.frameShapes}
            />
          </Link>

          <Link href={Routes.productsManagement.frames.frameTypes.root}>
            <StatCard
              name="Frame Types"
              value={loading ? "..." : "Manage"}
              icon={ICONS.Component}
              count={counts.frameTypes}
            />
          </Link>

          <Link href={Routes.productsManagement.frames.frameMaterials.root}>
            <StatCard
              name="Frame Materials"
              value={loading ? "..." : "Manage"}
              icon={ICONS.Gem}
              count={counts.frameMaterials}
            />
          </Link>
        </motion.div>
      </main>
    </div>
  );
}

export default withAuthCheck(FramesPage);
