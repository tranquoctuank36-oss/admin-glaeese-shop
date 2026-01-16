"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  RotateCcw,
  Trash2,
  X,
  Search,
  ChevronDown,
  Filter,
} from "lucide-react";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";
import {
  getProducts,
  restoreProduct,
  forceDeleteProduct,
} from "@/services/productService";
import { getBrands } from "@/services/brandService";
import { getTags } from "@/services/tagService";
import type { Product } from "@/types/product";
import type { Brand } from "@/types/brand";
import type { Tag } from "@/types/tag";
import TablePagination from "@/components/shared/TablePagination";
import { Button } from "@/components/ui/button";
import { useListQuery } from "@/components/listing/hooks/useListQuery";
import { useRouter } from "next/navigation";
import ConfirmPopover from "@/components/shared/ConfirmPopover";
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

// Custom Select Component
interface CustomSelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}

function CustomSelect<T extends string>({
  value,
  onChange,
  options,
}: CustomSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`h-[42px] w-full px-3 text-left bg-white border rounded-lg cursor-pointer transition-all flex items-center justify-between ${
          open ? "border-1 border-blue-400" : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <span className="text-sm text-gray-900">
          {selectedOption ? selectedOption.label : "Chọn..."}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`px-3 py-2 cursor-pointer transition-colors text-sm ${
                option.value === value
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "hover:bg-gray-100"
              }`}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductsTrashPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; alt: string } | null>(null);
  const router = useRouter();
  const filtersRef = useRef<HTMLDivElement>(null);

  const [rows, setRows] = useState<Product[]>([]);
  const [meta, setMeta] = useState<{
    totalPages?: number;
    totalItems?: number;
  }>();
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const { q, setQ, setAndResetPage, apiParams, apiKey } = useListQuery(
    {
      limit: 20,
      sortField: "name",
      sortOrder: "ASC",
      isDeleted: "true",
      productType: "",
      gender: "",
      brandId: "",
      tagId: "",
    } as any,
    {
      allowedsortField: ["name", "viewCount", "averageRating", "totalSold"] as const,
    }
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };

    if (showFilters) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilters]);

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

  // Load brands for filter
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getBrands({ limit: 100, isDeleted: false });
        if (!alive) return;
        setBrands(res.data ?? []);
      } catch (error) {
        console.error("Failed to fetch brands:", error);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Load tags for filter
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getTags({ limit: 100, isDeleted: false });
        if (!alive) return;
        setTags(res.data ?? []);
      } catch (error) {
        console.error("Failed to fetch tags:", error);
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
      toast.success(`Sản phẩm "${name}" đã được khôi phục thành công`);
    } catch (error: any) {
      console.error("Không thể khôi phục sản phẩm:", error);
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
      toast.success(`Sản phẩm "${name}" đã bị xóa vĩnh viễn`);
    } catch (error: any) {
      console.error("Không thể xóa vĩnh viễn sản phẩm:", error);
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
      toast.success(`${selectedProducts.length} sản phẩm đã được khôi phục thành công`);
    } catch (error: any) {
      console.error("Không thể khôi phục sản phẩm:", error);
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
      toast.success(`Đã xóa vĩnh viễn ${selectedProducts.length} sản phẩm`);
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
                    router.back()
                  }
                  title="Quay lại"
                >
                  <ArrowLeft className="text-gray-700 size-7" />
                </Button>
                <h1 className="text-3xl font-bold text-gray-800">
                  Thùng rác – Sản phẩm
                </h1>
              </div>
              <p className="text-gray-600 mt-1 ml-12">
                Khôi phục hoặc xóa vĩnh viễn sản phẩm
              </p>
            </div>
          </div>

          {/* Search & Filter */}
          <motion.div
            ref={filtersRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6 bg-white rounded-lg shadow border border-gray-200 p-3"
          >
            {/* Search Bar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                  placeholder="Tìm kiếm sản phẩm đã xóa..."
                  value={q.search || ""}
                  onChange={(e) => setAndResetPage({ search: e.target.value, page: 1 })}
                />
              </div>
              <CustomSelect
                value={`${q.sortField}-${q.sortOrder}`}
                onChange={(v) => {
                  const [field, order] = v.split("-");
                  setAndResetPage({
                    sortField: field,
                    sortOrder: order as "ASC" | "DESC",
                    page: 1,
                  } as any);
                }}
                options={[
                  { value: "name-ASC", label: "Tên A-Z" },
                  { value: "name-DESC", label: "Tên Z-A" },
                  { value: "viewCount-DESC", label: "Lượt xem nhiều nhất" },
                  { value: "averageRating-DESC", label: "Đánh giá cao nhất" },
                  { value: "totalSold-DESC", label: "Bán chạy nhất" },
                ]}
              />
              <Button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 h-[42px] px-4 bg-white text-gray-600 hover:text-gray-900 rounded-lg transition-colors ${
                  showFilters ? 'border-1 border-blue-500' : 'border border-gray-300 hover:border-gray-500'
                }`}
              >
                <Filter size={20} />
                Bộ lọc
              </Button>
            </div>

            {/* Collapsible Filter Panel */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-4 border-t border-gray-200 pt-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trạng thái
                    </label>
                    <CustomSelect
                      value={(q as any).status || ""}
                      onChange={(v) => setAndResetPage({ status: v, page: 1 } as any)}
                      options={[
                        { value: "", label: "Tất cả" },
                        { value: "draft", label: "Bản nháp" },
                        { value: "published", label: "Đã xuất bản" },
                        { value: "unlisted", label: "Chưa liệt kê" },
                        { value: "archived", label: "Đã lưu trữ" },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loại sản phẩm
                    </label>
                    <CustomSelect
                      value={(q as any).productType || ""}
                      onChange={(v) => setAndResetPage({ productType: v, page: 1 } as any)}
                      options={[
                        { value: "", label: "Tất cả" },
                        { value: "frame", label: "Gọng kính" },
                        { value: "sunglasses", label: "Kính mát" },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giới tính
                    </label>
                    <CustomSelect
                      value={(q as any).gender || ""}
                      onChange={(v) => setAndResetPage({ gender: v, page: 1 } as any)}
                      options={[
                        { value: "", label: "Tất cả" },
                        { value: "male", label: "Nam" },
                        { value: "female", label: "Nữ" },
                        { value: "unisex", label: "Unisex" },
                        { value: "kid", label: "Trẻ em" },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thương hiệu
                    </label>
                    <CustomSelect
                      value={(q as any).brandId || ""}
                      onChange={(v) => setAndResetPage({ brandId: v, page: 1 } as any)}
                      options={[
                        { value: "", label: "Tất cả" },
                        ...brands.map(brand => ({
                          value: brand.id,
                          label: brand.name
                        }))
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nhãn
                    </label>
                    <CustomSelect
                      value={(q as any).tagId || ""}
                      onChange={(v) => setAndResetPage({ tagId: v, page: 1 } as any)}
                      options={[
                        { value: "", label: "Tất cả" },
                        ...tags.map(tag => ({
                          value: tag.id,
                          label: tag.name
                        }))
                      ]}
                    />
                  </div>
                </div>

                {/* Reset Button */}
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => {
                      setAndResetPage({
                        search: "",
                        status: "",
                        productType: "",
                        gender: "",
                        brandId: "",
                        tagId: "",
                        sortField: "createdAt",
                        sortOrder: "DESC" as const,
                        page: 1,
                      } as any);
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800 transition-colors cursor-pointer hover:bg-gray-100 px-3 py-1 rounded-lg"
                  >
                    Đặt lại
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
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
                  Khôi phục sản phẩm
                </Button>
              </ConfirmPopover>
              <ConfirmPopover
                title="Xóa vĩnh viễn sản phẩm?"
                message={`Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedProducts.length} sản phẩm?`}
                confirmText="Xóa"
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
                    Tên
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
                    Ngày xóa
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
                          {/* <span className="text-gray-500 text-sm leading-none">
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
                            confirmText="Xóa"
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
                          </ConfirmPopover> */}
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

export default withAuthCheck(ProductsTrashPage);
