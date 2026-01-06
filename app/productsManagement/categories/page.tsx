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
  ListTree,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";
import Pagination from "@/components/data/Pagination";
import { useListQuery } from "@/components/data/useListQuery";
import ToolbarSearchFilters from "@/components/data/ToolbarSearchFilters";
import ConfirmPopover from "@/components/ConfirmPopover";
import { deleteCategory, getCategoriesFlat } from "@/services/categoryService";
import { toast } from "react-hot-toast";

function fmt(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()}`;
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

export default function CategoriesPage() {
  const router = useRouter();

  type DepthFilter = `${number}`;
  const [level, setLevel] = useState<DepthFilter | undefined>(undefined);
  const [maxLevel, setMaxLevel] = useState<number>(0);

  const { q, setQ, setAndResetPage, apiParams, apiKey } = useListQuery(
    {
      limit: 20,
      sortField: "priority",
      sortOrder: "ASC",
    },
    {
      allowedsortField: ["name", "priority", "level", "createdAt"] as const,
    }
  );

  const toggleNameSort = () => {
    if (q.sortField !== "name")
      setAndResetPage({ sortField: "name", sortOrder: "ASC" as const });
    else if (q.sortOrder === "ASC")
      setAndResetPage({ sortField: "name", sortOrder: "DESC" as const });
    else setAndResetPage({ sortField: "priority", sortOrder: "ASC" as const });
  };
  const toggleCreatedAtSort = () => {
    if (q.sortField !== "createdAt") {
      setAndResetPage({ sortField: "createdAt", sortOrder: "DESC" as const });
    } else if (q.sortOrder === "DESC") {
      setAndResetPage({ sortField: "createdAt", sortOrder: "ASC" as const });
    } else {
      setAndResetPage({ sortField: "priority", sortOrder: "ASC" as const });
    }
  };
  const toggleLevelSort = () => {
    if (q.sortField !== "level") {
      setAndResetPage({ sortField: "level", sortOrder: "DESC" as const });
    } else if (q.sortOrder === "DESC") {
      setAndResetPage({ sortField: "level", sortOrder: "ASC" as const });
    } else {
      setAndResetPage({ sortField: "priority", sortOrder: "ASC" as const });
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

  const [rows, setRows] = useState<Category[]>([]);
  const [meta, setMeta] = useState<{
    totalPages?: number;
    totalItems?: number;
  }>();
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await getCategoriesFlat(apiParams);
        if (!alive) return;

        const raw = res.data ?? [];
        const uniqueMap = new Map<string, any>();
        for (const item of raw) {
          const id = item?.id ?? null;
          if (!id) continue;
          if (!uniqueMap.has(id)) uniqueMap.set(id, item);
        }
        const uniqueRows = Array.from(uniqueMap.values());

        const levels = uniqueRows
          .map((r) => Number(r.level ?? 0))
          .filter((n) => Number.isFinite(n));
        const computedMax =
          levels.length > 0
            ? Math.max(...levels.map((n) => Math.max(0, n)))
            : 1;

        setRows(uniqueRows);
        setMeta({
          totalPages: res.meta?.totalPages,
          totalItems: res.meta?.totalItems,
        });
        setHasNext(!!res.hasNext);
        setHasPrev(!!res.hasPrev);
        setMaxLevel((prev) => Math.max(prev ?? 0, computedMax));

        const curLevelNum = level != null ? Number(level) : undefined;
        if (
          curLevelNum == null ||
          !Number.isFinite(curLevelNum) ||
          curLevelNum > computedMax
        ) {
          setLevel(`${computedMax}` as `${number}`);
        }

        const curQDepth = (q as any).depth;
        if (curQDepth == null || Number(curQDepth) > computedMax) {
          setAndResetPage({ depth: computedMax, page: 1 } as any);
        }
      } catch (e) {
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
      setDeletingId(id);
      await deleteCategory(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      console.error("Delete category failed:", err);
      const detail =
        err?.response?.data?.detail ||
        err?.detail ||
        "Failed to delete category";
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
              <h1 className="text-3xl font-bold text-gray-800">Danh sách danh mục</h1>
              <p className="text-gray-600 mt-1">
                Quản lý danh mục (danh sách phẳng)
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex h-12 items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-base"
                onClick={() =>
                  router.push(Routes.productsManagement.categories.review)
                }
              >
                <ListTree className="size-5" />
                Xem dạng cây
              </Button>

              <Button
                onClick={() =>
                  router.push(Routes.productsManagement.categories.add)
                }
                className="flex h-12 items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-base"
              >
                <Plus size={20} />
                Thêm danh mục
              </Button>
            </div>
          </div>

          <ToolbarSearchFilters
            value={q.search}
            onSearchChange={(v) => setAndResetPage({ search: v, page: 1 })}
            categoryStatus={(q as any).categoryStatus ?? "all"}
            depth={level as any}
            maxDepth={maxLevel as any}
            onFiltersChange={(patch) => {
              if (typeof patch.categoryStatus !== "undefined") {
                setAndResetPage({
                  categoryStatus: patch.categoryStatus,
                  page: 1,
                } as any);
              }
              if (typeof patch.depth !== "undefined") {
                const dnum = Number(patch.depth);
                setAndResetPage({
                  depth: Number.isFinite(dnum) ? dnum : undefined,
                  page: 1,
                } as any);
                setLevel(patch.depth);
              }
            }}
            placeholder="Tìm kiếm theo tên hoặc slug..."
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
                <table className="table-auto">
                  <thead className="bg-gray-100 border-b border-gray-300">
                    <tr>
                      <th className="px-4 py-3 w-60 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-600">
                            Tên
                          </span>
                          <button
                            type="button"
                            onClick={toggleNameSort}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
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
                      <th className="px-4 py-3 w-50 text-left text-xs font-bold text-gray-600 uppercase">
                        Slug
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center gap-2">
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
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center gap-2">
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
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-600">
                            Cấp độ
                          </span>
                          <button
                            type="button"
                            onClick={toggleLevelSort}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 cursor-pointer"
                            title={
                              q.sortField === "level"
                                ? `Sắp xếp: ${
                                    q.sortOrder === "ASC" ? "Thấp" : "Cao"
                                  } (click để thay đổi)`
                                : "Chưa sắp xếp (click để sắp xếp theo Cấp độ)"
                            }
                          >
                            {q.sortField === "level" ? (
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
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase whitespace-nowrap">
                        Thao tác
                      </th> 
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {rows.map((c) => (
                      <tr
                        key={c.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div
                            className="flex flex-col"
                            style={{ paddingLeft: (c.level ?? 0) * 24 }}
                          >
                            <span className="font-semibold">{c.name}</span>
                            {c.description && (
                              <p className="text-xs text-gray-600 mt-1 italic line-clamp-1">
                                <span className="text-gray-700 not-italic">
                                  Mô tả:
                                </span>{" "}
                                {c.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{c.slug}</td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${statusBadgeClass(
                              c.categoryStatus
                            )}`}
                          >
                            {formatStatusLabel(c.categoryStatus)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-center">
                          {fmt(c.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">
                          {c.priority ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">{c.level}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon-sm"
                              className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Xem chi tiết"
                              onClick={() =>
                                router.push(
                                  Routes.productsManagement.categories.viewDetails.replace(
                                    "[id]",
                                    c.id
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
                                  Routes.productsManagement.categories.edit.replace(
                                    "[id]",
                                    c.id
                                  )
                                )
                              }
                            >
                              <Edit className="text-green-600 size-5" />
                            </Button>
                            <span className="text-gray-500 text-sm">|</span>
                            <ConfirmPopover
                              open={openId === c.id}
                              onOpenChange={(o) => setOpenId(o ? c.id : null)}
                              title="Xóa danh mục này?"
                              message={
                                <div>
                                  Bạn có chắc chắn muốn xóa{" "}
                                  <strong>{c.name || "danh mục này"}</strong>?
                                </div>
                              }
                              confirmText="Xóa"
                              onConfirm={async () => {
                                setDeletingId(c.id);
                                try {
                                  await handleDelete(c.id);
                                } finally {
                                  setDeletingId(null);
                                }
                              }}
                              confirmDisabled={deletingId === c.id}
                              confirmLoading={deletingId === c.id}
                              confirmClassName="h-10 bg-red-600 hover:bg-red-700 text-white"
                              side="bottom"
                              sideOffset={8}
                              widthClass="w-[350px]"
                            >
                              <Button
                                size="icon-sm"
                                className="p-2 hover:bg-red-100 rounded-lg"
                                title="Xóa"
                                onClick={() => setOpenId(c.id)}
                                disabled={deletingId === c.id}
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
                            Danh sách danh mục trống.
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
                <span>Số hàng mỗi trang:</span>
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
