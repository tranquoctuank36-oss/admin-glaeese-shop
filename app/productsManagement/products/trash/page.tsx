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
  X,
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
  const statusMap: Record<string, string> = {
    "published": "Đã xuất bản",
    "draft": "Bản nháp",
    "unlisted": "Chưa liệt kê",
    "archived": "Đã lưu trữ"
  };
  return statusMap[String(status).toLowerCase()] || "-";
}

function formatProductType(type?: string | null) {
  if (!type) return "—";
  const typeMap: Record<string, string> = {
    "frame": "Gọng kính",
    "sunglasses": "Kính mát"
  };
  return typeMap[type] || type;
}

function formatGender(gender?: string | null) {
  if (!gender) return "—";
  const genderMap: Record<string, string> = {
    "male": "Nam",
    "female": "Nữ",
    "unisex": "Unisex",
    "kid": "Trẻ em"
  };
  return genderMap[gender] || gender;
}

function fmt(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()}`;
}

function ProductsTrashPage() {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; alt: string } | null>(null);
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
    sortField: "deletedAt",
    sortOrder: "DESC",
    isDeleted: "true",
  });

  const toggleNameSort = () => {
    if (q.sortField !== "name")
      setAndResetPage({ sortField: "name", sortOrder: "ASC" as const });
    else if (q.sortOrder === "ASC")
      setAndResetPage({ sortField: "name", sortOrder: "DESC" as const });
    else
      setAndResetPage({ sortField: "name", sortOrder: "ASC" as const });
  };

  const toggleDeletedAtSort = () => {
    if (q.sortField !== "deletedAt") {
      setAndResetPage({ sortField: "deletedAt", sortOrder: "DESC" as const });
    } else if (q.sortOrder === "DESC") {
      setAndResetPage({ sortField: "deletedAt", sortOrder: "ASC" as const });
    } else {
      setAndResetPage({ sortField: "deletedAt", sortOrder: "DESC" as const });
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
                  Thùng rác – Danh sách sản phẩm
                </h1>
              </div>
              <p className="text-gray-600 mt-1 ml-12">
                Khôi phục hoặc xóa vĩnh viễn sản phẩm
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
            placeholder="Tìm kiếm sản phẩm đã xóa..."
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
              {selectedProducts.length} sản phẩm được chọn
            </div>
            <div className="flex gap-2">
              <ConfirmPopover
                title="Khôi phục sản phẩm?"
                message={`Bạn có chắc chắn muốn khôi phục ${selectedProducts.length} sản phẩm?`}
                confirmText="Khôi phục"
                onConfirm={handleBulkRestore}
                confirmClassName="h-10 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Button className="px-4 py-2 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50">
                  Khôi phục được chọn
                </Button>
              </ConfirmPopover>
              <ConfirmPopover
                title="Xóa vĩnh viễn sản phẩm?"
                message={`Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedProducts.length} sản phẩm?`}
                confirmText="Xóa vĩnh viễn"
                onConfirm={handleBulkDelete}
              >
                <Button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  Xóa vĩnh viễn
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
            <table className="w-full">
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-600 truncate max-w-[320px]">
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
                  <th className="px-6 py-4 w-40 text-left text-xs font-bold text-gray-600 uppercase whitespace-nowrap">
                    Danh mục
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase whitespace-nowrap">
                    Hiệu suất
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase whitespace-nowrap">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xs font-bold text-gray-600">
                        Ngày xóa
                      </span>
                      <button
                        type="button"
                        onClick={toggleDeletedAtSort}
                        className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 cursor-pointer"
                        title={
                          q.sortField === "deletedAt"
                            ? `Sorting: ${
                                q.sortOrder === "ASC" ? "ASC" : "DESC"
                              } (click to change)`
                            : "No sorting (click to sort by Deleted At)"
                        }
                      >
                        {q.sortField === "deletedAt" ? (
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
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase whitespace-nowrap">
                    Thao tác 
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
                      Đang tải…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="px-6 py-8 text-center text-gray-500 italic"
                    >
                      Thùng rác trống.
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
                          {product.thumbnailUrl ? (
                            <img
                              src={product.thumbnailUrl}
                              alt={product.name}
                              className="w-15 h-15 object-contain rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setLightboxImage({ url: product.thumbnailUrl!, alt: product.name })}
                            />
                          ) : (
                            <div className="w-15 h-15 bg-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-gray-400 text-xs">Không có hình ảnh</span>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis">
                              {product.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                              {product.slug}
                            </div>
                            <div className="text-sm text-gray-600 mt-0.5 whitespace-nowrap">
                              {product.brand?.name} ·{" "}
                              {product.productVariants?.length} biến thể
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-800">
                            {formatProductType(product.productType)}
                          </div>
                          <div className="text-gray-600">
                            {formatGender(product.gender)}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                            <span>🛒 {product.totalSold ?? 0}</span>
                            <span>•</span>
                            <span>👁️ {product.reviewCount ?? 0}</span>
                          </div>
                          <div className="text-xs text-gray-600 flex items-center gap-1">
                            <span className="text-yellow-500">⭐</span>
                            <span>{Math.round(product.averageRating ?? 0)} / 5</span>
                          </div>
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

                      <td className="px-6 py-4 text-gray-600 text-center whitespace-nowrap">
                        {fmt(product.deletedAt)}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <ConfirmPopover
                            title="Khôi phục sản phẩm?"
                            message={
                              <div>
                                Bạn có chắc chắn muốn khôi phục{" "}
                                <strong>
                                  {product.name || "sản phẩm này"}
                                </strong>
                                ?
                              </div>
                            }
                            confirmText="Khôi phục"
                            onConfirm={() =>
                              handleRestore(product.id, product.name)
                            }
                            confirmClassName="h-10 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Button
                              size="icon-sm"
                              className="p-2 hover:bg-green-100 rounded-lg transition-colors "
                              title="Khôi phục"
                            >
                              <RotateCcw className="text-green-600 size-5" />
                            </Button>
                          </ConfirmPopover>
                          <span className="text-gray-500 text-sm leading-none">
                            |
                          </span>
                          <ConfirmPopover
                            title="Xóa vĩnh viễn sản phẩm"
                            message={
                              <div>
                                Bạn có chắc chắn muốn xóa{" "}
                                <strong>
                                  {product.name || "sản phẩm này"}
                                </strong>
                                ?
                              </div>
                            }
                            confirmText="Xóa vĩnh viễn"
                            onConfirm={() =>
                              handlePermanentDelete(product.id, product.name)
                            }
                          >
                            <Button
                              size="icon-sm"
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                              title="Xóa vĩnh viễn"
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
              <span>Số hàng mỗi trang:</span>
              <select
                className="h-9 rounded-md border border-gray-300 px-2 bg-white"
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
      </main>
    </div>
  );
}

export default withAuthCheck(ProductsTrashPage);
