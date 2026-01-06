"use client";

import { useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";
import { createVoucher } from "@/services/voucherService";
import VoucherForm, { VoucherFormValues } from "../VoucherForm";
import { toast } from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

export default function AddVoucherPage() {
  const router = useRouter();

  // Get current date and set default valid from/to
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const formatDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const initial: VoucherFormValues = {
    code: "",
    description: "",
    minOrderAmount: "0",
    maxUsage: 0,
    type: "fixed",
    value: "0",
    validFrom: formatDateTimeLocal(tomorrow),
    validTo: formatDateTimeLocal(nextWeek),
  };

  const onSubmit = async (values: VoucherFormValues) => {
    await createVoucher(values as any);
    toast.success("Voucher created successfully!");
    router.push(Routes.sales.vouchers.root);
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[980px] mx-auto py-6 px-4 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Thêm mã giảm giá</h1>
        </div>

        <VoucherForm
          initial={initial}
          submitLabel="Tạo"
          onSubmit={onSubmit}
          onCancel={() => router.back()}
        />
      </main>
    </div>
  );
}
