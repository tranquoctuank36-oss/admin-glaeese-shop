"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";
import { getBrandById, updateBrand } from "@/services/brandService";
import BrandForm, { BrandFormValues } from "../../BrandForm";
import { toast } from "react-hot-toast";

export default function EditBrandPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [initial, setInitial] = useState<BrandFormValues | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const b = await getBrandById(id);
        if (!alive) return;
        if (!b) {
          setInitial(null);
          return;
        } else {
          setInitial({
            name: b.name ?? "",
            slug: b.slug ?? "",
            websiteUrl: b.websiteUrl ?? "",
            description: b.description ?? "",
            isActive: b.isActive ?? true,
            bannerImageId: b.bannerImageId ?? undefined,
            bannerImage: b.bannerImage ? {
              id: b.bannerImage.id,
              publicUrl: b.bannerImage.publicUrl,
              altText: b.bannerImage.altText ?? undefined,
            } : undefined,
            priority: typeof b.priority === "number" ? b.priority : 10,
          });
        }
      } catch (e: any) {
        console.error("Fetch brand failed:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const onSubmit = async (values: BrandFormValues) => {
    await updateBrand(id, values as any);
    router.push(Routes.attributes.brands.root);
    toast.success("Đã cập nhật thương hiệu thành công!");
  };

  if (loading)
    return <p className="p-6 flex items-center justify-center">Đang tải...</p>;
  if (!initial) return <p className="p-6 text-red-600">Không tìm thấy thương hiệu.</p>;

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[980px] mx-auto py-6 px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Sửa thương hiệu</h1>
        </div>

        <BrandForm
          initial={initial}
          submitLabel="Cập nhật"
          onSubmit={onSubmit}
          onCancel={() => router.back()}
        />
      </main>
    </div>
  );
}
