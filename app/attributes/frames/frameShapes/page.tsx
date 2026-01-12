"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  ArrowUpAZ,
  ArrowDownAZ,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";

import TablePagination from "@/components/shared/TablePagination";
import { useListQuery } from "@/components/listing/hooks/useListQuery";
import ToolbarSearchFilters from "@/components/listing/ToolbarSearchFilters";
import {
  getFrameShapes,
  softDeleteFrameShape,
} from "@/services/frameService/frameShapeService";
import ConfirmPopover from "@/components/shared/ConfirmPopover";
import toast from "react-hot-toast";
import { useFrameCounts } from "@/context/FrameCountsContext";

function formatDate(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function FrameShapesPage() {
  const router = useRouter();
  const { refreshCounts } = useFrameCounts();

  const { q, setQ, setAndResetPage, apiParams, apiKey } = useListQuery({
    limit: 20,
    isDeleted: "false",
    sortField: "createdAt",
    sortOrder: "DESC",
  });

  const toggleNameSort = () => {
    if (q.sortField !== "name") {
      setAndResetPage({ sortField: "name", sortOrder: "ASC" as const, page: 1 });
    } else if (q.sortOrder === "ASC") {
      setAndResetPage({ sortField: "name", sortOrder: "DESC" as const, page: 1 });
    } else {
      setAndResetPage({ sortField: "name", sortOrder: "ASC" as const, page: 1 });
    }
  };

  const toggleCreatedAtSort = () => {
    if (q.sortField !== "createdAt") {
      setAndResetPage({ sortField: "createdAt", sortOrder: "DESC" as const, page: 1 });
    } else if (q.sortOrder === "DESC") {
      setAndResetPage({ sortField: "createdAt", sortOrder: "ASC" as const, page: 1 });
    } else {
      setAndResetPage({ sortField: "createdAt", sortOrder: "DESC" as const, page: 1 });
    }
  };

  const [rows, setRows] = useState<FrameShape[]>([]);
  const [meta, setMeta] = useState<{ totalPages?: number; totalItems?: number; }>();
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const [loading, setLoading] = useState(true);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const keyOf = (id: string, action: "delete") => `${id}|${action}`;
  const isOpen = (id: string) => openKey === keyOf(id, "delete");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await getFrameShapes(apiParams);
        if (!alive) return;
        setRows(res.data);
        setMeta({
          totalPages: res.meta?.totalPages,
          totalItems: res.meta?.totalItems,
        });
        setHasNext(!!res.hasNext);
        setHasPrev(!!res.hasPrev);
      } catch (e) {
        console.error("Failed to fetch frame shapes:", e);
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
      await softDeleteFrameShape(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast.success("Đã xóa hình dạng gọng thành công");
      refreshCounts(true); // Force refresh counts
    } catch (e: any) {
      console.error("Soft delete failed:", e);
      const detail =
          e?.response?.data?.detail ||
          e?.detail || "Không thể xóa hình dạng gọng";
        toast.error(detail);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[1440px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4 mb-6">
            <div className="flex gap-2">
              {/* <Button
                className="flex h-12 items-center gap-2 bg-red-500 hover:bg-red-700 text-white text-base disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() =>
                  router.push(
                    Routes.attributes.frames.frameShapes.trash
                  )
                }
                disabled={trashCount === 0}
              >
                <Trash2 className="size-5" />
                Trash Bin
                {trashCount > 0 && (
                  <span className="top-2 right-2 bg-white text-red-600 text-xs font-bold px-2 py-0.5 rounded-full shadow">
                    {trashCount}
                  </span>
                )}
              </Button> */}
              <Button
                onClick={() =>
                  router.push(Routes.attributes.frames.frameShapes.add)
                }
                className="flex h-12 items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-base"
              >
                <Plus size={20} />
                Thêm hình dạng gọng
              </Button>
            </div>
          </div>

          <ToolbarSearchFilters
            value={q.search}
            onSearchChange={(v) => setAndResetPage({ search: v, page: 1 })}
            isActive={q.isActive}
            onFiltersChange={(patch) =>
              setAndResetPage({ ...(patch as any), page: 1 })
            }
            placeholder="Tìm kiếm theo tên hình dạng hoặc slug..."
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
                                    q.sortOrder === "ASC" ? "ASC" : "DESC"
                                  } (nhấp để thay đổi)`
                                : "Không sắp xếp (nhấp để sắp xếp theo Tên)"
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

                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Slug
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Hoạt động
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
                                  } (nhấp để thay đổi)`
                                : "Không sắp xếp (nhấp để sắp xếp theo Ngày Tạo)"
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
                    {rows.map((shape) => (
                      <tr
                        key={shape.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="text-gray-800 font-semibold">
                            {shape.name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600">{shape.slug}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                              shape.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {shape.isActive ? "Có" : "Không"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-gray-600">
                            {formatDate(shape.createdAt) || "-"}
                          </span>
                        </td>

                        <td className="px-6 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="icon-sm"
                              className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                              title="Chỉnh sửa"
                              onClick={() =>
                                router.push(
                                  Routes.attributes.frames.frameShapes.edit.replace(
                                    "[id]",
                                    shape.id
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
                              open={isOpen(shape.id)}
                              onOpenChange={(o) =>
                                setOpenKey(
                                  o ? keyOf(shape.id, "delete") : null
                                )
                              }
                              title="Xóa hình dạng gọng này?"
                              message={<b>{shape.name}</b>}
                              confirmText="Xóa"
                              onConfirm={async () => {
                                setDeletingId(shape.id);
                                try {
                                  await handleSoftDelete(shape.id);
                                } finally {
                                  setDeletingId(null);
                                }
                              }}
                              confirmDisabled={deletingId === shape.id}
                              confirmLoading={deletingId === shape.id}
                              confirmClassName="h-10 bg-red-500 hover:bg-red-700 text-white"
                              cancelClassName="h-10 bg-gray-300 hover:bg-gray-400 text-gray-800"
                              side="bottom"
                              sideOffset={8}
                              widthClass="w-[250px]"
                            >
                              <Button
                                size="icon-sm"
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                title="Xóa"
                                onClick={() =>
                                  setOpenKey(keyOf(shape.id, "delete"))
                                }
                                disabled={deletingId === shape.id}
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
                        <td colSpan={5} className="px-6 py-6">
                          <div className="text-center text-gray-600">
                            Danh sách hình dạng gọng trống.
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
    </div>
  );
}
