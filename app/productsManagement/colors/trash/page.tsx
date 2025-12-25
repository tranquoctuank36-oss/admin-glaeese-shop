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
import Pagination from "@/components/data/Pagination";
import { useListQuery } from "@/components/data/useListQuery";
import ToolbarSearchFilters from "@/components/data/ToolbarSearchFilters";
import ConfirmPopover from "@/components/ConfirmPopover";
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
    } catch (e: any) {
      console.error("Restore failed:", e);
      const detail = e?.response?.data?.detail || e?.detail || "Failed to restore color";
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
    } catch (e: any) {
      console.error("Permanent delete failed:", e);
      const detail = e?.response?.data?.detail || e?.detail || "Failed to delete permanently";
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
                onClick={() =>
                  router.push(Routes.productsManagement.colors.root)
                }
                title="Go Back"
              >
                <ArrowLeft className="text-gray-700 size-7" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Trash Bin – Colors
                </h1>
                <p className="text-gray-600 mt-1">
                  Restore or permanently delete removed colors
                </p>
              </div>
            </div>
          </div>

          {/* Ẩn filter Active giống trang frame-trash */}
          <ToolbarSearchFilters
            value={q.search}
            onSearchChange={(v) => setAndResetPage({ search: v, page: 1 })}
            isActive={undefined as any}
            onFiltersChange={(patch) =>
              setAndResetPage({ ...(patch as any), page: 1 })
            }
            placeholder="Search by color name or slug or hex in trash..."
          />
        </motion.div>

        {loading ? (
          <p className="text-center text-gray-600">Loading...</p>
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
                            Name
                          </span>
                          <button
                            type="button"
                            onClick={toggleNameSort}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                            title={
                              q.sortField === "name"
                                ? `Sorting: ${
                                    q.sortOrder === "ASC" ? "ASC" : "DESC"
                                  } (click to change)`
                                : "No sorting (click to sort by Name)"
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
                        Hex
                      </th>

                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Active
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Deleted At
                      </th>

                      <th className="px-6 py-4 pl-8 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Actions
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
                            {c.isActive ? "Yes" : "No"}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrapp text-gray-600">
                          {formatDate(c.deletedAt)}
                        </td>

                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            {/* Restore */}
                            <ConfirmPopover
                              open={isOpen(c.id, "restore")}
                              onOpenChange={(o) =>
                                setOpenKey(o ? keyOf(c.id, "restore") : null)
                              }
                              title="Restore this color?"
                              message={<b>{c.name}</b>}
                              confirmText="Restore"
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
                              widthClass="w-[200px]"
                            >
                              <Button
                                size="icon-sm"
                                className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                                disabled={busyId === c.id}
                                title="Restore"
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
                              title="Permanently delete this color?"
                              message={<b>{c.name}</b>}
                              confirmText="Delete"
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
                                title="Delete permanently"
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
                            Trash is empty.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2 text-sm">
                <span>Rows per page:</span>
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
