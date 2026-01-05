// app/productsManagement/categories/[id]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";
import CategoryForm, { CategoryFormValues } from "../../CategoryForm";
import { getCategoryById, updateCategory } from "@/services/categoryService";
import { toast } from "react-hot-toast";

export default function EditCategoryPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [initial, setInitial] = useState<CategoryFormValues | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d: any = await getCategoryById(id);
        console.log("raw API response:", d);
        if (!alive) return;

        const priority =
          Number.isFinite(d?.priority) ? Math.max(0, Math.min(100, Math.trunc(d.priority))) : 100;

        const init: CategoryFormValues = {
          name: d?.name ?? "",
          slug: d?.slug ?? "",
          status: (d?.categoryStatus as "draft" | "published" | "unpublished") ?? "draft",
          description: d?.description ?? "",
          priority,
          parentId: d.parentId ?? null,          
          relativeUrl: d.relativeUrl ?? "",         
        };

        setInitial(init);
        console.log("Loaded category for edit:", init.parentId);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return <p className="p-6 flex items-center justify-center">Đang tải...</p>;
  }
  if (!initial) {
    return <p className="p-6 text-red-600">Không tìm thấy danh mục.</p>;
  }

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[980px] mx-auto py-6 px-4 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Sửa danh mục</h1>

        <CategoryForm
          initial={initial}
          submitLabel="Cập nhật"
          onCancel={() => router.back()}
          onSubmit={async (values) => {
            await updateCategory(id, values);
            router.push(Routes.productsManagement.categories.root);
            toast.success("Danh mục đã được cập nhật thành công!");
          }}
        />
      </main>
    </div>
  );
}
