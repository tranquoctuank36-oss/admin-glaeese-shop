"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpAZ,
  ArrowDownAZ,
  ArrowUpDown,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import TablePagination from "@/components/shared/TablePagination";
import { useListQuery } from "@/components/listing/hooks/useListQuery";
import ToolbarSearchFilters from "@/components/listing/ToolbarSearchFilters";
import ConfirmPopover from "@/components/shared/ConfirmPopover";
import { forceDeleteTag, getTags, restoreTag } from "@/services/tagService";
import toast from "react-hot-toast";
import { Tag } from "@/types/tag";

function formatDate(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function TagsTrashPage() {
  const router = useRouter();
  const { q, setQ, setAndResetPage, apiParams, apiKey } = useListQuery({
    limit: 20,
    isDeleted: "true",
    sortField: "name",
    sortOrder: "ASC",
  });

  const toggleNameSort = () => {
    if (q.sortField !== "name")
      setAndResetPage({
        sortField: "name",
        sortOrder: "ASC" as const,
        page: 1,
      });
    else if (q.sortOrder === "ASC")
      setAndResetPage({
        sortField: "name",
        sortOrder: "DESC" as const,
        page: 1,
      });
    else
      setAndResetPage({
        sortField: "name",
        sortOrder: "ASC" as const,
        page: 1,
      });
  };

  const [rows, setRows] = useState<Tag[]>([]);
  const [meta, setMeta] = useState<{
    totalPages?: number;
    totalItems?: number;
  }>();
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const keyOf = (id: string, action: "restore" | "delete") => `${id}|${action}`;
  const isOpen = (id: string, action: "restore" | "delete") =>
    openKey === keyOf(id, action);

  useEffect(() => {
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
        console.error("Failed to fetch deleted tags:", e);
        if (alive) {
          setRows([]);
          setMeta(undefined);
          setHasNext(false);
          setHasPrev(q.page > 1);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [apiKey, q.page]);

  const backIfEmpty = () => {
    setQ((prev) => ({ ...prev, page: Math.max(1, (prev.page ?? 1) - 1) }));
  };

  const handleRestore = async (id: string) => {
    try {
      setBusyId(id);
      await restoreTag(id);
      const next = rows.filter((r) => r.id !== id);
      setRows(next);
      if (next.length === 0 && hasPrev) backIfEmpty();
      toast.success("Đã khôi phục nhãn thành công");
    } catch (e: any) {
      console.error("Restore failed:", e);
      const detail = e?.response?.data?.detail || e?.detail || "Không thể khôi phục nhãn";
      toast.error(detail);
    } finally {
      setBusyId(null);
      setOpenKey(null);
    }
  };

  const handleForceDelete = async (id: string) => {
    try {
      setBusyId(id);
      await forceDeleteTag(id);
      const next = rows.filter((r) => r.id !== id);
      setRows(next);
      if (next.length === 0 && hasPrev) backIfEmpty();
      toast.success("Đã xóa vĩnh viễn nhãn thành công");
    } catch (e: any) {
      console.error("Permanent delete failed:", e);
      const detail = e?.response?.data?.detail || e?.detail || "Không thể xóa vĩnh viễn nhãn";
      toast.error(detail);
    } finally {
      setBusyId(null);
      setOpenKey(null);
    }
  };

  const safeTotalPages =
    meta?.totalPages ??
    (meta?.totalItems && q.limit
      ? Math.ceil(meta.totalItems / q.limit)
      : undefined);

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[1440px] mx-auto py-6 px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Button
                size="icon-lg"
                className="hover:bg-gray-300 rounded-full bg-gray-200"
                onClick={() => router.back()}
                title="Quay Lại"
              >
                <ArrowLeft className="text-gray-700 size-7" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Thùng Rác - Danh sách nhãn
                </h1>
                <p className="text-gray-600 mt-1">
                  Khôi phục hoặc xóa vĩnh viễn các nhãn đã xóa
                </p>
              </div>
            </div>
          </div>

          <ToolbarSearchFilters
            value={q.search}
            onSearchChange={(v) => setAndResetPage({ search: v, page: 1 })}
            isActive={q.isActive}
            onFiltersChange={(patch) =>
              setAndResetPage({ ...(patch as any), page: 1 })
            }
            placeholder="Tìm kiếm theo tên nhãn hoặc slug trong thùng rác…"
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
                                  } (nhấp để thay đổi)`
                                : "Không sắp xếp (nhấp để sắp xếp theo Tên)"
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
                        Ngày Xóa
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
                        <td className="px-6 py-4 whitespace-nowrapp">
                          <span className="text-gray-800 font-semibold truncate block">
                            {t.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrapp text-gray-600">
                          {t.slug}
                        </td>
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
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-center">
                          {formatDate(t.deletedAt || (t as any).deleted_at)}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-center gap-3">
                            <ConfirmPopover
                              open={isOpen(t.id, "restore")}
                              onOpenChange={(o) =>
                                setOpenKey(o ? keyOf(t.id, "restore") : null)
                              }
                              title="Khôi phục nhãn này?"
                              message={<b>{t.name}</b>}
                              confirmText="Khôi Phục"
                              onConfirm={async () => {
                                setBusyId(t.id);
                                try {
                                  await handleRestore(t.id);
                                } finally {
                                  setBusyId(null);
                                }
                              }}
                              confirmDisabled={busyId === t.id}
                              confirmLoading={busyId === t.id}
                              confirmClassName="h-10 bg-emerald-600 hover:bg-emerald-700 text-white"
                              side="bottom"
                              sideOffset={8}
                              widthClass="w-[250px]"
                            >
                              <Button
                                size="icon-sm"
                                className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                                disabled={busyId === t.id}
                                title="Khôi Phục"
                                onClick={() =>
                                  setOpenKey(keyOf(t.id, "restore"))
                                }
                              >
                                <RotateCcw className="size-5 text-green-600" />
                              </Button>
                            </ConfirmPopover>

                            <span className="text-gray-500 text-sm leading-none">
                              |
                            </span>

                            <ConfirmPopover
                              open={isOpen(t.id, "delete")}
                              onOpenChange={(o) =>
                                setOpenKey(o ? keyOf(t.id, "delete") : null)
                              }
                              title="Xóa vĩnh viễn nhãn này?"
                              message={<b>{t.name}</b>}
                              confirmText="Xóa"
                              onConfirm={async () => {
                                setBusyId(t.id);
                                try {
                                  await handleForceDelete(t.id);
                                } finally {
                                  setBusyId(null);
                                }
                              }}
                              confirmDisabled={busyId === t.id}
                              confirmLoading={busyId === t.id}
                              confirmClassName="h-10 bg-red-600 hover:bg-red-700 text-white"
                              side="bottom"
                              sideOffset={8}
                              widthClass="w-[300px]"
                            >
                              <Button
                                size="icon-sm"
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                disabled={busyId === t.id}
                                title="Xóa Vĩnh Viễn"
                                onClick={() =>
                                  setOpenKey(keyOf(t.id, "delete"))
                                }
                              >
                                <Trash2 className="size-5 text-red-600" />
                              </Button>
                            </ConfirmPopover>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-10">
                          <p className="text-center text-gray-600">
                            Thùng rác đang trống.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <TablePagination
              page={q.page}
              limit={q.limit}
              totalPages={safeTotalPages}
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
