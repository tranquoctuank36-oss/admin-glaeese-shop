"use client";

import { useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";
import { toast } from "react-hot-toast";
import ImageForm, { ImageFormValues } from "../ImageForm";

export default function AddImagePage() {
  const router = useRouter();

  const initial: ImageFormValues = {
    ownerType: "product_variant",
    file: null,
  };

  const onSubmit = async (values: ImageFormValues) => {
    router.push(Routes.productsManagement.images.root);
    toast.success("Image uploaded successfully!");
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[980px] mx-auto py-6 px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Add Image</h1>
        </div>

        <ImageForm
          initial={initial}
          submitLabel="Upload"
          onSubmit={onSubmit}
          onCancel={() => router.back()}
        />
      </main>
    </div>
  );
}
