"use client";
import { useRouter } from "next/navigation";
import { createColor } from "@/services/colorService";
import { Routes } from "@/lib/routes";
import ColorForm from "../ColorForm";
import { toast } from "react-hot-toast";

export default function AddColorPage() {
  const router = useRouter();

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[600px] mx-auto py-6 px-4 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Thêm Màu Sắc</h1>
        <ColorForm
          initial={{
            name: "",
            slug: "",
            hexCode: "",
            isActive: true,
          }}
          onSubmit={async (values) => {
            await createColor(values);
            router.push(Routes.productsManagement.colors.root);
            toast.success("Màu sắc đã được tạo thành công!");
          }}
          onCancel={() => router.back()}
          submitLabel="Tạo"
        />
      </main>
    </div>
  );
}
