"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { DiscountForm } from "../../DiscountForm";
import { getDiscountById, updateDiscount } from "@/services/discountService";
import { Routes } from "@/lib/routes";
import toast from "react-hot-toast";

export default function EditDiscountPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiscount = async () => {
      try {
        const discount = await getDiscountById(id);
        setInitialData(discount);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.detail || "Failed to fetch discount"
        );
        router.push(Routes.sales.discounts.root);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscount();
  }, [id, router]);

  const handleSubmit = async (data: any) => {
    try {
      const result = await updateDiscount(id, data);
      console.log('Update successful:', result);
      toast.success('Discount updated successfully!');
      router.push(Routes.sales.discounts.root);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to update discount');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-red-500">Discount not found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[980px] mx-auto py-6 px-4 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Edit Discount</h1>
        </div>

        <DiscountForm
          initial={initialData}
          onSubmit={handleSubmit}
          submitLabel="Update"
          onCancel={() => router.push(Routes.sales.discounts.root)}
        />
      </main>
    </div>
  );
}
