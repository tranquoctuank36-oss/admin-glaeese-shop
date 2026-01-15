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
import { Routes } from "@/lib/routes";
import TablePagination from "@/components/shared/TablePagination";
import { useListQuery } from "@/components/listing/hooks/useListQuery";
import ToolbarSearchFilters from "@/components/listing/ToolbarSearchFilters";
import ConfirmPopover from "@/components/shared/ConfirmPopover";
import {
  getColors,
  restoreColor,
  forceDeleteColor,
} from "@/services/colorService";
import toast from "react-hot-toast";

function formatDate(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function ColorsTrashPage() {
  const router = useRouter();

  const { q, setQ, setAndResetPage, apiParams, apiKey } = useListQuery({
    limit: 20,
    isDeleted: "true",
    sortField: "name",
    sortOrder: "ASC",
  });

  const toggleNameSort = () => {
    if (q.sortField !== "name") {
      setAndResetPage({
        sortField: "name",
        sortOrder: "ASC" as const,
        page: 1,
      });
    } else if (q.sortOrder === "ASC") {
      setAndResetPage({
        sortField: "name",
        sortOrder: "DESC" as const,
        page: 1,
      });
    } else {
      setAndResetPage({
        sortField: "name",
        sortOrder: "ASC" as const,
        page: 1,
      });
    }
  };

  const [rows, setRows] = useState<Color[]>([]);
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
        const res = await getColors(apiParams);
        if (!alive) return;
        setRows(res.data);
        setMeta({
          totalPages: res.meta?.totalPages,
          totalItems: res.meta?.totalItems,
        });
        setHasNext(!!res.hasNext);
        setHasPrev(!!res.hasPrev);
      } catch (e) {
        console.error("Failed to fetch deleted colors:", e);
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
    setQ((prev) => ({
      ...prev,
      page: Math.max(1, (prev.page ?? 1) - 1),
    }));
  };

  const handleRestore = async (id: string) => {
    try {
      setBusyId(id);
      await restoreColor(id);
      const next = rows.filter((r) => r.id !== id);
      setRows(next);
      if (next.length === 0 && hasPrev) backIfEmpty();
      toast.success("Đã khôi phục màu sắc thành công");
    } catch (e: any) {
      console.error("Restore failed:", e);
      const detail = e?.response?.data?.detail || e?.detail || "Không thể khôi phục màu sắc";
      toast.error(detail);
    } finally {
      setBusyId(null);
      setOpenKey(null);
    }
  };

  const handleForceDelete = async (id: string) => {
    try {
      setBusyId(id);
      await forceDeleteColor(id);
      const next = rows.filter((r) => r.id !== id);
      setRows(next);
      if (next.length === 0 && hasPrev) backIfEmpty();
      toast.success("Đã xóa vĩnh viễn màu sắc thành công");
    } catch (e: any) {
      console.error("Permanent delete failed:", e);
      const detail = e?.response?.data?.detail || e?.detail || "Không thể xóa vĩnh viễn màu sắc";
      toast.error(detail);
    } finally {
      setBusyId(null);
      setOpenKey(null);
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
                  Thùng Rác - Màu sắc
                </h1>
                <p className="text-gray-600 mt-1">
                  Khôi phục hoặc xóa vĩnh viễn các màu sắc đã xóa
                </p>
              </div>
            </div>
          </div>

          {/* Ẩn filter Active giống trang frame-trash */}
          <ToolbarSearchFilters
            value={q.search}
            onSearchChange={(v) => setAndResetPage({ search: v, page: 1 })}
            isActive={q.isActive}
            onFiltersChange={(patch) =>
              setAndResetPage({ ...(patch as any), page: 1 })
            }
            placeholder="Tìm kiếm theo tên màu sắc hoặc slug hoặc mã hex trong thùng rác..."
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
                                  } (nhấn để thay đổi)`
                                : "Không sắp xếp (nhấn để sắp xếp theo Tên)"
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

                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Mã Hex
                      </th>

                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Hoạt động
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
                    {rows.map((c) => (
                      <tr
                        key={c.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrapp">
                          <span className="text-gray-800 font-semibold truncate block">
                            {c.name}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrapp">
                          <span className="text-gray-600 truncate block">
                            {c.slug}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block h-4 w-4 rounded-full border border-gray-300"
                              style={{
                                backgroundColor: c.hexCode ?? "#FFFFFF",
                              }}
                              title={c.hexCode}
                            />
                            <span className="text-gray-700 font-mono">
                              {c.hexCode ?? "-"}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                              c.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {c.isActive ? "Có" : "Không"}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-center text-gray-600">
                          {formatDate(c.deletedAt)}
                        </td>

                        <td className="px-6 py-3 text-center">
                          <div className="flex items-center justify-center gap-3">
                            {/* Restore */}
                            <ConfirmPopover
                              open={isOpen(c.id, "restore")}
                              onOpenChange={(o) =>
                                setOpenKey(o ? keyOf(c.id, "restore") : null)
                              }
                              title="Khôi phục màu sắc này?"
                              message={<b>{c.name}</b>}
                              confirmText="Khôi phục"
                              onConfirm={async () => {
                                setBusyId(c.id);
                                try {
                                  await handleRestore(c.id);
                                } finally {
                                  setBusyId(null);
                                }
                              }}
                              confirmDisabled={busyId === c.id}
                              confirmLoading={busyId === c.id}
                              confirmClassName="h-10 bg-emerald-600 hover:bg-emerald-700 text-white"
                              side="bottom"
                              sideOffset={8}
                            >
                              <Button
                                size="icon-sm"
                                className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                                disabled={busyId === c.id}
                                title="Khôi phục"
                                onClick={() =>
                                  setOpenKey(keyOf(c.id, "restore"))
                                }
                              >
                                <RotateCcw className="size-5 text-green-600" />
                              </Button>
                            </ConfirmPopover>

                            <span className="text-gray-500 text-sm leading-none">
                              |
                            </span>

                            {/* Force delete */}
                            <ConfirmPopover
                              open={isOpen(c.id, "delete")}
                              onOpenChange={(o) =>
                                setOpenKey(o ? keyOf(c.id, "delete") : null)
                              }
                              title="Xóa vĩnh viễn màu sắc này?"
                              message={<b>{c.name}</b>}
                              confirmText="Xóa"
                              onConfirm={async () => {
                                setBusyId(c.id);
                                try {
                                  await handleForceDelete(c.id);
                                } finally {
                                  setBusyId(null);
                                }
                              }}
                              confirmDisabled={busyId === c.id}
                              confirmLoading={busyId === c.id}
                              confirmClassName="h-10 bg-red-600 hover:bg-red-700 text-white"
                              side="bottom"
                              sideOffset={8}
                              widthClass="w-[250px]"
                            >
                              <Button
                                size="icon-sm"
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                disabled={busyId === c.id}
                                title="Xóa vĩnh viễn"
                                onClick={() =>
                                  setOpenKey(keyOf(c.id, "delete"))
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
                        <td colSpan={6} className="px-6 py-10">
                          <p className="text-center text-gray-600">
                            Thùng rác đang trống
                          </p>
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
