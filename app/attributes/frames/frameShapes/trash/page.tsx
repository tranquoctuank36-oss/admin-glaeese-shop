"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

import TablePagination from "@/components/TablePagination";
import { useListQuery } from "@/components/data/useListQuery";
import ToolbarSearchFilters from "@/components/data/ToolbarSearchFilters";

import {
  getFrameShapes,
  restoreFrameShape,
  forceDeleteFrameShape,
} from "@/services/frameService/frameShapeService";

import ConfirmPopover from "@/components/ConfirmPopover";
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

export default function FrameShapesTrashPage() {
  const router = useRouter();

  const { q, setQ, setAndResetPage, apiParams, apiKey } = useListQuery({
    limit: 20,
    isDeleted: "true",
    sortField: "deletedAt",
    sortOrder: "DESC",
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

  const toggleDeletedAtSort = () => {
    if (q.sortField !== "deletedAt") {
      setAndResetPage({
        sortField: "deletedAt",
        sortOrder: "DESC" as const,
        page: 1,
      });
    } else if (q.sortOrder === "DESC") {
      setAndResetPage({
        sortField: "deletedAt",
        sortOrder: "ASC" as const,
        page: 1,
      });
    } else {
      setAndResetPage({
        sortField: "deletedAt",
        sortOrder: "DESC" as const,
        page: 1,
      });
    }
  };

  const [rows, setRows] = useState<FrameShape[]>([]);
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
        console.error("Failed to fetch trashed shapes:", e);
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
    if (rows.length <= 1 && hasPrev) {
      setQ((prev) => ({ ...prev, page: Math.max(1, (prev.page ?? 1) - 1) }));
    }
  };

  const handleRestore = async (id: string) => {
    try {
      setBusyId(id);
      await restoreFrameShape(id);
      if (rows.length <= 1 && hasPrev) backIfEmpty();
      else setRows((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      console.error("Restore shape failed:", e);
      const detail = e?.response?.data?.detail || e?.detail || "Failed to restore shape";
      toast.error(detail);
    } finally {
      setBusyId(null);
      setOpenKey(null);
    }
  };

  const handleForceDelete = async (id: string) => {
    try {
      setBusyId(id);
      await forceDeleteFrameShape(id);
      if (rows.length <= 1 && hasPrev) backIfEmpty();
      else setRows((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      console.error("Permanent delete shape failed:", e);
      const detail = e?.response?.data?.detail || e?.message || "Failed to delete permanently";
      toast.error(detail);
    } finally {
      setBusyId(null);
      setOpenKey(null);
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
          {/* <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold">
                <Trash2 className="size-5" />
                <span>Trash Bin</span>
              </div>
            </div>
          </div> */}

          {/* Tìm kiếm và Bộ lọc */}
          <ToolbarSearchFilters
            value={q.search}
            onSearchChange={(v) => setAndResetPage({ search: v, page: 1 })}
            isActive={q.isActive}
            onFiltersChange={(patch) =>
              setAndResetPage({ ...(patch as any), page: 1 })
            }
            placeholder="Tìm kiếm theo tên hình dạng hoặc slug trong thùng rác..."
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
                            Ngày Xóa
                          </span>
                          <button
                            type="button"
                            onClick={toggleDeletedAtSort}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                            title={
                              q.sortField === "deletedAt"
                                ? `Sắp xếp: ${
                                    q.sortOrder === "ASC" ? "ASC" : "DESC"
                                  } (nhấp để thay đổi)`
                                : "Không sắp xếp (nhấp để sắp xếp theo Ngày Xóa)"
                            }
                          >
                            {q.sortField === "deletedAt" ? (
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

                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {rows.map((s) => (
                      <tr
                        key={s.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrapp">
                          <span className="text-gray-800 font-semibold truncate block">
                            {s.name}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-gray-600 truncate block">
                            {s.slug}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-center">
                          {typeof s.isActive === "boolean" ? (
                            <span
                              className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                                s.isActive
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {s.isActive ? "Có" : "Không"}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span className="text-gray-600">
                            {formatDate((s as any).deletedAt)}
                          </span>
                        </td>

                        <td className="px-6 py-3 text-center">
                          <div className="flex items-center justify-center gap-3">
                            {/* Restore */}
                            <ConfirmPopover
                              open={isOpen(s.id, "restore")}
                              onOpenChange={(o) =>
                                setOpenKey(o ? keyOf(s.id, "restore") : null)
                              }
                              title="Khôi phục hình dạng gọng này?"
                              message={<b>{s.name}</b>}
                              confirmText="Khôi phục"
                              onConfirm={async () => {
                                setBusyId(s.id);
                                try {
                                  await handleRestore(s.id);
                                } finally {
                                  setBusyId(null);
                                }
                              }}
                              confirmDisabled={busyId === s.id}
                              confirmLoading={busyId === s.id}
                              confirmClassName="h-10 bg-emerald-600 hover:bg-emerald-700 text-white"
                              side="bottom"
                              sideOffset={8}
                              widthClass="w-[250px]"
                            >
                              <Button
                                size="icon-sm"
                                className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                                disabled={busyId === s.id}
                                title="Khôi phục"
                                onClick={() =>
                                  setOpenKey(keyOf(s.id, "restore"))
                                }
                              >
                                <RotateCcw className="size-5 text-green-600" />
                              </Button>
                            </ConfirmPopover>

                            <span className="text-gray-500 text-sm leading-none">
                              |
                            </span>

                            {/* Delete permanently */}
                            <ConfirmPopover
                              open={isOpen(s.id, "delete")}
                              onOpenChange={(o) =>
                                setOpenKey(o ? keyOf(s.id, "delete") : null)
                              }
                              title="Xóa vĩnh viễn hình dạng gọng này?"
                              message={<b>{s.name}</b>}
                              confirmText="Xóa"
                              onConfirm={async () => {
                                setBusyId(s.id);
                                try {
                                  await handleForceDelete(s.id);
                                } finally {
                                  setBusyId(null);
                                }
                              }}
                              confirmDisabled={busyId === s.id}
                              confirmLoading={busyId === s.id}
                              confirmClassName="h-10 bg-red-600 hover:bg-red-700 text-white"
                              side="bottom"
                              sideOffset={8}
                              widthClass="w-[300px]"
                            >
                              <Button
                                size="icon-sm"
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                disabled={busyId === s.id}
                                title="Xóa vĩnh viễn"
                                onClick={() =>
                                  setOpenKey(keyOf(s.id, "delete"))
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
