"use client";

import { useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";
import FrameMaterialForm from "../FrameMaterialForm";
import { createFrameMaterials } from "@/services/frameService/frameMaterialService";
import { toast } from "react-hot-toast";

export default function AddFrameMaterialsPage() {
  const router = useRouter();

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[600px] mx-auto py-6 px-4 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Thêm chất liệu gọng</h1>

        <FrameMaterialForm
          initial={{ name: "", slug: "", isActive: true }}
          onCancel={() => router.back()}
          onSubmit={async (values) => {
            await createFrameMaterials(values);
            router.push(Routes.attributes.frames.frameMaterials.root);
            toast.success("Chất liệu gọng đã được tạo thành công!");
          }}
          submitLabel="Tạo"
        />
      </main>
    </div>
  );
}
