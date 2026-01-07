"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Link as LinkIcon, Calendar, Hash, Layers, FolderTree, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Routes } from "@/lib/routes";

import { getCategoryById } from "@/services/categoryService";

function fmt(iso?: string | null) {
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
    case "published":
      return "bg-green-100 text-green-700";
    case "draft":
      return "bg-gray-100 text-gray-700";
    case "unpublished":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}
function formatStatusLabel(status?: string | null) {
  if (!status) return "-";
  const statusMap: Record<string, string> = {
    published: "Đã xuất bản",
    draft: "Bản nháp",
    unpublished: "Chưa xuất bản"
  };
  return statusMap[String(status).toLowerCase()] || "-";
}

export default function CategoryDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<Category | null>(null);
  const [parentName, setParentName] = useState<string>("-");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let alive = true;

    (async () => {
      setLoading(true);
      try {
        const c = await getCategoryById(id);
        if (!alive) return;
        setData(c);

        // fetch parent name if parentId present
        if ((c as any)?.parentId) {
          try {
            const p = await getCategoryById((c as any).parentId as string);
            if (!alive) return;
            setParentName(p?.name ?? "Không có cha");
          } catch {
            setParentName("Không có cha");
          }
        } else {
          setParentName("Không có cha");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

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
                onClick={() => router.push(Routes.interface.categories.root)}
                title="Quay lại"
              >
                <ArrowLeft className="text-gray-700 size-6" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Chi tiết danh mục</h1>
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
                  onClick={() => router.push(Routes.interface.categories.edit.replace("[id]", id))}
                  className="flex h-12 items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-base"
                >
                  <Edit size={20} />
                  Sửa danh mục
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
              <p className="text-gray-600 text-lg">Đang tải chi tiết danh mục…</p>
            </motion.div>
          ) : !data ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center"
            >
              <p className="text-red-600 text-xl font-semibold">Không tìm thấy danh mục.</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="space-y-6"
            >
              {/* Header Card */}
              <motion.div 
                transition={{ duration: 0.2 }}
                className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex-1">
                    <h2 className="text-4xl font-bold mb-3">{data.name}</h2>
                    <p className="text-blue-100 text-lg font-medium">{(data as any).slug}</p>
                  </div>
                  <div>
                    <span className={`inline-block px-4 py-2 rounded-full text-base font-semibold shadow-lg ${statusBadgeClass((data as any).categoryStatus)} ring-2 ring-white`}>
                      {formatStatusLabel((data as any).categoryStatus)}
                    </span>
                  </div>
                </div>
                {(data as any).description && (
                  <div className="pt-6 border-t border-blue-400">
                    <p className="text-blue-100 leading-relaxed whitespace-pre-line">
                      Mô tả: {(data as any).description}
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Created At Card */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl p-6 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <Calendar className="size-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 font-medium mb-1">Ngày tạo</p>
                      <p className="text-xl font-bold text-gray-800">{fmt((data as any).createdAt)}</p>
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
                      <p className="text-xl font-bold text-gray-800">{Number((data as any).priority ?? 0)}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Level Card */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl p-6 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <Layers className="size-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 font-medium mb-1">Cấp độ</p>
                      <p className="text-xl font-bold text-gray-800">{(data as any).level ?? "-"}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Parent Card */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 }}
                  className="bg-white rounded-2xl p-6 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 rounded-xl">
                      <FolderTree className="size-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 font-medium mb-1">Danh mục cha</p>
                      <p className="text-xl font-bold text-gray-800">{parentName}</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* URL Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl p-6 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <LinkIcon className="size-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-medium mb-2">URL tương đối</p>
                    {((data as any).relativeUrl as string) ? (
                      <a 
                        href={(data as any).relativeUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-lg font-semibold text-blue-600 hover:text-blue-700 break-all hover:underline transition-colors"
                      >
                        {(data as any).relativeUrl}
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
