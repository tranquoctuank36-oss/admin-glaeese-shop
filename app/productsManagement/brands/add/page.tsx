"use client";

import { useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";
import { createBrand } from "@/services/brandService";
import BrandForm, { BrandFormValues } from "../BrandForm";
import { toast } from "react-hot-toast";

export default function AddBrandPage() {
  const router = useRouter();

  const initial: BrandFormValues = {
    name: "",
    slug: "",
    websiteUrl: "",
    description: "",
    isActive: true,
    bannerImageId: "",
    priority: 100,
  };

  const onSubmit = async (values: BrandFormValues) => {
    await createBrand(values as any);
    router.push(Routes.productsManagement.brands.root);
    toast.success("Đã tạo thương hiệu thành công!");
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[980px] mx-auto py-6 px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Thêm thương hiệu</h1>
        </div>

        <BrandForm
          initial={initial}
          submitLabel="Tạo"
          onSubmit={onSubmit}
          onCancel={() => router.back()}
        />
      </main>
    </div>
  );
}
