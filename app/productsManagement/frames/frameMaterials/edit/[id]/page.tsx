"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";
import FrameMaterialForm, { FrameMaterialFormValues } from "../../FrameMaterialForm";
import { getFrameMaterialById, updateFrameMaterials } from "@/services/frameService/frameMaterialService";
import { toast } from "react-hot-toast";

export default function EditFrameMaterialPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [initial, setInitial] = useState<FrameMaterialFormValues | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getFrameMaterialById(id);
        if (!alive) return;
        if (!data) {
          setInitial(null);
          return;
        }
        setInitial({
          name: data.name,
          slug: data.slug,
          isActive: !!data.isActive,
        });
      } catch (e) {
        console.error("Failed to load frame material:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <p className="p-6 flex items-center justify-center">Đang tải...</p>;
  if (!initial) return <p className="p-6 text-red-600">Không tìm thấy chất liệu gọng.</p>;

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[600px] mx-auto py-6 px-4 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Chỉnh Sửa Chất Liệu Gọng
        </h1>   

        <FrameMaterialForm
          initial={initial}
          onCancel={() => router.back()}
          onSubmit={async (values) => {
            await updateFrameMaterials(id, values);
            router.push(Routes.productsManagement.frames.frameMaterials.root);
            toast.success("Chất liệu gọng đã được cập nhật thành công!");
          }}
          submitLabel="Cập nhật"
        />
      </main>
    </div>
  );
}
