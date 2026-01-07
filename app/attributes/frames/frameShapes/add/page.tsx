"use client";

import { useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";
import FrameShapeForm from "../FrameShapeForm";
import { createFrameShapes } from "@/services/frameService/frameShapeService";
import { toast } from "react-hot-toast";

export default function AddFrameShapesPage() {
  const router = useRouter();
  
  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[600px] mx-auto py-6 px-4 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Thêm hình dạng gọng</h1>

        <FrameShapeForm 
          initial={{ name: "", slug: "", isActive: true }}
          onCancel={() => router.back()}
          onSubmit={async (values) => {
            await createFrameShapes(values);
            router.push(Routes.attributes.frames.frameShapes.root);
            toast.success("Hình dạng gọng kính đã được tạo thành công!");
          }}
          submitLabel="Tạo"
        />
      </main>
    </div>
  );
}
