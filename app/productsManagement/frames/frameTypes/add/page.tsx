"use client";

import { useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";
import FrameTypeForm from "../FrameTypeForm";
import { createFrameTypes } from "@/services/frameService/frameTypeService";
import { toast } from "react-hot-toast";

export default function AddFrameTypesPage() {
  const router = useRouter();

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[980px] mx-auto py-6 px-4 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Add Frame Type</h1>

        <FrameTypeForm
          initial={{ name: "", slug: "", isActive: true }}
          onCancel={() => router.back()}
          onSubmit={async (values) => {
            await createFrameTypes(values);
            router.push(Routes.productsManagement.frames.frameTypes.root);
            toast.success("Frame Type created successfully!");
          }}
          submitLabel="Create"
        />
      </main>
    </div>
  );
}
