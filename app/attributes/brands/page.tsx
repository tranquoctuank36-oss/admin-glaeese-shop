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
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";
import TablePagination from "@/components/shared/TablePagination";
import { useListQuery } from "@/components/listing/hooks/useListQuery";
import ToolbarSearchFilters from "@/components/listing/ToolbarSearchFilters";
import ConfirmPopover from "@/components/shared/ConfirmPopover";
import {
  getBrandCounts,
  getBrands,
  softDeleteBrand,
} from "@/services/brandService";
import toast from "react-hot-toast";
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



export default function BrandsPage() {
  const router = useRouter();

  const { q, setQ, setAndResetPage, apiParams, apiKey } = useListQuery(
    {
      limit: 20,
      sortField: "priority",
      sortOrder: "ASC",
      isDeleted: "false",
    },
    {
      allowedsortField: ["name", "createdAt", "priority"] as const,
    }
  );

  const toggleNameSort = () => {
    if (q.sortField !== "name") {
      setAndResetPage({ sortField: "name", sortOrder: "ASC" as const });
    } else if (q.sortOrder === "ASC") {
      setAndResetPage({ sortField: "name", sortOrder: "DESC" as const });
    } else {
      setAndResetPage({ sortField: "name", sortOrder: "ASC" as const });
    }
  };

  const toggleCreatedAtSort = () => {
    if (q.sortField !== "createdAt") {
      setAndResetPage({ sortField: "createdAt", sortOrder: "DESC" as const });
    } else if (q.sortOrder === "DESC") {
      setAndResetPage({ sortField: "createdAt", sortOrder: "ASC" as const });
    } else {
      setAndResetPage({ sortField: "createdAt", sortOrder: "DESC" as const });
    }
  };

  const togglePrioritySort = () => {
    if (q.sortField !== "priority") {
      setAndResetPage({ sortField: "priority", sortOrder: "DESC" as const });
    } else {
      setAndResetPage({
        sortField: "priority",
        sortOrder:
          q.sortOrder === "DESC" ? ("ASC" as const) : ("DESC" as const),
      });
    }
  };

  const [rows, setRows] = useState<Brand[]>([]);
  const [meta, setMeta] = useState<{
    totalPages?: number;
    totalItems?: number;
  }>();
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [trashCount, setTrashCount] = useState<number>(0);
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getBrandCounts();
        setTrashCount(res.brandsTrash ?? 0);
      } catch (err) {
        console.error("Failed to count trash brands:", err);
      }
    })();
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await getBrands(apiParams);
        if (!alive) return;
        setRows(res.data);
        setMeta({
          totalPages: res.meta?.totalPages,
          totalItems: res.meta?.totalItems,
        });
        setHasNext(!!res.hasNext);
        setHasPrev(!!res.hasPrev);
      } catch (e) {
        console.error("Failed to fetch brands:", e);
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

  const handleSoftDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await softDeleteBrand(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      setTrashCount((prev) => prev + 1);
      toast.success("Đã xóa thương hiệu thành công");
    } catch (err: any) {
      console.error("Soft delete failed:", err);
      const detail =
          err?.response?.data?.detail ||
          err?.detail 
        toast.error(detail);
    } finally {
      setDeletingId(null);
      setOpenId(null);
    }
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[1440px] mx-auto py-6 px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Thương hiệu {meta?.totalItems !== undefined && `(${meta.totalItems})`}
              </h1>
              <p className="text-gray-600 mt-1">
                Quản lý thương hiệu cho sản phẩm của bạn
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex h-12 items-center gap-2 bg-red-500 hover:bg-red-700 text-white text-base"
                onClick={() =>
                  router.push(Routes.attributes.brands.trash)
                }
              >
                <Trash2 className="size-5" />
                Thùng rác
                {trashCount > 0 && (
                  <span className="top-2 right-2 bg-white text-red-600 text-xs font-bold px-2 py-0.5 rounded-full shadow">
                    {trashCount}
                  </span>
                )}
              </Button>

              <Button
                onClick={() =>
                  router.push(Routes.attributes.brands.add)
                }
                className="flex h-12 items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-base"
              >
                <Plus size={20} />
                Thêm thương hiệu
              </Button>
            </div>
          </div>

          <ToolbarSearchFilters
            value={q.search}
            onSearchChange={(v) => setAndResetPage({ search: v, page: 1 })}
            isActive={(q as any).isActive ?? "all"}
            onFiltersChange={(patch) =>
              setAndResetPage({ ...(patch as any), page: 1 })
            }
            placeholder="Tìm kiếm theo tên hoặc slug thương hiệu..."
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
                      <th className="px-4 py-4 w-1/5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-600">
                            Tên
                          </span>
                          <button
                            type="button"
                            onClick={toggleNameSort}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                            title={
                              q.sortField === "name"
                                ? `Sắp xếp: ${
                                    q.sortOrder === "ASC" ? "A-Z" : "Z-A"
                                  } (click để thay đổi)`
                                : "Chưa sắp xếp (click để sắp xếp theo Tên)"
                            }
                          >
                            {q.sortField === "name" ? (
                              q.sortOrder === "ASC" ? (
                                <ArrowUpAZ className="size-5 relative top-[1px]" />
                              ) : (
                                <ArrowDownAZ className="size-5 relative top-[1px]" />
                              )
                            ) : (
                              <ArrowUpDown className="size-5 relative top-[1px]" />
                            )}
                          </button>
                        </div>
                      </th>

                      <th className="px-4 py-4 w-1/6 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Slug
                      </th>

                      <th className="px-4 py-4 w-1/6 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Hoạt động
                      </th>

                      <th className="px-4 py-4 w-1/6 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs font-bold text-gray-600">
                            Ngày tạo  
                          </span>
                          <button
                            type="button"
                            onClick={toggleCreatedAtSort}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 cursor-pointer"
                            title={
                              q.sortField === "createdAt"
                                ? `Sắp xếp: ${
                                    q.sortOrder === "ASC" ? "A-Z" : "Z-A"
                                  } (click để thay đổi)`
                                : "Chưa sắp xếp (click để sắp xếp theo Ngày tạo)"
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

                      <th className="px-4 py-4 w-1/6 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs font-bold text-gray-600">
                            Mức ưu tiên
                          </span>
                          <button
                            type="button"
                            onClick={togglePrioritySort}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 cursor-pointer"
                            title={
                              q.sortField === "priority"
                                ? `Sắp xếp: ${
                                    q.sortOrder === "ASC" ? "Thấp" : "Cao"
                                  } (click để thay đổi)`
                                : "Chưa sắp xếp (click để sắp xếp theo Mức ưu tiên)"
                            }
                          >
                            {q.sortField === "priority" ? (
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

                      <th className="px-4 py-4 w-1/6 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {rows.map((b) => (
                      <tr
                        key={b.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <span className="text-gray-800 font-semibold">
                            {b.name}
                          </span>
                          {b.description && (
                            <p className="text-xs text-gray-600 mt-1 italic line-clamp-1">
                                <span className="text-gray-700 not-italic">
                                  Mô tả:
                                </span>{" "}
                                {b.description}
                              </p>
                          )}
                        </td>

                        <td className="px-4 py-4 text-gray-600">{b.slug}</td>

                        <td className="px-4 py-4 text-center">
                          <span
                            className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                              b.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {b.isActive ? "Có" : "Không"}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-gray-600 text-center">
                          {fmt(b.createdAt)}
                        </td>

                        <td className="px-4 py-4 text-center text-gray-700">
                          {typeof b.priority === "number" ? b.priority : 100}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon-sm"
                              className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Xem chi tiết"
                              onClick={() =>
                                router.push(
                                  Routes.attributes.brands.details.replace(
                                    "[id]",
                                    b.id
                                  )
                                )
                              }
                            >
                              <Eye className="text-blue-600 size-5" />
                            </Button>
                            <span className="text-gray-500 text-sm leading-none">
                              |
                            </span>

                            <Button
                              size="icon-sm"
                              className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                              title="Sửa"
                              onClick={() =>
                                router.push(
                                  Routes.attributes.brands.edit.replace(
                                    "[id]",
                                    b.id
                                  )
                                )
                              }
                            >
                              <Edit className="text-green-600 size-5" />
                            </Button>
                            <span className="text-gray-500 text-sm leading-none">
                              |
                            </span>

                            <ConfirmPopover
                              open={openId === b.id}
                              onOpenChange={(o) => setOpenId(o ? b.id : null)}
                              title="Xóa thương hiệu này?"
                              message={<b>{b.name}</b>}
                              confirmText="Xóa"
                              onConfirm={async () => {
                                setDeletingId(b.id);
                                try {
                                  await handleSoftDelete(b.id);
                                } finally {
                                  setDeletingId(null);
                                }
                              }}
                              confirmDisabled={deletingId === b.id}
                              confirmLoading={deletingId === b.id}
                              confirmClassName="h-10 bg-red-600 hover:bg-red-700 text-white"
                              side="bottom"
                              sideOffset={8}
                              widthClass="w-[200px]"
                            >
                              <Button
                                size="icon-sm"
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                title="Xóa"
                                onClick={() => setOpenId(b.id)}
                                disabled={deletingId === b.id}
                              >
                                <Trash2 className="text-red-600 size-5" />
                              </Button>
                            </ConfirmPopover>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-6 py-8">
                          <div className="text-center text-gray-600">
                            Danh sách thương hiệu trống.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <TablePagination
              page={q.page}
              limit={q.limit}
              totalPages={meta?.totalPages}
              totalItems={meta?.totalItems}
              hasPrev={hasPrev}
              hasNext={hasNext}
              onPageChange={(p) => setQ((prev) => ({ ...prev, page: p }))}
              onLimitChange={(l) => setAndResetPage({ limit: l, page: 1 })}
            />
          </motion.div>
        )}
      </main>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
          onClick={() => setLightboxImage(null)}
        >
          <Button
            className="absolute top-4 right-4 p-2 rounded-full bg-white hover:bg-gray-200 transition-colors"
            onClick={() => setLightboxImage(null)}
            title="Đóng"
          >
            <X className="w-6 h-6 text-gray-800" />
          </Button>
          <div className="max-w-7xl max-h-[90vh] p-4">
            <img
              src={lightboxImage.url}
              alt={lightboxImage.alt}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
