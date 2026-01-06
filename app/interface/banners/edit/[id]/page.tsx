"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";
import BannerForm, { BannerFormValues } from "../../BannerForm";
import { getBannerById, updateBanner } from "@/services/bannerService";
import { toast } from "react-hot-toast";

export default function EditBannerPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [initial, setInitial] = useState<BannerFormValues | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const banner = await getBannerById(id);
        if (!alive) return;
        if (!banner) {
          setInitial(null);
          return;
        }
        setInitial({
          title: banner.title,
          imageId: banner.imageId || "",
          imageUrl: banner.imageUrl || "",
          linkUrl: banner.linkUrl?.toString() || "",
          sortOrder: banner.sortOrder || 0,
        });
      } catch (e) {
        console.error("Failed to load banner:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <p className="p-6 flex items-center justify-center">Đang tải...</p>;
  if (!initial) return <p className="p-6 text-red-600">Không tìm thấy banner.</p>;

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[980px] mx-auto py-6 px-4 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Chỉnh Sửa Banner</h1>

        <BannerForm
          initial={initial}
          onCancel={() => router.back()}
          onSubmit={async (values) => {
            await updateBanner(id, values);
            router.push(Routes.interface.banners.root);
            toast.success("Banner đã được cập nhật thành công!");
          }}
          submitLabel="Cập nhật"
        />
      </main>
    </div>
  );
}
