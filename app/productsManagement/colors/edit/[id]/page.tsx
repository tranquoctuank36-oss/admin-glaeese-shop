"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getColorById, updateColor } from "@/services/colorService";
import { Routes } from "@/lib/routes";
import ColorForm, { ColorFormValues } from "../../ColorForm";
import { toast } from "react-hot-toast";

export default function EditColorPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [initial, setInitial] = useState<ColorFormValues | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const c = await getColorById(id as string);
        if (!alive) return;
        if (!c) {
          setInitial(null);
          return;
        }
        setInitial({
          name: c.name ?? "",
          slug: c.slug ?? "",
          hexCode: c.hexCode ?? "",
          isActive: !!c.isActive,
        });
      } catch (e) {
        console.error("Failed to load color:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading)
    return <p className="p-6 flex items-center justify-center">Đang tải...</p>;
  if (!initial) return <p className="p-6 text-red-600">Không có màu sắc.</p>;

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[600px] mx-auto py-6 px-4 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Chỉnh Sửa Màu Sắc</h1>

        <ColorForm
          initial={initial}
          onSubmit={async (values) => {
            await updateColor(id, values);
            router.push(Routes.productsManagement.colors.root);
            toast.success("Màu sắc đã được cập nhật thành công!");
          }}
          onCancel={() => router.back()}
          submitLabel="Cập nhật"
        />
      </main>
    </div>
  );
}
