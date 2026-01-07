// app/attributes/brands/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Globe, Calendar, Hash, Edit, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Routes } from "@/lib/routes";
import { getBrandById } from "@/services/brandService";
import { Brand } from "@/types/brand";

function fmt(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function statusBadgeClass(status?: string | null) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-700";
    case "hidden":
      return "bg-yellow-100 text-yellow-800";
    case "archived":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function formatStatusLabel(status?: string | null) {
  if (!status) return "-";
  return String(status)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function BrandDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const brandId = params?.id;

  const [data, setData] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!brandId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await getBrandById(brandId);
        setData(res);
      } finally {
        setLoading(false);
      }
    })();
  }, [brandId]);

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[1440px] mx-auto py-8 px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                size="icon-lg"
                className="hover:bg-gray-300 rounded-full bg-gray-200 shadow-md hover:shadow-lg transition-all"
                onClick={() => router.push(Routes.attributes.brands.root)}
                title="Quay lại"
              >
                <ArrowLeft className="text-gray-700 size-6" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Chi tiết thương hiệu</h1>
                <p className="text-sm text-gray-500 mt-1">Xem thông tin đầy đủ</p>
              </div>
            </div>
            
            {!loading && data && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  onClick={() => router.push(Routes.attributes.brands.edit.replace("[id]", brandId))}
                  className="flex h-12 items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-base shadow-lg hover:shadow-xl transition-all"
                >
                  <Edit size={20} />
                  Sửa thương hiệu
                </Button>
              </motion.div>
            )}
          </div>

          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 text-lg">Đang tải chi tiết thương hiệu…</p>
            </motion.div>
          ) : !data ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center"
            >
              <p className="text-red-600 text-xl font-semibold">Không tìm thấy thương hiệu.</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="space-y-6"
            >
              {/* Banner Image */}
              {data.bannerImage?.publicUrl ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200"
                >
                  <div className="relative h-64 md:h-60">
                    <img
                      src={data.bannerImage.publicUrl}
                      alt={data.bannerImage.altText ?? data.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div className="absolute bottom-6 left-6">
                      <div className="flex items-center gap-2 text-white">
                        <ImageIcon className="size-5" />
                        <span className="text-sm font-medium">Hình ảnh banner thương hiệu</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null}

              {/* Header Card */}
              <motion.div
                transition={{ duration: 0.2 }}
                className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl shadow-xl p-8 text-white"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-4xl font-bold mb-3">{data.name}</h2>
                    <p className="text-purple-100 text-lg font-medium">{data.slug}</p>
                  </div>
                </div>
                {data.description && (
                  <div className="border-t border-purple-400 pt-4">
                    <p className="text-purple-100 text-base leading-relaxed whitespace-pre-line">
                      Mô tả: {data.description}
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Created At Card */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl p-6 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Calendar className="size-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 font-medium mb-1">Ngày tạo</p>
                      <p className="text-xl font-bold text-gray-800">{fmt(data.createdAt)}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Priority Card */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-white rounded-2xl p-6 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-100 rounded-xl">
                      <Hash className="size-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 font-medium mb-1">Mức ưu tiên</p>
                      <p className="text-xl font-bold text-gray-800">{Number(data.priority ?? 0)}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Active Status Card */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl p-6 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${data.isActive ? "bg-green-100" : "bg-red-100"}`}>
                      <span className={`text-xl font-bold ${data.isActive ? "text-green-600" : "text-red-600"}`}>
                        ●
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 font-medium mb-1">Hoạt động</p>
                      <p className={`text-xl font-bold ${data.isActive ? "text-green-600" : "text-red-600"}`}>
                        {data.isActive ? "Có" : "Không"}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Website Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-6 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Globe className="size-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-medium mb-2">Trang web</p>
                    {data.websiteUrl ? (
                      <a
                        href={data.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-lg font-semibold text-green-600 hover:text-green-700 break-all hover:underline transition-colors"
                      >
                        {data.websiteUrl}
                      </a>
                    ) : (
                      <p className="text-lg font-semibold text-gray-400">-</p>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
