"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DiscountForm } from "../DiscountForm";
import { createDiscount } from "@/services/discountService";
import { Routes } from "@/lib/routes";
import toast from "react-hot-toast";

export default function AddDiscountPage() {
  const router = useRouter();
  const initialData = {
    name: "",
    slug: "",
    description: "",
    type: "percentage" as "percentage" | "fixed",
    value: "0",
    maxDiscountValue: "",
    bannerImageId: "",
  };

  const handleSubmit = async (data: any) => {
    try {
      await createDiscount(data);
      toast.success("Discount created successfully!");
      router.push(Routes.sales.discounts.root);
    } catch (error) {
      throw error;
    }
  };

  const handleCancel = () => {
    router.push(Routes.sales.discounts.root);
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[980px] mx-auto py-6 px-4 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Add Discount</h1>
        </div>

        <DiscountForm
          initial={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="Create"
        />
      </main>
    </div>
  );
}
