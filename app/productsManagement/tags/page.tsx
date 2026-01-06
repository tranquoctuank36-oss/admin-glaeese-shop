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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";
import Pagination from "@/components/data/Pagination";
import { useListQuery } from "@/components/data/useListQuery";
import ToolbarSearchFilters from "@/components/data/ToolbarSearchFilters";
import ConfirmPopover from "@/components/ConfirmPopover";
import { getTagCounts, getTags, softDeleteTag } from "@/services/tagService";
import toast from "react-hot-toast";

function fmt(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function TagsPage() {
  const router = useRouter();
  const { q, setQ, setAndResetPage, apiParams, apiKey } = useListQuery({
    limit: 20,
    isDeleted: "false",
    sortField: "createdAt",
    sortOrder: "DESC",
  });

  const toggleNameSort = () => {
    if (q.sortField !== "name")
      setAndResetPage({ sortField: "name", sortOrder: "ASC" as const, page: 1 });
    else if (q.sortOrder === "ASC")
      setAndResetPage({ sortField: "name", sortOrder: "DESC" as const, page: 1 });
    else
      setAndResetPage({ sortField: "createdAt", sortOrder: "DESC" as const, page: 1 });
  };

  const toggleCreatedAtSort = () => {
    if (q.sortField !== "createdAt") {
      setAndResetPage({ sortField: "createdAt", sortOrder: "DESC" as const, page: 1 });
    } else if (q.sortOrder === "DESC") {
      setAndResetPage({ sortField: "createdAt", sortOrder: "ASC" as const, page: 1 });
    } else {
      setAndResetPage({ sortField: "name", sortOrder: "ASC" as const, page: 1 });
    }
  };

  const [rows, setRows] = useState<Tag[]>([]);
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

  useEffect(() => {
    (async () => {
      try {
        const res = await getTagCounts();
        setTrashCount(res.tagsTrash ?? 0);
        console.log("Trash count:", res.tagsTrash ?? 0);
      } catch (err) {
        console.error("Failed to count trash tags:", err);
      }
    })();
  }, []);

  useEffect(() => {
    console.log("API Params:", apiParams);
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await getTags(apiParams);
        if (!alive) return;
        setRows(res.data);
        setMeta({
          totalPages: res.meta?.totalPages,
          totalItems: res.meta?.totalItems,
        });
        setHasNext(!!res.hasNext);
        setHasPrev(!!res.hasPrev);
      } catch (e) {
        console.error("Failed to fetch tags:", e);
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
      await softDeleteTag(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      setTrashCount((prev) => prev + 1);
    } catch (e: any) {
      console.error("Soft delete failed:", e);
      const detail =
          e?.response?.data?.detail ||
          e?.detail || "Failed to remove tag";
        toast.error(detail);
    } finally {
      setDeletingId(null);
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
              <h1 className="text-3xl font-bold text-gray-800">Danh Sách Nhãn {meta?.totalItems !== undefined && `(${meta.totalItems})`}</h1>
              <p className="text-gray-600 mt-1">Quản lý nhãn sản phẩm</p>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex h-12 items-center gap-2 bg-red-500 hover:bg-red-700 text-white text-base"
                onClick={() =>
                  router.push(Routes.productsManagement.tags.trash)
                }
              >
                <Trash2 className="size-5" />
                Thùng Rác
                {trashCount > 0 && (
                  <span className="top-2 right-2 bg-white text-red-600 text-xs font-bold px-2 py-0.5 rounded-full shadow">
                    {trashCount}
                  </span>
                )}
              </Button>

              <Button
                onClick={() => router.push(Routes.productsManagement.tags.add)}
                className="flex h-12 items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-base"
              >
                <Plus size={20} />
                Thêm Nhãn
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
            placeholder="Tìm kiếm theo tên nhãn hoặc slug..."
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
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 cursor-pointer"
                            title={
                              q.sortField === "name"
                                ? `Sắp xếp: ${
                                    q.sortOrder === "ASC" ? "ASC" : "DESC"
                                  } (nhấn để thay đổi)`
                                : "Không sắp xếp (nhấn để sắp xếp theo Tên)"
                            }
                          >
                            {q.sortField === "name" ? (
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
                        Slug
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Hoạt Động
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
                    {rows.map((t) => (
                      <tr
                        key={t.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-gray-600">{t.name}</td>
                        <td className="px-6 py-4 text-gray-600">{t.slug}</td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                              t.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {t.isActive ? "Có" : "Không"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-center">
                          {fmt(t.createdAt)}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="icon-sm"
                              className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                              title="Chỉnh Sửa"
                              onClick={() =>
                                router.push(
                                  Routes.productsManagement.tags.edit.replace(
                                    "[id]",
                                    t.id
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
                              open={openId === t.id}
                              onOpenChange={(o) => setOpenId(o ? t.id : null)}
                              title="Xóa nhãn này?"
                              message={<b>{t.name}</b>}
                              confirmText="Xóa"
                              onConfirm={async () => {
                                setDeletingId(t.id);
                                try {
                                  await handleSoftDelete(t.id);
                                } finally {
                                  setDeletingId(null);
                                }
                              }}
                              confirmDisabled={deletingId === t.id}
                              confirmLoading={deletingId === t.id}
                              confirmClassName="h-10 bg-red-600 hover:bg-red-700 text-white"
                              side="bottom"
                              sideOffset={8}
                              widthClass="w-[200px]"
                            >
                              <Button
                                size="icon-sm"
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                title="Xóa"
                                onClick={() => setOpenId(t.id)}
                                disabled={deletingId === t.id}
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
                        <td colSpan={7} className="px-6 py-8">
                          <div className="text-center text-gray-600">
                            Chưa có nhãn nào.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2 text-sm">
                <span>Hàng trên trang:</span>
                <select
                  className="border rounded-md px-2 py-1"
                  value={q.limit}
                  onChange={(e) =>
                    setAndResetPage({ limit: Number(e.target.value), page: 1 })
                  }
                >
                  {[10, 20, 30, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <Pagination
                page={q.page}
                totalPages={meta?.totalPages}
                hasPrev={hasPrev}
                hasNext={hasNext}
                onChange={(p) => {
                  const capped = meta?.totalPages
                    ? Math.min(p, meta.totalPages)
                    : p;
                  setQ((prev) => ({ ...prev, page: Math.max(1, capped) }));
                }}
              />
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
