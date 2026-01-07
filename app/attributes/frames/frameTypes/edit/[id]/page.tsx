"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";
import FrameTypeForm, { FrameTypeFormValues } from "../../FrameTypeForm";
import { getFrameTypeById, updateFrameTypes } from "@/services/frameService/frameTypeService";
import { toast } from "react-hot-toast";

export default function EditFrameTypePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [initial, setInitial] = useState<FrameTypeFormValues | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getFrameTypeById(id);
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
        console.error("Failed to load frame type:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <p className="p-6 flex items-center justify-center">Đang tải...</p>;
  if (!initial) return <p className="p-6 text-red-600">Không tìm thấy Loại gọng.</p>;

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[600px] mx-auto py-6 px-4 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Chỉnh Sửa Loại Gọng
        </h1>

        <FrameTypeForm
          initial={initial}
          onCancel={() => router.back()}
          onSubmit={async (values) => {
            await updateFrameTypes(id, values);
            router.push(Routes.attributes.frames.frameTypes.root);
            toast.success("Loại gọng đã được cập nhật thành công!");
          }}
          submitLabel="Cập nhật"
        />
      </main>
    </div>
  );
}
