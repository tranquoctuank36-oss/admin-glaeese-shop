"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  ArrowUpAZ,
  ArrowDownAZ,
  ArrowUpDown,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";
import Pagination from "@/components/data/Pagination";
import { useListQuery } from "@/components/data/useListQuery";
import SearchBar from "@/components/data/SearchBar";
import ConfirmPopover from "@/components/ConfirmPopover";
import { getBanners, deleteBanner } from "@/services/bannerService";
import toast from "react-hot-toast";
import Image from "next/image";
import { Banner } from "@/types/banner";

function fmt(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function BannersPage() {
  const router = useRouter();
  const { q, setQ, setAndResetPage, apiParams, apiKey } = useListQuery({
    limit: 20,
    sortField: "sortOrder" as "title" | "createdAt" | "sortOrder",
    sortOrder: "DESC",
  });

  const toggleTitleSort = () => {
    if (q.sortField !== "title")
      setAndResetPage({ sortField: "title", sortOrder: "ASC" as const, page: 1 });
    else if (q.sortOrder === "ASC")
      setAndResetPage({ sortField: "title", sortOrder: "DESC" as const, page: 1 });
    else
      setAndResetPage({ sortField: "sortOrder", sortOrder: "ASC" as const, page: 1 });
  };

  const toggleSortOrderSort = () => {
    if (q.sortField !== "sortOrder") {
      setAndResetPage({ sortField: "sortOrder", sortOrder: "ASC" as const, page: 1 });
    } else if (q.sortOrder === "ASC") {
      setAndResetPage({ sortField: "sortOrder", sortOrder: "DESC" as const, page: 1 });
    } else {
      setAndResetPage({ sortField: "sortOrder", sortOrder: "ASC" as const, page: 1 });
    }
  };

  const toggleCreatedAtSort = () => {
    if (q.sortField !== "createdAt") {
      setAndResetPage({ sortField: "createdAt", sortOrder: "DESC" as const, page: 1 });
    } else if (q.sortOrder === "DESC") {
      setAndResetPage({ sortField: "createdAt", sortOrder: "ASC" as const, page: 1 });
    } else {
      setAndResetPage({ sortField: "sortOrder", sortOrder: "ASC" as const, page: 1 });
    }
  };

  const [rows, setRows] = useState<Banner[]>([]);
  const [meta, setMeta] = useState<{
    totalPages?: number;
    totalItems?: number;
  }>();
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    console.log("API Params:", apiParams);
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await getBanners(apiParams as any);
        if (!alive) return;
        setRows(res.data);
        setMeta({
          totalPages: res.meta?.totalPages,
          totalItems: res.meta?.totalItems,
        });
      } catch (e) {
        console.error("Failed to fetch banners:", e);
        if (alive) {
          setRows([]);
          setMeta(undefined);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [apiKey]);

  const handleDelete = async (id: string) => {
    try {
      await deleteBanner(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast.success("Đã xóa banner thành công");
    } catch (e: any) {
      console.error("Delete failed:", e);
      const detail =
        e?.response?.data?.detail ||
        e?.detail || "Failed to remove banner";
      toast.error(detail);
    } finally {
      setOpenId(null);
    }
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[1440px] mx-auto py-6 px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Danh Sách Banner {meta?.totalItems !== undefined && `(${meta.totalItems})`}
              </h1>
              <p className="text-gray-600 mt-1">Quản lý banner trang chủ</p>
            </div>

            <Button
              onClick={() => router.push(Routes.interface.banners.add)}
              className="flex h-12 items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-base"
            >
              <Plus size={20} />
              Thêm Banner
            </Button>
          </div>

          <SearchBar
            value={q.search}
            onChange={(v) => setAndResetPage({ search: v, page: 1 })}
            placeholder="Tìm kiếm theo tiêu đề banner..."
          />
        </motion.div>

        {loading ? (
          <p className="text-center text-gray-600">Đang tải...</p>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-visible"
          >
            <div className="rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-300">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Hình ảnh
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-600">
                            Tiêu đề
                          </span>
                          <button
                            type="button"
                            onClick={toggleTitleSort}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 cursor-pointer"
                            title={
                              q.sortField === "title"
                                ? `Sắp xếp: ${
                                    q.sortOrder === "ASC" ? "ASC" : "DESC"
                                  } (nhấn để thay đổi)`
                                : "Không sắp xếp (nhấn để sắp xếp theo Tiêu đề)"
                            }
                          >
                            {q.sortField === "title" ? (
                              q.sortOrder === "ASC" ? (
                                <ArrowUpAZ className="size-5" />
                              ) : (
                                <ArrowDownAZ className="size-5" />
                              )
                            ) : (
                              <ArrowUpDown className="size-5" />
                            )}
                          </button>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs font-bold text-gray-600">
                            Thứ tự sắp xếp
                          </span>
                          <button
                            type="button"
                            onClick={toggleSortOrderSort}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 cursor-pointer"
                            title={
                              q.sortField === "sortOrder"
                                ? `Sắp xếp: ${
                                    q.sortOrder === "ASC" ? "ASC" : "DESC"
                                  } (nhấn để thay đổi)`
                                : "Không sắp xếp (nhấn để sắp xếp theo Thứ tự)"
                            }
                          >
                            {q.sortField === "sortOrder" ? (
                              q.sortOrder === "ASC" ? (
                                <ArrowUpAZ className="size-5" />
                              ) : (
                                <ArrowDownAZ className="size-5" />
                              )
                            ) : (
                              <ArrowUpDown className="size-5" />
                            )}
                          </button>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Link URL
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs font-bold text-gray-600">
                            Ngày Tạo
                          </span>
                          <button
                            type="button"
                            onClick={toggleCreatedAtSort}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 cursor-pointer"
                            title={
                              q.sortField === "createdAt"
                                ? `Sắp xếp: ${
                                    q.sortOrder === "ASC" ? "ASC" : "DESC"
                                  } (nhấn để thay đổi)`
                                : "Không sắp xếp (nhấn để sắp xếp theo Ngày Tạo)"
                            }
                          >
                            {q.sortField === "createdAt" ? (
                              q.sortOrder === "ASC" ? (
                                <ArrowUpAZ className="size-5" />
                              ) : (
                                <ArrowDownAZ className="size-5" />
                              )
                            ) : (
                              <ArrowUpDown className="size-5" />
                            )}
                          </button>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {rows.map((banner) => (
                      <tr
                        key={banner.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-gray-200">
                            {banner.imageUrl ? (
                              <Image
                                src={banner.imageUrl}
                                alt={banner.title}
                                fill
                                className="object-cover"
                                sizes="128px"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">No image</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-medium">
                          {banner.title}
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-center">
                          {banner.sortOrder ?? '-'}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {banner.linkUrl ? (
                            <a 
                              href={banner.linkUrl.toString()} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <Eye className="size-4" />
                              Xem
                            </a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-center">
                          {fmt(banner.createdAt)}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="icon-sm"
                              className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                              title="Chỉnh Sửa"
                              onClick={() =>
                                router.push(
                                  Routes.interface.banners.edit.replace(
                                    "[id]",
                                    banner.id
                                  )
                                )
                              }
                            >
                              <Edit className="size-5 text-green-600" />
                            </Button>
                            <span className="text-gray-500 text-sm leading-none">
                              |
                            </span>
                            <ConfirmPopover
                              open={openId === banner.id}
                              onOpenChange={(op) => setOpenId(op ? banner.id : null)}
                              message={`Bạn có chắc chắn muốn xoá vĩnh banner "${banner.title}"?`}
                              onConfirm={() => handleDelete(banner.id)}
                            >
                              <Button
                                size="icon-sm"
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                title="Xoá"
                              >
                                <Trash2 className="size-5 text-red-600" />
                              </Button>
                            </ConfirmPopover>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {rows.length === 0 && !loading && (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg">Không tìm thấy banner nào</p>
                  </div>
                )}
              </div>
            </div>

            {!loading && rows.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                {/* Rows per page (left) */}
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <span>Số hàng mỗi trang:</span>
                  <select
                    className="h-9 rounded-md border border-gray-300 px-2 bg-white"
                    value={q.limit}
                    onChange={(e) => {
                      setAndResetPage({ limit: Number(e.target.value), page: 1 });
                    }}
                  >
                    {[10, 20, 30, 50].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Controls (right) */}
                <div className="flex items-center gap-4">
                  <Pagination
                    page={q.page}
                    totalPages={meta?.totalPages}
                    hasPrev={q.page > 1}
                    hasNext={q.page < (meta?.totalPages || 1)}
                    onChange={(p: number) => setQ({ ...q, page: p })}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
