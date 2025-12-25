"use client";

import StatCard from "@/components/StatCard";
import { DollarSign, ShoppingBag, SquareActivity, Users } from "lucide-react";
import { motion } from "framer-motion";
import SalesOverViewChart from "@/components/chart/SalesOverViewChart";
import CategoryDistributionChart from "@/components/chart/CategoryDistributionChart";
import OrderDistributionChart from "@/components/chart/OrderDistributionChart";
import ProductPerformanceChart from "@/components/chart/ProductPerformanceChart";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";

const OverviewPage = () => {
  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-7xl mx-auto py-4 px-4 lg:px-8">
        <motion.div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <StatCard
            name="Total Sales"
            icon={DollarSign}
            value="182,450đ"
            color="blue"
          />
          <StatCard
            name="Total Clients"
            icon={Users}
            value="1,437"
            color="green"
          />
          <StatCard
            name="Total Products"
            icon={ShoppingBag}
            value="674"
            color="purple"
          />
          <StatCard
            name="Stock"
            icon={SquareActivity}
            value="12,845"
            color="orange"
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SalesOverViewChart />
          <CategoryDistributionChart />
          <OrderDistributionChart />
          <ProductPerformanceChart />
        </div>
      </main>
    </div>
  );
};

export default withAuthCheck(OverviewPage);
