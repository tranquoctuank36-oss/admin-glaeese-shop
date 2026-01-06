"use client";

import { useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";
import BannerForm from "../BannerForm";
import { createBanner } from "@/services/bannerService";
import { toast } from "react-hot-toast";

export default function AddBannerPage() {
  const router = useRouter();

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[980px] mx-auto py-6 px-4 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Thêm Banner</h1>

        <BannerForm
          initial={{ title: "", imageId: "", linkUrl: "", sortOrder: 0 }}
          onCancel={() => router.back()}
          onSubmit={async (values) => {
            await createBanner(values);
            router.push(Routes.interface.banners.root);
            toast.success("Banner đã được tạo thành công!");
          }}
          submitLabel="Tạo"
        />
      </main>
    </div>
  );
}
