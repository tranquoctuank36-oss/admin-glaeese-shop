"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Routes } from "@/lib/routes";
import { getVoucherById, updateVoucher } from "@/services/voucherService";
import VoucherForm, { VoucherFormValues } from "../../VoucherForm";
import { toast } from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

export default function EditVoucherPage() {
  const router = useRouter();
  const params = useParams();
  const voucherId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [initial, setInitial] = useState<VoucherFormValues | null>(null);

  // Convert ISO datetime to datetime-local format
  const convertToDateTimeLocal = (isoString: string): string => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    if (!voucherId) return;

    const fetchVoucher = async () => {
      try {
        setLoading(true);
        const voucher = await getVoucherById(voucherId);
        
        setInitial({
          code: voucher.code || "",
          description: voucher.description || "",
          minOrderAmount: voucher.minOrderAmount || "0",
          maxDiscountValue: voucher.maxDiscountValue || undefined,
          maxUsage: voucher.maxUsage || 0,
          type: voucher.type || "fixed",
          value: voucher.value || "0",
          validFrom: convertToDateTimeLocal(voucher.validFrom),
          validTo: convertToDateTimeLocal(voucher.validTo),
        });
      } catch (error: any) {
        console.error("Error fetching voucher:", error);
        const errorMessage = error?.response?.status === 404 
          ? "Voucher not found. It may have been deleted."
          : error?.response?.data?.detail || "Failed to load voucher";
        toast.error(errorMessage);
        router.push(Routes.sales.vouchers.root);
      } finally {
        setLoading(false);
      }
    };

    fetchVoucher();
  }, [voucherId, router]);

  const onSubmit = async (values: VoucherFormValues) => {
    await updateVoucher(voucherId, values as any);
    toast.success("Voucher updated successfully!");
    router.push(Routes.sales.vouchers.root);
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-auto relative z-10">
        <main className="max-w-[980px] mx-auto py-6 px-4 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading voucher...</div>
          </div>
        </main>
      </div>
    );
  }

  if (!initial) {
    return null;
  }

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[980px] mx-auto py-6 px-4 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Edit Voucher</h1>
        </div>

        <VoucherForm
          initial={initial}
          submitLabel="Update"
          onSubmit={onSubmit}
          onCancel={() => router.back()}
        />
      </main>
    </div>
  );
}
