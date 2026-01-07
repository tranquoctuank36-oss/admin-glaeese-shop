"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  ArrowUpAZ,
  ArrowDownAZ,
  ArrowUpDown,
  X,
} from "lucide-react";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";
import {
  getProducts,
  softDeleteProduct,
  countTrashProductsClient,
  getProductCounts,
} from "@/services/productService";
import type { Product } from "@/types/product";
import TablePagination from "@/components/TablePagination";
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

function fmt(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()}`;
}

function ProductsPage() {
  // const [showFilters, setShowFilters] = useState(false);
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
  const [trashCount, setTrashCount] = useState(0);
  const [counts, setCounts] = useState<any>(null);

  const { q, setQ, setAndResetPage, apiParams, apiKey } = useListQuery({
    limit: 20,
    sortField: "createdAt",
    sortOrder: "DESC",
    isDeleted: "false",
  });

  const toggleNameSort = () => {
    if (q.sortField !== "name")
      setAndResetPage({ sortField: "name", sortOrder: "ASC" as const });
    else if (q.sortOrder === "ASC")
      setAndResetPage({ sortField: "name", sortOrder: "DESC" as const });
    else
      setAndResetPage({ sortField: "name", sortOrder: "ASC" as const });
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

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getProducts(apiParams);
        console.log("Fetched products:", res);
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

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const count = await countTrashProductsClient();
        if (!alive) return;
        setTrashCount(count);
      } catch (error) {
        console.error("Failed to fetch trash count:", error);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const countsData = await getProductCounts();
        if (!alive) return;
        setCounts(countsData.data ?? countsData);
      } catch (error) {
        console.error("Failed to fetch product counts:", error);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

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

  const handleDelete = async (id: string, name: string) => {
    try {
      await softDeleteProduct(id);
      // Refresh the list after deletion
      const res = await getProducts(apiParams);
      setRows(res.data ?? []);
      setMeta({
        totalPages: res.meta?.totalPages,
        totalItems: res.meta?.totalItems,
      });
      setHasNext(!!res.hasNext);
      setHasPrev(!!res.hasPrev);
      // Refresh trash count
      const count = await countTrashProductsClient();
      setTrashCount(count);
      // Show success message if you have a toast/notification system
      console.log(`Product "${name}" deleted successfully`);
    } catch (error: any) {
      console.error("Failed to delete product:", error);
      const detail = error?.response?.data?.detail || error?.detail;
      toast.error(detail);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedProducts.map((id) => softDeleteProduct(id)));
      setSelectedProducts([]);
      // Refresh the list after deletion
      const res = await getProducts(apiParams);
      setRows(res.data ?? []);
      setMeta({
        totalPages: res.meta?.totalPages,
        totalItems: res.meta?.totalItems,
      });
      setHasNext(!!res.hasNext);
      setHasPrev(!!res.hasPrev);
      // Refresh trash count
      const count = await countTrashProductsClient();
      setTrashCount(count);
      console.log(`${selectedProducts.length} products deleted successfully`);
    } catch (error: any) {
      console.error("Failed to delete products:", error);
      const detail = error?.response?.data?.detail || error?.detail;
      toast.error(detail);
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
                Danh sách sản phẩm
              </h1>
              <p className="text-gray-600 mt-1">
                Quản lý kho hàng kính mắt của bạn
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() =>
                  router.push(Routes.products.trash)
                }
                className="flex h-12 items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-base"
              >
                <Trash2 size={20} />
                Thùng rác
                {trashCount > 0 && (
                  <span className="top-2 right-2 bg-white text-red-600 text-xs font-bold px-2 py-0.5 rounded-full shadow">
                    {trashCount}
                  </span>
                )}
              </Button>
              <Button
                onClick={() =>
                  router.push(Routes.products.add)
                }
                className="flex h-12 items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-base"
              >
                <Plus size={20} />
                Thêm sản phẩm
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          {counts && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
            >
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tổng sản phẩm</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {counts.total ?? 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Đã xuất bản</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {counts.published ?? 0}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Bản nháp</p>
                    <p className="text-2xl font-bold text-gray-600 mt-1">
                      {counts.draft ?? 0}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Chưa liệt kê</p>
                    <p className="text-2xl font-bold text-orange-600 mt-1">
                      {counts.unlisted ?? 0}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Đã lưu trữ</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">
                      {counts.archived ?? 0}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tổng biến thể</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">
                      {counts.totalVariants ?? 0}
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sản phẩm mới</p>
                    <p className="text-2xl font-bold text-pink-600 mt-1">
                      {counts.newProducts ?? 0}
                    </p>
                  </div>
                  <div className="p-3 bg-pink-100 rounded-lg">
                    <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Giá trung bình</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">
                      {counts.averagePrice ? `${Number(counts.averagePrice).toLocaleString('en-US')}đ` : '0đ'}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

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
            placeholder="Tìm kiếm theo tên, slug hoặc mô tả sản phẩm..."
          />

          {/* <ProductListToolbar
            value={searchTerm}
            onSearchChange={setSearchTerm}
            onSearchSideEffect={() => setPage(1)}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters((s) => !s)}
          >
            <div className="text-sm text-gray-500">More filters…</div>
          </ProductListToolbar> */}

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
                title="Bạn có chắc chắn muốn xóa các sản phẩm đã chọn?"
                message={`${selectedProducts.length} sản phẩm`}
                confirmText="Xóa"
                onConfirm={handleBulkDelete}
              >
                <Button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  Xóa được chọn
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
                  <th className="px-6 py-4 text-center">
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
                                q.sortOrder === "ASC" ? "Tăng" : "Giảm"
                              } (nhấp để thay đổi)`
                            : "Không sắp xếp (nhấp để sắp xếp theo Ngày tạo)"
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
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase whitespace-nowrap">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Đang tải…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-6 py-8 text-center text-gray-500 italic"
                    >
                      Danh sách sản phẩm trống.
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

                      <td className="px-6 py-4 whitespace-nowrap">
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

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col items-center gap-1">
                          <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                            <span>🛒 {product.totalSold ?? 0}</span>
                            <span>•</span>
                            <span>👁️ {product.viewCount ?? 0}</span>
                          </div>
                          <div className="text-xs text-gray-600 flex items-center gap-1">
                            <span className="text-yellow-500">⭐</span>
                            <span>{Math.round(product.averageRating ?? 0)} / 5</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${statusBadgeClass(
                            product.productStatus
                          )}`}
                        >
                          {formatStatusLabel(product.productStatus)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-gray-600 text-center whitespace-nowrap">
                        {fmt(product.createdAt)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon-sm"
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Xem chi tiết"
                            onClick={() =>
                              router.push(
                                Routes.products.details(
                                  product.id
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
                                Routes.products.edit(
                                  product.id
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
                            title="Bạn có chắc chắn muốn xóa sản phẩm này?"
                            message={<b>{product.name}</b>}
                            confirmText="Xóa"
                            onConfirm={() =>
                              handleDelete(product.id, product.name)
                            }
                          >
                            <Button
                              size="icon-sm"
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                              title="Xóa"
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

export default withAuthCheck(ProductsPage);
