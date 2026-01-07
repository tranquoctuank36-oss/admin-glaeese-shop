"use client";

import { useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";
import CategoryForm, { CategoryFormValues } from "../CategoryForm";
import { createCategory } from "@/services/categoryService";
import { toast } from "react-hot-toast";

export default function AddCategoryPage() {
  const router = useRouter();

  const initial: CategoryFormValues = {
    name: "",
    slug: "",
    status: "published",
    description: "",
    relativeUrl: "",
    priority: 100,
    parentId: undefined,
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[980px] mx-auto py-6 px-4 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Thêm danh mục</h1>
        <CategoryForm
          initial={initial}
          onCancel={() => router.back()}
          onSubmit={async (v) => {
            await createCategory(v);
            router.push(Routes.interface.categories.root);
            toast.success("Danh mục đã được tạo thành công!");
          }}
          submitLabel="Tạo"
        />
      </main>
    </div>
  );
}
