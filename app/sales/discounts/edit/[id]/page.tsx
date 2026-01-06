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
        // Convert percentage value from backend (divide by 100)
        if (discount.type === "percentage" && discount.value) {
          discount.value = String(parseFloat(discount.value) / 100);
        }
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
      toast.success('Cập nhật mã giảm giá thành công!');
      router.push(Routes.sales.discounts.root);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Cập nhật mã giảm giá thất bại');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-gray-500">Đang tải...</p>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-red-500">Không tìm thấy mã giảm giá</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[980px] mx-auto py-6 px-4 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Chỉnh sửa mã giảm giá</h1>
        </div>

        <DiscountForm
          initial={initialData}
          onSubmit={handleSubmit}
          submitLabel="Cập nhật"
          onCancel={() => router.push(Routes.sales.discounts.root)}
        />
      </main>
    </div>
  );
}
