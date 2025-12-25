"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  RotateCcw,
  Trash2,
  ArrowUpAZ,
  ArrowDownAZ,
  ArrowUpDown,
} from "lucide-react";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";
import {
  getProducts,
  restoreProduct,
  forceDeleteProduct,
} from "@/services/productService";
import type { Product } from "@/types/product";
import Pagination from "@/components/data/Pagination";
import { Button } from "@/components/ui/button";
import ToolbarSearchFilters from "@/components/data/ToolbarSearchFilters";
import { useListQuery } from "@/components/data/useListQuery";
import { Routes } from "@/lib/routes";
import { useRouter } from "next/navigation";
import ConfirmPopover from "@/components/ConfirmPopover";
import { toast } from "react-hot-toast";

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
  return String(status)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmt(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()}`;
}

function ProductsTrashPage() {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const router = useRouter();

  const [rows, setRows] = useState<Product[]>([]);
  const [meta, setMeta] = useState<{
    totalPages?: number;
    totalItems?: number;
  }>();
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { q, setQ, setAndResetPage, apiParams, apiKey } = useListQuery({
    limit: 20,
    sortField: "createdAt",
    sortOrder: "DESC",
    isDeleted: "true",
  });

  const toggleNameSort = () => {
    if (q.sortField !== "name")
      setAndResetPage({ sortField: "name", sortOrder: "ASC" as const });
    else if (q.sortOrder === "ASC")
      setAndResetPage({ sortField: "name", sortOrder: "DESC" as const });
    else
      setAndResetPage({ sortField: "createdAt", sortOrder: "DESC" as const });
  };

  const toggleCreatedAtSort = () => {
    if (q.sortField !== "createdAt") {
      setAndResetPage({ sortField: "createdAt", sortOrder: "DESC" as const });
    } else if (q.sortOrder === "DESC") {
      setAndResetPage({ sortField: "createdAt", sortOrder: "ASC" as const });
    } else {
      setAndResetPage({ sortField: "name", sortOrder: "ASC" as const });
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getProducts({ ...apiParams, isDeleted: true });
        console.log("Fetched trash products:", res);
        if (!alive) return;
        setRows(res.data ?? []);
        setMeta({
          totalPages: res.meta?.totalPages,
          totalItems: res.meta?.totalItems,
        });
        setHasNext(!!res.hasNext);
        setHasPrev(!!res.hasPrev);
      } catch (e: any) {
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

  const allSelected =
    rows.length > 0 && selectedProducts.length === rows.length;

  const toggleSelectAll = (checked: boolean) => {
    setSelectedProducts(checked ? rows.map((r) => r.id) : []);
  };

  const toggleSelectOne = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleRestore = async (id: string, name: string) => {
    try {
      await restoreProduct(id);
      // Refresh the list after restoration
      const res = await getProducts({ ...apiParams, isDeleted: true });
      setRows(res.data ?? []);
      setMeta({
        totalPages: res.meta?.totalPages,
        totalItems: res.meta?.totalItems,
      });
      setHasNext(!!res.hasNext);
      setHasPrev(!!res.hasPrev);
      console.log(`Product "${name}" restored successfully`);
    } catch (error: any) {
      console.error("Failed to restore product:", error);
      const detail = error?.response?.data?.detail || error?.detail;
      toast.error(detail);
    }
  };

  const handlePermanentDelete = async (id: string, name: string) => {
    try {
      await forceDeleteProduct(id);
      // Refresh the list after permanent deletion
      const res = await getProducts({ ...apiParams, isDeleted: true });
      setRows(res.data ?? []);
      setMeta({
        totalPages: res.meta?.totalPages,
        totalItems: res.meta?.totalItems,
      });
      setHasNext(!!res.hasNext);
      setHasPrev(!!res.hasPrev);
      console.log(`Product "${name}" permanently deleted`);
    } catch (error: any) {
      console.error("Failed to permanently delete product:", error);
      const detail = error?.response?.data?.detail || error?.detail;
      toast.error(detail);
    }
  };

  const handleBulkRestore = async () => {
    try {
      await Promise.all(selectedProducts.map((id) => restoreProduct(id)));
      setSelectedProducts([]);
      const res = await getProducts({ ...apiParams, isDeleted: true });
      setRows(res.data ?? []);
      setMeta({
        totalPages: res.meta?.totalPages,
        totalItems: res.meta?.totalItems,
      });
      setHasNext(!!res.hasNext);
      setHasPrev(!!res.hasPrev);
      console.log(`${selectedProducts.length} products restored successfully`);
    } catch (error: any) {
      console.error("Failed to restore products:", error);
      const detail = error?.response?.data?.detail || error?.detail;
      toast.error(detail);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedProducts.map((id) => forceDeleteProduct(id)));
      setSelectedProducts([]);
      const res = await getProducts({ ...apiParams, isDeleted: true });
      setRows(res.data ?? []);
      setMeta({
        totalPages: res.meta?.totalPages,
        totalItems: res.meta?.totalItems,
      });
      setHasNext(!!res.hasNext);
      setHasPrev(!!res.hasPrev);
      console.log(`${selectedProducts.length} products permanently deleted`);
    } catch (error) {
      console.error("Failed to permanently delete products:", error);
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
              <div className="flex items-center gap-3 mb-2">
                <Button
                  size="icon-lg"
                  className="hover:bg-gray-300 rounded-full bg-gray-200"
                  onClick={() =>
                    router.push(Routes.productsManagement.products.root)
                  }
                  title="Go Back"
                >
                  <ArrowLeft className="text-gray-700 size-7" />
                </Button>
                <h1 className="text-3xl font-bold text-gray-800">
                  Trash Bin – Products
                </h1>
              </div>
              <p className="text-gray-600 mt-1 ml-12">
                Restore or permanently delete products
              </p>
            </div>
          </div>

          {/* Search & Filter */}
          <ToolbarSearchFilters
            value={q.search}
            onSearchChange={(v) => setAndResetPage({ search: v, page: 1 })}
            productStatus={(q as any).productStatus ?? "all"}
            onFiltersChange={(patch) => {
              if (typeof patch.productStatus !== "undefined") {
                setAndResetPage({
                  productStatus: patch.productStatus,
                  page: 1,
                } as any);
              }
            }}
            placeholder="Search deleted products..."
          />
        </motion.div>

        {/* Bulk actions */}
        {selectedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between"
          >
            <div className="text-blue-800 font-medium">
              {selectedProducts.length} product(s) selected
            </div>
            <div className="flex gap-2">
              <ConfirmPopover
                title="Restore Products?"
                message={`Are you sure you want to restore ${selectedProducts.length} product(s)?`}
                confirmText="Restore"
                onConfirm={handleBulkRestore}
                confirmClassName="h-10 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Button className="px-4 py-2 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50">
                  Restore Selected
                </Button>
              </ConfirmPopover>
              <ConfirmPopover
                title="Permanently Delete Products?"
                message={`Are you sure you want to permanently delete ${selectedProducts.length} product(s)?`}
                confirmText="Delete Permanently"
                onConfirm={handleBulkDelete}
              >
                <Button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  Delete Permanently
                </Button>
              </ConfirmPopover>
            </div>
          </motion.div>
        )}

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
        >
          {error && (
            <div className="p-4 text-red-600 border-b border-red-200 bg-red-50">
              {error}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="table-auto w-max min-w-[1440px]">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 w-50 text-left text-xs font-semibold text-gray-600 uppercase">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-600">
                        Name
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
                  <th className="px-6 py-4 w-50 text-left text-xs font-bold text-gray-600 uppercase whitespace-nowrap">
                    Slug
                  </th>
                  <th className="px-6 py-4 w-20 text-left text-xs font-bold text-gray-600 uppercase whitespace-nowrap">
                    Brand
                  </th>
                  <th className="px-6 py-4 w-40 text-left text-xs font-bold text-gray-600 uppercase">
                    Product Type & Gender
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">
                    Frame Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">
                    Dimensions
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">
                    Review / Sold
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase whitespace-nowrapp">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-600">
                        Created At
                      </span>
                      <button
                        type="button"
                        onClick={toggleCreatedAtSort}
                        className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 cursor-pointer"
                        title={
                          q.sortField === "createdAt"
                            ? `Sorting: ${
                                q.sortOrder === "ASC" ? "ASC" : "DESC"
                              } (click to change)`
                            : "No sorting (click to sort by Created At)"
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
                  <th className="px-6 py-4 pl-8 text-left text-xs font-bold text-gray-600 uppercase whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Loading…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="px-6 py-8 text-center text-gray-500 italic"
                    >
                      Trash is empty.
                    </td>
                  </tr>
                ) : (
                  rows.map((product, index) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleSelectOne(product.id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-semibold text-gray-800">
                              {product.name}
                            </div>
                            <div className="text-sm text-blue-600 mt-0.5">
                              {product.productVariants?.length} variant(s)
                            </div>
                            {product.description && (
                              <p className="text-xs text-gray-600 mt-1 italic line-clamp-1">
                                <span className="text-gray-700 not-italic">
                                  Description:
                                </span>{" "}
                                {product.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {product.slug}
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-base text-gray-600 block max-w-[100px] truncate">
                          {product.brand?.name ?? "—"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-800">
                            {product.productType ?? "—"}
                          </div>
                          <div className="text-gray-600">
                            {product.gender ?? "—"}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm space-y-1 block ">
                          <div>
                            <span className="text-gray-500">Type: </span>
                            <span className="font-medium text-gray-600 ">
                              {product.frameType?.name ?? "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Shape: </span>
                            <span className="font-medium text-gray-600">
                              {product.frameShape?.name ?? "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Material: </span>
                            <span className="font-medium text-gray-600">
                              {product.frameMaterial?.name ?? "—"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 space-y-0.5">
                          <div>
                            <span className="text-gray-500">Lens Width: </span>
                            <span className="font-medium text-gray-600 ">
                              {product.lensWidth !== null &&
                              product.lensWidth !== undefined
                                ? product.lensWidth
                                : "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Lens Height: </span>
                            <span className="font-medium text-gray-600 ">
                              {product.lensHeight !== null &&
                              product.lensHeight !== undefined
                                ? product.lensHeight
                                : "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">
                              Bridge Width:{" "}
                            </span>
                            <span className="font-medium text-gray-600 ">
                              {product.bridgeWidth !== null &&
                              product.bridgeWidth !== undefined
                                ? product.bridgeWidth
                                : "—"}
                            </span>
                          </div>

                          <div>
                            <span className="text-gray-500">
                              Temple Length:{" "}
                            </span>
                            <span className="font-medium text-gray-600 ">
                              {product.templeLength !== null &&
                              product.templeLength !== undefined
                                ? product.templeLength
                                : "—"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-800 text-center">
                          {product.reviewCount ?? "—"} /{" "}
                          {product.totalSold ?? "—"}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${statusBadgeClass(
                            product.productStatus
                          )}`}
                        >
                          {formatStatusLabel(product.productStatus)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {fmt(product.createdAt)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {/* <Button
                            size="icon-sm"
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                            title="View Details"
                            onClick={() =>
                              router.push(
                                Routes.productsManagement.products.details(
                                  product.id
                                )
                              )
                            }
                          >
                            <Eye className="text-blue-600 size-5" />
                          </Button> */}
                          <ConfirmPopover
                            title="Restore Product?"
                            message={
                              <div>
                                Are you sure you want to restore{" "}
                                <strong>
                                  {product.name || "this product"}
                                </strong>
                                ?
                              </div>
                            }
                            confirmText="Restore"
                            onConfirm={() =>
                              handleRestore(product.id, product.name)
                            }
                            confirmClassName="h-10 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Button
                              size="icon-sm"
                              className="p-2 hover:bg-green-100 rounded-lg transition-colors "
                              title="Restore"
                            >
                              <RotateCcw className="text-green-600 size-5" />
                            </Button>
                          </ConfirmPopover>
                          <span className="text-gray-500 text-sm leading-none">
                            |
                          </span>
                          <ConfirmPopover
                            title="Permanently Delete Product"
                            message={
                              <div>
                                Are you sure you want to delete{" "}
                                <strong>
                                  {product.name || "this product"}
                                </strong>
                                ?
                              </div>
                            }
                            confirmText="Delete"
                            onConfirm={() =>
                              handlePermanentDelete(product.id, product.name)
                            }
                          >
                            <Button
                              size="icon-sm"
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                              title="Delete Permanently"
                            >
                              <Trash2 className="text-red-600 size-5" />
                            </Button>
                          </ConfirmPopover>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            {/* Rows per page (left) */}
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <span>Rows per page:</span>
              <select
                className="h-9 rounded-md border border-gray-300 px-3 bg-white"
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

            {/* Controls (right) */}
            <div className="flex items-center gap-4">
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
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default withAuthCheck(ProductsTrashPage);
